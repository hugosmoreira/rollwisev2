import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Banner } from '@/components/common/Banner';
import { useAuthAction } from './useAuthAction';
import { authService } from '@/services/authService';
import { isEmail } from '@/lib/validation';
import { ROUTES } from '@/lib/routes';
import styles from './Auth.module.css';

export function ForgotPasswordPage() {
  const { pending, error, run } = useAuthAction();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [sent, setSent] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isEmail(email)) {
      setEmailError('Enter a valid email address.');
      return;
    }
    setEmailError(undefined);
    void run(async () => {
      await authService.resetPasswordForEmail(email);
      setSent(true);
    });
  };

  return (
    <div>
      <div className={styles.head}>
        <h1 className={styles.title}>Reset your password</h1>
        <p className={styles.subtitle}>
          Enter your email and we'll send you a link to reset your password.
        </p>
      </div>

      {error && (
        <Banner variant="error" className={styles.banner}>
          {error}
        </Banner>
      )}
      {sent && (
        <Banner variant="success" className={styles.banner}>
          If an account exists for {email}, a reset link is on its way.
        </Banner>
      )}

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError(undefined);
          }}
          error={emailError}
          required
        />
        <Button type="submit" fullWidth loading={pending} className={styles.submit}>
          Send reset link
        </Button>
      </form>

      <p className={styles.footer}>
        Remembered it?{' '}
        <Link to={ROUTES.login} className={styles.footerLink}>
          Back to log in
        </Link>
      </p>
    </div>
  );
}
