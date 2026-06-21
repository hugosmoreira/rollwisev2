import { Link, Outlet } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { ROUTES } from '@/lib/routes';
import styles from './AuthLayout.module.css';

const BRAND_POINTS = [
  'Verified BJJ coaches, gi & no-gi',
  'Book private or small-group sessions',
  'Track your training and progress',
];

/** Split layout for all auth screens: brand panel + centered form. */
export function AuthLayout() {
  return (
    <div className={styles.layout}>
      <aside className={styles.brand}>
        <div className={styles.brandGlow} aria-hidden="true" />
        <div className={styles.brandTop}>
          <Logo />
        </div>
        <div className={styles.brandBody}>
          <h2 className={styles.brandHeadline}>
            Train with purpose. <span>Roll with the best.</span>
          </h2>
          <p className={styles.brandText}>
            RollWise is the marketplace for private Jiu-Jitsu coaching — find
            verified coaches, book sessions, and level up your game.
          </p>
          <ul className={styles.brandList}>
            {BRAND_POINTS.map((point) => (
              <li key={point} className={styles.brandItem}>
                <span className={styles.brandCheck}>
                  <Check size={13} strokeWidth={2.6} />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>
        <p className={styles.brandFine}>
          Built for the Jiu-Jitsu community · Oss.
        </p>
      </aside>

      <div className={styles.formSide}>
        <div className={styles.formTop}>
          <Logo size="sm" className={styles.formLogo} />
          <div className={styles.formTopEnd}>
            <Link to={ROUTES.home} className={styles.backLink}>
              <ArrowLeft size={16} strokeWidth={2} />
              Back to home
            </Link>
            <ThemeToggle size="sm" />
          </div>
        </div>
        <main className={styles.formMain}>
          <div className={styles.formInner}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
