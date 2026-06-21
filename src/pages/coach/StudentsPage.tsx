import { useState } from 'react';
import { Search, Users } from 'lucide-react';
import { Input } from '@/components/common/Input';
import { Card } from '@/components/common/Card';
import { Avatar } from '@/components/common/Avatar';
import { EmptyState } from '@/components/common/EmptyState';
import { Banner } from '@/components/common/Banner';
import { LoadingState } from '@/components/common/LoadingState';
import { useAuth } from '@/lib/auth';
import { useAsync } from '@/hooks/useAsync';
import { coachService } from '@/services/coachService';
import { formatDate } from '@/lib/format';
import shared from './Coach.module.css';
import styles from './Students.module.css';

export function StudentsPage() {
  const { profile } = useAuth();
  const [search, setSearch] = useState('');

  const coachId = profile?.id;
  const { data, loading, error } = useAsync(
    () => (coachId ? coachService.listStudents(coachId) : Promise.resolve([])),
    [coachId],
  );

  const students = (data ?? []).filter((s) =>
    s.fullName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <p className={shared.intro}>
        Students who've trained with you — their total sessions and most recent
        booking.
      </p>

      <div className={shared.toolbar}>
        <Input
          placeholder="Search students…"
          leadingIcon={<Search size={18} strokeWidth={1.9} />}
          aria-label="Search students"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <Banner variant="error" className={shared.banner}>
          {error}
        </Banner>
      )}

      {loading ? (
        <LoadingState label="Loading students…" />
      ) : students.length === 0 ? (
        <EmptyState
          icon={<Users size={26} strokeWidth={1.7} />}
          title={data && data.length > 0 ? 'No matches' : 'No students yet'}
          description={
            data && data.length > 0
              ? 'No students match your search.'
              : 'Once students book and train with you, they’ll appear here.'
          }
        />
      ) : (
        <div className={styles.list}>
          {students.map((s) => (
            <Card key={s.studentId} padding="sm" className={styles.row}>
              <Avatar name={s.fullName} src={s.avatarUrl} size="md" shape="rounded" />
              <div className={styles.body}>
                <span className={styles.name}>{s.fullName}</span>
                <span className={styles.meta}>
                  {s.totalSessions} session{s.totalSessions === 1 ? '' : 's'}
                  {s.lastSessionAt ? ` · Last ${formatDate(s.lastSessionAt)}` : ''}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
