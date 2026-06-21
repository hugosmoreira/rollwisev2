import type { ReactNode } from 'react';
import { Info, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import styles from './Banner.module.css';

export type BannerVariant = 'info' | 'success' | 'warning' | 'error';

const ICONS: Record<BannerVariant, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
};

interface BannerProps {
  variant?: BannerVariant;
  title?: string;
  children: ReactNode;
  className?: string;
}

/** Inline message block for form-level feedback and notices. */
export function Banner({
  variant = 'info',
  title,
  children,
  className,
}: BannerProps) {
  const Icon = ICONS[variant];
  return (
    <div className={cn(styles.banner, styles[variant], className)} role="status">
      <span className={styles.icon}>
        <Icon size={18} strokeWidth={1.9} />
      </span>
      <div className={styles.body}>
        {title && <div className={styles.title}>{title}</div>}
        <div className={styles.message}>{children}</div>
      </div>
    </div>
  );
}
