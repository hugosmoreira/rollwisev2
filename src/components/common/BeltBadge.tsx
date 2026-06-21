import type { CSSProperties } from 'react';
import { cn } from '@/lib/cn';
import type { BeltRank } from '@/types';
import styles from './BeltBadge.module.css';

const BELT_COLOR: Record<BeltRank, string> = {
  white: '#e8e8ea',
  blue: '#2d6ce0',
  purple: '#7a3de0',
  brown: '#6b4423',
  black: '#0a0a0b',
};

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

export function beltLabel(belt: BeltRank, degree?: number | null): string {
  const name = `${belt.charAt(0).toUpperCase()}${belt.slice(1)} Belt`;
  return degree ? `${name} · ${ordinal(degree)}°` : name;
}

interface BeltSwatchProps {
  belt: BeltRank;
  small?: boolean;
  className?: string;
}

/** Just the visual belt swatch with its red degree tip. */
export function BeltSwatch({ belt, small, className }: BeltSwatchProps) {
  return (
    <span
      className={cn(styles.swatch, small && styles.sm, className)}
      style={{ '--_belt': BELT_COLOR[belt] } as CSSProperties}
      aria-hidden="true"
    />
  );
}

interface BeltBadgeProps {
  belt: BeltRank;
  degree?: number | null;
  small?: boolean;
  className?: string;
}

/** Belt swatch + label chip (e.g. "Black Belt · 3rd°"). */
export function BeltBadge({ belt, degree, small, className }: BeltBadgeProps) {
  return (
    <span className={cn(styles.badge, className)}>
      <BeltSwatch belt={belt} small={small} />
      {beltLabel(belt, degree)}
    </span>
  );
}
