import { useState } from 'react';
import { Plus, Layers, CheckCircle2 } from 'lucide-react';
import { Tabs } from '@/components/common/Tabs';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/common/Button';
import { Banner } from '@/components/common/Banner';
import { LoadingState } from '@/components/common/LoadingState';
import { SessionCard } from '@/components/domain/SessionCard';
import { useAuth } from '@/lib/auth';
import { useAsync } from '@/hooks/useAsync';
import { sessionService, type CoachSessionStatus } from '@/services/sessionService';
import { ROUTES } from '@/lib/routes';
import { cn } from '@/lib/cn';
import shared from './Coach.module.css';

const TABS = [
  { value: 'published', label: 'Published' },
  { value: 'past', label: 'Past' },
];

const EMPTY = {
  published: {
    icon: <Layers size={26} strokeWidth={1.7} />,
    title: 'No published sessions',
    description:
      "Publish a session and it'll appear here, where you can manage it and review its bookings.",
  },
  past: {
    icon: <CheckCircle2 size={26} strokeWidth={1.7} />,
    title: 'No past sessions',
    description: 'Sessions that have already run will be archived here.',
  },
} as const;

export function ActiveSessionsPage() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<keyof typeof EMPTY>('published');

  const coachId = profile?.id;
  const { data, loading, error } = useAsync(
    () =>
      coachId
        ? sessionService.listCoachSessions(coachId, tab as CoachSessionStatus)
        : Promise.resolve([]),
    [coachId, tab],
  );

  const empty = EMPTY[tab];
  const sessions = data ?? [];

  return (
    <div>
      <p className={shared.intro}>
        Manage your upcoming and published sessions — review who's booked and keep
        them up to date.
      </p>

      <div className={cn(shared.toolbarRow, shared.tabsBar)}>
        <Tabs
          tabs={TABS}
          value={tab}
          onChange={(v) => setTab(v as keyof typeof EMPTY)}
          aria-label="Session status"
        />
        <Button
          to={ROUTES.coach.createSession}
          size="sm"
          leftIcon={<Plus size={16} strokeWidth={2.2} />}
        >
          Create Session
        </Button>
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
          icon={empty.icon}
          title={empty.title}
          description={empty.description}
          action={
            tab === 'published' ? (
              <Button to={ROUTES.coach.createSession} variant="secondary">
                Create Session
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className={shared.cardGrid}>
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              to={ROUTES.coach.editSession(session.id)}
              ctaLabel="Manage"
            />
          ))}
        </div>
      )}
    </div>
  );
}
