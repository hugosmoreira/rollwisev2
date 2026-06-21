import { cn } from '@/lib/cn';
import styles from './Tabs.module.css';

export interface TabItem {
  value: string;
  label: string;
  /** Optional count badge. */
  count?: number;
}

interface TabsProps {
  tabs: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  'aria-label'?: string;
}

/** Compact segmented tab control for in-page view switching. */
export function Tabs({ tabs, value, onChange, className, ...rest }: TabsProps) {
  return (
    <div className={cn(styles.tabs, className)} role="tablist" {...rest}>
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={cn(styles.tab, active && styles.active)}
            onClick={() => onChange(tab.value)}
          >
            {tab.label}
            {typeof tab.count === 'number' && (
              <span className={styles.count}>{tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
