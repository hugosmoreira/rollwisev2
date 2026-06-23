import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ban } from 'lucide-react';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { Select } from '@/components/common/Select';
import { Tabs } from '@/components/common/Tabs';
import { TagInput } from '@/components/common/TagInput';
import { Button } from '@/components/common/Button';
import { Banner } from '@/components/common/Banner';
import { LoadingState } from '@/components/common/LoadingState';
import { CancelSessionModal } from '@/components/domain/CancelSessionModal';
import {
  sessionService,
  type SessionInput,
} from '@/services/sessionService';
import type { Ruleset, SessionFormat, SessionStatus, SkillLevel } from '@/types';
import { isFilled } from '@/lib/validation';
import { ROUTES } from '@/lib/routes';
import shared from './Coach.module.css';

const FORMAT_TABS = [
  { value: 'private', label: 'Private' },
  { value: 'group', label: 'Group' },
];
const RULESET_TABS = [
  { value: 'gi', label: 'Gi' },
  { value: 'no-gi', label: 'No-Gi' },
  { value: 'both', label: 'Gi & No-Gi' },
];
const SKILL_OPTIONS = [
  { label: 'All levels', value: 'all-levels' },
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
];
const DURATION_OPTIONS = [
  { label: '30 minutes', value: '30' },
  { label: '45 minutes', value: '45' },
  { label: '60 minutes', value: '60' },
  { label: '90 minutes', value: '90' },
  { label: '120 minutes', value: '120' },
];

interface SessionFormProps {
  submitLabel: string;
  /** Shown as a banner above the form (e.g. edit-mode notice). */
  notice?: string;
  /** When set, the form loads this session and saves edits instead of creating. */
  sessionId?: string;
}

/** Split an ISO timestamp into local `YYYY-MM-DD` + `HH:MM` for date/time inputs. */
function splitLocal(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: '', time: '' };
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

interface Errors {
  title?: string;
  date?: string;
  time?: string;
  price?: string;
  capacity?: string;
  city?: string;
}

