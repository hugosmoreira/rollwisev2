import { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { Tabs } from '@/components/common/Tabs';
import { EmptyState } from '@/components/common/EmptyState';
import { Banner } from '@/components/common/Banner';
import { LoadingState } from '@/components/common/LoadingState';
import { BookingCard } from '@/components/domain/BookingCard';
import { useAuth } from '@/lib/auth';
import { useAsync } from '@/hooks/useAsync';
import { bookingService } from '@/services/bookingService';
import type { BookingStatus } from '@/types';
import shared from './Coach.module.css';

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
];

export function BookingsPage() {
  const { profile } = useAuth();
  const [tab, setTab] = useState('all');

  const coachId = profile?.id;
  const status = tab === 'all' ? undefined : (tab as BookingStatus);
  const { data, loading, error } = useAsync(
    () =>
      coachId
        ? bookingService.listCoachBookings(coachId, { status })
        : Promise.resolve([]),
    [coachId, tab],
  );
  const bookings = data ?? [];

  return (
    <div>
      <p className={shared.intro}>
        Every booking for your sessions — student, session, date, status, and
        payment — in one place.
      </p>

      <div className={shared.tabsBar}>
        <Tabs tabs={TABS} value={tab} onChange={setTab} aria-label="Booking status" />
      </div>

      {error && (
        <Banner variant="error" className={shared.banner}>
          {error}
        </Banner>
      )}

      {loading ? (
        <LoadingState label="Loading bookings…" />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={26} strokeWidth={1.7} />}
          title="No bookings yet"
          description="When students book your sessions, they'll appear here with their status and payment details."
        />
      ) : (
        <div className={shared.cardGrid} style={{ gridTemplateColumns: '1fr' }}>
          {bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              counterpartName={booking.studentName}
              counterpartAvatarUrl={booking.studentAvatarUrl}
              showPayment
            />
          ))}
        </div>
      )}
    </div>
  );
}
