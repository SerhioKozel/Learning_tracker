import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile, UserRole } from '../types';

// ─── Shape ───────────────────────────────────────────────────────────────────

interface AuthContextValue {
  // State
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: UserRole | null;       // shorthand — avoids profile?.role everywhere
  loading: boolean;
  error: string | null;

  // Actions
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<string | null>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession]   = useState<Session | null>(null);
  const [user, setUser]         = useState<User | null>(null);
  const [profile, setProfile]   = useState<Profile | null>(null);
  const [loading, setLoading]   = useState(true);   // true until first session check resolves
  const [error, setError]       = useState<string | null>(null);

  // Fetch profile row for the given user id.
  // Called after session is established or changes.
  const fetchProfile = useCallback(async (userId: string): Promise<void> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, role, created_at')
      .eq('id', userId)
      .single();

    if (error || !data) {
      // Profile should always exist (created by trigger on sign-up).
      // If it's missing, something went wrong server-side — surface the error.
      setProfile(null);
      setError('Could not load user profile. Please sign out and try again.');
      return;
    }

    setProfile({
      id: data.id,
      role: data.role as 'user' | 'admin',
      createdAt: data.created_at,
    });
  }, []);

  // Apply a session (or null) to local state.
  const applySession = useCallback(async (s: Session | null): Promise<void> => {
    setSession(s);
    setUser(s?.user ?? null);
    if (s?.user) {
      await fetchProfile(s.user.id);
    } else {
      setProfile(null);
    }
  }, [fetchProfile]);

  // On mount: get the current session, then subscribe to changes.
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      await applySession(data.session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        if (!mounted) return;
        await applySession(s);
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [applySession]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); return error.message; }
    return null;
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<string | null> => {
    setError(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) { setError(error.message); return error.message; }
    return null;
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    setError(null);
    await supabase.auth.signOut();
    // onAuthStateChange fires → applySession(null) → clears user/profile
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<string | null> => {
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) { setError(error.message); return error.message; }
    return null;
  }, []);

  // ─── Value ─────────────────────────────────────────────────────────────────

  const value: AuthContextValue = {
    user,
    session,
    profile,
    role: profile?.role ?? null,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
