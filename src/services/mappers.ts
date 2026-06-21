/* =================================================================
   RollWise — Row mappers
   -----------------------------------------------------------------
   Convert snake_case Supabase rows into the camelCase domain types
   the UI uses (@/types).
   ================================================================= */

import type { Database } from '@/lib/database.types';
import type {
  BeltRank,
  Booking,
  BookingStatus,
  Coach,
  CoachVerificationRequest,
  Payment,
  PaymentStatus,
  Profile,
  Ruleset,
  Session,
  SessionFormat,
  SkillLevel,
  TrainingHistoryEntry,
  VerificationStatus,
} from '@/types';

type Tables = Database['public']['Tables'];
export type ProfileRow = Tables['profiles']['Row'];
export type SessionRow = Tables['sessions']['Row'];
export type BookingRow = Tables['bookings']['Row'];
export type TrainingHistoryRow = Tables['training_history']['Row'];
export type VerificationRow = Tables['coach_verification_requests']['Row'];
export type PaymentRow = Tables['payments']['Row'];

export function rowToPayment(r: PaymentRow): Payment {
  return {
    id: r.id,
    bookingId: r.booking_id ?? '',
    amount: r.amount,
    currency: r.currency,
    status: r.status as PaymentStatus,
    createdAt: r.created_at,
  };
}

type CoachLite = Pick<ProfileRow, 'full_name' | 'avatar_url' | 'belt'>;

/** Parse the jsonb social_links column into a typed array. */
export function parseSocialLinks(
  value: ProfileRow['social_links'],
): { label: string; url: string }[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const record = item as Record<string, unknown>;
      if (typeof record.url === 'string') {
        return [
          {
            label: typeof record.label === 'string' ? record.label : '',
            url: record.url,
          },
        ];
      }
    }
    return [];
  });
}

export function rowToProfile(r: ProfileRow): Profile {
  return {
    id: r.id,
    role: r.role,
    fullName: r.full_name,
    email: r.email,
    avatarUrl: r.avatar_url,
    city: r.city,
    bio: r.bio,
    status: r.status,
    createdAt: r.created_at,
  };
}

export function rowToCoach(r: ProfileRow): Coach {
  return {
    id: r.id,
    profileId: r.id,
    fullName: r.full_name,
    avatarUrl: r.avatar_url,
    belt: (r.belt ?? 'white') as BeltRank,
    beltDegree: r.belt_degree,
    academy: r.academy,
    lineage: r.lineage,
    city: r.city ?? '',
    ratingAverage: r.rating_average,
    ratingCount: r.rating_count,
    hourlyRate: r.hourly_rate ?? 0,
    rulesets: (r.rulesets ?? []) as Ruleset[],
    focusTags: r.focus_tags ?? [],
    verification: r.verification as VerificationStatus,
    socialLinks: parseSocialLinks(r.social_links),
  };
}

export function rowToSession(
  r: SessionRow & { coach?: CoachLite | null },
): Session {
  return {
    id: r.id,
    coachId: r.coach_id,
    coachName: r.coach?.full_name ?? '',
    coachAvatarUrl: r.coach?.avatar_url ?? null,
    coachBelt: (r.coach?.belt ?? undefined) as BeltRank | undefined,
    title: r.title,
    description: r.description ?? undefined,
    format: r.format as SessionFormat,
    ruleset: r.ruleset as Ruleset,
    skillLevel: r.skill_level as SkillLevel,
    focusTags: r.focus_tags ?? [],
    startsAt: r.starts_at,
    durationMinutes: r.duration_minutes,
    price: r.price,
    capacity: r.capacity,
    spotsRemaining: r.spots_remaining,
    gymName: r.gym_name,
    city: r.city,
    timezone: r.timezone ?? 'UTC',
    status: r.status,
  };
}

type BookingJoins = BookingRow & {
  session?: Pick<
    SessionRow,
    'title' | 'starts_at' | 'duration_minutes' | 'price' | 'city' | 'gym_name'
  > | null;
  student?: Pick<ProfileRow, 'full_name' | 'avatar_url'> | null;
  coach?: Pick<ProfileRow, 'full_name' | 'avatar_url'> | null;
};

export function rowToBooking(r: BookingJoins): Booking {
  const location =
    r.session?.gym_name && r.session?.city
      ? `${r.session.gym_name} · ${r.session.city}`
      : (r.session?.city ?? null);
  return {
    id: r.id,
    sessionId: r.session_id,
    studentId: r.student_id,
    studentName: r.student?.full_name ?? '',
    studentAvatarUrl: r.student?.avatar_url ?? null,
    coachId: r.coach_id,
    coachName: r.coach?.full_name ?? '',
    coachAvatarUrl: r.coach?.avatar_url ?? null,
    sessionTitle: r.session?.title ?? 'Session',
    startsAt: r.session?.starts_at ?? r.created_at,
    durationMinutes: r.session?.duration_minutes ?? 0,
    price: r.session?.price ?? 0,
    status: r.status as BookingStatus,
    paymentStatus: r.payment_status as PaymentStatus,
    location,
  };
}

export function rowToVerification(r: VerificationRow): CoachVerificationRequest {
  return {
    id: r.id,
    coachId: r.coach_id,
    belt: r.belt as BeltRank,
    beltDegree: r.belt_degree,
    academy: r.academy,
    lineage: r.lineage,
    socialLinks: parseSocialLinks(r.social_links),
    proofUrl: r.proof_url,
    status: r.status as VerificationStatus,
    submittedAt: r.submitted_at,
  };
}

export function rowToTrainingHistory(
  r: TrainingHistoryRow & {
    session?: Pick<SessionRow, 'title'> | null;
    coach?: Pick<ProfileRow, 'full_name'> | null;
  },
): TrainingHistoryEntry {
  return {
    id: r.id,
    bookingId: r.booking_id,
    studentId: r.student_id,
    coachId: r.coach_id,
    coachName: r.coach?.full_name ?? '',
    sessionTitle: r.session?.title ?? 'Session',
    completedAt: r.completed_at,
    durationMinutes: r.duration_minutes,
    focusTags: r.focus_tags ?? [],
    coachNotes: r.coach_notes,
  };
}
