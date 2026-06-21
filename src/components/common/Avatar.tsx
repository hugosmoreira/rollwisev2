import { cn } from '@/lib/cn';
import styles from './Avatar.module.css';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type AvatarShape = 'circle' | 'rounded';

interface AvatarProps {
  name?: string;
  src?: string | null;
  size?: AvatarSize;
  shape?: AvatarShape;
  /** Show a green online dot in the corner. */
  online?: boolean;
  className?: string;
}

function initials(name?: string): string {
  if (!name) return '';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function Avatar({
  name,
  src,
  size = 'md',
  shape = 'rounded',
  online = false,
  className,
}: AvatarProps) {
  return (
    <span className={cn(styles.wrap, className)}>
      <span className={cn(styles.avatar, styles[size], styles[shape])}>
        {src ? (
          <img className={styles.img} src={src} alt={name ?? 'avatar'} />
        ) : (
          initials(name)
        )}
      </span>
      {online && <span className={styles.status} aria-hidden="true" />}
    </span>
  );
}
