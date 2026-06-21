import { MapPin, Star, ArrowRight, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Avatar } from '@/components/common/Avatar';
import { BeltBadge } from '@/components/common/BeltBadge';
import { Button } from '@/components/common/Button';
import type { Coach } from '@/types';
import { cn } from '@/lib/cn';
import styles from './CoachCard.module.css';

interface CoachCardProps {
  coach: Coach;
  /** Link target for the primary action (defaults to no link/button hidden). */
  to?: string;
  ctaLabel?: string;
  className?: string;
}

export function CoachCard({
  coach,
  to,
  ctaLabel = 'View Profile',
  className,
}: CoachCardProps) {
  return (
    <Card className={cn(styles.card, className)} hoverable>
      <div className={styles.head}>
        <div className={styles.identity}>
          <Avatar
            name={coach.fullName}
            src={coach.avatarUrl}
            size="lg"
            online={coach.verification === 'verified'}
          />
          <div className={styles.nameBlock}>
            <span className={styles.name}>{coach.fullName}</span>
            <div className={styles.meta}>
              <BeltBadge belt={coach.belt} degree={coach.beltDegree} />
              {coach.verification === 'verified' && (
                <Badge variant="success" leftIcon={<ShieldCheck size={13} strokeWidth={2.2} />}>
                  Verified
                </Badge>
              )}
            </div>
            <span className={styles.location}>
              <MapPin size={14} strokeWidth={1.8} />
              {coach.city}
            </span>
          </div>
        </div>
        <div className={styles.price}>
          <div className={styles.priceValue}>
            ${coach.hourlyRate}
            <span className={styles.priceUnit}> /hr</span>
          </div>
        </div>
      </div>

      {coach.focusTags.length > 0 && (
        <div className={styles.tags}>
          {coach.focusTags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="neutral">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className={styles.footer}>
        {coach.ratingCount > 0 ? (
          <span className={styles.rating}>
            <Star size={15} className={styles.ratingStar} fill="currentColor" stroke="none" />
            <span className={styles.ratingValue}>{coach.ratingAverage.toFixed(1)}</span>
            <span className={styles.ratingCount}>({coach.ratingCount})</span>
          </span>
        ) : (
          <span className={styles.ratingCount}>New coach</span>
        )}
        {to && (
          <Button to={to} size="sm" rightIcon={<ArrowRight size={16} strokeWidth={2.2} />}>
            {ctaLabel}
          </Button>
        )}
      </div>
    </Card>
  );
}
