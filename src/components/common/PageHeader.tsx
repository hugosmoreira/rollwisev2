import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  /** Small uppercase label above the title. */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Right-aligned actions (buttons, filters). */
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn(styles.header, className)}>
      <div className={styles.text}>
        {eyebrow && (
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowBar} />
            <span className={styles.eyebrowText}>{eyebrow}</span>
          </span>
        )}
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}
