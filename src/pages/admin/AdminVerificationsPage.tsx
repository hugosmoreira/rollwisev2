import { useState } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, Check, X, FileText } from 'lucide-react';
import { Tabs } from '@/components/common/Tabs';
import { EmptyState } from '@/components/common/EmptyState';
import { Banner } from '@/components/common/Banner';
import { LoadingState } from '@/components/common/LoadingState';
import { Card } from '@/components/common/Card';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { BeltBadge } from '@/components/common/BeltBadge';
import { useAsync } from '@/hooks/useAsync';
import {
  adminService,
  type VerificationQueue,
} from '@/services/adminService';
import { coachService } from '@/services/coachService';
import { formatDate } from '@/lib/format';
import shared from './Admin.module.css';

const TABS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const TAB_TO_STATUS: Record<string, VerificationQueue> = {
  pending: 'pending',
  approved: 'verified',
  rejected: 'rejected',
};

const EMPTY = {
  pending: { icon: <ShieldCheck size={26} strokeWidth={1.7} />, title: 'No pending requests', text: "You're all caught up." },
  approved: { icon: <CheckCircle2 size={26} strokeWidth={1.7} />, title: 'No approved coaches yet', text: 'Coaches you approve will be listed here.' },
  rejected: { icon: <XCircle size={26} strokeWidth={1.7} />, title: 'No rejected requests', text: 'Requests you reject will be kept here.' },
} as const;

export function AdminVerificationsPage() {
  const [tab, setTab] = useState<keyof typeof EMPTY>('pending');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, loading, reload } = useAsync(
    () => adminService.listVerificationRequests(TAB_TO_STATUS[tab]),
    [tab],
  );
  const requests = data ?? [];
  const empty = EMPTY[tab];

  const viewProof = async (path: string) => {
    setError(null);
    try {
      const url = await coachService.getVerificationProofUrl(path);
      window.open(url, '_blank', 'noopener');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open the document.');
    }
  };

  const act = async (fn: () => Promise<void>, id: string) => {
    setError(null);
    setBusy(id);
    try {
      await fn();
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
        Review coach verification requests. Approve to grant a verified badge, or
        reject the request.
      </p>

      <div className={shared.tabsBar}>
        <Tabs
          tabs={TABS}
          value={tab}
          onChange={(v) => setTab(v as keyof typeof EMPTY)}
          aria-label="Verification status"
        />
      </div>

      {error && (
        <Banner variant="error" className={shared.banner}>
          {error}
        </Banner>
      )}

      {loading ? (
        <LoadingState label="Loading requests…" />
      ) : requests.length === 0 ? (
        <EmptyState icon={empty.icon} title={empty.title} description={empty.text} />
      ) : (
        <div className={shared.list}>
          {requests.map((r) => (
            <Card key={r.id} className={shared.review}>
              <div className={shared.reviewHead}>
                <Avatar name={r.coachName} src={r.coachAvatarUrl} size="lg" />
                <div className={shared.reviewBody}>
                  <span className={shared.reviewName}>{r.coachName}</span>
                  <div className={shared.reviewTags}>
                    <BeltBadge belt={r.belt} degree={r.beltDegree} />
                    <span className={shared.reviewDetail}>
                      Submitted {formatDate(r.submittedAt)}
                    </span>
                  </div>
                </div>
              </div>
              <div className={shared.reviewDetail}>
                <strong>Academy:</strong> {r.academy}
                {r.lineage ? ` · Lineage: ${r.lineage}` : ''}
              </div>
              <div className={shared.reviewDetail}>
                {r.proofUrl ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    leftIcon={<FileText size={15} strokeWidth={1.9} />}
                    onClick={() => viewProof(r.proofUrl!)}
                  >
                    View proof document
                  </Button>
                ) : (
                  'No proof document attached.'
                )}
              </div>
              {tab === 'pending' && (
                <div className={shared.reviewActions}>
                  <Button
                    type="button"
                    size="sm"
                    loading={busy === r.id}
                    leftIcon={<Check size={16} strokeWidth={2.4} />}
                    onClick={() => act(() => adminService.approveVerification(r.id), r.id)}
                  >
                    Approve
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    disabled={busy === r.id}
                    leftIcon={<X size={16} strokeWidth={2.4} />}
                    onClick={() =>
                      act(
                        () =>
                          adminService.rejectVerification(
                            r.id,
                            'Did not meet verification requirements.',
                          ),
                        r.id,
                      )
                    }
                  >
                    Reject
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
