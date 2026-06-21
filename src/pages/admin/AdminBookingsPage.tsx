import { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { Tabs } from '@/components/common/Tabs';
import { EmptyState } from '@/components/common/EmptyState';
import { Banner } from '@/components/common/Banner';
import { LoadingState } from '@/components/common/LoadingState';
import { BookingCard } from '@/components/domain/BookingCard';
import { useAsync } from '@/hooks/useAsync';
import { adminService } from '@/services/adminService';
import shared from './Admin.module.css';

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function AdminBookingsPage() {
  const [tab, setTab] = useState('all');
  const { data, loading, error } = useAsync(() => adminService.listBookings(), []);
  const all = data ?? [];

  const now = Date.now();
  const bookings = all.filter((b) => {
    if (tab === 'all') return true;
    if (tab === 'cancelled') return b.status === 'cancelled';
    if (tab === 'completed') return b.status === 'completed';
    // upcoming
    return (
      new Date(b.startsAt).getTime() >= now &&
      b.status !== 'cancelled' &&
      b.status !== 'completed'
    );
  });

  return (
    <div>
      <p className={shared.intro}>
        Every booking across the platform — student, coach, session, status, and
        payment.
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
          title="No bookings found"
          description="No bookings match this filter."
        />
      ) : (
        <div className={shared.list}>
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
