/* =================================================================
   RollWise — Supabase database types
   -----------------------------------------------------------------
   Hand-written to match the schema in supabase/migrations/. Once the
   Supabase CLI is set up you can regenerate this with:
     supabase gen types typescript --project-id <id> > src/lib/database.types.ts
   ================================================================= */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'student' | 'coach' | 'admin';
export type BeltRank = 'white' | 'blue' | 'purple' | 'brown' | 'black';
export type Ruleset = 'gi' | 'no-gi' | 'both';
export type SessionFormat = 'private' | 'group';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'all-levels';
export type SessionStatus = 'draft' | 'published' | 'cancelled' | 'completed';
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'refunded';
export type VerificationStatus =
  | 'unverified'
  | 'pending'
  | 'verified'
  | 'rejected';
export type AccountStatus = 'active' | 'suspended';

type ProfileRow = {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  avatar_url: string | null;
  city: string | null;
  bio: string | null;
  belt: BeltRank | null;
  belt_degree: number | null;
  academy: string | null;
  lineage: string | null;
  hourly_rate: number | null;
  rulesets: string[] | null;
  focus_tags: string[] | null;
  rating_average: number;
  rating_count: number;
  verification: VerificationStatus;
  status: AccountStatus;
  social_links: Json | null;
  stripe_account_id: string | null;
  stripe_charges_enabled: boolean;
  created_at: string;
}

type SessionRow = {
  id: string;
  coach_id: string;
  title: string;
  description: string | null;
  format: SessionFormat;
  ruleset: Ruleset;
  skill_level: SkillLevel;
  focus_tags: string[];
  starts_at: string;
  duration_minutes: number;
  price: number;
  capacity: number;
  spots_remaining: number;
  gym_name: string | null;
  city: string;
  timezone: string;
  status: SessionStatus;
  created_at: string;
}

type BookingRow = {
  id: string;
  session_id: string;
  student_id: string;
  coach_id: string;
  status: BookingStatus;
  payment_status: PaymentStatus;
  stripe_session_id: string | null;
  created_at: string;
}

type VerificationRequestRow = {
  id: string;
  coach_id: string;
  belt: BeltRank;
  belt_degree: number | null;
  academy: string;
  lineage: string | null;
  social_links: Json | null;
  proof_url: string | null;
  status: VerificationStatus;
  reason: string | null;
  submitted_at: string;
}

type TrainingHistoryRow = {
  id: string;
  booking_id: string;
  student_id: string;
  coach_id: string;
  completed_at: string;
  duration_minutes: number;
  focus_tags: string[];
  coach_notes: string | null;
  created_at: string;
}

type PaymentRow = {
  id: string;
  booking_id: string | null;
  coach_id: string;
  amount: number;
  application_fee: number;
  currency: string;
  status: PaymentStatus;
  type: string;
  stripe_payment_id: string | null;
  created_at: string;
}

/** Helper: a table definition with Row, Insert (Row minus DB-managed), Update. */
type Table<Row, Optional extends keyof Row> = {
  Row: Row;
  Insert: Omit<Row, Optional> & Partial<Pick<Row, Optional>>;
  Update: Partial<Row>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: Table<ProfileRow, 'created_at' | 'rating_average' | 'rating_count' | 'verification' | 'status' | 'stripe_account_id' | 'stripe_charges_enabled'>;
      // Public coach-discovery view (active coaches only), readable by anon.
      public_profiles: Table<ProfileRow, 'created_at' | 'rating_average' | 'rating_count' | 'verification' | 'status' | 'stripe_account_id' | 'stripe_charges_enabled'>;
      // Authenticated-only participant lookup (name/avatar for all roles by id).
      member_profiles: Table<ProfileRow, 'created_at' | 'rating_average' | 'rating_count' | 'verification' | 'status' | 'stripe_account_id' | 'stripe_charges_enabled'>;
      sessions: Table<SessionRow, 'id' | 'created_at' | 'status' | 'spots_remaining' | 'timezone'>;
      bookings: Table<BookingRow, 'id' | 'created_at' | 'status' | 'payment_status' | 'stripe_session_id'>;
      coach_verification_requests: Table<VerificationRequestRow, 'id' | 'submitted_at' | 'status' | 'reason'>;
      training_history: Table<TrainingHistoryRow, 'id' | 'created_at'>;
      payments: Table<PaymentRow, 'id' | 'created_at' | 'currency' | 'booking_id' | 'stripe_payment_id' | 'application_fee'>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    CompositeTypes: Record<string, never>;
    Enums: {
      user_role: UserRole;
      belt_rank: BeltRank;
      ruleset: Ruleset;
      session_format: SessionFormat;
      skill_level: SkillLevel;
      session_status: SessionStatus;
      booking_status: BookingStatus;
      payment_status: PaymentStatus;
      verification_status: VerificationStatus;
      account_status: AccountStatus;
    };
  };
}
