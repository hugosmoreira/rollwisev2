/* =================================================================
   RollWise — Admin service  (platform-wide reads + moderation)
   Requires the signed-in user to be an admin (enforced by RLS).
   ================================================================= */

import type {
  Booking,
  Coach,
  CoachVerificationRequest,
  Profile,
  Session,
  UserRole,
  VerificationStatus,
} from '@/types';
import { getSupabase } from '@/lib/supabase';
import {
  rowToBooking,
  rowToCoach,
  rowToProfile,
  rowToSession,
  rowToVerification,
} from './mappers';
import type { CoachFilters } from './coachService';
import type { SessionFilters } from './sessionService';
import type { BookingFilters } from './bookingService';

/** Aggregate counters for the admin dashboard. */
export interface PlatformStats {
  totalUsers: number;
  coaches: number;
  sessions: number;
  bookings: number;
  revenue: number;
  pendingVerifications: number;
}

export interface UserFilters {
  query?: string;
  role?: UserRole;
  status?: 'active' | 'suspended';
}

export type VerificationQueue = Extract<
  VerificationStatus,
  'pending' | 'verified' | 'rejected'
>;

/** A verification request enriched with the coach's display info. */
export interface VerificationReview extends CoachVerificationRequest {
  coachName: string;
  coachAvatarUrl: string | null;
  city: string | null;
}

type Lite = { full_name: string; avatar_url: string | null };

async function liteMap(ids: string[]): Promise<Map<string, Lite>> {
  const unique = [...new Set(ids)].filter(Boolean);
  if (unique.length === 0) return new Map();
  const { data } = await getSupabase()
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', unique);
  return new Map(
    (data ?? []).map((p) => [p.id, { full_name: p.full_name, avatar_url: p.avatar_url }]),
  );
}

export const adminService = {
  async getPlatformStats(): Promise<PlatformStats> {
    const sb = getSupabase();
    const head = { count: 'exact' as const, head: true };
    const [users, coaches, sessions, bookings, pending, payments] =
      await Promise.all([
        sb.from('profiles').select('*', head),
        sb.from('profiles').select('*', head).eq('role', 'coach'),
        sb.from('sessions').select('*', head).eq('status', 'published'),
        sb.from('bookings').select('*', head),
        sb
          .from('coach_verification_requests')
          .select('*', head)
          .eq('status', 'pending'),
        sb.from('payments').select('amount').eq('status', 'paid'),
      ]);

    const revenue = (payments.data ?? []).reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      totalUsers: users.count ?? 0,
      coaches: coaches.count ?? 0,
      sessions: sessions.count ?? 0,
      bookings: bookings.count ?? 0,
      revenue,
      pendingVerifications: pending.count ?? 0,
    };
  },

  async listUsers(filters: UserFilters = {}): Promise<Profile[]> {
    let q = getSupabase()
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (filters.role) q = q.eq('role', filters.role);
    if (filters.status) q = q.eq('status', filters.status);
    if (filters.query) q = q.ilike('full_name', `%${filters.query}%`);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map(rowToProfile);
  },

  async suspendUser(id: string): Promise<void> {
    const { error } = await getSupabase()
      .from('profiles')
      .update({ status: 'suspended' })
      .eq('id', id);
    if (error) throw error;
  },

  async reinstateUser(id: string): Promise<void> {
    const { error } = await getSupabase()
      .from('profiles')
      .update({ status: 'active' })
      .eq('id', id);
    if (error) throw error;
  },

  async listCoaches(filters: CoachFilters = {}): Promise<Coach[]> {
    let q = getSupabase().from('profiles').select('*').eq('role', 'coach');
    if (filters.city) q = q.ilike('city', `%${filters.city}%`);
    if (filters.query) q = q.ilike('full_name', `%${filters.query}%`);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map(rowToCoach);
  },

  async listVerificationRequests(
    status: VerificationQueue = 'pending',
  ): Promise<VerificationReview[]> {
    const sb = getSupabase();
    const requestStatus = status === 'verified' ? 'verified' : status;
    const { data, error } = await sb
      .from('coach_verification_requests')
      .select('*')
      .eq('status', requestStatus)
      .order('submitted_at', { ascending: false });
    if (error) throw error;
    const rows = data ?? [];
    const coaches = await liteMap(rows.map((r) => r.coach_id));
    return rows.map((r) => {
      const req = rowToVerification(r);
      const lite = coaches.get(r.coach_id);
      return {
        ...req,
        coachName: lite?.full_name ?? 'Coach',
        coachAvatarUrl: lite?.avatar_url ?? null,
        city: null,
      };
    });
  },

  async approveVerification(id: string): Promise<void> {
    const sb = getSupabase();
    const { data: req, error } = await sb
      .from('coach_verification_requests')
      .update({ status: 'verified' })
      .eq('id', id)
      .select('coach_id')
      .single();
    if (error) throw error;
    await sb.from('profiles').update({ verification: 'verified' }).eq('id', req.coach_id);
  },

  async rejectVerification(id: string, reason: string): Promise<void> {
    const sb = getSupabase();
    const { data: req, error } = await sb
      .from('coach_verification_requests')
      .update({ status: 'rejected', reason })
      .eq('id', id)
      .select('coach_id')
      .single();
    if (error) throw error;
    await sb.from('profiles').update({ verification: 'rejected' }).eq('id', req.coach_id);
  },

  async listSessions(filters: SessionFilters = {}): Promise<Session[]> {
    let q = getSupabase()
      .from('sessions')
      .select('*')
      .order('starts_at', { ascending: false });
    if (filters.ruleset) q = q.eq('ruleset', filters.ruleset);
    if (filters.format) q = q.eq('format', filters.format);
    const { data, error } = await q;
    if (error) throw error;
    const rows = data ?? [];
    const coaches = await liteMap(rows.map((r) => r.coach_id));
    return rows.map((r) =>
      rowToSession({
        ...r,
        coach: coaches.get(r.coach_id)
          ? { ...coaches.get(r.coach_id)!, belt: null }
          : null,
      }),
    );
  },

  async listBookings(_filters: BookingFilters = {}): Promise<Booking[]> {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    const rows = data ?? [];
    const sessionIds = rows.map((r) => r.session_id);
    const { data: sessions } = await sb
      .from('sessions')
      .select('id, title, starts_at, duration_minutes, price, city, gym_name')
      .in('id', sessionIds.length ? sessionIds : ['']);
    const sessionMap = new Map((sessions ?? []).map((s) => [s.id, s]));
    const people = await liteMap([
      ...rows.map((r) => r.student_id),
      ...rows.map((r) => r.coach_id),
    ]);
    return rows.map((r) =>
      rowToBooking({
        ...r,
        session: sessionMap.get(r.session_id) ?? null,
        student: people.get(r.student_id) ?? null,
        coach: people.get(r.coach_id) ?? null,
      }),
    );
  },
};
