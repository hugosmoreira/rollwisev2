import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import styles from './Card.module.css';

type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding;
  /** Lifts and shows a red hairline on hover (marketing/feature cards). */
  hoverable?: boolean;
  /** Stronger gradient + drop shadow for hero/preview cards. */
  raised?: boolean;
  children?: ReactNode;
}

const padMap: Record<CardPadding, string> = {
  none: styles.padNone,
  sm: styles.padSm,
  md: styles.padMd,
  lg: styles.padLg,
};

export function Card({
  padding = 'md',
  hoverable = false,
  raised = false,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        styles.card,
        padMap[padding],
        raised && styles.raised,
        hoverable && styles.hoverable,
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
