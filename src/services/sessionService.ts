/* =================================================================
   RollWise — Session service  (Supabase table: `sessions`)
   ================================================================= */

import type { Ruleset, Session, SessionFormat, SkillLevel } from '@/types';
import type { Database } from '@/lib/database.types';
import { getSupabase } from '@/lib/supabase';
import { rowToSession } from './mappers';
import { functionError, notImplemented } from './serviceError';

type SessionsInsert = Database['public']['Tables']['sessions']['Insert'];
type SessionsUpdate = Database['public']['Tables']['sessions']['Update'];
type CoachLite = { full_name: string; avatar_url: string | null; belt: Database['public']['Enums']['belt_rank'] | null };

/** Filters for student-facing session discovery (Find Classes). */
export interface SessionFilters {
  query?: string;
  ruleset?: Ruleset;
  format?: SessionFormat;
  skillLevel?: SkillLevel;
  date?: string;
  city?: string;
}

/** Payload to create or edit a session. */
export interface SessionInput {
  title: string;
  description?: string;
  format: SessionFormat;
  ruleset: Ruleset;
  skillLevel: SkillLevel;
  focusTags: string[];
  startsAt: string;
  durationMinutes: number;
  price: number;
  capacity: number;
  gymName?: string;
  city: string;
  /** IANA timezone the session time is expressed in (coach's zone). */
  timezone: string;
}

export type CoachSessionStatus = 'published' | 'draft' | 'past';

/** Fetch lightweight coach info for a set of coach ids (manual join). */
async function coachLiteMap(ids: string[]): Promise<Map<string, CoachLite>> {
  const unique = [...new Set(ids)].filter(Boolean);
  if (unique.length === 0) return new Map();
  const { data } = await getSupabase()
    .from('public_profiles')
    .select('id, full_name, avatar_url, belt')
    .in('id', unique);
  const map = new Map<string, CoachLite>();
  (data ?? []).forEach((p) =>
    map.set(p.id, {
      full_name: p.full_name,
      avatar_url: p.avatar_url,
      belt: p.belt,
    }),
  );
  return map;
}

export const sessionService = {
  /** Search published sessions for discovery, newest start first. */
  async listSessions(filters: SessionFilters = {}): Promise<Session[]> {
    let q = getSupabase()
      .from('sessions')
      .select('*')
      .eq('status', 'published')
      // Only surface sessions that haven't started yet — no booking the past.
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true });

    if (filters.ruleset) q = q.eq('ruleset', filters.ruleset);
    if (filters.format) q = q.eq('format', filters.format);
    if (filters.skillLevel) q = q.eq('skill_level', filters.skillLevel);
    if (filters.city) q = q.ilike('city', `%${filters.city}%`);
    if (filters.query) q = q.ilike('title', `%${filters.query}%`);

    const { data, error } = await q;
    if (error) throw error;
    const rows = data ?? [];
    const coaches = await coachLiteMap(rows.map((r) => r.coach_id));
    return rows.map((r) => rowToSession({ ...r, coach: coaches.get(r.coach_id) ?? null }));
  },

  /** A single session by id (class details). */
  async getSession(id: string): Promise<Session | null> {
    const { data, error } = await getSupabase()
      .from('sessions')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const coaches = await coachLiteMap([data.coach_id]);
    return rowToSession({ ...data, coach: coaches.get(data.coach_id) ?? null });
  },

  /** A coach's own sessions, optionally filtered by status. */
  async listCoachSessions(
    coachId: string,
    status: CoachSessionStatus = 'published',
  ): Promise<Session[]> {
    let q = getSupabase()
      .from('sessions')
      .select('*')
      .eq('coach_id', coachId)
      .order('starts_at', { ascending: true });

    if (status === 'draft') q = q.eq('status', 'draft');
    else if (status === 'past')
      q = q.in('status', ['completed', 'cancelled']);
    else q = q.eq('status', 'published');

    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map((r) => rowToSession(r));
  },

  /** Create and publish a new session as the signed-in coach. */
  async createSession(input: SessionInput): Promise<Session> {
    const sb = getSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) throw new Error('You must be signed in to create a session.');

    const insert: SessionsInsert = {
      coach_id: user.id,
      title: input.title,
      description: input.description ?? null,
      format: input.format,
      ruleset: input.ruleset,
      skill_level: input.skillLevel,
      focus_tags: input.focusTags,
      starts_at: input.startsAt,
      duration_minutes: input.durationMinutes,
      price: input.price,
      capacity: input.capacity,
      spots_remaining: input.capacity,
      gym_name: input.gymName ?? null,
      city: input.city,
      timezone: input.timezone,
      status: 'published',
    };

    const { data, error } = await sb
      .from('sessions')
      .insert(insert)
      .select('*')
      .single();
    if (error) throw error;
    return rowToSession(data);
  },

  /** Update an existing session. */
  async updateSession(
    id: string,
    patch: Partial<SessionInput>,
  ): Promise<Session> {
    const row: SessionsUpdate = {};
    if (patch.title !== undefined) row.title = patch.title;
    if (patch.description !== undefined) row.description = patch.description;
    if (patch.format !== undefined) row.format = patch.format;
    if (patch.ruleset !== undefined) row.ruleset = patch.ruleset;
    if (patch.skillLevel !== undefined) row.skill_level = patch.skillLevel;
    if (patch.focusTags !== undefined) row.focus_tags = patch.focusTags;
    if (patch.startsAt !== undefined) row.starts_at = patch.startsAt;
    if (patch.durationMinutes !== undefined) row.duration_minutes = patch.durationMinutes;
    if (patch.price !== undefined) row.price = patch.price;
    if (patch.capacity !== undefined) row.capacity = patch.capacity;
    if (patch.gymName !== undefined) row.gym_name = patch.gymName;
    if (patch.city !== undefined) row.city = patch.city;
    if (patch.timezone !== undefined) row.timezone = patch.timezone;

    const { data, error } = await getSupabase()
      .from('sessions')
      .update(row)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return rowToSession(data);
  },

  /**
   * Cancel a session. Routed through the `cancel-session` Edge Function: every
   * active PAID booking is refunded via Stripe (the charge.refunded webhook then
   * cancels each booking and frees its seat), unpaid/pending bookings are
   * cancelled, and only then is the session marked cancelled. The database
   * refuses a direct cancellation of a session that still has paid bookings, so
   * this is the only path.
   */
  async cancelSession(id: string): Promise<void> {
    const { data, error } = await getSupabase().functions.invoke<{
      ok?: boolean;
      error?: string;
    }>('cancel-session', { body: { sessionId: id } });
    if (error) throw new Error(await functionError(error));
    if (!data?.ok) throw new Error(data?.error ?? 'Could not cancel the session.');
  },

  /** Duplicate a session as a new draft. */
  async duplicateSession(_id: string): Promise<Session> {
    return notImplemented('sessionService.duplicateSession');
  },
};
