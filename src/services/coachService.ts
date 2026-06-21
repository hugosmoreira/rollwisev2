/* =================================================================
   RollWise — Coach service
   (Supabase tables: `profiles` (coach view), `coach_verification_requests`)
   ================================================================= */

import type {
  BeltRank,
  Coach,
  CoachVerificationRequest,
  Ruleset,
} from '@/types';
import type { Database, Json } from '@/lib/database.types';
import { getSupabase } from '@/lib/supabase';
import { rowToCoach, rowToVerification } from './mappers';

type ProfilesUpdate = Database['public']['Tables']['profiles']['Update'];
type VerificationInsert =
  Database['public']['Tables']['coach_verification_requests']['Insert'];

/** Filters for coach discovery (Find Coaches). */
export interface CoachFilters {
  query?: string;
  ruleset?: Ruleset;
  focusTags?: string[];
  city?: string;
}

/** Editable fields on a coach's public profile. */
export interface CoachProfileUpdate {
  fullName?: string;
  avatarUrl?: string | null;
  city?: string;
  bio?: string;
  belt?: BeltRank;
  beltDegree?: number | null;
  academy?: string | null;
  lineage?: string | null;
  hourlyRate?: number | null;
  rulesets?: Ruleset[];
  focusTags?: string[];
  socialLinks?: { label: string; url: string }[];
}

/** Payload for a verification submission. */
export interface VerificationInput {
  belt: BeltRank;
  beltDegree?: number;
  academy: string;
  lineage?: string;
  socialLinks: { label: string; url: string }[];
  proofUrl?: string;
}

/** A row in a coach's "Students" list. */
export interface CoachStudentSummary {
  studentId: string;
  fullName: string;
  avatarUrl?: string | null;
  totalSessions: number;
  lastSessionAt?: string | null;
}

