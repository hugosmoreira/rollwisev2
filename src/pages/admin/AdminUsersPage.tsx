import { useState } from 'react';
import { Search, Users } from 'lucide-react';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { EmptyState } from '@/components/common/EmptyState';
import { Banner } from '@/components/common/Banner';
import { LoadingState } from '@/components/common/LoadingState';
import { Card } from '@/components/common/Card';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { useAsync } from '@/hooks/useAsync';
import { adminService } from '@/services/adminService';
import type { UserRole } from '@/types';
import shared from './Admin.module.css';

export function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, loading, reload } = useAsync(
    () =>
      adminService.listUsers({
        role: (role || undefined) as UserRole | undefined,
        status: (status || undefined) as 'active' | 'suspended' | undefined,
      }),
    [role, status],
  );

  const users = (data ?? []).filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const toggle = async (id: string, suspended: boolean) => {
    setError(null);
    setBusy(id);
    try {
      if (suspended) await adminService.reinstateUser(id);
      else await adminService.suspendUser(id);
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <p className={shared.intro}>
        Every account on RollWise. Search, filter by role, and suspend accounts when
        needed.
      </p>

      <div className={shared.toolbar}>
        <div className={shared.searchRow}>
          <Input
            placeholder="Search by name or email…"
            leadingIcon={<Search size={18} strokeWidth={1.9} />}
            aria-label="Search users"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={shared.filters}>
          <Select
            aria-label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={[
              { label: 'All roles', value: '' },
              { label: 'Students', value: 'student' },
              { label: 'Coaches', value: 'coach' },
              { label: 'Admins', value: 'admin' },
            ]}
          />
          <Select
            aria-label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { label: 'All statuses', value: '' },
              { label: 'Active', value: 'active' },
              { label: 'Suspended', value: 'suspended' },
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
        <LoadingState label="Loading users…" />
      ) : users.length === 0 ? (
        <EmptyState
          icon={<Users size={26} strokeWidth={1.7} />}
          title="No users found"
          description="No accounts match your filters."
        />
      ) : (
        <div className={shared.list}>
          {users.map((u) => {
            const suspended = u.status === 'suspended';
            return (
              <Card key={u.id} padding="sm" className={shared.row}>
                <Avatar name={u.fullName} src={u.avatarUrl} size="md" shape="circle" />
                <div className={shared.rowBody}>
                  <span className={shared.rowName}>{u.fullName || 'Unnamed'}</span>
                  <span className={shared.rowMeta}>{u.email}</span>
                </div>
                <div className={shared.rowEnd}>
                  <Badge variant="muted">{u.role}</Badge>
                  <Badge variant={suspended ? 'danger' : 'success'}>
                    {suspended ? 'Suspended' : 'Active'}
                  </Badge>
                  {u.role !== 'admin' && (
                    <Button
                      type="button"
                      size="sm"
                      variant={suspended ? 'secondary' : 'danger'}
                      loading={busy === u.id}
                      onClick={() => toggle(u.id, suspended)}
                    >
                      {suspended ? 'Reinstate' : 'Suspend'}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
