import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import styles from './Field.module.css';

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { label, hint, error, required, id, className, containerClassName, ...rest },
    ref,
  ) {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const describedBy = error
      ? `${textareaId}-error`
      : hint
        ? `${textareaId}-hint`
        : undefined;

    return (
      <div className={cn(styles.field, containerClassName)}>
        {label && (
          <label className={styles.label} htmlFor={textareaId}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            styles.control,
            styles.textareaControl,
            error && styles.invalid,
            className,
          )}
          {...rest}
        />
        {error ? (
          <span id={`${textareaId}-error`} className={styles.errorText}>
            {error}
          </span>
        ) : hint ? (
          <span id={`${textareaId}-hint`} className={styles.hint}>
            {hint}
          </span>
        ) : null}
      </div>
    );
  },
);
