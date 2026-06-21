import { cn } from '@/lib/cn';
import styles from './Switch.module.css';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  'aria-label'?: string;
  className?: string;
}

/** Accessible on/off toggle switch. */
export function Switch({
  checked,
  onChange,
  disabled,
  className,
  ...rest
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(styles.switch, checked && styles.checked, className)}
      {...rest}
    >
      <span className={styles.thumb} />
    </button>
  );
}
