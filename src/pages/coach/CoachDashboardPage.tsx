import { Link } from 'react-router-dom';
import {
  Wallet,
  CalendarCheck,
  Users,
  Inbox,
  ShieldCheck,
  UserCog,
  Plus,
  ArrowRight,
  CalendarDays,
  Check,
} from 'lucide-react';
import { StatCard } from '@/components/domain/StatCard';
import { SessionCard } from '@/components/domain/SessionCard';
import { BookingCard } from '@/components/domain/BookingCard';
import { SectionHeading } from '@/components/common/SectionHeading';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/common/Button';
import { Badge, type BadgeVariant } from '@/components/common/Badge';
import { LoadingState } from '@/components/common/LoadingState';
import { useAuth } from '@/lib/auth';
import { useAsync } from '@/hooks/useAsync';
import { bookingService } from '@/services/bookingService';
import { sessionService } from '@/services/sessionService';
import { coachService } from '@/services/coachService';
import { formatCurrency } from '@/lib/format';
import type { VerificationStatus } from '@/types';
import { ROUTES } from '@/lib/routes';
import { cn } from '@/lib/cn';
import shared from './Coach.module.css';
import styles from './CoachDashboard.module.css';

const arrow = <ArrowRight size={16} strokeWidth={2.2} />;

const VSTATUS: Record<VerificationStatus, { label: string; variant: BadgeVariant }> = {
  unverified: { label: 'Not verified', variant: 'warning' },
  pending: { label: 'Pending review', variant: 'warning' },
  verified: { label: 'Verified', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'danger' },
};

