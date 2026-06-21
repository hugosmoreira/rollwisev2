import { Button } from '@/components/common/Button';
import { GoogleIcon, AppleIcon } from '@/components/common/icons';
import type { OAuthProvider } from '@/services/authService';
import styles from './Auth.module.css';

interface OAuthButtonsProps {
  onSelect: (provider: OAuthProvider) => void;
  disabled?: boolean;
  /** Verb shown in the labels, e.g. "Continue" or "Sign up". */
  verb?: string;
}

/** Google / Apple sign-in buttons (UI prepared for Supabase OAuth). */
export function OAuthButtons({
  onSelect,
  disabled,
  verb = 'Continue',
}: OAuthButtonsProps) {
  return (
    <div className={styles.oauth}>
      <Button
        type="button"
        variant="secondary"
        fullWidth
        disabled={disabled}
        onClick={() => onSelect('google')}
        leftIcon={<GoogleIcon />}
      >
        {verb} with Google
      </Button>
      <Button
        type="button"
        variant="secondary"
        fullWidth
        disabled={disabled}
        onClick={() => onSelect('apple')}
        leftIcon={<AppleIcon />}
      >
        {verb} with Apple
      </Button>
    </div>
  );
}
