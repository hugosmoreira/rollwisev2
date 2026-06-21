import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Award,
  ShieldCheck,
  Layers,
  ClipboardList,
  CreditCard,
  Settings,
  Bell,
} from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import type { SidebarSection } from '@/components/layout/Sidebar';
import { SidebarAccount } from '@/components/layout/SidebarAccount';
import { Avatar } from '@/components/common/Avatar';
import { useAuth } from '@/lib/auth';
import { ROUTES } from '@/lib/routes';
import styles from './AdminLayout.module.css';

const ICON = { size: 18, strokeWidth: 1.8 } as const;

const SECTIONS: SidebarSection[] = [
  {
    items: [
      {
        label: 'Dashboard',
        to: ROUTES.admin.dashboard,
        icon: <LayoutDashboard {...ICON} />,
        end: true,
      },
      { label: 'Users', to: ROUTES.admin.users, icon: <Users {...ICON} /> },
      { label: 'Coaches', to: ROUTES.admin.coaches, icon: <Award {...ICON} /> },
      {
        label: 'Verifications',
        to: ROUTES.admin.verifications,
        icon: <ShieldCheck {...ICON} />,
      },
      { label: 'Sessions', to: ROUTES.admin.sessions, icon: <Layers {...ICON} /> },
      {
        label: 'Bookings',
        to: ROUTES.admin.bookings,
        icon: <ClipboardList {...ICON} />,
      },
      {
        label: 'Payments',
        to: ROUTES.admin.payments,
        icon: <CreditCard {...ICON} />,
      },
    ],
  },
  {
    label: 'System',
    items: [
      {
        label: 'Settings',
        to: ROUTES.admin.settings,
        icon: <Settings {...ICON} />,
      },
    ],
  },
];

const TITLES: Record<string, string> = {
  [ROUTES.admin.dashboard]: 'Dashboard',
  [ROUTES.admin.users]: 'Users',
  [ROUTES.admin.coaches]: 'Coaches',
  [ROUTES.admin.verifications]: 'Verifications',
  [ROUTES.admin.sessions]: 'Sessions',
  [ROUTES.admin.bookings]: 'Bookings',
  [ROUTES.admin.payments]: 'Payments',
  [ROUTES.admin.settings]: 'Settings',
};

function useAdminTitle(): string {
  const { pathname } = useLocation();
  return TITLES[pathname] ?? 'Dashboard';
}

export function AdminLayout() {
  const title = useAdminTitle();
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
            to={ROUTES.admin.settings}
            className={styles.avatarLink}
            aria-label="Admin settings"
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
        <SidebarAccount profileTo={ROUTES.admin.settings} fallbackRole="admin" />
      }
    >
      <Outlet />
    </DashboardShell>
  );
}