export function CoachDashboardPage() {
  const { profile } = useAuth();
  const coachId = profile?.id;

  const { data: coach } = useAsync(() => coachService.getCurrentCoach(), [coachId]);
  const { data: bookings } = useAsync(
    () => (coachId ? bookingService.listCoachBookings(coachId, {}) : Promise.resolve([])),
    [coachId],
  );
  const { data: sessions, loading: sLoading } = useAsync(
    () =>
      coachId
        ? sessionService.listCoachSessions(coachId, 'published')
        : Promise.resolve([]),
    [coachId],
  );
  const { data: students } = useAsync(
    () => (coachId ? coachService.listStudents(coachId) : Promise.resolve([])),
    [coachId],
  );

  const allBookings = bookings ?? [];
  const requests = allBookings.filter((b) => b.status === 'pending');
  const now = new Date();
  const sessionsThisMonth = (sessions ?? []).filter((s) => {
    const d = new Date(s.startsAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const revenue = allBookings
    .filter((b) => b.paymentStatus === 'paid')
    .reduce((s, b) => s + b.price, 0);

  const vstatus = coach?.verification ?? 'unverified';
  const vmeta = VSTATUS[vstatus];

  const steps = [
    { label: 'Add your academy', done: !!coach?.academy },
    { label: 'Add focus areas', done: (coach?.focusTags?.length ?? 0) > 0 },
    { label: 'Set your hourly rate', done: (coach?.hourlyRate ?? 0) > 0 },
    { label: 'Submit verification', done: vstatus !== 'unverified' },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className={shared.sections}>
      <section className={styles.welcome}>
        <div className={styles.welcomeGlow} aria-hidden="true" />
        <div className={styles.welcomeInner}>
          <span className={styles.belt} aria-hidden="true" />
          <h1 className={styles.welcomeTitle}>
            Welcome back{profile?.fullName ? `, ${profile.fullName.split(' ')[0]}` : ', Coach'}
          </h1>
          <p className={styles.welcomeText}>
            Your coaching business at a glance. Publish sessions, manage bookings,
            and track your earnings — all in one place.
          </p>
          <div className={styles.welcomeActions}>
            <Button to={ROUTES.coach.createSession} leftIcon={<Plus size={18} strokeWidth={2.2} />}>
              Create Session
            </Button>
            <Button to={ROUTES.coach.schedule} variant="secondary">
              View Schedule
            </Button>
          </div>
        </div>
      </section>

      <section className={shared.statGrid}>
        <StatCard label="Revenue this month" value={formatCurrency(revenue)} hint="From paid sessions" icon={<Wallet size={20} strokeWidth={1.9} />} />
        <StatCard label="Sessions this month" value={String(sessionsThisMonth)} hint="Published" icon={<CalendarCheck size={20} strokeWidth={1.9} />} />
        <StatCard label="Students trained" value={String((students ?? []).length)} hint="All time" icon={<Users size={20} strokeWidth={1.9} />} />
        <StatCard label="Booking requests" value={String(requests.length)} hint="Awaiting response" icon={<Inbox size={20} strokeWidth={1.9} />} />
      </section>

      <div className={shared.twoCol}>
        <div className={shared.panelStack}>
          <section>
            <SectionHeading
              title="Booking requests"
              action={<Link to={ROUTES.coach.bookings}>View all {arrow}</Link>}
            />
            {requests.length === 0 ? (
              <EmptyState
                icon={<Inbox size={26} strokeWidth={1.7} />}
                title="No booking requests"
                description="When students book your sessions, their requests will appear here."
              />
            ) : (
              <div className={shared.cardGrid} style={{ gridTemplateColumns: '1fr' }}>
                {requests.slice(0, 4).map((b) => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    counterpartName={b.studentName}
                    counterpartAvatarUrl={b.studentAvatarUrl}
                    showPayment
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <SectionHeading
              title="Upcoming sessions"
              action={<Link to={ROUTES.coach.activeSessions}>Manage {arrow}</Link>}
            />
            {sLoading ? (
              <LoadingState label="Loading…" />
            ) : (sessions ?? []).length === 0 ? (
              <EmptyState
                icon={<CalendarDays size={26} strokeWidth={1.7} />}
                title="No upcoming sessions"
                description="Publish your first session and it'll show up here."
                action={
                  <Button to={ROUTES.coach.createSession} variant="secondary">
                    Create Session
                  </Button>
                }
              />
            ) : (
              <div className={shared.cardGrid}>
                {(sessions ?? []).slice(0, 4).map((s) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    to={ROUTES.coach.editSession(s.id)}
                    ctaLabel="Manage"
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <div className={shared.panelStack}>
          <section className={shared.panel}>
            <div className={styles.panelHead}>
              <span className={styles.panelIcon}>
                <ShieldCheck size={20} strokeWidth={1.9} />
              </span>
              <span className={styles.panelTitle}>Verification</span>
            </div>
            <div className={styles.statusRow}>
              <span className={styles.progressLabel}>Status</span>
              <Badge variant={vmeta.variant}>{vmeta.label}</Badge>
            </div>
            <p className={styles.panelText}>
              {vstatus === 'verified'
                ? 'You’re verified — students see your verified badge.'
                : vstatus === 'pending'
                  ? 'Your verification is in review. We’ll notify you when it’s done.'
                  : 'Verified coaches build trust and rank higher in search.'}
            </p>
            <Button to={ROUTES.coach.verification} fullWidth variant={vstatus === 'unverified' ? 'primary' : 'secondary'}>
              {vstatus === 'unverified' ? 'Start verification' : 'View verification'}
            </Button>
          </section>

          <section className={shared.panel}>
            <div className={styles.panelHead}>
              <span className={styles.panelIcon}>
                <UserCog size={20} strokeWidth={1.9} />
              </span>
              <span className={styles.panelTitle}>Profile completion</span>
            </div>
            <div className={styles.progress}>
              <div className={styles.progressTop}>
                <span className={styles.progressLabel}>Getting started</span>
                <span className={styles.progressValue}>{doneCount} of {steps.length}</span>
              </div>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${(doneCount / steps.length) * 100}%` }} />
              </div>
            </div>
            <div className={styles.checklist}>
              {steps.map((step) => (
                <div key={step.label} className={styles.checkItem}>
                  <span
                    className={cn(styles.checkBox)}
                    style={
                      step.done
                        ? {
                            background: 'var(--rw-primary)',
                            borderColor: 'var(--rw-primary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }
                        : undefined
                    }
                  >
                    {step.done && <Check size={12} strokeWidth={3} color="#fff" />}
                  </span>
                  {step.label}
                </div>
              ))}
            </div>
            <Button to={ROUTES.coach.profile} variant="secondary" fullWidth>
              Complete profile
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
}
