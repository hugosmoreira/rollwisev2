import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';
import { cn } from '@/lib/cn';
import styles from './Logo.module.css';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  /** Render just the mark without the wordmark. */
  markOnly?: boolean;
  /** Where the logo links to (defaults home — logo always returns home). */
  to?: string;
  className?: string;
}

/** The RollWise wordmark: a charcoal black-belt mark + the wordmark. */
export function Logo({
  size = 'md',
  markOnly = false,
  to = ROUTES.home,
  className,
}: LogoProps) {
  return (
    <Link
      to={to}
      className={cn(styles.logo, styles[size], markOnly && styles.markOnly, className)}
      aria-label="RollWise — home"
    >
      <span className={styles.mark} aria-hidden="true">
        <span className={styles.markStripe} />
      </span>
      {!markOnly && <span className={styles.wordmark}>RollWise</span>}
    </Link>
  );
}
