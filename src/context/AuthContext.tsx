import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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

async function buildAuthUser(userId: string, email: string, metaName: string): Promise<AuthUser> {
  let { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('[Auth] Profile query error:', error);
  }

  // If profile doesn't exist, create one
  if (!profile) {
    console.log('[Auth] No profile found — creating one');
    const { data: newProfile, error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        nome: metaName || email.split('@')[0],
        email,
        cargo: 'bartender',
      }, { onConflict: 'id' })
      .select()
      .single();

    if (!upsertError) {
      profile = newProfile;
    }
  }

  return {
    id: userId,
    email,
    name: (profile as any)?.nome || (profile as any)?.full_name || metaName || email.split('@')[0],
    role: (profile as any)?.cargo || 'bartender',
    avatar_url: undefined,
  };
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount: check for existing session
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      console.log('[Auth] Init: Starting check checking existing session...');
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('[Auth] getSession error:', error);
          throw error;
        }

        const session = data?.session;
        if (cancelled) return;

        if (session?.user) {
          console.log('[Auth] Existing session found for:', session.user.email);
          const meta = session.user.user_metadata?.full_name || session.user.user_metadata?.name || '';
          try {
            const authUser = await buildAuthUser(session.user.id, session.user.email!, meta);
            if (!cancelled) {
              setUser(authUser);
              console.log('[Auth] User loaded successfully:', authUser.email);
            }
          } catch (profileError) {
            console.error('[Auth] Profile build failed during init:', profileError);
            // Don't block loading — let user retry login if needed
          }
        } else {
          console.log('[Auth] No existing session found');
        }
      } catch (err) {
        console.error('[Auth] Init critical error:', err);
      } finally {
        if (!cancelled) {
          console.log('[Auth] Init complete — turning off loading');
          setLoading(false);
        }
      }
    };

    init();

    // Listen for future auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] Event:', event, session?.user?.email || 'no user');

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_IN' && session?.user) {
        // Fresh login — build and set user
        const meta = session.user.user_metadata?.full_name || session.user.user_metadata?.name || '';
        const authUser = await buildAuthUser(session.user.id, session.user.email!, meta);
        console.log('[Auth] Signed in:', authUser.email, authUser.role);
        setUser(authUser);
        setLoading(false);
      }

      // TOKEN_REFRESHED and INITIAL_SESSION are handled by init() above
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) throw error;
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      // Race Supabase against a 5s timeout to prevent infinite hanging on corrupt storage
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Login timeout")), 5000)
      );

      const result: any = await Promise.race([
        supabase.auth.signInWithPassword({ email, password }),
        timeoutPromise
      ]);

      if (result.error) throw result.error;

      if (result.data?.user) {
        const meta = result.data.user.user_metadata?.full_name || result.data.user.user_metadata?.name || '';
        try {
          const authUser = await buildAuthUser(result.data.user.id, result.data.user.email!, meta);
          console.log('[Auth] signInWithEmail OK:', authUser.email, authUser.role);
          setUser(authUser);
          setLoading(false);
        } catch (e) {
          console.error("Error building user:", e);
        }
      }
    } catch (err: any) {
      if (err.message === "Login timeout" || err.message?.includes("stuck")) {
        console.error("Critical Auth Timeout — cleaning corrupted storage...");
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
        return;
      }
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user, loading,
      signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
