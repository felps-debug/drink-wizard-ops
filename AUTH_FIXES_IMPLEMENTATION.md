# Implementação de Fixes - Problemas de Autenticação

## SOLUÇÃO 1: Configurar Storage Persistente no Supabase

### Arquivo: `/Users/davioliveeira/py/drink-wizard-ops/src/lib/supabase.ts`

**ANTES (Problemático)**:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);
```

**DEPOIS (Corrigido)**:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      // Configura persistência de sessão
      persistSession: true,
      // Especifica onde guardar a sessão (localStorage padrão, mas explícito)
      storage: typeof window !== 'undefined' ? window.localStorage : null,
      // Chave para armazenar a sessão no localStorage
      storageKey: 'sb-auth-token',
      // Auto-refresh do token antes de expirar
      autoRefreshToken: true,
      // Detecta sessão na URL (importante para OAuth redirects)
      detectSessionInUrl: true,
      // Garante que a sessão persiste entre abas/janelas
      flowType: 'implicit',
    },
  }
);
```

**O que cada opção faz**:
- `persistSession: true` - Salva a sessão no storage
- `storage` - Usa localStorage (padrão, mas explícito para evitar ambiguidades)
- `storageKey` - Chave única para não conflitar com outros dados
- `autoRefreshToken: true` - Renovação automática de token antes de expirar
- `detectSessionInUrl` - Necessário para OAuth (Google, etc.)

---

## SOLUÇÃO 2: Reescrever AuthContext com sincronização correta

### Arquivo: `/Users/davioliveeira/py/drink-wizard-ops/src/context/AuthContext.tsx`

**PROBLEMAS DO CÓDIGO ATUAL**:
1. Race condition entre `checkUser()` e `onAuthStateChange()`
2. `fetchProfile()` pode deixar `loading=false` sem `user` válido
3. `setTimeout(500ms)` é um hack frágil

