import { Link } from 'react-router-dom';
import {
  Users,
  Award,
  Layers,
  ClipboardList,
  DollarSign,
  ShieldCheck,
  Activity,
  UserPlus,
  CreditCard,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { StatCard } from '@/components/domain/StatCard';
import { SectionHeading } from '@/components/common/SectionHeading';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/common/Button';
import { useAsync } from '@/hooks/useAsync';
import { adminService } from '@/services/adminService';
import { formatCurrency } from '@/lib/format';
import { ROUTES } from '@/lib/routes';
import shared from './Admin.module.css';
import styles from './AdminDashboard.module.css';

const QUICK_ACTIONS = [
  { label: 'Manage users', to: ROUTES.admin.users, icon: <Users size={18} strokeWidth={1.8} /> },
  { label: 'Review coaches', to: ROUTES.admin.coaches, icon: <Award size={18} strokeWidth={1.8} /> },
  { label: 'All sessions', to: ROUTES.admin.sessions, icon: <Layers size={18} strokeWidth={1.8} /> },
  { label: 'Payments', to: ROUTES.admin.payments, icon: <CreditCard size={18} strokeWidth={1.8} /> },
];

export function AdminDashboardPage() {
  const { data: stats } = useAsync(() => adminService.getPlatformStats(), []);
  const num = (n: number | undefined) => (stats ? String(n) : '—');

  return (
    <div className={shared.sections}>
      {/* Overview */}
      <section className={styles.welcome}>
        <div className={styles.welcomeGlow} aria-hidden="true" />
        <div className={styles.welcomeInner}>
          <span className={styles.belt} aria-hidden="true" />
          <h1 className={styles.welcomeTitle}>Platform overview</h1>
          <p className={styles.welcomeText}>
            Manage users, coaches, sessions, bookings, and payments across RollWise
            — and review coach verification requests.
          </p>
          <div className={styles.welcomeActions}>
            <Button
              to={ROUTES.admin.verifications}
              rightIcon={<ArrowRight size={16} strokeWidth={2.2} />}
            >
              Review verifications
            </Button>
            <Button to={ROUTES.admin.users} variant="secondary">
              Manage users
            </Button>
          </div>
        </div>
      </section>

      {/* Platform metrics — true empty-platform zero state */}
      <section className={shared.statGrid}>
        <StatCard label="Total users" value={num(stats?.totalUsers)} hint="Students & coaches" icon={<Users size={20} strokeWidth={1.9} />} />
        <StatCard label="Coaches" value={num(stats?.coaches)} hint="On the platform" icon={<Award size={20} strokeWidth={1.9} />} />
        <StatCard label="Sessions" value={num(stats?.sessions)} hint="Published" icon={<Layers size={20} strokeWidth={1.9} />} />
        <StatCard label="Bookings" value={num(stats?.bookings)} hint="All time" icon={<ClipboardList size={20} strokeWidth={1.9} />} />
        <StatCard label="Revenue" value={stats ? formatCurrency(stats.revenue) : '—'} hint="Gross volume" icon={<DollarSign size={20} strokeWidth={1.9} />} />
        <StatCard label="Pending reviews" value={num(stats?.pendingVerifications)} hint="Verification queue" icon={<ShieldCheck size={20} strokeWidth={1.9} />} />
      </section>

      <div className={shared.twoCol}>
        {/* Left: activity */}
        <div className={shared.panelStack}>
          <section>
            <SectionHeading
              title="Recent activity"
              description="Sign-ups, bookings, and payments across the platform."
            />
            <EmptyState
              icon={<Activity size={26} strokeWidth={1.7} />}
              title="No activity yet"
              description="Platform activity will appear here as users sign up, book sessions, and make payments."
            />
          </section>

          <section>
            <SectionHeading
              title="New users"
              action={<Link to={ROUTES.admin.users}>View all <ArrowRight size={16} strokeWidth={2.2} /></Link>}
            />
            <EmptyState
              icon={<UserPlus size={26} strokeWidth={1.7} />}
              title="No users yet"
              description="The newest students and coaches to join RollWise will be listed here."
            />
          </section>
        </div>

        {/* Right: queue + quick actions */}
        <div className={shared.panelStack}>
          <section className={shared.panel}>
            <div className={styles.panelHead}>
              <span className={styles.panelIcon}>
                <ShieldCheck size={20} strokeWidth={1.9} />
              </span>
              <span className={styles.panelTitle}>Verification queue</span>
            </div>
            <div className={styles.bigStat}>{num(stats?.pendingVerifications)}</div>
            <p className={styles.bigStatText}>
              {stats && stats.pendingVerifications > 0
                ? 'Coaches are waiting for review — approve or reject their requests.'
                : 'No coaches are waiting for review. New requests will show up here.'}
            </p>
            <Button to={ROUTES.admin.verifications} variant="secondary" fullWidth>
              Open queue
            </Button>
          </section>

          <section className={shared.panel}>
            <div className={styles.panelHead}>
              <span className={styles.panelIcon}>
                <Activity size={20} strokeWidth={1.9} />
              </span>
              <span className={styles.panelTitle}>Quick actions</span>
            </div>
            <div className={styles.quickList}>
              {QUICK_ACTIONS.map((action) => (
                <Link key={action.to} to={action.to} className={styles.quickItem}>
                  <span className={styles.quickIcon}>{action.icon}</span>
                  <span className={styles.quickLabel}>{action.label}</span>
                  <ChevronRight size={16} strokeWidth={2} />
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
