import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@/lib/theme';
import { AuthProvider } from '@/lib/auth';
import { RequireAuth, RequireRole, AppIndexRedirect } from '@/lib/guards';
import { ScrollManager } from '@/components/layout/ScrollManager';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AuthLayout } from '@/pages/auth/AuthLayout';
import { StudentLayout } from '@/pages/student/StudentLayout';
import { CoachLayout } from '@/pages/coach/CoachLayout';
import { AdminLayout } from '@/pages/admin/AdminLayout';

import { LandingPage } from '@/pages/public/LandingPage';
import { FindCoachesPage } from '@/pages/public/FindCoachesPage';
import { AboutPage } from '@/pages/public/AboutPage';
import { BecomeCoachPage } from '@/pages/public/BecomeCoachPage';
import { TermsPage } from '@/pages/public/TermsPage';
import { PrivacyPage } from '@/pages/public/PrivacyPage';

import { LoginPage } from '@/pages/auth/LoginPage';
import { SignupPage } from '@/pages/auth/SignupPage';
import { ChooseRolePage } from '@/pages/auth/ChooseRolePage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';

import { StudentDashboardPage } from '@/pages/student/StudentDashboardPage';
import { FindClassesPage } from '@/pages/student/FindClassesPage';
import { ClassDetailsPage } from '@/pages/student/ClassDetailsPage';
import { MyBookingsPage } from '@/pages/student/MyBookingsPage';
import { TrainingHistoryPage } from '@/pages/student/TrainingHistoryPage';
import { MessagesPage } from '@/pages/student/MessagesPage';
import { ProfilePage } from '@/pages/student/ProfilePage';
import { SettingsPage } from '@/pages/student/SettingsPage';

import { CoachDashboardPage } from '@/pages/coach/CoachDashboardPage';
import { CreateSessionPage } from '@/pages/coach/CreateSessionPage';
import { EditSessionPage } from '@/pages/coach/EditSessionPage';
import { ActiveSessionsPage } from '@/pages/coach/ActiveSessionsPage';
import { SchedulePage } from '@/pages/coach/SchedulePage';
import { BookingsPage } from '@/pages/coach/BookingsPage';
import { StudentsPage } from '@/pages/coach/StudentsPage';
import { EarningsPage } from '@/pages/coach/EarningsPage';
import { VerificationPage } from '@/pages/coach/VerificationPage';
import { CoachProfilePage } from '@/pages/coach/CoachProfilePage';
import { CoachSettingsPage } from '@/pages/coach/CoachSettingsPage';

import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminCoachesPage } from '@/pages/admin/AdminCoachesPage';
import { AdminVerificationsPage } from '@/pages/admin/AdminVerificationsPage';
import { AdminSessionsPage } from '@/pages/admin/AdminSessionsPage';
import { AdminBookingsPage } from '@/pages/admin/AdminBookingsPage';
import { AdminPaymentsPage } from '@/pages/admin/AdminPaymentsPage';
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage';

import { NotFoundPage } from '@/pages/public/NotFoundPage';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <ScrollManager />
        <Routes>
          {/* ---- Public / marketing ---- */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/find-coaches" element={<FindCoachesPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/become-a-coach" element={<BecomeCoachPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            {/* ---- Fallback ---- */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* ---- Auth (UI prepared for Supabase Auth; no mock auth) ---- */}
          <Route element={<AuthLayout />}>
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/signup" element={<SignupPage />} />
            <Route path="/auth/choose-role" element={<ChooseRolePage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          </Route>

          {/* ---- Authenticated app (role-gated) ---- */}
          <Route path="/app" element={<RequireAuth />}>
            <Route index element={<AppIndexRedirect />} />

            {/* Student */}
            <Route path="student" element={<RequireRole role="student" />}>
              <Route element={<StudentLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<StudentDashboardPage />} />
                <Route path="find-classes" element={<FindClassesPage />} />
                <Route path="class/:id" element={<ClassDetailsPage />} />
                <Route path="my-bookings" element={<MyBookingsPage />} />
                <Route path="training-history" element={<TrainingHistoryPage />} />
                <Route path="messages" element={<MessagesPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Route>

            {/* Coach */}
            <Route path="coach" element={<RequireRole role="coach" />}>
              <Route element={<CoachLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<CoachDashboardPage />} />
                <Route path="create-session" element={<CreateSessionPage />} />
                <Route path="edit-session/:id" element={<EditSessionPage />} />
                <Route path="active-sessions" element={<ActiveSessionsPage />} />
                <Route path="schedule" element={<SchedulePage />} />
                <Route path="bookings" element={<BookingsPage />} />
                <Route path="students" element={<StudentsPage />} />
                <Route path="earnings" element={<EarningsPage />} />
                <Route path="verification" element={<VerificationPage />} />
                <Route path="profile" element={<CoachProfilePage />} />
                <Route path="settings" element={<CoachSettingsPage />} />
              </Route>
            </Route>

            {/* Admin */}
            <Route path="admin" element={<RequireRole role="admin" />}>
              <Route element={<AdminLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="coaches" element={<AdminCoachesPage />} />
                <Route path="verifications" element={<AdminVerificationsPage />} />
                <Route path="sessions" element={<AdminSessionsPage />} />
                <Route path="bookings" element={<AdminBookingsPage />} />
                <Route path="payments" element={<AdminPaymentsPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
