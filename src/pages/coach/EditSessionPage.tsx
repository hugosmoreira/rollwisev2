import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SessionForm } from './SessionForm';
import { ROUTES } from '@/lib/routes';
import shared from './Coach.module.css';
import styles from './CoachList.module.css';

export function EditSessionPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div>
      <Link to={ROUTES.coach.activeSessions} className={styles.back}>
        <ArrowLeft size={16} strokeWidth={2} />
        Back to active sessions
      </Link>
      <p className={shared.intro}>
        Update your session details, schedule, pricing, or location.
      </p>
      <SessionForm submitLabel="Save changes" sessionId={id} />
    </div>
  );
}
