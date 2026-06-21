import { useState } from 'react';
import { Search, Compass } from 'lucide-react';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { EmptyState } from '@/components/common/EmptyState';
import { Banner } from '@/components/common/Banner';
import { LoadingState } from '@/components/common/LoadingState';
import { SessionCard } from '@/components/domain/SessionCard';
import { useAsync } from '@/hooks/useAsync';
import { sessionService } from '@/services/sessionService';
import { ROUTES } from '@/lib/routes';
import { cn } from '@/lib/cn';
import shared from './Student.module.css';

const FOCUS_CHIPS = [
  'Guard Passing',
  'Leg Locks',
  'Wrestling',
  'Takedowns',
  'Submissions',
  'Competition Prep',
  'Fundamentals',
];

export function FindClassesPage() {
  const [search, setSearch] = useState('');
  const [ruleset, setRuleset] = useState('');
  const [format, setFormat] = useState('');
  const [skill, setSkill] = useState('');
  const [active, setActive] = useState<Record<string, boolean>>({});

  const { data, loading, error } = useAsync(() => sessionService.listSessions(), []);
  const sessions = data ?? [];

  const activeChips = Object.keys(active).filter((k) => active[k]);
  const filtered = sessions.filter((s) => {
    if (ruleset && s.ruleset !== ruleset) return false;
    if (format && s.format !== format) return false;
    if (skill && s.skillLevel !== skill) return false;
    if (activeChips.length && !activeChips.every((c) => s.focusTags.includes(c)))
      return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !s.title.toLowerCase().includes(q) &&
        !s.coachName.toLowerCase().includes(q) &&
        !s.city.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  return (
    <div>
      <p className={shared.intro}>
        Search by coach, technique, gym, or city, then filter by ruleset, format,
        and skill level to find your next session.
      </p>

      <div className={shared.toolbar}>
        <Input
          placeholder="Search coaches, techniques, gyms, or cities…"
          leadingIcon={<Search size={18} strokeWidth={1.9} />}
          aria-label="Search classes"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className={shared.filters}>
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
          <Select
            aria-label="Skill level"
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            options={[
              { label: 'Any level', value: '' },
              { label: 'Beginner', value: 'beginner' },
              { label: 'Intermediate', value: 'intermediate' },
              { label: 'Advanced', value: 'advanced' },
              { label: 'All levels', value: 'all-levels' },
            ]}
          />
        </div>
        <div className={shared.chips}>
          {FOCUS_CHIPS.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setActive((p) => ({ ...p, [label]: !p[label] }))}
              className={cn(shared.chip, active[label] && shared.chipActive)}
              aria-pressed={!!active[label]}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <Banner variant="error" className={shared.tabsBar}>
          {error}
        </Banner>
      )}

      {loading ? (
        <LoadingState label="Loading classes…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Compass size={26} strokeWidth={1.7} />}
          title={sessions.length === 0 ? 'No classes available yet' : 'No matches'}
          description={
            sessions.length === 0
              ? 'Sessions appear here once verified coaches publish them. Check back soon.'
              : 'No sessions match your filters. Try clearing some to see more.'
          }
        />
      ) : (
        <div className={shared.cardGrid}>
          {filtered.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              to={ROUTES.student.class(session.id)}
              ctaLabel="View"
            />
          ))}
        </div>
      )}
    </div>
  );
}
