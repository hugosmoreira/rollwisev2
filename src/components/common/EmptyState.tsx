import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  /** Optional CTA, typically a <Button>. */
  action?: ReactNode;
  className?: string;
}

/**
 * Clean empty state for screens with no data yet — used everywhere a
 * backend list would render, instead of fake seeded data.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(styles.empty, className)}>
      {icon && <div className={styles.iconWrap}>{icon}</div>}
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
