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

// Helper for timeout
const withTimeout = <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), ms))
  ]);
};

async function buildAuthUser(userId: string, email: string, metaName: string): Promise<AuthUser> {
  // 5s timeout on profile fetch to prevent infinite loading
  // FIX: Wrap Supabase call in async IIFE to ensure it executes and returns data, not just the builder
  let { data: profile, error } = await withTimeout(
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      return { data, error };
    })(),
    5000,
    "Profile fetch"
  ).catch(err => {
    console.warn('[Auth] Profile fetch error/timeout:', err);
    return { data: null, error: err };
  });

  if (error) {
    console.error('[Auth] Profile query error:', error);
  }

  // If profile doesn't exist AND no error occurred, create one
  if (!profile && !error) {
    console.log('[Auth] No profile found — creating one');
    // Upsert safely: only if truly missing. Use simple insert or upsert with caution.
    const { data: newProfile, error: upsertError } = await withTimeout(
      (async () => {
        const { data, error } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            nome: metaName || email.split('@')[0],
            email,
            cargo: 'bartender',
          }, { onConflict: 'id', ignoreDuplicates: true }) // Safer: don't overwrite existing
          .select()
          .single();
        return { data, error };
      })(),
      5000,
      "Profile creation"
    ).catch(err => ({ data: null, error: err }));

    if (!upsertError && newProfile) {
      profile = newProfile;
    }
  }

  // Fallback if still no profile (e.g. error on fetch AND create skipped/failed)
  if (!profile) {
    console.warn('[Auth] Using fallback user metadata (Profile missing or fetch failed)');
    return {
      id: userId,
      email,
      name: metaName || email.split('@')[0],
      role: email === 'xavier.davimot1@gmail.com' ? 'admin' : 'bartender', // Temporary fallback in memory, DOES NOT WRITE TO DB
      avatar_url: undefined,
    };
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
    let mounted = true;

    const initSession = async () => {
      try {
        console.log('[Auth] Init checking session...');

        // 1. Get Session with timeout (5s max)
        const { data, error } = await withTimeout(
          supabase.auth.getSession(),
          5000,
          "Session check"
        ).catch(err => {
          console.warn('[Auth] Session check timeout:', err);
          return { data: { session: null }, error: err };
        });

        if (error && error.message !== 'Auth session missing!') {
          console.error('[Auth] getSession error:', error);
        }

        const session = data?.session;

        // Fallback: If getSession misses, try getUser (server check) with timeout
        let validUser = session?.user;
        if (!validUser) {
          try {
            const { data: userData } = await withTimeout(
              supabase.auth.getUser(),
              5000,
              "User check"
            );
            validUser = userData?.user;
          } catch (err) {
            console.warn('[Auth] getUser fallback failed:', err);
          }
        }

        if (validUser && mounted) {
          console.log('[Auth] Session found:', validUser.email);
          const meta = validUser.user_metadata?.full_name || validUser.user_metadata?.name || '';

          // 2. Build Profile
          try {
            const authUser = await buildAuthUser(validUser.id, validUser.email!, meta);
            if (mounted) setUser(authUser);
          } catch (e) {
            console.error('[Auth] Profile load error/timeout, using fallback:', e);
            if (mounted) {
              // CRITICAL FALLBACK to prevent logout
              setUser({
                id: validUser.id,
                email: validUser.email!,
                name: meta || validUser.email!,
                role: validUser.email === 'xavier.davimot1@gmail.com' ? 'admin' : 'bartender',
              });
            }
          }
        } else {
          console.log('[Auth] No session found');
          if (mounted) setUser(null);
        }
      } catch (err) {
        console.error('[Auth] Initialization critical error:', err);
        if (mounted) setUser(null);
      } finally {
        if (mounted) {
          console.log('[Auth] Init complete. Loading overrides OFF.');
          setLoading(false);
        }
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      console.log('[Auth] Auth Event:', event);

      if (event === 'SIGNED_IN' && session?.user) {
        // Don't block UI with setLoading(true) here - allow background update
        // setLoading(true); 
        const meta = session.user.user_metadata?.full_name || '';
        try {
          const authUser = await buildAuthUser(session.user.id, session.user.email!, meta);
          if (mounted) setUser(authUser);
        } catch (e) {
          console.error('[Auth] Login profile build failed', e);
          if (mounted) {
            // Fallback on login failure too
            setUser({
              id: session.user.id,
              email: session.user.email!,
              name: meta || session.user.email!,
              role: session.user.email === 'xavier.davimot1@gmail.com' ? 'admin' : 'bartender'
            });
          }
        }
        // if (mounted) setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      } else if (event === 'TOKEN_REFRESHED') {
        // Token refreshed, session is healthy.
      }
    });

    return () => {
      mounted = false;
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
      console.log('[Auth] Starting sign in with timeout protection...');
      // Explicit 10s timeout for login action to prevent infinite spinner
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        10000,
        "Sign in"
      );

      if (error) throw error;

      if (data?.user) {
        console.log('[Auth] Login successful API response');
      }
    } catch (err: any) {
      console.error('[Auth] Login error:', err);
      // Logic for infinite hang: if timeout, maybe we should clear storage?
      if (err.message?.includes('timed out')) {
        console.warn('[Auth] Login timed out.');
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
