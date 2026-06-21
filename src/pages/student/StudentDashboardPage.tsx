import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  Clock,
  Wallet,
  CalendarDays,
  History,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { StatCard } from '@/components/domain/StatCard';
import { SessionCard } from '@/components/domain/SessionCard';
import { BookingCard } from '@/components/domain/BookingCard';
import { SectionHeading } from '@/components/common/SectionHeading';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/common/Button';
import { LoadingState } from '@/components/common/LoadingState';
import { useAuth } from '@/lib/auth';
import { useAsync } from '@/hooks/useAsync';
import { bookingService } from '@/services/bookingService';
import { sessionService } from '@/services/sessionService';
import { formatCurrency } from '@/lib/format';
import { ROUTES } from '@/lib/routes';
import shared from './Student.module.css';
import styles from './StudentDashboard.module.css';

const arrow = <ArrowRight size={16} strokeWidth={2.2} />;

export function StudentDashboardPage() {
  const { profile } = useAuth();
  const studentId = profile?.id;

  const { data: bookings, loading } = useAsync(
    () =>
      studentId
        ? bookingService.listStudentBookings(studentId, { scope: 'all' })
        : Promise.resolve([]),
    [studentId],
  );
  const { data: suggested } = useAsync(() => sessionService.listSessions(), []);

  const all = bookings ?? [];
  const now = Date.now();
  const upcoming = all
    .filter(
      (b) =>
        new Date(b.startsAt).getTime() >= now &&
        b.status !== 'cancelled' &&
        b.status !== 'completed',
    )
    .slice(0, 3);
  const completed = all.filter((b) => b.status === 'completed');
  const hours = completed.reduce((s, b) => s + b.durationMinutes, 0) / 60;
  const spent = all
    .filter((b) => b.paymentStatus === 'paid')
    .reduce((s, b) => s + b.price, 0);
  const suggestedTop = (suggested ?? []).slice(0, 3);

  return (
    <div className={shared.sections}>
      <section className={styles.welcome}>
        <div className={styles.welcomeGlow} aria-hidden="true" />
        <div className={styles.welcomeInner}>
          <span className={styles.belt} aria-hidden="true" />
          <h1 className={styles.welcomeTitle}>
            Welcome back{profile?.fullName ? `, ${profile.fullName.split(' ')[0]}` : ''}
          </h1>
          <p className={styles.welcomeText}>
            Your training at a glance. Find a coach, book your next session, and
            track your progress over time.
          </p>
          <div className={styles.welcomeActions}>
            <Button to={ROUTES.student.findClasses} rightIcon={arrow}>
              Find Classes
            </Button>
            <Button to={ROUTES.student.myBookings} variant="secondary">
              My Bookings
            </Button>
          </div>
        </div>
      </section>

      <section className={shared.statGrid}>
        <StatCard
          label="Sessions completed"
          value={String(completed.length)}
          hint={completed.length === 0 ? 'No sessions yet' : 'Great work'}
          icon={<CalendarCheck size={20} strokeWidth={1.9} />}
        />
        <StatCard
          label="Training hours"
          value={`${hours % 1 === 0 ? hours : hours.toFixed(1)}h`}
          hint="Across completed sessions"
          icon={<Clock size={20} strokeWidth={1.9} />}
        />
        <StatCard
          label="Total spent"
          value={formatCurrency(spent)}
          hint="Across all bookings"
          icon={<Wallet size={20} strokeWidth={1.9} />}
        />
      </section>

      <section>
        <SectionHeading
          title="Upcoming sessions"
          action={<Link to={ROUTES.student.myBookings}>View all {arrow}</Link>}
        />
        {loading ? (
          <LoadingState label="Loading…" />
        ) : upcoming.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={26} strokeWidth={1.7} />}
            title="No upcoming sessions"
            description="When you book a session, it'll show up here with the date, coach, and location."
            action={
              <Button to={ROUTES.student.findClasses} variant="secondary">
                Find Classes
              </Button>
            }
          />
        ) : (
          <div className={shared.stack}>
            {upcoming.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                counterpartName={b.coachName}
                counterpartAvatarUrl={b.coachAvatarUrl}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeading
          title="Recent training"
          action={<Link to={ROUTES.student.trainingHistory}>View history {arrow}</Link>}
        />
        <EmptyState
          icon={<History size={26} strokeWidth={1.7} />}
          title="No training logged yet"
          description="Completed sessions and your coach's notes will appear here so you can track your progress."
        />
      </section>

      <section>
        <SectionHeading
          title="Suggested for you"
          description="Sessions you can book right now."
          action={<Link to={ROUTES.student.findClasses}>Browse all {arrow}</Link>}
        />
        {suggestedTop.length === 0 ? (
          <EmptyState
            icon={<Compass size={26} strokeWidth={1.7} />}
            title="No sessions available yet"
            description="Once coaches publish sessions, recommendations will appear here."
          />
        ) : (
          <div className={shared.cardGrid}>
            {suggestedTop.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                to={ROUTES.student.class(session.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
