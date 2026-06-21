/* =================================================================
   RollWise — Booking service
   (Supabase tables: `bookings`, `training_history`)
   ================================================================= */

import type { Booking, BookingStatus, TrainingHistoryEntry } from '@/types';
import type { Database } from '@/lib/database.types';
import { getSupabase } from '@/lib/supabase';
import { rowToBooking, rowToTrainingHistory } from './mappers';
import { notImplemented } from './serviceError';

type BookingsInsert = Database['public']['Tables']['bookings']['Insert'];
type SessionLite = {
  title: string;
  starts_at: string;
  duration_minutes: number;
  price: number;
  city: string;
  gym_name: string | null;
};
type ProfileLite = { full_name: string; avatar_url: string | null };

/** Coarse filter used by the booking list tabs. */
export type BookingScope = 'all' | 'upcoming' | 'past';

export interface BookingFilters {
  scope?: BookingScope;
  status?: BookingStatus;
}

async function sessionLiteMap(ids: string[]): Promise<Map<string, SessionLite>> {
  const unique = [...new Set(ids)].filter(Boolean);
  if (unique.length === 0) return new Map();
  const { data } = await getSupabase()
    .from('sessions')
    .select('id, title, starts_at, duration_minutes, price, city, gym_name')
    .in('id', unique);
  const map = new Map<string, SessionLite>();
  (data ?? []).forEach((s) =>
    map.set(s.id, {
      title: s.title,
      starts_at: s.starts_at,
      duration_minutes: s.duration_minutes,
      price: s.price,
      city: s.city,
      gym_name: s.gym_name,
    }),
  );
  return map;
}

async function profileLiteMap(ids: string[]): Promise<Map<string, ProfileLite>> {
  const unique = [...new Set(ids)].filter(Boolean);
  if (unique.length === 0) return new Map();
  const { data } = await getSupabase()
    .from('public_profiles')
    .select('id, full_name, avatar_url')
    .in('id', unique);
  const map = new Map<string, ProfileLite>();
  (data ?? []).forEach((p) =>
    map.set(p.id, { full_name: p.full_name, avatar_url: p.avatar_url }),
  );
  return map;
}

function applyScope(bookings: Booking[], scope: BookingScope): Booking[] {
  if (scope === 'all') return bookings;
  const now = Date.now();
  return bookings.filter((b) => {
    const upcoming =
      new Date(b.startsAt).getTime() >= now &&
      b.status !== 'cancelled' &&
      b.status !== 'completed';
    return scope === 'upcoming' ? upcoming : !upcoming;
  });
}

export const bookingService = {
  /** Bookings made by a student (with session + coach info). */
  async listStudentBookings(
    studentId: string,
    filters: BookingFilters = {},
  ): Promise<Booking[]> {
    // A real booking only exists once it's paid (see create-checkout /
    // stripe-webhook). Unpaid rows are never shown to the student.
    const { data, error } = await getSupabase()
      .from('bookings')
      .select('*')
      .eq('student_id', studentId)
      .neq('payment_status', 'unpaid')
      .order('created_at', { ascending: false });
    if (error) throw error;
    const rows = data ?? [];
    const [sessions, coaches] = await Promise.all([
      sessionLiteMap(rows.map((r) => r.session_id)),
      profileLiteMap(rows.map((r) => r.coach_id)),
    ]);
    const bookings = rows.map((r) =>
      rowToBooking({
        ...r,
        session: sessions.get(r.session_id) ?? null,
        coach: coaches.get(r.coach_id) ?? null,
      }),
    );
    return applyScope(bookings, filters.scope ?? 'all');
  },

  /** Bookings for a coach's sessions (with session + student info). */
  async listCoachBookings(
    coachId: string,
    filters: BookingFilters = {},
  ): Promise<Booking[]> {
    const { data, error } = await getSupabase()
      .from('bookings')
      .select('*')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    const rows = data ?? [];
    const [sessions, students] = await Promise.all([
      sessionLiteMap(rows.map((r) => r.session_id)),
      profileLiteMap(rows.map((r) => r.student_id)),
    ]);
    let bookings = rows.map((r) =>
      rowToBooking({
        ...r,
        session: sessions.get(r.session_id) ?? null,
        student: students.get(r.student_id) ?? null,
      }),
    );
    if (filters.status) bookings = bookings.filter((b) => b.status === filters.status);
    return applyScope(bookings, filters.scope ?? 'all');
  },

  /** A single booking by id. */
  async getBooking(id: string): Promise<Booking | null> {
    const { data, error } = await getSupabase()
      .from('bookings')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToBooking(data) : null;
  },

  /** Book a session as the signed-in student. */
  async createBooking(sessionId: string): Promise<Booking> {
    const sb = getSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) throw new Error('You must be signed in to book a session.');

    const { data: session, error: sErr } = await sb
      .from('sessions')
      .select('coach_id, status')
      .eq('id', sessionId)
      .single();
    if (sErr) throw sErr;
    if (session.status !== 'published') {
      throw new Error('This session is not available to book.');
    }
    if (session.coach_id === user.id) {
      throw new Error('You can’t book your own session.');
    }

    const insert: BookingsInsert = {
      session_id: sessionId,
      student_id: user.id,
      coach_id: session.coach_id,
    };
    const { data, error } = await sb
      .from('bookings')
      .insert(insert)
      .select('*')
      .single();
    if (error) throw error;
    return rowToBooking(data);
  },

  /** Confirm a pending booking (coach action). */
  async confirmBooking(id: string): Promise<void> {
    const { error } = await getSupabase()
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', id);
    if (error) throw error;
  },

  /** Cancel a booking. */
  async cancelBooking(id: string): Promise<void> {
    const { error } = await getSupabase()
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id);
    if (error) throw error;
  },

  /** A student's completed-session history with coach notes. */
  async listTrainingHistory(studentId: string): Promise<TrainingHistoryEntry[]> {
    const { data, error } = await getSupabase()
      .from('training_history')
      .select('*')
      .eq('student_id', studentId)
      .order('completed_at', { ascending: false });
    if (error) throw error;
    const rows = data ?? [];
    const coaches = await profileLiteMap(rows.map((r) => r.coach_id));
    return rows.map((r) =>
      rowToTrainingHistory({ ...r, coach: coaches.get(r.coach_id) ?? null }),
    );
  },

  /** Add or update a coach's notes on a completed session. */
  async saveTrainingNote(
    _bookingId: string,
    _notes: string,
  ): Promise<TrainingHistoryEntry> {
    return notImplemented('bookingService.saveTrainingNote');
  },
};
