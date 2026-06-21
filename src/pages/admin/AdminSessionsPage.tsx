import { useState } from 'react';
import { Search, Layers } from 'lucide-react';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { EmptyState } from '@/components/common/EmptyState';
import { Banner } from '@/components/common/Banner';
import { LoadingState } from '@/components/common/LoadingState';
import { SessionCard } from '@/components/domain/SessionCard';
import { useAsync } from '@/hooks/useAsync';
import { adminService } from '@/services/adminService';
import shared from './Admin.module.css';

export function AdminSessionsPage() {
  const [search, setSearch] = useState('');
  const [format, setFormat] = useState('');

  const { data, loading, error } = useAsync(() => adminService.listSessions(), []);
  const sessions = (data ?? []).filter((s) => {
    if (format && s.format !== format) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.title.toLowerCase().includes(q) ||
        s.coachName.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div>
      <p className={shared.intro}>
        Every session published on RollWise — across all coaches, formats, and
        rulesets.
      </p>

      <div className={shared.toolbar}>
        <div className={shared.searchRow}>
          <Input
            placeholder="Search sessions by title, coach, or city…"
            leadingIcon={<Search size={18} strokeWidth={1.9} />}
            aria-label="Search sessions"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={shared.filters}>
          <Select
            aria-label="Format"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            options={[
              { label: 'Any format', value: '' },
              { label: 'Private', value: 'private' },
              { label: 'Group', value: 'group' },
            ]}
          />
        </div>
      </div>

      {error && (
        <Banner variant="error" className={shared.banner}>
          {error}
        </Banner>
      )}

      {loading ? (
        <LoadingState label="Loading sessions…" />
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={<Layers size={26} strokeWidth={1.7} />}
          title="No sessions found"
          description="No sessions match your filters."
        />
      ) : (
        <div className={shared.cardGrid}>
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}
