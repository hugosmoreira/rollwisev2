import { Clock, MapPin, CalendarDays, ArrowRight, Ban } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import type { Ruleset, Session, SessionFormat } from '@/types';
import { formatDateTime, formatDuration } from '@/lib/format';
import { cn } from '@/lib/cn';
import styles from './SessionCard.module.css';

const FORMAT_LABEL: Record<SessionFormat, string> = {
  private: 'Private',
  group: 'Group',
};

const RULESET_LABEL: Record<Ruleset, string> = {
  gi: 'Gi',
  'no-gi': 'No-Gi',
  both: 'Gi & No-Gi',
};

interface SessionCardProps {
  session: Session;
  /** Link to the class details page. */
  to?: string;
  ctaLabel?: string;
  /** When set, shows a "Cancel" action (coach session management). */
  onCancel?: () => void;
  className?: string;
}

export function SessionCard({
  session,
  to,
  ctaLabel = 'View',
  onCancel,
  className,
}: SessionCardProps) {
  const lowSpots = session.spotsRemaining > 0 && session.spotsRemaining <= 2;
  const full = session.spotsRemaining <= 0;

  return (
    <Card className={cn(styles.card, className)} hoverable>
      <div className={styles.badges}>
        <Badge variant="primary">{FORMAT_LABEL[session.format]}</Badge>
        <Badge variant="neutral">{RULESET_LABEL[session.ruleset]}</Badge>
        {session.status === 'cancelled' && <Badge variant="danger">Cancelled</Badge>}
        {session.status === 'completed' && <Badge variant="muted">Completed</Badge>}
      </div>

      <h3 className={styles.title}>{session.title}</h3>

      <div className={styles.coach}>
        <Avatar
          name={session.coachName}
          src={session.coachAvatarUrl}
          size="sm"
          shape="circle"
        />
        <span className={styles.coachName}>{session.coachName}</span>
      </div>

      <div className={styles.meta}>
        <span className={styles.metaRow}>
          <CalendarDays className={styles.metaIcon} size={16} strokeWidth={1.8} />
          {formatDateTime(session.startsAt)}
        </span>
        <span className={styles.metaRow}>
          <Clock className={styles.metaIcon} size={16} strokeWidth={1.8} />
          {formatDuration(session.durationMinutes)}
        </span>
        <span className={styles.metaRow}>
          <MapPin className={styles.metaIcon} size={16} strokeWidth={1.8} />
          {session.gymName ? `${session.gymName} · ${session.city}` : session.city}
        </span>
      </div>

      <div className={styles.spacer} />

      <div className={styles.footer}>
        <div>
          <div className={styles.price}>
            ${session.price}
            <span className={styles.priceUnit}> /session</span>
          </div>
          <div className={cn(styles.spots, lowSpots && styles.spotsLow)}>
            {full
              ? 'Fully booked'
              : `${session.spotsRemaining} spot${session.spotsRemaining === 1 ? '' : 's'} left`}
          </div>
        </div>
        {(onCancel || to) && (
          <div className={styles.actions}>
            {onCancel && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onCancel}
                leftIcon={<Ban size={15} strokeWidth={2.2} />}
              >
                Cancel
              </Button>
            )}
            {to && (
              <Button
                to={to}
                size="sm"
                variant="secondary"
                rightIcon={<ArrowRight size={16} strokeWidth={2.2} />}
              >
                {ctaLabel}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
