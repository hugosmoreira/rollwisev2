import { CalendarCheck, Clock, Target, History } from 'lucide-react';
import { StatCard } from '@/components/domain/StatCard';
import { SectionHeading } from '@/components/common/SectionHeading';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/common/Button';
import { Banner } from '@/components/common/Banner';
import { LoadingState } from '@/components/common/LoadingState';
import { Card } from '@/components/common/Card';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { useAuth } from '@/lib/auth';
import { useAsync } from '@/hooks/useAsync';
import { bookingService } from '@/services/bookingService';
import { formatDate } from '@/lib/format';
import { ROUTES } from '@/lib/routes';
import shared from './Student.module.css';
import styles from './TrainingHistory.module.css';

export function TrainingHistoryPage() {
  const { profile } = useAuth();
  const studentId = profile?.id;

  const { data, loading, error } = useAsync(
    () =>
      studentId
        ? bookingService.listTrainingHistory(studentId)
        : Promise.resolve([]),
    [studentId],
  );
  const history = data ?? [];
  const hours = history.reduce((s, h) => s + h.durationMinutes, 0) / 60;
  const focusAreas = new Set(history.flatMap((h) => h.focusTags)).size;

  return (
    <div className={shared.sections}>
      <div>
        <p className={shared.intro}>
          A record of every completed session — your coach's notes, the techniques
          you focused on, and your progress over time.
        </p>

        <div className={shared.statGrid}>
          <StatCard label="Sessions completed" value={String(history.length)} hint="All time" icon={<CalendarCheck size={20} strokeWidth={1.9} />} />
          <StatCard label="Hours trained" value={`${hours % 1 === 0 ? hours : hours.toFixed(1)}h`} hint="Across all sessions" icon={<Clock size={20} strokeWidth={1.9} />} />
          <StatCard label="Focus areas" value={String(focusAreas)} hint="Techniques worked" icon={<Target size={20} strokeWidth={1.9} />} />
        </div>
      </div>

      <div>
        <SectionHeading title="Past sessions" description="Each entry includes your coach's notes and focus tags." />

        {error && <Banner variant="error">{error}</Banner>}

        {loading ? (
          <LoadingState label="Loading history…" />
        ) : history.length === 0 ? (
          <EmptyState
            icon={<History size={26} strokeWidth={1.7} />}
            title="No training history yet"
            description="Complete your first session and it'll appear here with notes and the techniques you worked on."
            action={
              <Button to={ROUTES.student.findClasses} variant="secondary">
                Find Classes
              </Button>
            }
          />
        ) : (
          <div className={styles.list}>
            {history.map((h) => (
              <Card key={h.id} padding="sm" className={styles.row}>
                <Avatar name={h.coachName} size="md" shape="rounded" />
                <div className={styles.body}>
                  <span className={styles.name}>{h.sessionTitle}</span>
                  <span className={styles.meta}>
                    {h.coachName} · {formatDate(h.completedAt)}
                  </span>
                  {h.coachNotes && <span className={styles.meta}>“{h.coachNotes}”</span>}
                </div>
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                  {h.focusTags.slice(0, 3).map((t) => (
                    <Badge key={t} variant="neutral">
                      {t}
                    </Badge>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
