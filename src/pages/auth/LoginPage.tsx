import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/common/Input';
import { PasswordInput } from '@/components/common/PasswordInput';
import { Button } from '@/components/common/Button';
import { Banner } from '@/components/common/Banner';
import { OAuthButtons } from './OAuthButtons';
import { useAuthAction } from './useAuthAction';
import { authService, type OAuthProvider } from '@/services/authService';
import { isEmail, isFilled } from '@/lib/validation';
import { ROUTES } from '@/lib/routes';
import styles from './Auth.module.css';

interface Errors {
  email?: string;
  password?: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const { pending, error, run } = useAuthAction();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  const validate = (): boolean => {
    const next: Errors = {};
    if (!isEmail(email)) next.email = 'Enter a valid email address.';
    if (!isFilled(password)) next.password = 'Enter your password.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    void run(async () => {
      await authService.signInWithPassword({ email, password });
      navigate('/app');
    });
  };

  const onOAuth = (provider: OAuthProvider) =>
    void run(() => authService.signInWithOAuth(provider));

  return (
    <div>
      <div className={styles.head}>
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>Log in to your RollWise account.</p>
      </div>

      {error && (
        <Banner variant="error" className={styles.banner}>
          {error}
        </Banner>
      )}

      <OAuthButtons onSelect={onOAuth} disabled={pending} />

      <div className={styles.divider}>or continue with email</div>

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
            if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
          }}
          error={errors.email}
          required
        />
        <PasswordInput
          label="Password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
          }}
          error={errors.password}
          required
        />

        <div className={styles.options}>
          <label className={styles.remember}>
            <input type="checkbox" className={styles.checkbox} />
            Remember me
          </label>
          <Link to={ROUTES.forgotPassword} className={styles.link}>
            Forgot password?
          </Link>
        </div>

        <Button type="submit" fullWidth loading={pending} className={styles.submit}>
          Log In
        </Button>
      </form>

      <p className={styles.footer}>
        Don't have an account?{' '}
        <Link to={ROUTES.signup} className={styles.footerLink}>
          Sign up
        </Link>
      </p>
    </div>
  );
}
