import { Link } from 'react-router-dom';
import { Logo } from '@/components/common/Logo';
import { ROUTES } from '@/lib/routes';
import styles from './Footer.module.css';

interface FooterColumn {
  title: string;
  links: { label: string; to: string }[];
}

const COLUMNS: FooterColumn[] = [
  {
    title: 'Platform',
    links: [
      { label: 'Find Coaches', to: ROUTES.findCoaches },
      { label: 'How It Works', to: '/#how' },
    ],
  },
  {
    title: 'Coaches',
    links: [
      { label: 'Become a Coach', to: ROUTES.becomeCoach },
      { label: 'Coach Login', to: ROUTES.login },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Contact', to: ROUTES.about },
      { label: 'Help Center', to: ROUTES.about },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms', to: ROUTES.terms },
      { label: 'Privacy', to: ROUTES.privacy },
    ],
  },
];

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <Logo className={styles.brandLogo} />
            <p className={styles.tagline}>
              The marketplace for private Jiu-Jitsu coaching. Find verified
              coaches, book sessions, and train with purpose — gi or no-gi.
            </p>
          </div>

          <div className={styles.columns}>
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <div className={styles.colTitle}>{col.title}</div>
                <div className={styles.colLinks}>
                  {col.links.map((link) => (
                    <Link key={link.label} to={link.to} className={styles.colLink}>
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.bottom}>
          <span className={styles.fine}>
            © 2026 RollWise. All rights reserved.
          </span>
          <span className={styles.fine}>
            Built for the Jiu-Jitsu community · Oss.
          </span>
        </div>
      </div>
    </footer>
  );
}
