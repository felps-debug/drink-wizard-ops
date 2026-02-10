# Código Corrigido - Snippets para Copiar e Colar

## FIX 1: `/Users/davioliveeira/py/drink-wizard-ops/src/lib/supabase.ts`

**Copie e substitua o arquivo inteiro por este conteúdo:**

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
      // Configura persistência de sessão no localStorage
      persistSession: true,
      // Storage a usar (localStorage padrão)
      storage: typeof window !== 'undefined' ? window.localStorage : null,
      // Chave para armazenar a sessão
      storageKey: 'sb-auth-token',
      // Auto-renovação de token antes de expirar
      autoRefreshToken: true,
      // Detecta sessão na URL (importante para OAuth)
      detectSessionInUrl: true,
    },
  }
);
```

---

## FIX 2: `/Users/davioliveeira/py/drink-wizard-ops/src/context/AuthContext.tsx`

**Copie e substitua o arquivo inteiro por este conteúdo:**

```typescript
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { User as MockUser, UserRole } from "@/lib/mock-data";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
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
  const profileFetchInProgressRef = useRef(false);

  const fetchProfile = async (userId: string, email: string): Promise<AuthUser> => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching profile:", error);
      }

      const isOwner = email === 'xavier.davimot1@gmail.com';
      const fetchedRole = (profile as any)?.cargo || profile?.role || (profile as any)?.roles?.[0] || 'bartender';
      const finalRole = isOwner ? 'admin' : fetchedRole;

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
        const { data: { session } } = await supabase.auth.getSession();

        if (isMounted) {
          if (session?.user) {
            profileFetchInProgressRef.current = true;
            const authUser = await fetchProfile(session.user.id, session.user.email!);

            if (isMounted) {
              setUser(authUser);
              setLoading(false);
            }
          } else {
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
            // Token foi renovado silenciosamente
            console.log('Token refreshed silently');
            break;

          case 'INITIAL_SESSION':
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
      // Não navegamos aqui - deixamos que onAuthStateChange handle
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

---

## FIX 3: `/Users/davioliveeira/py/drink-wizard-ops/src/pages/Login.tsx`

**Copie e substitua o arquivo inteiro por este conteúdo:**

```typescript
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogIn, UserPlus, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-2 border-primary/20 bg-card shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-4xl uppercase tracking-tighter text-primary">
            Mago dos Drinks
          </CardTitle>
          <CardDescription>
            Acesse o sistema de operações táticas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-none border border-border bg-muted p-0">
              <TabsTrigger
                value="login"
                className="rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Entrar
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Cadastrar
              </TabsTrigger>
            </TabsList>

            {error && (
              <Alert variant="destructive" className="mt-4 border-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {authLoading && (
              <div className="mt-4 p-4 bg-primary/10 rounded border border-primary/20">
                <p className="text-sm text-center text-primary animate-pulse">
                  Autenticando...
                </p>
              </div>
            )}

            <TabsContent value="login" className="mt-4 space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading || authLoading}
                    className="rounded-none border-border bg-background focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading || authLoading}
                    className="rounded-none border-border bg-background focus:border-primary"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full rounded-none font-bold uppercase"
                  disabled={loading || authLoading}
                >
                  {loading || authLoading ? "Entrando..." : "Acessar Sistema"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-4 space-y-4">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-name">Nome Completo</Label>
                  <Input
                    id="reg-name"
                    placeholder="João Barman"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={loading}
                    className="rounded-none border-border bg-background focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="rounded-none border-border bg-background focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Senha</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={loading}
                    className="rounded-none border-border bg-background focus:border-primary"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full rounded-none font-bold uppercase"
                  disabled={loading}
                >
                  {loading ? "Criando..." : "Criar Conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Ou continue com</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="mt-4 w-full rounded-none border-2 border-border hover:bg-muted"
            onClick={handleGoogleLogin}
            disabled={loading || authLoading}
          >
            Google (Requer Configuração)
          </Button>
        </CardContent>
        <CardFooter className="justify-center border-t border-border bg-muted/50 p-4">
          <p className="text-xs text-muted-foreground">
            Mago dos Drinks Ops © 2026
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
```

---

## FIX 4: `/Users/davioliveeira/py/drink-wizard-ops/src/components/auth/ProtectedRoute.tsx`

**Copie e substitua o arquivo inteiro por este conteúdo:**

```typescript
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/lib/mock-data";

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  // Debug logging (remova em produção se preferir)
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

## Instruções de Implementação

### Passo 1: Aplicar FIX 1
1. Abra `/Users/davioliveeira/py/drink-wizard-ops/src/lib/supabase.ts`
2. Copie TODO o conteúdo da seção "FIX 1" acima
3. Substitua o arquivo inteiro

### Passo 2: Aplicar FIX 2
1. Abra `/Users/davioliveeira/py/drink-wizard-ops/src/context/AuthContext.tsx`
2. Copie TODO o conteúdo da seção "FIX 2" acima
3. Substitua o arquivo inteiro

### Passo 3: Aplicar FIX 3
1. Abra `/Users/davioliveeira/py/drink-wizard-ops/src/pages/Login.tsx`
2. Copie TODO o conteúdo da seção "FIX 3" acima
3. Substitua o arquivo inteiro

### Passo 4: Aplicar FIX 4
1. Abra `/Users/davioliveeira/py/drink-wizard-ops/src/components/auth/ProtectedRoute.tsx`
2. Copie TODO o conteúdo da seção "FIX 4" acima
3. Substitua o arquivo inteiro

### Passo 5: Testar
1. `npm install` (se necessário)
2. `npm run dev`
3. Tente fazer login
4. Recarregue a página (F5) - deve permanecer logado
5. Faça logout
6. Tente acessar rota protegida - deve redirecionar para /login

---

## Validação

Após aplicar os fixes, procure por:

1. **localStorage com sessão**:
   - DevTools → Application → localStorage
   - Procure por `sb-auth-token`
   - Deve conter JSON com `access_token` e `refresh_token`

2. **Console sem erros**:
   - DevTools → Console
   - Não deve haver erros de autenticação

3. **Comportamento esperado**:
   - Login → Espera carregar perfil → Redireciona para /
   - Recarrega página → Permanece logado
   - Logout → Redireciona para /login
