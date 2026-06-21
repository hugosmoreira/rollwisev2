import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { GraduationCap, Award } from 'lucide-react';
import { Input } from '@/components/common/Input';
import { PasswordInput } from '@/components/common/PasswordInput';
import { Button } from '@/components/common/Button';
import { Banner } from '@/components/common/Banner';
import { useAuthAction } from './useAuthAction';
import { authService, type AuthRole } from '@/services/authService';
import { isEmail, isFilled, minLength } from '@/lib/validation';
import { ROUTES } from '@/lib/routes';
import { cn } from '@/lib/cn';
import styles from './Auth.module.css';

interface Errors {
  fullName?: string;
  email?: string;
  password?: string;
}

const ROLE_OPTIONS: { value: AuthRole; label: string; icon: typeof GraduationCap }[] =
  [
    { value: 'student', label: 'Train', icon: GraduationCap },
    { value: 'coach', label: 'Coach', icon: Award },
  ];

export function SignupPage() {
  const [params] = useSearchParams();
  const initialRole: AuthRole = params.get('role') === 'coach' ? 'coach' : 'student';

  const navigate = useNavigate();
  const { pending, error, run } = useAuthAction();
  const [info, setInfo] = useState<string | null>(null);
  const [role, setRole] = useState<AuthRole>(initialRole);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  const validate = (): boolean => {
    const next: Errors = {};
    if (!isFilled(fullName)) next.fullName = 'Enter your full name.';
    if (!isEmail(email)) next.email = 'Enter a valid email address.';
    if (!minLength(password, 8)) next.password = 'Use at least 8 characters.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setInfo(null);
    if (!validate()) return;
    void run(async () => {
      const { session } = await authService.signUp({
        fullName,
        email,
        password,
        role,
      });
      if (session) {
        navigate('/app');
      } else {
        setInfo('Check your email to confirm your account, then log in.');
      }
    });
  };

  return (
    <div>
      <div className={styles.head}>
        <h1 className={styles.title}>Create your account</h1>
        <p className={styles.subtitle}>
          Join RollWise to book training or start coaching.
        </p>
      </div>

      {error && (
        <Banner variant="error" className={styles.banner}>
          {error}
        </Banner>
      )}
      {info && (
        <Banner variant="success" className={styles.banner}>
          {info}
        </Banner>
      )}

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <div>
          <div className={styles.segmentHeader}>
            <span className={styles.fieldLabel}>I want to</span>
            <Link to={ROUTES.chooseRole} className={styles.segmentHelp}>
              Compare roles
            </Link>
          </div>
          <div className={styles.segment} role="tablist" aria-label="Account role">
            {ROLE_OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = role === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={cn(styles.segmentBtn, active && styles.segmentActive)}
                  onClick={() => setRole(option.value)}
                >
                  <span className={styles.segmentIcon}>
                    <Icon size={17} strokeWidth={1.9} />
                  </span>
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <Input
          label="Full name"
          name="fullName"
          autoComplete="name"
          placeholder="Marina Costa"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            if (errors.fullName) setErrors((p) => ({ ...p, fullName: undefined }));
          }}
          error={errors.fullName}
          required
        />
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
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
          }}
          error={errors.password}
          hint={errors.password ? undefined : 'Use 8 or more characters.'}
          required
        />

        <Button type="submit" fullWidth loading={pending} className={styles.submit}>
          Create account
        </Button>
      </form>

      <p className={styles.agreement}>
        By creating an account, you agree to our{' '}
        <Link to={ROUTES.terms}>Terms</Link> and{' '}
        <Link to={ROUTES.privacy}>Privacy Policy</Link>.
      </p>

      <p className={styles.footer}>
        Already have an account?{' '}
        <Link to={ROUTES.login} className={styles.footerLink}>
          Log in
        </Link>
      </p>
    </div>
  );
}
