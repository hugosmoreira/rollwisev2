import { useState } from 'react';
import { Search, Award } from 'lucide-react';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { EmptyState } from '@/components/common/EmptyState';
import { Banner } from '@/components/common/Banner';
import { LoadingState } from '@/components/common/LoadingState';
import { CoachCard } from '@/components/domain/CoachCard';
import { useAsync } from '@/hooks/useAsync';
import { adminService } from '@/services/adminService';
import shared from './Admin.module.css';

export function AdminCoachesPage() {
  const [search, setSearch] = useState('');
  const [verification, setVerification] = useState('');

  const { data, loading, error } = useAsync(() => adminService.listCoaches(), []);
  const coaches = (data ?? []).filter((c) => {
    if (verification && c.verification !== verification) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.fullName.toLowerCase().includes(q) ||
        (c.academy ?? '').toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div>
      <p className={shared.intro}>
        All coaches on the platform — their verification status, rating, and rate.
      </p>

      <div className={shared.toolbar}>
        <div className={shared.searchRow}>
          <Input
            placeholder="Search coaches by name, academy, or city…"
            leadingIcon={<Search size={18} strokeWidth={1.9} />}
            aria-label="Search coaches"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={shared.filters}>
          <Select
            aria-label="Verification"
            value={verification}
            onChange={(e) => setVerification(e.target.value)}
            options={[
              { label: 'Any verification', value: '' },
              { label: 'Verified', value: 'verified' },
              { label: 'Pending', value: 'pending' },
              { label: 'Unverified', value: 'unverified' },
              { label: 'Rejected', value: 'rejected' },
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
        <LoadingState label="Loading coaches…" />
      ) : coaches.length === 0 ? (
        <EmptyState
          icon={<Award size={26} strokeWidth={1.7} />}
          title="No coaches found"
          description="No coaches match your filters."
        />
      ) : (
        <div className={shared.cardGrid}>
          {coaches.map((coach) => (
            <CoachCard key={coach.id} coach={coach} />
          ))}
        </div>
      )}
    </div>
  );
}
