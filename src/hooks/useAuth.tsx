import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: {
    first_name: string;
    last_name: string;
    name: string;
    mobile_no: string;
  }) => Promise<{ error: any }>;
  signIn: (identifier: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  recordLogin: (method: string, currentUser?: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch profile with timeout
  const fetchProfile = async (userId: string) => {
    try {
      // Create a promise that rejects after 5 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000);
      });

      const fetchPromise = supabase
        .from('profiles')
        .select('id, has_completed_onboarding')
        .eq('id', userId)
        .single();

      // Race the fetch against the timeout
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (!error && data) {
        setProfile(data);
      } else {
        console.error("Profile fetch error or empty:", error);
        setProfile(null);
      }
    } catch (err) {
      console.error("Profile unexpected error/timeout:", err);
      // Fallback: profile null
      setProfile(null);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }

        setLoading(false);

        // Record login if user just signed in
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(() => {
            recordLogin('email', session.user);
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }

      // Force loading false after a max delay just in case everything above hangs
      setLoading(false);
    });

    // Safety valve: Force loading false after 6 seconds absolute max
    // This ensures that even if DB/network totally hangs, the app unlocks.
    const safetyTimer = setTimeout(() => setLoading(false), 6000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, []);

  const signUp = async (email: string, password: string, userData: {
    first_name: string;
    last_name: string;
    name: string;
    mobile_no: string;
  }) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: userData
      }
    });
    return { error };
  };

  const signIn = async (identifier: string, password: string) => {
    // Check if identifier is email or mobile
    const isEmail = identifier.includes('@');

    if (isEmail) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: identifier,
        password
      });

      if (error) return { error };

      // Security Check: Enforce Google Auth for Admins
      if (data.user) {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (roles) {
          await supabase.auth.signOut();
          return {
            error: {
              message: 'Security Alert: Administrators must use Google Sign-In.'
            }
          };
        }
      }

      return { error: null };
    } else {
      // For mobile number login, we need to find the user by mobile first
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('mobile_no', identifier)
        .single();

      if (profileError || !profiles) {
        return { error: { message: 'User not found with this mobile number' } };
      }

      // Get the email from auth.users (this would require a server function)
      // For now, we'll show an error message asking to use email
      return { error: { message: 'Please use email to login for now' } };
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`
      }
    });
    return { error };
  };

  const signOut = async () => {
    if (user) {
      await supabase.rpc('log_activity' as any, {
        p_action: 'LOGOUT',
        p_entity_type: 'auth',
        p_entity_id: user.id,
        p_details: { email: user.email }
      });
    }
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const recordLogin = async (method: string, currentUser?: User) => {
    const targetUser = currentUser || user;
    if (!targetUser) return;

    try {
      // 1. Record in DB (Legacy)
      await supabase.from('login_history').insert({
        user_id: targetUser.id,
        login_method: method,
        ip_address: 'unknown', // In production, get from server
        user_agent: navigator.userAgent
      });

      // 2. Log Activity (New System)
      await supabase.rpc('log_activity' as any, {
        p_action: 'LOGIN',
        p_entity_type: 'auth',
        p_entity_id: targetUser.id,
        p_details: { method, userAgent: navigator.userAgent }
      });

    } catch (error) {
      console.error('Failed to record login:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      loading,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
      recordLogin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};