import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { SectionHeading } from '@/components/common/SectionHeading';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import { Banner } from '@/components/common/Banner';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/lib/auth';
import { useAsync } from '@/hooks/useAsync';
import { sessionService } from '@/services/sessionService';
import { formatDate, formatTime } from '@/lib/format';
import { ROUTES } from '@/lib/routes';
import { cn } from '@/lib/cn';
import shared from './Coach.module.css';
import styles from './Schedule.module.css';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Cell {
  key: string;
  day: number;
  muted: boolean;
  today: boolean;
  hasEvent: boolean;
}

function buildMonth(
  year: number,
  month: number,
  today: Date,
  eventDays: Set<number>,
): Cell[] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;

  return Array.from({ length: 42 }, (_, i) => {
    const offset = i - firstWeekday + 1;
    if (offset < 1) {
      return {
        key: `p${i}`,
        day: daysInPrev + offset,
        muted: true,
        today: false,
        hasEvent: false,
      };
    }
    if (offset > daysInMonth) {
      return {
        key: `n${i}`,
        day: offset - daysInMonth,
        muted: true,
        today: false,
        hasEvent: false,
      };
    }
    return {
      key: `d${offset}`,
      day: offset,
      muted: false,
      today: isCurrentMonth && offset === today.getDate(),
      hasEvent: eventDays.has(offset),
    };
  });
}

export function SchedulePage() {
  const { profile } = useAuth();
  const coachId = profile?.id;
  const today = new Date();
  const [offset, setOffset] = useState(0);

  const { data, loading, error } = useAsync(
    () =>
      coachId
        ? sessionService.listCoachSessions(coachId, 'published')
        : Promise.resolve([]),
    [coachId],
  );
  const sessions = data ?? [];

  const view = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const monthLabel = view.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Days of the viewed month that have at least one published session.
  const eventDays = new Set<number>();
  sessions.forEach((s) => {
    const d = new Date(s.startsAt);
    if (
      d.getFullYear() === view.getFullYear() &&
      d.getMonth() === view.getMonth()
    ) {
      eventDays.add(d.getDate());
    }
  });

  const cells = buildMonth(view.getFullYear(), view.getMonth(), today, eventDays);

  // Upcoming = sessions starting from now, soonest first.
  const now = today.getTime();
  const upcoming = sessions
    .filter((s) => new Date(s.startsAt).getTime() >= now)
    .sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );

  return (
    <div>
      <p className={shared.intro}>
        Your sessions on a calendar. Pick a day to see what's scheduled, or jump to
        a session to edit it.
      </p>

      {error && (
        <Banner variant="error" className={shared.banner}>
          {error}
        </Banner>
      )}

      <div className={shared.twoCol}>
        <section className={shared.panel}>
          <div className={styles.calHead}>
            <span className={styles.calTitle}>{monthLabel}</span>
            <div className={styles.calNav}>
              <button
                type="button"
                className={cn(styles.navBtn, styles.todayBtn)}
                onClick={() => setOffset(0)}
              >
                Today
              </button>
              <button
                type="button"
                className={styles.navBtn}
                onClick={() => setOffset((o) => o - 1)}
                aria-label="Previous month"
              >
                <ChevronLeft size={18} strokeWidth={2} />
              </button>
              <button
                type="button"
                className={styles.navBtn}
                onClick={() => setOffset((o) => o + 1)}
                aria-label="Next month"
              >
                <ChevronRight size={18} strokeWidth={2} />
              </button>
            </div>
          </div>

          <div className={styles.weekdays}>
            {WEEKDAYS.map((d) => (
              <span key={d} className={styles.weekday}>
                {d}
              </span>
            ))}
          </div>
          <div className={styles.grid}>
            {cells.map((cell) => (
              <div
                key={cell.key}
                className={cn(
                  styles.cell,
                  cell.muted && styles.cellMuted,
                  cell.today && styles.cellToday,
                  cell.hasEvent && styles.cellEvent,
                )}
              >
                <span className={styles.dayNum}>{cell.day}</span>
                {cell.hasEvent && <span className={styles.eventDot} aria-hidden />}
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionHeading title="Upcoming" />
          {loading ? (
            <LoadingState label="Loading schedule…" />
          ) : upcoming.length === 0 ? (
            <EmptyState
              icon={<CalendarDays size={26} strokeWidth={1.7} />}
              title="Nothing scheduled"
              description="Your published sessions will appear on the calendar and in this list."
              action={
                <Button to={ROUTES.coach.createSession} variant="secondary">
                  Create Session
                </Button>
              }
            />
          ) : (
            <ul className={styles.upcoming}>
              {upcoming.map((s) => (
                <li key={s.id}>
                  <Link
                    to={ROUTES.coach.editSession(s.id)}
                    className={styles.upItem}
                  >
                    <span className={styles.upDate}>
                      <span className={styles.upDay}>{formatDate(s.startsAt)}</span>
                      <span className={styles.upTime}>{formatTime(s.startsAt)}</span>
                    </span>
                    <span className={styles.upTitle}>{s.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
