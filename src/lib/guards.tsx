import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoadingState } from '@/components/common/LoadingState';
import { useAuth } from './auth';
import { ROUTES } from './routes';
import type { UserRole } from '@/types';

/** The home dashboard for a given role. */
export function appHomeFor(role: UserRole): string {
  switch (role) {
    case 'coach':
      return ROUTES.coach.dashboard;
    case 'admin':
      return ROUTES.admin.dashboard;
    default:
      return ROUTES.student.dashboard;
  }
}

function FullPageLoader() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <LoadingState label="Loading…" />
    </div>
  );
}

/** Gate: requires an authenticated session, else redirects to login. */
export function RequireAuth() {
  const { loading, session } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader />;
  if (!session) {
    return <Navigate to={ROUTES.login} state={{ from: location.pathname }} replace />;
  }
  return <Outlet />;
}

/** Gate: requires the signed-in user to have a specific role. */
export function RequireRole({ role }: { role: UserRole }) {
  const { profile, profileLoading } = useAuth();

  if (profileLoading) return <FullPageLoader />;
  if (!profile) return <Navigate to={ROUTES.login} replace />;
  if (profile.role !== role) return <Navigate to={appHomeFor(profile.role)} replace />;
  return <Outlet />;
}

/** /app index — sends the user to their role's dashboard. */
export function AppIndexRedirect() {
  const { loading, session, profile, profileLoading } = useAuth();

  if (loading || profileLoading) return <FullPageLoader />;
  if (!session) return <Navigate to={ROUTES.login} replace />;
  if (!profile) return <Navigate to={ROUTES.login} replace />;
  return <Navigate to={appHomeFor(profile.role)} replace />;
}