**NOVO CÓDIGO (Completo)**:
```typescript
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { User as MockUser, UserRole } from "@/lib/mock-data";

// Extend the User type to include Auth properties if needed, or map Supabase user to App user
export interface AuthUser {
  id: string;
  email: string;
  name: string; // From metadata or profile
  role: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => { },
  signInWithEmail: async () => { },
  signUpWithEmail: async () => { },
  resetPassword: async () => { },
  signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Usar ref para rastrear se estamos no meio de uma operação de profile fetch
  const profileFetchInProgressRef = useRef(false);

  // Função auxiliar para carregar perfil
  const fetchProfile = async (userId: string, email: string): Promise<AuthUser> => {
    try {
      // 1. Try to fetch profile from public.profiles
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching profile:", error);
      }

      // 2. Map correctly - handle different schema versions
      const isOwner = email === 'xavier.davimot1@gmail.com';
      // Try multiple field names for compatibility: cargo (old), role (new), or first item in roles array
      const fetchedRole = (profile as any)?.cargo || profile?.role || (profile as any)?.roles?.[0] || 'bartender';
      const finalRole = isOwner ? 'admin' : fetchedRole;

      // Return user object
      const authUser: AuthUser = {
        id: userId,
        email: email,
        name: (profile as any)?.nome || profile?.full_name || email.split('@')[0],
        role: finalRole,
        avatar_url: undefined,
      };

      return authUser;
    } catch (err) {
      console.error("Profile fetch error:", err);

      // Fallback: Create basic user object
      const isOwner = email === 'xavier.davimot1@gmail.com';
      const authUser: AuthUser = {
        id: userId,
        email: email,
        name: email.split('@')[0],
        role: isOwner ? 'admin' : 'bartender',
        avatar_url: undefined,
      };

      return authUser;
    }
  };

  // Setup inicial: verifica sessão existente
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // Supabase já trata persistência automaticamente com localStorage
        const { data: { session } } = await supabase.auth.getSession();

        if (isMounted) {
          if (session?.user) {
            // User tem sessão válida, carrega perfil
            profileFetchInProgressRef.current = true;
            const authUser = await fetchProfile(session.user.id, session.user.email!);

            if (isMounted) {
              setUser(authUser);
              setLoading(false);
            }
          } else {
            // Nenhuma sessão
            if (isMounted) {
              setUser(null);
              setLoading(false);
            }
          }
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
      } finally {
        profileFetchInProgressRef.current = false;
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // Listener para mudanças de estado de autenticação
  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        console.log('Auth state changed:', event);

        switch (event) {
          case 'SIGNED_OUT':
            setUser(null);
            setLoading(false);
            break;

          case 'SIGNED_IN':
          case 'USER_UPDATED':
            if (session?.user) {
              // Evita múltiplos fetches simultâneos
              if (profileFetchInProgressRef.current) {
                console.log('Profile fetch already in progress, skipping...');
                return;
              }

              profileFetchInProgressRef.current = true;
              try {
                const authUser = await fetchProfile(session.user.id, session.user.email!);
                if (isMounted) {
                  setUser(authUser);
                  setLoading(false);
                }
              } catch (error) {
                console.error("Profile fetch on auth change failed:", error);
                if (isMounted) {
                  setLoading(false);
                }
              } finally {
                profileFetchInProgressRef.current = false;
              }
            }
            break;

          case 'TOKEN_REFRESHED':
            // Token foi renovado, mas user data não muda
            console.log('Token refreshed silently');
            break;

          case 'INITIAL_SESSION':
            // Sessão inicial carregada
            if (session?.user) {
              if (profileFetchInProgressRef.current) {
                return;
              }

              profileFetchInProgressRef.current = true;
              try {
                const authUser = await fetchProfile(session.user.id, session.user.email!);
                if (isMounted) {
                  setUser(authUser);
                  setLoading(false);
                }
              } catch (error) {
                console.error("Profile fetch on initial session failed:", error);
                if (isMounted) {
                  setLoading(false);
                }
              } finally {
                profileFetchInProgressRef.current = false;
              }
            } else {
              if (isMounted) {
                setUser(null);
                setLoading(false);
              }
            }
            break;

          default:
            if (isMounted) {
              setUser(null);
              setLoading(false);
            }
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
      // Não setamos loading=false aqui porque haverá redirecionamento
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      // IMPORTANTE: Não navegamos aqui! Deixamos que onAuthStateChange handle
      // O loading permanecerá true até que o perfil seja carregado
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });
      if (error) throw error;
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error("Sign out failed:", error);
      // Mesmo se falhar, limpa o user localmente
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      resetPassword,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

**Mudanças Principais**:
1. Removeu o `setTimeout()` hack
2. Usa `useRef` para rastrear fetches em progresso
3. `signInWithEmail()` NÃO navega mais - deixa que `onAuthStateChange` handle
4. `setLoading(false)` só ocorre DEPOIS que `fetchProfile()` completa
5. Trata `INITIAL_SESSION` event
6. Cleanup adequado com `isMounted`

---

## SOLUÇÃO 3: Atualizar Login para aguardar autenticação

### Arquivo: `/Users/davioliveeira/py/drink-wizard-ops/src/pages/Login.tsx`

**ANTES (Problemático)**:
```typescript
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);
  try {
    await signInWithEmail(email, password);
    navigate("/");  // ← NAVEGA ANTES DE USER ESTAR PRONTO
  } catch (err: any) {
    setError(err.message || "Erro ao fazer login");
  } finally {
    setLoading(false);
  }
};
```

**DEPOIS (Corrigido)**:
```typescript
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);
  try {
    await signInWithEmail(email, password);

    // NÃO navegamos aqui! AuthContext vai atualizar user
    // Login permanecerá carregando até que user seja setado
    // Quando user é setado, ProtectedRoute permitirá acesso

  } catch (err: any) {
    setError(err.message || "Erro ao fazer login");
    setLoading(false); // Só reseta loading em caso de erro
  }
  // NÃO CHAMAMOS setLoading(false) aqui - deixamos que persista
};
```

**Alternativa com Listener (Mais robusto)**:
```typescript
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // Se user foi carregado com sucesso, redireciona
  useEffect(() => {
    if (user && !authLoading) {
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmail(email, password);
      // AuthContext vai atualizar user, que vai ativar useEffect acima
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login");
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signUpWithEmail(email, password, name);
      setError("Conta criada! Verifique seu email se necessário, ou faça login.");
    } catch (err: any) {
      setError(err.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError("Erro ao conectar com Google. O provedor está ativado no Supabase?");
      setLoading(false);
    }
  };

  return (
    // ... resto do JSX igual ao original ...
  );
}
```

---

## SOLUÇÃO 4: Melhorar ProtectedRoute

### Arquivo: `/Users/davioliveeira/py/drink-wizard-ops/src/components/auth/ProtectedRoute.tsx`

**ANTES (Simples mas pode ter problemas)**:
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

**DEPOIS (Melhorado com logging)**:
```typescript
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/lib/mock-data";

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('ProtectedRoute:', { loading, user: user?.email, role: user?.role });
  }

  // Mostrar carregamento enquanto verifica autenticação
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center">
          <p className="font-mono text-primary animate-pulse uppercase mb-4">Verificando Credenciais...</p>
          <p className="text-xs text-muted-foreground">Por favor aguarde...</p>
        </div>
      </div>
    );
  }

  // Redirecionar se não há sessão
  if (!user) {
    console.log('ProtectedRoute: Usuário não autenticado, redirecionando para /login');
    return <Navigate to="/login" replace />;
  }

  // Verificar permissões de role
  if (allowedRoles && !allowedRoles.includes(user.role as any)) {
    console.log('ProtectedRoute: Usuário sem permissão', { userRole: user.role, allowedRoles });
    return <Navigate to="/" replace />;
  }

  // User autenticado e autorizado
  return <Outlet />;
};
```

---

## Checklist de Aplicação das Fixes

- [ ] **FIX 1**: Atualizar `/Users/davioliveeira/py/drink-wizard-ops/src/lib/supabase.ts`
  - Adicionar configuração `auth` com `persistSession`, `storage`, etc.

- [ ] **FIX 2**: Reescrever `/Users/davioliveeira/py/drink-wizard-ops/src/context/AuthContext.tsx`
  - Remover `setTimeout` hack
  - Adicionar `useRef` para rastrear fetches
  - Implementar sincronização correta entre eventos

- [ ] **FIX 3**: Atualizar `/Users/davioliveeira/py/drink-wizard-ops/src/pages/Login.tsx`
  - Remover `navigate()` imediato
  - Adicionar listener para `user` no useEffect

- [ ] **FIX 4**: Melhorar `/Users/davioliveeira/py/drink-wizard-ops/src/components/auth/ProtectedRoute.tsx`
  - Adicionar logging para debug
  - Melhorar mensagem de carregamento

- [ ] **TESTE 1**: Fazer login e recarregar página (F5)
  - Deve permanecer logado

- [ ] **TESTE 2**: Fazer login e aguardar tela de carregamento
  - Não deve ficar em loop infinito

- [ ] **TESTE 3**: Fazer logout e tentar acessar rota protegida
  - Deve redirecionar para /login

- [ ] **TESTE 4**: Testar com diferentes roles (admin, chefe_bar, bartender)
  - Deve respeitar permissões

---

## Ordem de Implementação Recomendada

1. **Primeiro**: Fix 1 (Supabase storage) - Crítico
2. **Segundo**: Fix 2 (AuthContext) - Crítico
3. **Terceiro**: Fix 3 (Login) - Importante
4. **Quarto**: Fix 4 (ProtectedRoute) - Melhorias

Após cada fix, executar testes correspondentes.
