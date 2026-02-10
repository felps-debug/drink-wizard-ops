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
  const { user, loading: authLoading, signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      console.log('[Login] User is authenticated, redirecting to home...');
      setLoading(false);
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      console.log('[Login] Attempting login for:', email);
      await signInWithEmail(email, password);
      console.log('[Login] Login request completed, waiting for auth state...');
      // onAuthStateChange will set user → useEffect redirect kicks in
    } catch (err: any) {
      console.error('[Login] Login failed:', err);
      setError(err.message || "Erro ao fazer login");
    } finally {
      // Always reset local loading. Auth context handles its own loading.
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signUpWithEmail(email, password, name);
      // Supabase default: requires email confirmation usually, or helper message
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
    } finally {
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
                    className="rounded-none border-border bg-background focus:border-primary"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full rounded-none font-bold uppercase"
                  disabled={loading}
                >
                  {loading ? "Entrando..." : "Acessar Sistema"}
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
            disabled={loading}
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
