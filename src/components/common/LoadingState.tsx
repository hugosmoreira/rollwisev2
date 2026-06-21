import { cn } from '@/lib/cn';
import styles from './LoadingState.module.css';

interface LoadingStateProps {
  label?: string;
  /** Render compact inline (spinner + label on one row). */
  inline?: boolean;
  className?: string;
}

/** Standard loading indicator for async screens. */
export function LoadingState({
  label = 'Loading…',
  inline = false,
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(styles.loading, inline && styles.inline, className)}
      role="status"
      aria-live="polite"
    >
      <span className={styles.spinner} />
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
}

interface SkeletonProps {
  width?: string;
  height?: string;
  radius?: string;
  className?: string;
}

/** A shimmering placeholder block for content that is still loading. */
export function Skeleton({ width, height, radius, className }: SkeletonProps) {
  return (
    <span
      className={cn(styles.skeleton, className)}
      style={{ width, height, borderRadius: radius, display: 'block' }}
      aria-hidden="true"
    />
  );
}
