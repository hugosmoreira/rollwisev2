import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Clock, MapPin, Users } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Avatar } from '@/components/common/Avatar';
import { BeltBadge } from '@/components/common/BeltBadge';
import { Button } from '@/components/common/Button';
import { Banner } from '@/components/common/Banner';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';
import { useAsync } from '@/hooks/useAsync';
import { sessionService } from '@/services/sessionService';
import { paymentService } from '@/services/paymentService';
import { formatDateTime, formatDuration } from '@/lib/format';
import type { Ruleset, SessionFormat } from '@/types';
import { ROUTES } from '@/lib/routes';
import { cn } from '@/lib/cn';
import shared from './Student.module.css';
import styles from './ClassDetails.module.css';

const FORMAT_LABEL: Record<SessionFormat, string> = {
  private: 'Private',
  group: 'Group',
};
const RULESET_LABEL: Record<Ruleset, string> = {
  gi: 'Gi',
  'no-gi': 'No-Gi',
  both: 'Gi & No-Gi',
};

export function ClassDetailsPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const canceled = params.get('canceled') === '1';
  const { data: session, loading, error } = useAsync(
    () => (id ? sessionService.getSession(id) : Promise.resolve(null)),
    [id],
  );

  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);

  const onBook = async () => {
    if (!session) return;
    setBookError(null);
    setBooking(true);
    try {
      // Redirects to Stripe Checkout; the booking is created server-side.
      const { url } = await paymentService.createCheckoutSession(session.id);
      window.location.href = url;
    } catch (e) {
      setBookError(
        e instanceof Error ? e.message : 'Could not start checkout. Please try again.',
      );
      setBooking(false);
    }
  };

  const back = (
    <Link to={ROUTES.student.findClasses} className={styles.back}>
      <ArrowLeft size={16} strokeWidth={2} />
      Back to classes
    </Link>
  );

  if (loading) {
    return (
      <div>
        {back}
        <LoadingState label="Loading session…" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div>
        {back}
        <EmptyState
          icon={<CalendarDays size={26} strokeWidth={1.7} />}
          title="Class not found"
          description={
            error ?? "This session may have been removed or is no longer available."
          }
          action={
            <Button to={ROUTES.student.findClasses} variant="secondary">
              Browse classes
            </Button>
          }
        />
      </div>
    );
  }

  const isPast = new Date(session.startsAt).getTime() <= Date.now();
  const full = session.spotsRemaining <= 0;
  const lowSpots = session.spotsRemaining > 0 && session.spotsRemaining <= 2;
  const location = session.gymName
    ? `${session.gymName} · ${session.city}`
    : session.city;

  return (
    <div>
      {back}

      {canceled && (
        <Banner variant="info" className={styles.banner}>
          Checkout was canceled — you can book this session again anytime.
        </Banner>
      )}
      {bookError && (
        <Banner variant="error" className={styles.banner}>
          {bookError}
        </Banner>
      )}

      <div className={shared.twoCol}>
        <div>
          <div className={styles.cover}>
            <span className={styles.coverLabel}>
              {FORMAT_LABEL[session.format]} · {RULESET_LABEL[session.ruleset]}
            </span>
          </div>

          <div className={styles.badges}>
            <Badge variant="primary">{FORMAT_LABEL[session.format]}</Badge>
            <Badge variant="neutral">{RULESET_LABEL[session.ruleset]}</Badge>
          </div>
          <h1 className={styles.title}>{session.title}</h1>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>About this session</h2>
            <p className={styles.description}>
              {session.description?.trim()
                ? session.description
                : 'No description provided for this session.'}
            </p>
          </div>

          {session.focusTags.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>What you'll work on</h2>
              <div className={styles.tags}>
                {session.focusTags.map((tag) => (
                  <Badge key={tag} variant="neutral">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Your coach</h2>
            <div className={styles.coachRow}>
              <Avatar name={session.coachName} src={session.coachAvatarUrl} size="lg" />
              <div className={styles.coachMeta}>
                <span className={styles.coachName}>
                  {session.coachName || 'Coach'}
                </span>
                {session.coachBelt && <BeltBadge belt={session.coachBelt} />}
              </div>
            </div>
          </div>
        </div>

        {/* Booking panel */}
        <aside className={styles.bookPanel}>
          <div className={styles.bookHead}>
            <span className={styles.bookLabel}>{FORMAT_LABEL[session.format]}</span>
            <span className={styles.price}>
              ${session.price}
              <span className={styles.priceUnit}> /session</span>
            </span>
          </div>

          <div className={styles.bookRows}>
            <div className={styles.bookRow}>
              <span className={styles.bookRowLabel}>
                <CalendarDays className={styles.bookRowIcon} size={16} strokeWidth={1.8} />
                Date
              </span>
              <span className={styles.bookRowValue}>{formatDateTime(session.startsAt)}</span>
            </div>
            <div className={styles.bookRow}>
              <span className={styles.bookRowLabel}>
                <Clock className={styles.bookRowIcon} size={16} strokeWidth={1.8} />
                Duration
              </span>
              <span className={styles.bookRowValue}>
                {formatDuration(session.durationMinutes)}
              </span>
            </div>
            <div className={styles.bookRow}>
              <span className={styles.bookRowLabel}>
                <MapPin className={styles.bookRowIcon} size={16} strokeWidth={1.8} />
                Location
              </span>
              <span className={styles.bookRowValue}>{location}</span>
            </div>
            <div className={styles.bookRow}>
              <span className={styles.bookRowLabel}>
                <Users className={styles.bookRowIcon} size={16} strokeWidth={1.8} />
                Spots left
              </span>
              <span className={cn(styles.bookRowValue, lowSpots && styles.spotsLow)}>
                {full ? 'Full' : session.spotsRemaining}
              </span>
            </div>
          </div>

          <Button
            fullWidth
            onClick={onBook}
            loading={booking}
            disabled={full || isPast}
          >
            {isPast
              ? 'This session has ended'
              : full
                ? 'Fully booked'
                : `Book & Pay $${session.price}`}
          </Button>
          {isPast && (
            <p className={styles.pastNote}>
              This session has already taken place and can no longer be booked.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
