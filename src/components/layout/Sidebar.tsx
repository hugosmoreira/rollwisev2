import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Logo } from '@/components/common/Logo';
import { cn } from '@/lib/cn';
import styles from './Sidebar.module.css';

export interface SidebarItem {
  label: string;
  to: string;
  icon: ReactNode;
  /** Match the path exactly (for index routes). */
  end?: boolean;
}

export interface SidebarSection {
  label?: string;
  items: SidebarItem[];
}

interface SidebarProps {
  sections: SidebarSection[];
  /** Bottom area, e.g. profile/settings + theme toggle. */
  footer?: ReactNode;
  onNavigate?: () => void;
  className?: string;
}

/** Reusable app sidebar used by the student, coach, and admin shells. */
export function Sidebar({ sections, footer, onNavigate, className }: SidebarProps) {
  return (
    <aside className={cn(styles.sidebar, className)}>
      <div className={styles.brand}>
        <Logo size="sm" />
      </div>

      {sections.map((section, i) => (
        <div className={styles.section} key={section.label ?? i}>
          {section.label && (
            <div className={styles.sectionLabel}>{section.label}</div>
          )}
          <nav className={styles.nav}>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(styles.item, isActive && styles.itemActive)
                }
              >
                <span className={styles.itemIcon}>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      ))}

      <div className={styles.spacer} />
      {footer && <div className={styles.footer}>{footer}</div>}
    </aside>
  );
}
