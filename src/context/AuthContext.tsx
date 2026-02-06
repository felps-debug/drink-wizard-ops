import { createContext, useContext, useEffect, useState } from "react";
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

  useEffect(() => {
    const checkUser = async () => {
      try {
        // Supabase already handles session persistence automatically
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          // Fetch profile without timeout - let it complete
          await fetchProfile(session.user.id, session.user.email!);
        } else {
          setUser(null);
          setLoading(false);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        // Don't clear session on profile fetch error - keep user logged in
        setLoading(false);
      }
    };

    checkUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event:", event);

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      } else if (session?.user) {
        // Fetch profile on sign in
        await fetchProfile(session.user.id, session.user.email!);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string, email: string) => {
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

      console.log('🔐 Auth Debug:', {
        email,
        isOwner,
        profileRole: profile?.role,
        profileCargo: (profile as any)?.cargo,
        profileRoles: (profile as any)?.roles,
        fetchedRole,
        finalRole,
        profileData: profile
      });

      // Set user - this keeps session persistent
      setUser({
        id: userId,
        email: email,
        name: (profile as any)?.nome || profile?.full_name || email.split('@')[0],
        role: finalRole,
        avatar_url: undefined,
      });

      setLoading(false);
    } catch (err) {
      console.error("Profile fetch error:", err);

      // Fallback: Keep user logged in with basic info from session
      // This prevents logout on profile fetch errors
      const isOwner = email === 'xavier.davimot1@gmail.com';
      setUser({
        id: userId,
        email: email,
        name: email.split('@')[0],
        role: isOwner ? 'admin' : 'bartender',
        avatar_url: undefined,
      });

      setLoading(false);
    }
  };

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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (err) {
      setLoading(false); // Ensure loading is reset on error
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
