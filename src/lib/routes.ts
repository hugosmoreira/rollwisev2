/**
 * Centralized route paths. Import these instead of hardcoding strings
 * so navigation stays consistent as the app grows across phases.
 */
export const ROUTES = {
  // ---- Public / marketing ----
  home: '/',
  findCoaches: '/find-coaches',
  about: '/about',
  becomeCoach: '/become-a-coach',
  terms: '/terms',
  privacy: '/privacy',

  // ---- Auth ----
  login: '/auth/login',
  signup: '/auth/signup',
  chooseRole: '/auth/choose-role',
  forgotPassword: '/auth/forgot-password',

  // ---- Student app (built in later phases) ----
  student: {
    dashboard: '/app/student/dashboard',
    findClasses: '/app/student/find-classes',
    class: (id = ':id') => `/app/student/class/${id}`,
    myBookings: '/app/student/my-bookings',
    trainingHistory: '/app/student/training-history',
    messages: '/app/student/messages',
    profile: '/app/student/profile',
    settings: '/app/student/settings',
  },

  // ---- Coach app (built in later phases) ----
  coach: {
    dashboard: '/app/coach/dashboard',
    createSession: '/app/coach/create-session',
    editSession: (id = ':id') => `/app/coach/edit-session/${id}`,
    activeSessions: '/app/coach/active-sessions',
    schedule: '/app/coach/schedule',
    bookings: '/app/coach/bookings',
    students: '/app/coach/students',
    earnings: '/app/coach/earnings',
    verification: '/app/coach/verification',
    profile: '/app/coach/profile',
    settings: '/app/coach/settings',
  },

  // ---- Admin app (built in later phases) ----
  admin: {
    dashboard: '/app/admin/dashboard',
    users: '/app/admin/users',
    coaches: '/app/admin/coaches',
    verifications: '/app/admin/verifications',
    sessions: '/app/admin/sessions',
    bookings: '/app/admin/bookings',
    payments: '/app/admin/payments',
    settings: '/app/admin/settings',
  },
} as const;
