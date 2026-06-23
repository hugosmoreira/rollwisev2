/* =================================================================
   RollWise — Domain types
   -----------------------------------------------------------------
   The shared shape of platform data. These mirror the planned
   Supabase tables (profiles, sessions, bookings,
   coach_verification_requests, training_history, payments) so
   services and UI agree on one model. No data is defined here —
   only types.
   ================================================================= */

export type UserRole = 'student' | 'coach' | 'admin';

export type BeltRank = 'white' | 'blue' | 'purple' | 'brown' | 'black';

/** Jiu-Jitsu ruleset. */
export type Ruleset = 'gi' | 'no-gi' | 'both';

export type SessionFormat = 'private' | 'group';

export type SessionStatus = 'draft' | 'published' | 'cancelled' | 'completed';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'all-levels';

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'refunded';

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export type AccountStatus = 'active' | 'suspended';

/** A user account profile (maps to `profiles`). */
export interface Profile {
  id: string;
  role: UserRole;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  city?: string | null;
  bio?: string | null;
  status?: AccountStatus;
  createdAt: string;
}

/** Public-facing coach details layered on top of a profile. */
export interface Coach {
  id: string;
  profileId: string;
  fullName: string;
  avatarUrl?: string | null;
  belt: BeltRank;
  beltDegree?: number | null;
  academy?: string | null;
  lineage?: string | null;
  city: string;
  ratingAverage: number;
  ratingCount: number;
  hourlyRate: number;
  rulesets: Ruleset[];
  focusTags: string[];
  verification: VerificationStatus;
  socialLinks?: { label: string; url: string }[];
}

/** A bookable training session (maps to `sessions`). */
export interface Session {
  id: string;
  coachId: string;
  coachName: string;
  coachAvatarUrl?: string | null;
  coachBelt?: BeltRank;
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
  spotsRemaining: number;
  gymName?: string | null;
  city: string;
  timezone: string;
  status: SessionStatus;
}

/** A student's booking of a session (maps to `bookings`). */
export interface Booking {
  id: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  studentAvatarUrl?: string | null;
  coachId: string;
  coachName?: string;
  coachAvatarUrl?: string | null;
  sessionTitle: string;
  startsAt: string;
  durationMinutes: number;
  price: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  location?: string | null;
}

/** A completed training entry with coach feedback (maps to `training_history`). */
export interface TrainingHistoryEntry {
  id: string;
  bookingId: string;
  studentId: string;
  coachId: string;
  coachName: string;
  sessionTitle: string;
  completedAt: string;
  durationMinutes: number;
  focusTags: string[];
  coachNotes?: string | null;
}

/** A payment record (maps to `payments`). */
export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: string;
}

/** A coach's submitted verification request (maps to `coach_verification_requests`). */
export interface CoachVerificationRequest {
  id: string;
  coachId: string;
  belt: BeltRank;
  beltDegree?: number | null;
  academy: string;
  lineage?: string | null;
  socialLinks: { label: string; url: string }[];
  proofUrl?: string | null;
  status: VerificationStatus;
  submittedAt: string;
}
