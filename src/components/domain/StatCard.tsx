import type { ReactNode } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { cn } from '@/lib/cn';
import styles from './StatCard.module.css';

interface StatCardProps {
  label: string;
  value: ReactNode;
  /** Small caption under the value (e.g. "from 26 sessions"). */
  hint?: string;
  icon?: ReactNode;
  /** Percentage change; positive renders green/up, negative red/down. */
  delta?: number;
  className?: string;
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  delta,
  className,
}: StatCardProps) {
  const hasDelta = typeof delta === 'number';
  const up = (delta ?? 0) >= 0;

  return (
    <Card className={cn(styles.card, className)}>
      <div className={styles.head}>
        <span className={styles.label}>{label}</span>
        {icon && <span className={styles.iconWrap}>{icon}</span>}
      </div>
      <div className={styles.value}>{value}</div>
      {(hint || hasDelta) && (
        <div className={styles.footer}>
          {hasDelta && (
            <span className={cn(styles.delta, up ? styles.deltaUp : styles.deltaDown)}>
              {up ? (
                <TrendingUp size={12} strokeWidth={2.4} />
              ) : (
                <TrendingDown size={12} strokeWidth={2.4} />
              )}
              {up ? '+' : ''}
              {delta}%
            </span>
          )}
          {hint && <span className={styles.hint}>{hint}</span>}
        </div>
      )}
    </Card>
  );
}
