import { Link, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import { useAuth } from '@/lib/auth';
import { ROUTES } from '@/lib/routes';
import styles from './SidebarAccount.module.css';

interface SidebarAccountProps {
  /** Profile route for the current role's app. */
  profileTo: string;
  /** Fallback label shown before the profile loads. */
  fallbackRole: string;
}

/** Sidebar footer showing the signed-in user + a sign-out action. */
export function SidebarAccount({ profileTo, fallbackRole }: SidebarAccountProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const onSignOut = async () => {
    await signOut();
    navigate(ROUTES.login, { replace: true });
  };

  return (
    <div className={styles.wrap}>
      <Link to={profileTo} className={styles.account}>
        <Avatar name={profile?.fullName} src={profile?.avatarUrl} size="sm" shape="circle" />
        <span className={styles.text}>
          <span className={styles.name}>{profile?.fullName || 'Your account'}</span>
          <span className={styles.role}>{profile?.role ?? fallbackRole}</span>
        </span>
      </Link>
      <button type="button" className={styles.signOut} onClick={onSignOut}>
        <span className={styles.signOutIcon}>
          <LogOut size={18} strokeWidth={1.8} />
        </span>
        Sign out
      </button>
    </div>
  );
}
