import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import styles from './Container.module.css';

interface ContainerProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  size?: 'default' | 'narrow' | 'wide';
  children: ReactNode;
}

/** Centered max-width content wrapper used across all pages. */
export function Container({
  as: Tag = 'div',
  size = 'default',
  className,
  children,
  ...rest
}: ContainerProps) {
  return (
    <Tag
      className={cn(
        styles.container,
        size === 'narrow' && styles.narrow,
        size === 'wide' && styles.wide,
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
