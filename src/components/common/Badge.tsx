import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import styles from './Badge.module.css';

export type BadgeVariant =
  | 'neutral'
  | 'outline'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'muted';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  /** Show a leading status dot in the current color. */
  dot?: boolean;
  leftIcon?: ReactNode;
  children: ReactNode;
}

export function Badge({
  variant = 'neutral',
  dot = false,
  leftIcon,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span className={cn(styles.badge, styles[variant], className)} {...rest}>
      {dot && <span className={styles.dot} />}
      {leftIcon}
      {children}
    </span>
  );
}
