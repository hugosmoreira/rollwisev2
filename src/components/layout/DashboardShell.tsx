import { useState, type ReactNode } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar, type SidebarSection } from './Sidebar';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/cn';
import styles from './DashboardShell.module.css';

interface DashboardShellProps {
  sections: SidebarSection[];
  /** Title shown in the top bar (usually the active page name). */
  title?: string;
  /** Right-aligned top bar content (search, notifications, avatar). */
  topbarEnd?: ReactNode;
  /** Bottom area of the sidebar. */
  sidebarFooter?: ReactNode;
  children: ReactNode;
}

/**
 * App shell for authenticated areas: a persistent sidebar, a sticky
 * top bar, and a centered content column. The sidebar collapses to a
 * drawer on small screens.
 */
export function DashboardShell({
  sections,
  title,
  topbarEnd,
  sidebarFooter,
  children,
}: DashboardShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn(styles.shell, open && styles.sidebarOpen)}>
      <div className={styles.sidebarCol}>
        <Sidebar
          sections={sections}
          footer={sidebarFooter}
          onNavigate={() => setOpen(false)}
        />
      </div>
      <div
        className={styles.scrim}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topbarStart}>
            <button
              type="button"
              className={styles.menuButton}
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle navigation"
            >
              <Menu size={20} strokeWidth={2} />
            </button>
            {title && <span className={styles.topbarTitle}>{title}</span>}
          </div>
          <div className={styles.topbarEnd}>
            {topbarEnd}
            <ThemeToggle size="sm" />
          </div>
        </header>

        <div className={styles.content}>
          <div className={styles.contentInner}>{children}</div>
        </div>
      </div>
    </div>
  );
}
