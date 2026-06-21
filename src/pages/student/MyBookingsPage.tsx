import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays, CheckCircle2 } from 'lucide-react';
import { Tabs } from '@/components/common/Tabs';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/common/Button';
import { Banner } from '@/components/common/Banner';
import { LoadingState } from '@/components/common/LoadingState';
import { BookingCard } from '@/components/domain/BookingCard';
import { useAuth } from '@/lib/auth';
import { useAsync } from '@/hooks/useAsync';
import { bookingService, type BookingScope } from '@/services/bookingService';
import { ROUTES } from '@/lib/routes';
import shared from './Student.module.css';

const TABS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
];

export function MyBookingsPage() {
  const { profile } = useAuth();
  const [params] = useSearchParams();
  const paid = params.get('paid') === '1';
  const [tab, setTab] = useState<BookingScope>('upcoming');

  const studentId = profile?.id;
  const { data, loading, error, reload } = useAsync(
    () =>
      studentId
        ? bookingService.listStudentBookings(studentId, { scope: tab })
        : Promise.resolve([]),
    [studentId, tab],
  );
  const bookings = data ?? [];

  // After a successful checkout the booking is created by the Stripe webhook a
  // moment later, so re-fetch a few times until it appears (eventual consistency).
  useEffect(() => {
    if (!paid) return;
    const timers = [1500, 3500, 6500].map((ms) =>
      window.setTimeout(() => reload(), ms),
    );
    return () => timers.forEach((t) => clearTimeout(t));
  }, [paid, reload]);

  return (
    <div>
      <p className={shared.intro}>
        Your booked sessions — upcoming and completed — with their date, coach,
        status, and payment.
      </p>

      {paid && (
        <Banner variant="success" className={shared.tabsBar}>
          Payment successful — your session is booked and confirmed. See you on the
          mats!
        </Banner>
      )}

      <div className={shared.tabsBar}>
        <Tabs
          tabs={TABS}
          value={tab}
          onChange={(v) => setTab(v as BookingScope)}
          aria-label="Bookings filter"
        />
      </div>

      {error && (
        <Banner variant="error" className={shared.tabsBar}>
          {error}
        </Banner>
      )}

      {loading ? (
        <LoadingState label="Loading bookings…" />
      ) : bookings.length === 0 ? (
        tab === 'upcoming' ? (
          <EmptyState
            icon={<CalendarDays size={26} strokeWidth={1.7} />}
            title="No upcoming bookings"
            description="Sessions you book will appear here so you can keep track of what's next."
            action={
              <Button to={ROUTES.student.findClasses} variant="secondary">
                Find Classes
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<CheckCircle2 size={26} strokeWidth={1.7} />}
            title="No past bookings yet"
            description="Once you complete a session, it'll move here with your booking details."
          />
        )
      ) : (
        <div className={shared.stack}>
          {bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              counterpartName={booking.coachName}
              counterpartAvatarUrl={booking.coachAvatarUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
}