export function SessionForm({ submitLabel, notice, sessionId }: SessionFormProps) {
  const navigate = useNavigate();
  const isEdit = Boolean(sessionId);
  const [format, setFormat] = useState<SessionFormat>('private');
  const [ruleset, setRuleset] = useState<Ruleset>('no-gi');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [focus, setFocus] = useState<string[]>([]);
  const [skill, setSkill] = useState<SkillLevel>('all-levels');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [price, setPrice] = useState('');
  const [capacity, setCapacity] = useState('1');
  const [gymName, setGymName] = useState('');
  const [city, setCity] = useState('');

  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Session cancellation (edit mode). Only a published session is cancellable;
  // the dialog routes through cancelSession, which refunds any paid bookings.
  const [status, setStatus] = useState<SessionStatus | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // In edit mode, load the session once and prefill every field.
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    setLoadingSession(true);
    setLoadError(null);
    sessionService
      .getSession(sessionId)
      .then((s) => {
        if (cancelled) return;
        if (!s) {
          setLoadError('This session could not be found.');
          return;
        }
        setFormat(s.format);
        setRuleset(s.ruleset);
        setTitle(s.title);
        setDescription(s.description ?? '');
        setFocus(s.focusTags);
        setSkill(s.skillLevel);
        const { date: d, time: t } = splitLocal(s.startsAt);
        setDate(d);
        setTime(t);
        setDuration(String(s.durationMinutes));
        setPrice(String(s.price));
        setCapacity(String(s.capacity));
        setGymName(s.gymName ?? '');
        setCity(s.city);
        setStatus(s.status);
      })
      .catch((e) => {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : 'Could not load the session.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSession(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const now = new Date();
  const minDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const validate = (): boolean => {
    const next: Errors = {};
    if (!isFilled(title)) next.title = 'Give your session a title.';
    if (!date) next.date = 'Pick a date.';
    if (!time) next.time = 'Pick a start time.';
    if (date && time && new Date(`${date}T${time}`).getTime() <= Date.now()) {
      next.date = 'Pick a date and time in the future.';
    }
    if (price === '' || Number(price) < 0) next.price = 'Enter a valid price.';
    if (capacity === '' || Number(capacity) < 1) next.capacity = 'At least 1 spot.';
    if (!isFilled(city)) next.city = 'Where does it take place?';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    const startsAt = new Date(`${date}T${time}`).toISOString();
    const input: SessionInput = {
      title: title.trim(),
      description: description.trim() || undefined,
      format,
      ruleset,
      skillLevel: skill,
      focusTags: focus,
      startsAt,
      durationMinutes: Number(duration),
      price: Number(price),
      capacity: Number(capacity),
      gymName: gymName.trim() || undefined,
      city: city.trim(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    };

    setPending(true);
    try {
      if (sessionId) {
        await sessionService.updateSession(sessionId, input);
      } else {
        await sessionService.createSession(input);
      }
      navigate(ROUTES.coach.activeSessions);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : isEdit
            ? 'Could not save your changes.'
            : 'Could not publish the session.',
      );
    } finally {
      setPending(false);
    }
  };

  if (loadingSession) {
    return <LoadingState label="Loading session…" />;
  }
  if (loadError) {
    return (
      <Banner variant="error" className={shared.banner}>
        {loadError}
      </Banner>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      {notice && (
        <Banner variant="info" className={shared.banner}>
          {notice}
        </Banner>
      )}
      {submitError && (
        <Banner variant="error" className={shared.banner}>
          {submitError}
        </Banner>
      )}

      <div className={shared.formSections}>
        {/* Session details */}
        <section className={shared.panel}>
          <h2 className={shared.formSectionTitle}>Session details</h2>
          <p className={shared.formSectionDesc}>
            Define the format, focus, and what students can expect.
          </p>
          <div className={shared.fields}>
            <div className={shared.formGrid}>
              <div>
                <span className={shared.fieldLabel}>Format</span>
                <Tabs
                  tabs={FORMAT_TABS}
                  value={format}
                  onChange={(v) => setFormat(v as SessionFormat)}
                  aria-label="Format"
                />
              </div>
              <div>
                <span className={shared.fieldLabel}>Ruleset</span>
                <Tabs
                  tabs={RULESET_TABS}
                  value={ruleset}
                  onChange={(v) => setRuleset(v as Ruleset)}
                  aria-label="Ruleset"
                />
              </div>
            </div>
            <Input
              label="Title"
              placeholder="e.g. No-Gi guard passing fundamentals"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={errors.title}
              required
            />
            <Textarea
              label="Description"
              placeholder="What you'll cover, who it's for, and what to bring…"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <TagInput
              label="Focus areas"
              value={focus}
              onChange={setFocus}
              placeholder="Add a focus (e.g. Leg Locks) and press Enter"
              hint="Help students find this session by technique."
            />
            <Select
              label="Skill level"
              options={SKILL_OPTIONS}
              value={skill}
              onChange={(e) => setSkill(e.target.value as SkillLevel)}
            />
          </div>
        </section>

        {/* Schedule & pricing */}
        <section className={shared.panel}>
          <h2 className={shared.formSectionTitle}>Schedule & pricing</h2>
          <p className={shared.formSectionDesc}>
            Set when the session runs, how long it lasts, and what it costs.
          </p>
          <div className={shared.fields}>
            <div className={shared.formGrid3}>
              <Input
                label="Date"
                type="date"
                min={minDate}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                error={errors.date}
                required
              />
              <Input
                label="Start time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                error={errors.time}
                required
              />
              <Select
                label="Duration"
                options={DURATION_OPTIONS}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
            <div className={shared.formGrid}>
              <Input
                label="Price (USD)"
                type="number"
                min={0}
                placeholder="90"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                error={errors.price}
                required
              />
              <Input
                label="Capacity"
                type="number"
                min={1}
                placeholder="1"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                error={errors.capacity}
                required
              />
            </div>
          </div>
        </section>

        {/* Location */}
        <section className={shared.panel}>
          <h2 className={shared.formSectionTitle}>Location</h2>
          <p className={shared.formSectionDesc}>Where the session takes place.</p>
          <div className={shared.fields}>
            <Input
              label="Gym name"
              placeholder="e.g. Atos HQ"
              value={gymName}
              onChange={(e) => setGymName(e.target.value)}
            />
            <Input
              label="City"
              placeholder="City, Country"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              error={errors.city}
              required
            />
          </div>
        </section>
      </div>

      <div className={shared.formActions}>
        {isEdit && status === 'published' && (
          <Button
            type="button"
            variant="danger"
            onClick={() => setConfirmOpen(true)}
            disabled={pending}
            leftIcon={<Ban size={16} strokeWidth={2.2} />}
            style={{ marginRight: 'auto' }}
          >
            Cancel session
          </Button>
        )}
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate(ROUTES.coach.activeSessions)}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button type="submit" loading={pending}>
          {submitLabel}
        </Button>
      </div>

      <CancelSessionModal
        session={sessionId ? { id: sessionId, title } : null}
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onCancelled={() => navigate(ROUTES.coach.activeSessions)}
      />
    </form>
  );
}
