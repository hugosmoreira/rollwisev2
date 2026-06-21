/**
 * RollWise services — the data layer between the UI and Supabase.
 * Every method currently throws "Not implemented yet" (see serviceError);
 * implementations land once Supabase is wired. Nothing returns fake data.
 */
export { authService } from './authService';
export type { AuthRole, OAuthProvider, SignUpParams, SignInParams } from './authService';

export { profileService } from './profileService';
export type { ProfileUpdate } from './profileService';

export { sessionService } from './sessionService';
export type {
  SessionFilters,
  SessionInput,
  CoachSessionStatus,
} from './sessionService';

export { bookingService } from './bookingService';
export type { BookingFilters, BookingScope } from './bookingService';

export { coachService } from './coachService';
export type {
  CoachFilters,
  CoachProfileUpdate,
  VerificationInput,
  CoachStudentSummary,
} from './coachService';

export { adminService } from './adminService';
export type {
  PlatformStats,
  UserFilters,
  VerificationQueue,
} from './adminService';

export { paymentService } from './paymentService';
export type {
  PaymentFilters,
  CoachEarnings,
  PlatformPayments,
  RedirectUrl,
} from './paymentService';

export { NotImplementedError, notImplemented } from './serviceError';
