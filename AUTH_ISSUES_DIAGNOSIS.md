# Diagnóstico Completo - Problemas de Autenticação no Supabase

## Problemas Identificados

### 1. **Sessão não persiste ao recarregar a página** (CRÍTICO)
### 2. **Login fica em loop infinito "Entrando..."** (CRÍTICO)

---

## RAIZ DO PROBLEMA 1: Sessão não persiste

### Causa Identificada
**Falta de configuração de Storage Persistente no cliente Supabase**

#### Local do problema:
- **Arquivo**: `/Users/davioliveeira/py/drink-wizard-ops/src/lib/supabase.ts`
- **Linhas**: 10-13

```typescript
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);
```

#### O que está acontecendo:
1. O cliente Supabase está sendo criado **SEM configuração de storage persistente**
2. Por padrão, Supabase tenta usar `localStorage` automaticamente, MAS:
   - Se houver erros de acesso ao localStorage
   - Se o storage não estiver configurado explicitamente
   - A sessão é armazenada apenas em memória
3. Quando a página é recarregada, a sessão em memória é perdida

#### Evidência:
- Não há configuração de `auth.persistSession`
- Não há configuração de `auth.storageKey`
- Não há implementação de `AsyncLocalStorage` ou custom storage
- Apenas `getSession()` é chamado, mas sem garantia de persistência

---

## RAIZ DO PROBLEMA 2: Loop infinito "Entrando..."

### Causa Identificada
**Race condition no fluxo de autenticação combinado com múltiplas renderizações do ProtectedRoute**

#### Locais do problema:

**1. AuthContext.tsx (Linhas 41-86)**
```typescript
useEffect(() => {
  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        await fetchProfile(session.user.id, session.user.email!);
      } else {
        setUser(null);
        setLoading(false);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setLoading(false);
    }
  };

  checkUser();

  // Listen for auth state changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT') {
      setUser(null);
      setLoading(false);
    } else if (event === 'SIGNED_IN' && session?.user) {
      try {
        await fetchProfile(session.user.id, session.user.email!);
      } catch (error) {
        console.error("Profile fetch failed:", error);
        setLoading(false);
      }
    } else if (event === 'TOKEN_REFRESHED' && session?.user) {
      // Silent refresh, don't fetch profile again
    } else {
      setUser(null);
      setLoading(false);
    }
  });

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

**PROBLEMA**:
- Não há sincronização entre `checkUser()` e `onAuthStateChange`
- Se `fetchProfile()` demora, `loading` nunca é setado como `false` em alguns casos
- Múltiplas renderizações podem ocorrer durante o carregamento

**2. Login.tsx (Linhas 23-35)**
```typescript
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);
  try {
    await signInWithEmail(email, password);
    navigate("/");  // ← AQUI É O PROBLEMA
  } catch (err: any) {
    setError(err.message || "Erro ao fazer login");
  } finally {
    setLoading(false);
  }
};
```

**PROBLEMA**:
- Navega imediatamente após `signInWithEmail()`
- Mas `signInWithEmail()` não espera o AuthContext processar a mudança de estado
- Veja a implementação em AuthContext.ts (linhas 153-167):

```typescript
const signInWithEmail = async (email: string, password: string) => {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    // Wait a bit for onAuthStateChange to process
    await new Promise(resolve => setTimeout(resolve, 500)); // ← HACK!
  } catch (err) {
    setLoading(false);
    throw err;
  }
};
```

**PROBLEMA**:
- Usa um `setTimeout` de 500ms como "hack" para aguardar
- Isso é frágil e não garante que `fetchProfile()` foi completado
- Se `fetchProfile()` demorar mais de 500ms, o usuário é redirecionado antes de ser carregado
- O ProtectedRoute verifica `loading` e `user`, causando redirecionamento para /login

**3. ProtectedRoute.tsx (Linhas 9-28)**
```typescript
export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <p className="font-mono text-primary animate-pulse uppercase">Verificando Credenciais...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role as any)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
```

**PROBLEMA**:
- Se `loading` é `true`, mostra tela de carregamento
- Se `loading` é `false` mas `user` ainda é `null`, redireciona para /login
- O fluxo é:
  1. Login → `signInWithEmail()` → 500ms espera → navigate("/")
  2. ProtectedRoute renderiza, `loading` pode ainda ser `true` → mostra "Verificando"
  3. Mas se `loading` vira `false` antes de `user` ser setado → volta para `/login`
  4. `/login` renderiza, usuario tenta novamente → loop

---

## PROBLEMAS SECUNDÁRIOS IDENTIFICADOS

### 3. Falta de configuração de CORS/Cookies
**Arquivo**: `/Users/davioliveeira/py/drink-wizard-ops/src/lib/supabase.ts`

O cliente não está configurado com:
```typescript
// Faltam estas opções:
auth: {
  persistSession: true,
  storageKey: 'sb-session',
  storage: localStorage, // ou AsyncLocalStorage
  autoRefreshToken: true,
  detectSessionInUrl: true,
}
```

### 4. Falta de tratamento de estado de autenticação incompleto
**Arquivo**: `/Users/davioliveeira/py/drink-wizard-ops/src/context/AuthContext.tsx`

O `fetchProfile()` pode:
- Falhar silenciosamente (línea 125-126)
- Deixar `loading` como `false` sem um `user` válido
- Não há fallback para dados incompletos

---

## Resumo das Causas

| Problema | Causa Raiz | Gravidade |
|----------|-----------|-----------|
| Sessão não persiste ao reload | Sem storage persistente no Supabase | CRÍTICO |
| Login em loop infinito | Race condition: navigate() antes de `fetchProfile()` completar | CRÍTICO |
| Timeout frágil | `setTimeout(500ms)` não garante conclusão | ALTO |
| Sem sincronização | Múltiplos fluxos assincronos sem await adequado | ALTO |

---

## Arquivos Problemáticos

1. **`/Users/davioliveeira/py/drink-wizard-ops/src/lib/supabase.ts`** - Linhas 10-13
   - Falta configuração de storage persistente

2. **`/Users/davioliveeira/py/drink-wizard-ops/src/context/AuthContext.tsx`** - Linhas 41-167
   - Fluxo de autenticação com race conditions
   - Falta sincronização entre checkUser() e onAuthStateChange
   - fetchProfile() pode deixar loading=false sem user válido

3. **`/Users/davioliveeira/py/drink-wizard-ops/src/pages/Login.tsx`** - Linhas 23-35
   - Navigation ocorre antes de user ser carregado
   - Sem await para conclusão do carregamento de perfil

4. **`/Users/davioliveeira/py/drink-wizard-ops/src/components/auth/ProtectedRoute.tsx`** - Linhas 9-28
   - Não há tratamento de transição de estado
   - Pode redirecionar antes de dados carregarem

---

## Ordem de Prioridade de Fixes

1. **PRIMEIRO**: Configurar storage persistente no Supabase
2. **SEGUNDO**: Eliminar o `setTimeout()` e usar Promise adequadamente
3. **TERCEIRO**: Sincronizar corretamente `fetchProfile()` com autenticação
4. **QUARTO**: Verificar que `setLoading(false)` só ocorre quando user está realmente carregado
