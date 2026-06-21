import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/common/Button';
import { ThemeToggle } from './ThemeToggle';
import { ROUTES } from '@/lib/routes';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/cn';
import styles from './Navbar.module.css';

const NAV_LINKS = [
  { label: 'Find Coaches', to: ROUTES.findCoaches },
  { label: 'How It Works', to: '/#how' },
  { label: 'Become a Coach', to: ROUTES.becomeCoach },
  { label: 'About', to: ROUTES.about },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { session } = useAuth();

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className={styles.header}>
      <div className={styles.bar}>
        <Logo />

        <nav className={styles.links}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className={cn(
                styles.link,
                link.to === pathname && styles.active,
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className={cn(styles.actions, styles.desktopActions)}>
          <ThemeToggle />
          {session ? (
            <Button to="/app" size="sm">
              Dashboard
            </Button>
          ) : (
            <>
              <Link to={ROUTES.login} className={styles.loginLink}>
                Log In
              </Link>
              <Button to={ROUTES.signup} size="sm">
                Sign Up
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className={styles.burger}
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            <X size={20} strokeWidth={2} />
          ) : (
            <Menu size={20} strokeWidth={2} />
          )}
        </button>
      </div>

      {menuOpen && (
        <div className={styles.mobileMenu}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className={styles.mobileLink}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <button
            type="button"
            className={styles.mobileToggleRow}
            onClick={toggleTheme}
          >
            <span>Appearance</span>
            <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
          </button>
          <div className={styles.mobileActions}>
            {session ? (
              <Button to="/app" fullWidth>
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button to={ROUTES.login} variant="secondary" fullWidth>
                  Log In
                </Button>
                <Button to={ROUTES.signup} fullWidth>
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
