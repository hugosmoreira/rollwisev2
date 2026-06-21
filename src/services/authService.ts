/* =================================================================
   RollWise — Auth service  (Supabase Auth)
   -----------------------------------------------------------------
   Real authentication against Supabase. No mock users: every call
   goes to Supabase Auth. On sign-up, a `profiles` row is created
   automatically by the `handle_new_user` trigger (see schema.sql),
   reading full_name + role from the sign-up metadata.
   ================================================================= */

import type { UserRole } from '@/types';
import { getSupabase } from '@/lib/supabase';

export type AuthRole = Extract<UserRole, 'student' | 'coach'>;
export type OAuthProvider = 'google' | 'apple';

export interface SignUpParams {
  fullName: string;
  email: string;
  password: string;
  role: AuthRole;
}

export interface SignInParams {
  email: string;
  password: string;
}

const appOrigin = () =>
  typeof window !== 'undefined' ? window.location.origin : '';

export const authService = {
  /**
   * Create an account. Returns whether a session was created immediately
   * (true when email confirmation is off) or the user must confirm by email.
   */
  async signUp({
    fullName,
    email,
    password,
    role,
  }: SignUpParams): Promise<{ session: boolean }> {
    const { data, error } = await getSupabase().auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
        emailRedirectTo: `${appOrigin()}/auth/login`,
      },
    });
    if (error) throw error;
    return { session: Boolean(data.session) };
  },

  /** Sign in with email + password. */
  async signInWithPassword({ email, password }: SignInParams): Promise<void> {
    const { error } = await getSupabase().auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  },

  /** Begin an OAuth sign-in flow (redirects away from the app). */
  async signInWithOAuth(provider: OAuthProvider): Promise<void> {
    const { error } = await getSupabase().auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${appOrigin()}/app` },
    });
    if (error) throw error;
  },

  /** Send a password reset email. */
  async resetPasswordForEmail(email: string): Promise<void> {
    const { error } = await getSupabase().auth.resetPasswordForEmail(email, {
      redirectTo: `${appOrigin()}/auth/login`,
    });
    if (error) throw error;
  },

  /** Sign the current user out. */
  async signOut(): Promise<void> {
    const { error } = await getSupabase().auth.signOut();
    if (error) throw error;
  },
};
