import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Award } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ROUTES } from '@/lib/routes';
import type { AuthRole } from '@/services/authService';
import { cn } from '@/lib/cn';
import styles from './Auth.module.css';

const ROLES: {
  value: AuthRole;
  title: string;
  text: string;
  icon: typeof GraduationCap;
}[] = [
  {
    value: 'student',
    title: 'I want to train',
    text: 'Find verified coaches and book private or small-group sessions.',
    icon: GraduationCap,
  },
  {
    value: 'coach',
    title: 'I want to coach',
    text: 'Create sessions, manage bookings, and grow your private-lesson business.',
    icon: Award,
  },
];

export function ChooseRolePage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<AuthRole | null>(null);

  const onContinue = () => {
    if (!role) return;
    navigate(`${ROUTES.signup}?role=${role}`);
  };

  return (
    <div>
      <div className={styles.head}>
        <h1 className={styles.title}>How will you use RollWise?</h1>
        <p className={styles.subtitle}>
          Choose your role to get started. You can always adjust this later.
        </p>
      </div>

      <div className={styles.roles}>
        {ROLES.map((option) => {
          const Icon = option.icon;
          const active = role === option.value;
          return (
            <button
              key={option.value}
              type="button"
              className={cn(styles.roleCard, active && styles.roleCardActive)}
              onClick={() => setRole(option.value)}
              aria-pressed={active}
            >
              <span className={styles.roleIcon}>
                <Icon size={22} strokeWidth={1.9} />
              </span>
              <span className={styles.roleBody}>
                <span className={styles.roleTitle}>{option.title}</span>
                <span className={styles.roleText}>{option.text}</span>
              </span>
              <span className={styles.roleRadio}>
                <span className={styles.roleRadioDot} />
              </span>
            </button>
          );
        })}
      </div>

      <Button
        type="button"
        fullWidth
        className={styles.submit}
        disabled={!role}
        onClick={onContinue}
      >
        Continue
      </Button>

      <p className={styles.footer}>
        Already have an account?{' '}
        <Link to={ROUTES.login} className={styles.footerLink}>
          Log in
        </Link>
      </p>
    </div>
  );
}
