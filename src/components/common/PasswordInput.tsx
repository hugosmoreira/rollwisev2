import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input, type InputProps } from './Input';
import styles from './Field.module.css';

type PasswordInputProps = Omit<InputProps, 'type' | 'trailing'>;

/** Password field with a show/hide visibility toggle. */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(props, ref) {
    const [visible, setVisible] = useState(false);

    return (
      <Input
        {...props}
        ref={ref}
        type={visible ? 'text' : 'password'}
        trailing={
          <button
            type="button"
            className={styles.trailingButton}
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {visible ? (
              <EyeOff size={18} strokeWidth={1.9} />
            ) : (
              <Eye size={18} strokeWidth={1.9} />
            )}
          </button>
        }
      />
    );
  },
);
