import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import styles from './Modal.module.css';

type ModalSize = 'sm' | 'md' | 'lg';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  size?: ModalSize;
  /** Footer actions (e.g. Cancel / Confirm buttons). */
  footer?: ReactNode;
  children?: ReactNode;
  /** Hide the default close (X) button. */
  hideClose?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  size = 'md',
  footer,
  children,
  hideClose = false,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className={styles.overlay}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(styles.dialog, styles[size])}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {(title || !hideClose) && (
          <div className={styles.header}>
            <div className={styles.titles}>
              {title && <h2 className={styles.title}>{title}</h2>}
              {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
            {!hideClose && (
              <button
                type="button"
                className={styles.close}
                onClick={onClose}
                aria-label="Close dialog"
              >
                <X size={18} strokeWidth={2} />
              </button>
            )}
          </div>
        )}
        {children && (
          <div className={cn(styles.body, !footer && styles.bodyPad)}>
            {children}
          </div>
        )}
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