export const coachService = {
  /** Search coaches for discovery. */
  async listCoaches(filters: CoachFilters = {}): Promise<Coach[]> {
    let q = getSupabase()
      .from('public_profiles')
      .select('*')
      .eq('role', 'coach')
      .order('rating_average', { ascending: false });

    if (filters.city) q = q.ilike('city', `%${filters.city}%`);
    if (filters.query) q = q.ilike('full_name', `%${filters.query}%`);

    const { data, error } = await q;
    if (error) throw error;
    let coaches = (data ?? []).map(rowToCoach);
    if (filters.ruleset) {
      coaches = coaches.filter((c) => c.rulesets.includes(filters.ruleset!));
    }
    if (filters.focusTags?.length) {
      coaches = coaches.filter((c) =>
        filters.focusTags!.every((t) => c.focusTags.includes(t)),
      );
    }
    return coaches;
  },

  /** A coach's public profile by id. */
  async getCoach(id: string): Promise<Coach | null> {
    const { data, error } = await getSupabase()
      .from('public_profiles')
      .select('*')
      .eq('id', id)
      .eq('role', 'coach')
      .maybeSingle();
    if (error) throw error;
    return data ? rowToCoach(data) : null;
  },

  /** The signed-in coach's own profile. */
  async getCurrentCoach(): Promise<Coach | null> {
    const sb = getSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return null;
    const { data, error } = await sb
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToCoach(data) : null;
  },

  /** Update the signed-in coach's profile. */
  async updateCoachProfile(
    id: string,
    patch: CoachProfileUpdate,
  ): Promise<Coach> {
    const row: ProfilesUpdate = {};
    if (patch.fullName !== undefined) row.full_name = patch.fullName;
    if (patch.avatarUrl !== undefined) row.avatar_url = patch.avatarUrl;
    if (patch.city !== undefined) row.city = patch.city;
    if (patch.bio !== undefined) row.bio = patch.bio;
    if (patch.belt !== undefined) row.belt = patch.belt;
    if (patch.beltDegree !== undefined) row.belt_degree = patch.beltDegree;
    if (patch.academy !== undefined) row.academy = patch.academy;
    if (patch.lineage !== undefined) row.lineage = patch.lineage;
    if (patch.hourlyRate !== undefined) row.hourly_rate = patch.hourlyRate;
    if (patch.rulesets !== undefined) row.rulesets = patch.rulesets;
    if (patch.focusTags !== undefined) row.focus_tags = patch.focusTags;
    if (patch.socialLinks !== undefined)
      row.social_links = patch.socialLinks as unknown as Json;

    const { data, error } = await getSupabase()
      .from('profiles')
      .update(row)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return rowToCoach(data);
  },

  /** Submit a verification request and mark the profile as pending. */
  async submitVerification(
    input: VerificationInput,
  ): Promise<CoachVerificationRequest> {
    const sb = getSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) throw new Error('You must be signed in to submit verification.');

    const insert: VerificationInsert = {
      coach_id: user.id,
      belt: input.belt,
      belt_degree: input.beltDegree ?? null,
      academy: input.academy,
      lineage: input.lineage ?? null,
      social_links: input.socialLinks as unknown as Json,
      proof_url: input.proofUrl ?? null,
    };
    const { data, error } = await sb
      .from('coach_verification_requests')
      .insert(insert)
      .select('*')
      .single();
    if (error) throw error;

    // Reflect "pending" on the coach's profile.
    await sb.from('profiles').update({ verification: 'pending' }).eq('id', user.id);

    return rowToVerification(data);
  },

  /** Upload a verification document to the private bucket; returns its path. */
  async uploadVerificationProof(file: File): Promise<string> {
    const sb = getSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) throw new Error('You must be signed in to upload a document.');
    const ext =
      (file.name.split('.').pop() ?? 'pdf').toLowerCase().replace(/[^a-z0-9]/g, '') ||
      'pdf';
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await sb.storage
      .from('verification-proofs')
      .upload(path, file, {
        upsert: true,
        contentType: file.type || 'application/octet-stream',
      });
    if (error) {
      if (/bucket not found/i.test(error.message)) {
        throw new Error(
          'Verification storage is not set up yet. Run supabase/verification-proofs.sql.',
        );
      }
      throw error;
    }
    return path;
  },

  /** A short-lived signed URL to view a stored proof (admin/owner only). */
  async getVerificationProofUrl(path: string): Promise<string> {
    const { data, error } = await getSupabase()
      .storage.from('verification-proofs')
      .createSignedUrl(path, 300);
    if (error) throw error;
    return data.signedUrl;
  },

  /** The signed-in coach's latest verification request, if any. */
  async getVerification(coachId: string): Promise<CoachVerificationRequest | null> {
    const { data, error } = await getSupabase()
      .from('coach_verification_requests')
      .select('*')
      .eq('coach_id', coachId)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToVerification(data) : null;
  },

  /** Students who have trained with a coach (aggregated from bookings). */
  async listStudents(coachId: string): Promise<CoachStudentSummary[]> {
    const sb = getSupabase();
    const { data: bookings, error } = await sb
      .from('bookings')
      .select('student_id, created_at')
      .eq('coach_id', coachId);
    if (error) throw error;

    const byStudent = new Map<string, { count: number; last: string }>();
    (bookings ?? []).forEach((b) => {
      const cur = byStudent.get(b.student_id);
      if (!cur) byStudent.set(b.student_id, { count: 1, last: b.created_at });
      else {
        cur.count += 1;
        if (b.created_at > cur.last) cur.last = b.created_at;
      }
    });

    const ids = [...byStudent.keys()];
    if (ids.length === 0) return [];
    const { data: profiles } = await sb
      .from('public_profiles')
      .select('id, full_name, avatar_url')
      .in('id', ids);
    const nameMap = new Map(
      (profiles ?? []).map((p) => [p.id, { name: p.full_name, avatar: p.avatar_url }]),
    );

    return ids.map((id) => {
      const agg = byStudent.get(id)!;
      const info = nameMap.get(id);
      return {
        studentId: id,
        fullName: info?.name ?? 'Student',
        avatarUrl: info?.avatar ?? null,
        totalSessions: agg.count,
        lastSessionAt: agg.last,
      };
    });
  },
};
