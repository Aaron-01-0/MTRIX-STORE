import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
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
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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

      // 3. Trigger Security Alert (Fire and Forget)
      // We don't await this because we don't want to block the UI
      /* 
      supabase.functions.invoke('send-login-alert', {
        body: {
          userAgent: navigator.userAgent,
        }
      }).then(({ error }) => {
        if (error) console.error('Failed to send login alert:', error);
      });
      */

    } catch (error) {
      console.error('Failed to record login:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
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