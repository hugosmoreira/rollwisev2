import { CalendarDays, MapPin } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Badge, type BadgeVariant } from '@/components/common/Badge';
import { Avatar } from '@/components/common/Avatar';
import type { Booking, BookingStatus, PaymentStatus } from '@/types';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import styles from './BookingCard.module.css';

const STATUS: Record<BookingStatus, { label: string; variant: BadgeVariant }> = {
  pending: { label: 'Pending', variant: 'warning' },
  confirmed: { label: 'Confirmed', variant: 'success' },
  completed: { label: 'Completed', variant: 'muted' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
};

const PAYMENT: Record<PaymentStatus, { label: string; variant: BadgeVariant }> = {
  unpaid: { label: 'Unpaid', variant: 'muted' },
  pending: { label: 'Payment pending', variant: 'warning' },
  paid: { label: 'Paid', variant: 'success' },
  refunded: { label: 'Refunded', variant: 'muted' },
};

interface BookingCardProps {
  booking: Booking;
  /** Whose name/avatar to surface alongside the session. */
  counterpartName?: string;
  counterpartAvatarUrl?: string | null;
  /** Show the payment status badge (coach/earnings views). */
  showPayment?: boolean;
  className?: string;
}

export function BookingCard({
  booking,
  counterpartName,
  counterpartAvatarUrl,
  showPayment = false,
  className,
}: BookingCardProps) {
  const status = STATUS[booking.status];
  const payment = PAYMENT[booking.paymentStatus];
  const name = counterpartName ?? booking.studentName;

  return (
    <Card className={cn(styles.card, className)} padding="sm">
      <Avatar name={name} src={counterpartAvatarUrl} size="md" shape="rounded" />
      <div className={styles.body}>
        <span className={styles.title}>{booking.sessionTitle}</span>
        <div className={styles.sub}>
          <span className={styles.subItem}>
            <CalendarDays size={14} strokeWidth={1.8} />
            {formatDateTime(booking.startsAt)}
          </span>
          {booking.location && (
            <span className={styles.subItem}>
              <MapPin size={14} strokeWidth={1.8} />
              {booking.location}
            </span>
          )}
        </div>
      </div>
      <div className={styles.end}>
        <div className={styles.badges}>
          <Badge variant={status.variant}>{status.label}</Badge>
          {showPayment && <Badge variant={payment.variant}>{payment.label}</Badge>}
        </div>
        <span className={styles.price}>${booking.price}</span>
      </div>
    </Card>
  );
}
