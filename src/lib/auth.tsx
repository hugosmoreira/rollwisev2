import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { rowToProfile } from '@/services/mappers';
import type { Profile } from '@/types';

interface AuthContextValue {
  /** True while the initial session is loading. */
  loading: boolean;
  session: Session | null;
  user: User | null;
  /** The signed-in user's profile row, or null. */
  profile: Profile | null;
  /** True while the signed-in user's profile is still being resolved. */
  profileLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  /** The user id whose profile fetch has completed (resolved or null). */
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);

  // ---- Session: initial load + subscribe (no awaits inside the callback) ----
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // ---- Profile: reload whenever the signed-in user changes ----
  const userId = session?.user.id ?? null;
  useEffect(() => {
    if (!supabase || !userId) {
      setProfile(null);
      setLoadedUserId(null);
      return;
    }
    let cancelled = false;
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setProfile(data ? rowToProfile(data) : null);
        setLoadedUserId(userId);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!supabase || !userId) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    setProfile(data ? rowToProfile(data) : null);
  }, [userId]);

  const profileLoading = !loading && Boolean(session) && loadedUserId !== userId;

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      session,
      user: session?.user ?? null,
      profile,
      profileLoading,
      signOut,
      refreshProfile,
    }),
    [loading, session, profile, profileLoading, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an <AuthProvider>');
  return ctx;
}
