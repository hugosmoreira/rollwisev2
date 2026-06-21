import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/cn';
import styles from './ThemeToggle.module.css';

interface ThemeToggleProps {
  size?: 'sm' | 'md';
  className?: string;
}

/** Switches between dark and light themes. */
export function ThemeToggle({ size = 'md', className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className={cn(styles.toggle, size === 'sm' && styles.sm, className)}
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Light theme' : 'Dark theme'}
    >
      {isDark ? (
        <Sun size={18} strokeWidth={1.9} />
      ) : (
        <Moon size={18} strokeWidth={1.9} />
      )}
    </button>
  );
}
