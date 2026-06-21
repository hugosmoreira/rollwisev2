import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  Layers,
  CalendarDays,
  ClipboardList,
  Users,
  Wallet,
  BadgeCheck,
  User,
  Settings,
  Bell,
} from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import type { SidebarSection } from '@/components/layout/Sidebar';
import { SidebarAccount } from '@/components/layout/SidebarAccount';
import { Avatar } from '@/components/common/Avatar';
import { useAuth } from '@/lib/auth';
import { ROUTES } from '@/lib/routes';
import styles from './CoachLayout.module.css';

const ICON = { size: 18, strokeWidth: 1.8 } as const;

const SECTIONS: SidebarSection[] = [
  {
    items: [
      {
        label: 'Dashboard',
        to: ROUTES.coach.dashboard,
        icon: <LayoutDashboard {...ICON} />,
        end: true,
      },
      {
        label: 'Create Session',
        to: ROUTES.coach.createSession,
        icon: <PlusCircle {...ICON} />,
      },
      {
        label: 'Active Sessions',
        to: ROUTES.coach.activeSessions,
        icon: <Layers {...ICON} />,
      },
      {
        label: 'Schedule',
        to: ROUTES.coach.schedule,
        icon: <CalendarDays {...ICON} />,
      },
      {
        label: 'Bookings',
        to: ROUTES.coach.bookings,
        icon: <ClipboardList {...ICON} />,
      },
      { label: 'Students', to: ROUTES.coach.students, icon: <Users {...ICON} /> },
      { label: 'Earnings', to: ROUTES.coach.earnings, icon: <Wallet {...ICON} /> },
    ],
  },
  {
    label: 'Account',
    items: [
      {
        label: 'Verification',
        to: ROUTES.coach.verification,
        icon: <BadgeCheck {...ICON} />,
      },
      { label: 'Profile', to: ROUTES.coach.profile, icon: <User {...ICON} /> },
      {
        label: 'Settings',
        to: ROUTES.coach.settings,
        icon: <Settings {...ICON} />,
      },
    ],
  },
];

const TITLES: Record<string, string> = {
  [ROUTES.coach.dashboard]: 'Dashboard',
  [ROUTES.coach.createSession]: 'Create Session',
  [ROUTES.coach.activeSessions]: 'Active Sessions',
  [ROUTES.coach.schedule]: 'Schedule',
  [ROUTES.coach.bookings]: 'Bookings',
  [ROUTES.coach.students]: 'Students',
  [ROUTES.coach.earnings]: 'Earnings',
  [ROUTES.coach.verification]: 'Verification',
  [ROUTES.coach.profile]: 'Profile',
  [ROUTES.coach.settings]: 'Settings',
};

function useCoachTitle(): string {
  const { pathname } = useLocation();
  if (pathname.includes('/edit-session/')) return 'Edit Session';
  return TITLES[pathname] ?? 'Dashboard';
}

export function CoachLayout() {
  const title = useCoachTitle();
  const { profile } = useAuth();

  return (
    <DashboardShell
      sections={SECTIONS}
      title={title}
      topbarEnd={
        <>
          <button type="button" className={styles.iconButton} aria-label="Notifications">
            <Bell size={18} strokeWidth={1.8} />
          </button>
          <Link
            to={ROUTES.coach.profile}
            className={styles.avatarLink}
            aria-label="Your profile"
          >
            <Avatar
              name={profile?.fullName}
              src={profile?.avatarUrl}
              size="sm"
              shape="circle"
            />
          </Link>
        </>
      }
      sidebarFooter={
        <SidebarAccount profileTo={ROUTES.coach.profile} fallbackRole="coach" />
      }
    >
      <Outlet />
    </DashboardShell>
  );
}
