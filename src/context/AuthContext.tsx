import { createContext, useContext, useEffect, useRef, useState } from "react";
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
  const fetchingRef = useRef(false);

  useEffect(() => {
    // Safety timeout — never hang on "Verificando Credenciais" forever
    const safetyTimer = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          console.warn('[Auth] Safety timeout hit — forcing loading=false');
        }
        return false;
      });
    }, 8000);

    // Single source of truth: onAuthStateChange handles INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] Event:', event, session?.user?.email || 'no user');

      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setLoading(false);
        return;
      }

      if (event === 'TOKEN_REFRESHED') {
        // Silent refresh — user is already set, nothing to do
        return;
      }

      // INITIAL_SESSION (on page load/F5) or SIGNED_IN (fresh login)
      if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && session?.user) {
        // Guard against duplicate fetches using a ref (synchronous, works in closures)
        if (fetchingRef.current) {
          console.log('[Auth] Fetch already in progress, skipping');
          return;
        }
        fetchingRef.current = true;

        try {
          const userId = session.user.id;
          const email = session.user.email!;

          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          if (error) {
            console.error('[Auth] Profile query error:', error);
          }

          const authUser: AuthUser = {
            id: userId,
            email,
            name: (profile as any)?.nome || (profile as any)?.full_name || email.split('@')[0],
            role: (profile as any)?.cargo || 'bartender',
            avatar_url: undefined,
          };

          console.log('[Auth] Loaded:', authUser.email, authUser.role);
          setUser(authUser);
        } catch (err) {
          console.error('[Auth] Profile fetch failed:', err);
          // Fallback — keep user logged in with session data
          setUser({
            id: session.user.id,
            email: session.user.email!,
            name: session.user.email!.split('@')[0],
            role: 'bartender',
            avatar_url: undefined,
          });
        } finally {
          setLoading(false);
          fetchingRef.current = false;
        }
      }
    });

    return () => {
      clearTimeout(safetyTimer);
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
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      // Session is now handled by onAuthStateChange - no setTimeout needed
      // The fetchProfile will be called automatically by the listener
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
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
