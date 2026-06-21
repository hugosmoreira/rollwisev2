import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import styles from './SectionHeading.module.css';

interface SectionHeadingProps {
  title: string;
  description?: string;
  /** Right-aligned action, e.g. a "See all" link or a button. */
  action?: ReactNode;
  className?: string;
}

/** Smaller in-page section header (h2) used inside dashboard content. */
export function SectionHeading({
  title,
  description,
  action,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn(styles.heading, className)}>
      <div className={styles.text}>
        <h2 className={styles.title}>{title}</h2>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
