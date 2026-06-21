import { useState } from 'react';
import { Search, Compass } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/common/PageHeader';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { EmptyState } from '@/components/common/EmptyState';
import { Banner } from '@/components/common/Banner';
import { LoadingState } from '@/components/common/LoadingState';
import { Button } from '@/components/common/Button';
import { CoachCard } from '@/components/domain/CoachCard';
import { useAsync } from '@/hooks/useAsync';
import { coachService } from '@/services/coachService';
import type { Ruleset } from '@/types';
import { ROUTES } from '@/lib/routes';
import { cn } from '@/lib/cn';
import styles from './FindCoachesPage.module.css';

const FOCUS_CHIPS = [
  'No-Gi',
  'Gi',
  'Guard Passing',
  'Leg Locks',
  'Wrestling',
  'Competition Prep',
  'Beginners',
];

export function FindCoachesPage() {
  const [search, setSearch] = useState('');
  const [ruleset, setRuleset] = useState('');
  const [active, setActive] = useState<Record<string, boolean>>({});

  const { data, loading, error } = useAsync(() => coachService.listCoaches(), []);
  const coaches = data ?? [];

  const activeChips = Object.keys(active).filter((k) => active[k]);
  const filtered = coaches.filter((c) => {
    if (ruleset && !c.rulesets.includes(ruleset as Ruleset)) return false;
    if (activeChips.length && !activeChips.every((t) => c.focusTags.includes(t)))
      return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !c.fullName.toLowerCase().includes(q) &&
        !(c.academy ?? '').toLowerCase().includes(q) &&
        !c.city.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  return (
    <Container as="section" className={styles.page}>
      <PageHeader
        eyebrow="Find Coaches"
        title="Browse verified BJJ coaches"
        subtitle="Search by coach, academy, or city, then filter by ruleset and focus area to find the right match for your game."
      />

      <div className={styles.toolbar}>
        <div className={styles.searchRow}>
          <Input
            placeholder="Search coaches, academies, or cities…"
            leadingIcon={<Search size={18} strokeWidth={1.9} />}
            aria-label="Search coaches"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.filters}>
          <Select
            aria-label="Ruleset"
            value={ruleset}
            onChange={(e) => setRuleset(e.target.value)}
            options={[
              { label: 'Any ruleset', value: '' },
              { label: 'Gi', value: 'gi' },
              { label: 'No-Gi', value: 'no-gi' },
              { label: 'Gi & No-Gi', value: 'both' },
            ]}
          />
        </div>
        <div className={styles.chips}>
          {FOCUS_CHIPS.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setActive((p) => ({ ...p, [label]: !p[label] }))}
              className={cn(styles.chip, active[label] && styles.chipActive)}
              aria-pressed={!!active[label]}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && <Banner variant="error">{error}</Banner>}

      {loading ? (
        <LoadingState label="Loading coaches…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Compass size={26} strokeWidth={1.7} />}
          title={coaches.length === 0 ? 'No coaches to show yet' : 'No matches'}
          description={
            coaches.length === 0
              ? 'Coach discovery goes live as verified coaches join RollWise.'
              : 'No coaches match your filters. Try clearing some to see more.'
          }
          action={
            <Button to={ROUTES.becomeCoach} variant="secondary">
              Become a Coach
            </Button>
          }
        />
      ) : (
        <div className={styles.grid}>
          {filtered.map((coach) => (
            <CoachCard key={coach.id} coach={coach} to={ROUTES.signup} />
          ))}
        </div>
      )}
    </Container>
  );
}
