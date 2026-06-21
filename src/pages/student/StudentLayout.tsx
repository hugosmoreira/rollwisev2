import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  CalendarCheck,
  History,
  MessageSquare,
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
import styles from './StudentLayout.module.css';

const ICON = { size: 18, strokeWidth: 1.8 } as const;

const SECTIONS: SidebarSection[] = [
  {
    items: [
      {
        label: 'Dashboard',
        to: ROUTES.student.dashboard,
        icon: <LayoutDashboard {...ICON} />,
        end: true,
      },
      {
        label: 'Find Classes',
        to: ROUTES.student.findClasses,
        icon: <Search {...ICON} />,
      },
      {
        label: 'My Bookings',
        to: ROUTES.student.myBookings,
        icon: <CalendarCheck {...ICON} />,
      },
      {
        label: 'Training History',
        to: ROUTES.student.trainingHistory,
        icon: <History {...ICON} />,
      },
      {
        label: 'Messages',
        to: ROUTES.student.messages,
        icon: <MessageSquare {...ICON} />,
      },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Profile', to: ROUTES.student.profile, icon: <User {...ICON} /> },
      {
        label: 'Settings',
        to: ROUTES.student.settings,
        icon: <Settings {...ICON} />,
      },
    ],
  },
];

const TITLES: Record<string, string> = {
  [ROUTES.student.dashboard]: 'Dashboard',
  [ROUTES.student.findClasses]: 'Find Classes',
  [ROUTES.student.myBookings]: 'My Bookings',
  [ROUTES.student.trainingHistory]: 'Training History',
  [ROUTES.student.messages]: 'Messages',
  [ROUTES.student.profile]: 'Profile',
  [ROUTES.student.settings]: 'Settings',
};

function useStudentTitle(): string {
  const { pathname } = useLocation();
  if (pathname.includes('/class/')) return 'Class Details';
  return TITLES[pathname] ?? 'Dashboard';
}

export function StudentLayout() {
  const title = useStudentTitle();
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
            to={ROUTES.student.profile}
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
        <SidebarAccount profileTo={ROUTES.student.profile} fallbackRole="student" />
      }
    >
      <Outlet />
    </DashboardShell>
  );
}
