import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ShieldCheck,
  Users,
  Search,
  CalendarDays,
  TrendingUp,
  Star,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { BeltBadge } from '@/components/common/BeltBadge';
import { Badge } from '@/components/common/Badge';
import { GiBeltIcon } from '@/components/common/icons';
import { ROUTES } from '@/lib/routes';
import { cn } from '@/lib/cn';
import styles from './LandingPage.module.css';

const FEATURES: { icon: ReactNode; title: string; text: string }[] = [
  {
    icon: <ShieldCheck size={23} strokeWidth={1.8} />,
    title: 'Verified BJJ Coaches',
    text: 'Every coach is vetted for belt rank, lineage, and teaching experience.',
  },
  {
    icon: <Users size={23} strokeWidth={1.8} />,
    title: 'Private & Small Group',
    text: 'One-on-one focus or train with a few partners — you choose the format.',
  },
  {
    icon: <GiBeltIcon size={23} strokeWidth={1.8} />,
    title: 'Gi & No-Gi Specialists',
    text: 'Filter coaches by ruleset and style — from traditional gi to modern no-gi.',
  },
  {
    icon: <CalendarDays size={23} strokeWidth={1.8} />,
    title: 'Simple Booking Flow',
    text: 'See live availability, pick a slot, and lock in your session in seconds.',
  },
];

const STEPS: { num: string; icon: ReactNode; title: string; text: string }[] = [
  {
    num: '01',
    icon: <Search size={21} strokeWidth={1.9} />,
    title: 'Search & discover',
    text: 'Search by location, coach, or technique — guard passing, leg locks, comp prep, and more.',
  },
  {
    num: '02',
    icon: <CalendarDays size={21} strokeWidth={1.9} />,
    title: 'Book your session',
    text: 'Pick a private or small-group slot that fits your schedule and confirm instantly.',
  },
  {
    num: '03',
    icon: <TrendingUp size={21} strokeWidth={1.9} />,
    title: 'Train & track progress',
    text: 'Roll with purpose, log what you worked, and watch your game level up over time.',
  },
];

const COACH_BENEFITS = [
  'Create private or group sessions',
  'Set your own price and schedule',
  'Add social and profile links',
  'Get discovered by local students',
  'Track bookings and earnings',
];

const ACADEMIES = ['Atos', 'Alliance', 'Gracie Barra', 'CheckMat', 'AOJ'];

const CHIP_DEFS = [
  'No-Gi',
  'Gi',
  'Guard Passing',
  'Leg Locks',
  'Wrestling',
  'Competition Prep',
  'Beginners',
  'Kids / Youth',
];

const REVENUE_BARS = [
  { h: 38, red: false },
  { h: 55, red: false },
  { h: 46, red: false },
  { h: 70, red: false },
  { h: 60, red: false },
  { h: 88, red: true },
  { h: 100, red: true },
];

const arrow = <ArrowRight size={18} strokeWidth={2.2} />;

export function LandingPage() {
  const [activeChips, setActiveChips] = useState<Record<string, boolean>>({
    'No-Gi': true,
    'Guard Passing': true,
  });

  const toggleChip = (label: string) =>
    setActiveChips((prev) => ({ ...prev, [label]: !prev[label] }));

  return (
    <div className={styles.page}>
      {/* ============ HERO ============ */}
      <section id="top" className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.heroGrid} aria-hidden="true" />

        <div className={cn(styles.container, styles.heroInner)}>
          <div className={styles.heroCopy}>
            <div className={styles.badge}>
              <span className={styles.badgeDot} />
              <span className={styles.badgeText}>
                Private Jiu-Jitsu coaching, on demand
              </span>
            </div>

            <h1 className={styles.heroTitle}>
              Book Private Jiu-Jitsu Training With{' '}
              <span className={styles.accent}>Elite Coaches</span>
            </h1>

            <p className={styles.heroSubtitle}>
              Find verified BJJ coaches, book private or small-group sessions, and
              train with purpose — gi or no-gi.
            </p>

            <div className={styles.heroCtas}>
              <Button to={ROUTES.findCoaches} size="lg" rightIcon={arrow}>
                Find a Coach
              </Button>
              <Button to={ROUTES.becomeCoach} size="lg" variant="secondary">
                Become a Coach
              </Button>
            </div>

            <div className={styles.heroSocial}>
              <div className={styles.avatarStack} aria-hidden="true">
                <span className={styles.stackAvatar} />
                <span className={styles.stackAvatar} />
                <span className={styles.stackAvatar} />
                <span className={styles.stackPlus}>+</span>
              </div>
              <div className={styles.heroSocialText}>
                <strong>400+</strong> verified coaches
                <br />
                across gi &amp; no-gi
              </div>
            </div>
          </div>

          {/* Hero visual — preview cards (marketing illustration) */}
          <div className={styles.heroVisual}>
            <div className={styles.heroVisualInner}>
              <div className={styles.previewCoach}>
                <div className={styles.previewCoachHead}>
                  <div className={styles.previewAvatar}>
                    <span className={styles.previewAvatarDot} />
                  </div>
                  <div>
                    <div className={styles.previewName}>Rafael Mendes</div>
                    <div className={styles.previewBeltRow}>
                      <BeltBadge belt="black" small />
                    </div>
                  </div>
                </div>
                <div className={styles.previewTags}>
                  <Badge variant="neutral">No-Gi</Badge>
                  <Badge variant="neutral">Leg Locks</Badge>
                  <Badge variant="neutral">Guard Passing</Badge>
                </div>
                <div className={styles.previewDivider}>
                  <div className={styles.previewRating}>
                    <Star
                      size={15}
                      className={styles.previewRatingStar}
                      fill="currentColor"
                      stroke="none"
                    />
                    <span className={styles.previewRatingValue}>4.9</span>
                    <span className={styles.previewRatingCount}>(127)</span>
                  </div>
                  <div className={styles.previewLocation}>
                    <MapPin size={14} strokeWidth={1.8} />
                    São Paulo, BR
                  </div>
                </div>
              </div>

              <div className={styles.previewBooking}>
                <div className={styles.previewBookingHead}>
                  <span className={styles.previewBookingLabel}>Private Session</span>
                  <span className={styles.previewBookingPrice}>
                    $90<span> /hr</span>
                  </span>
                </div>
                <div className={styles.previewDates}>
                  <div className={styles.dayPill}>
                    <div className={styles.dayPillTop}>THU</div>
                    <div className={styles.dayPillNum}>12</div>
                  </div>
                  <div className={cn(styles.dayPill, styles.dayPillActive)}>
                    <div className={styles.dayPillTop}>FRI</div>
                    <div className={styles.dayPillNum}>13</div>
                  </div>
                  <div className={styles.dayPill}>
                    <div className={styles.dayPillTop}>SAT</div>
                    <div className={styles.dayPillNum}>14</div>
                  </div>
                </div>
                <div className={styles.previewBookBtn}>
                  Book 6:00 PM
                  <Check size={15} strokeWidth={2.2} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Academy logo strip */}
        <div className={cn(styles.container, styles.logoStrip)}>
          <p className={styles.logoStripLabel}>
            Trusted by athletes from leading academies
          </p>
          <div className={styles.logoStripRow}>
            {ACADEMIES.map((name) => (
              <span key={name} className={styles.logoStripItem}>
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section className={cn(styles.container, styles.features)}>
        <div className={styles.featuresGrid}>
          {FEATURES.map((feature) => (
            <div key={feature.title} className={styles.featureCard}>
              <div className={styles.featureIcon}>{feature.icon}</div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureText}>{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how" className={styles.altSection}>
        <div className={cn(styles.container, styles.sectionPad)}>
          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>
              <span className={styles.eyebrowBar} />
              <span className={styles.eyebrowText}>How RollWise Works</span>
            </span>
            <h2 className={styles.sectionTitle}>
              From search to submission in three steps
            </h2>
            <p className={styles.sectionLead}>
              No DMs, no guesswork. RollWise turns finding and booking the right
              coach into a clean, repeatable flow.
            </p>
          </div>

          <div className={styles.stepsGrid}>
            {STEPS.map((step) => (
              <div key={step.num} className={styles.stepCard}>
                <div className={styles.stepHead}>
                  <span className={styles.stepNumber}>{step.num}</span>
                  <span className={styles.stepIcon}>{step.icon}</span>
                </div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepText}>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FOR COACHES ============ */}
      <section id="coaches" className={cn(styles.container, styles.sectionPad)}>
        <div className={styles.splitRow}>
          <div className={styles.splitCopy}>
            <span className={styles.eyebrow}>
              <span className={styles.eyebrowBar} />
              <span className={styles.eyebrowText}>For Coaches</span>
            </span>
            <h2 className={styles.splitTitle}>Built for coaches who want to grow</h2>
            <p className={styles.splitLead}>
              Turn your mat time into a real private-lesson business. RollWise
              handles discovery, scheduling, and bookings so you can focus on
              teaching.
            </p>

            <div className={styles.checklist}>
              {COACH_BENEFITS.map((benefit) => (
                <div key={benefit} className={styles.checkItem}>
                  <span className={styles.checkIcon}>
                    <Check size={14} strokeWidth={2.4} />
                  </span>
                  <span className={styles.checkText}>{benefit}</span>
                </div>
              ))}
            </div>

            <Button to={ROUTES.becomeCoach} size="lg" rightIcon={arrow}>
              Apply as a Coach
            </Button>
          </div>

          {/* Coach dashboard mini (marketing illustration) */}
          <div className={styles.splitVisual}>
            <div className={styles.coachDash}>
              <div className={styles.coachDashHead}>
                <span className={styles.coachDashLabel}>This month</span>
                <span className={styles.coachDashDelta}>
                  <TrendingUp size={12} strokeWidth={2.4} />
                  +18%
                </span>
              </div>
              <div className={styles.coachDashValue}>$2,480</div>
              <div className={styles.coachDashSub}>from 26 sessions · 14 students</div>

              <div className={styles.coachDashBars} aria-hidden="true">
                {REVENUE_BARS.map((bar, i) => (
                  <span
                    key={i}
                    className={cn(styles.bar, bar.red && styles.barRed)}
                    style={{ height: `${bar.h}%` }}
                  />
                ))}
              </div>

              <div className={styles.coachDashList}>
                <div className={styles.coachDashRow}>
                  <span className={styles.coachDashRowIcon} />
                  <div className={styles.coachDashRowBody}>
                    <div className={styles.coachDashRowTitle}>Private · No-Gi</div>
                    <div className={styles.coachDashRowTime}>Today · 6:00 PM</div>
                  </div>
                  <span className={styles.coachDashRowPrice}>$90</span>
                </div>
                <div className={styles.coachDashRow}>
                  <span className={styles.coachDashRowIcon} />
                  <div className={styles.coachDashRowBody}>
                    <div className={styles.coachDashRowTitle}>Group · Comp Prep</div>
                    <div className={styles.coachDashRowTime}>Tomorrow · 11:00 AM</div>
                  </div>
                  <span className={styles.coachDashRowPrice}>$140</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOR STUDENTS ============ */}
      <section id="coaches-list" className={styles.altSection}>
        <div className={cn(styles.container, styles.sectionPad)}>
          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>
              <span className={styles.eyebrowBar} />
              <span className={styles.eyebrowText}>For Students</span>
            </span>
            <h2 className={styles.sectionTitle}>Find the right coach for your game</h2>
            <p className={styles.sectionLead}>
              Filter by ruleset, position, and focus area — built around how
              Jiu-Jitsu is actually trained.
            </p>
          </div>

          <Link to={ROUTES.findCoaches} className={styles.searchBar}>
            <Search size={19} strokeWidth={1.9} className={styles.searchIcon} />
            <span className={styles.searchText}>
              Search coaches, techniques, or city…
            </span>
            <span className={styles.searchBtn}>Search</span>
          </Link>

          <div className={styles.chips}>
            {CHIP_DEFS.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => toggleChip(label)}
                className={cn(styles.chip, activeChips[label] && styles.chipActive)}
                aria-pressed={!!activeChips[label]}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FEATURED COACH ============ */}
      <section className={cn(styles.container, styles.sectionPad)}>
        <div className={styles.sectionHead}>
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowBar} />
            <span className={styles.eyebrowText}>Featured Coach</span>
          </span>
          <h2 className={styles.sectionTitle}>A real profile, ready to book</h2>
        </div>

        <div className={styles.featuredCard}>
          <div className={styles.featuredCover}>
            <span className={styles.featuredCoverLabel}>coach action shot</span>
            <div className={styles.featuredCoverFade} />
            <span className={styles.featuredVerified}>
              <ShieldCheck
                size={13}
                strokeWidth={2.2}
                className={styles.featuredVerifiedIcon}
              />
              Verified
            </span>
          </div>

          <div className={styles.featuredBody}>
            <div className={styles.featuredAvatar} />

            <div className={styles.featuredTopRow}>
              <div>
                <h3 className={styles.featuredName}>Marina Costa</h3>
                <div className={styles.featuredMeta}>
                  <BeltBadge belt="black" degree={3} />
                  <span className={styles.featuredLocation}>
                    <MapPin size={14} strokeWidth={1.8} />
                    Austin, TX
                  </span>
                </div>
              </div>
              <div className={styles.featuredPrice}>
                <div className={styles.featuredPriceValue}>
                  $110<span className={styles.featuredPriceUnit}> /hr</span>
                </div>
                <div className={styles.featuredRating}>
                  <Star
                    size={14}
                    className={styles.featuredRatingStar}
                    fill="currentColor"
                    stroke="none"
                  />
                  <span className={styles.featuredRatingValue}>5.0</span>
                  <span className={styles.featuredRatingCount}>(84)</span>
                </div>
              </div>
            </div>

            <div className={styles.featuredTags}>
              <Badge variant="neutral">No-Gi</Badge>
              <Badge variant="neutral">Wrestling</Badge>
              <Badge variant="neutral">Guard Passing</Badge>
              <Badge variant="neutral">Competition Prep</Badge>
            </div>

            <Button to={ROUTES.findCoaches} fullWidth rightIcon={arrow}>
              View Profile
            </Button>
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section id="cta" className={cn(styles.container, styles.finalCta)}>
        <div className={styles.ctaPanel}>
          <div className={styles.ctaGlow} aria-hidden="true" />
          <div className={styles.ctaContent}>
            <span className={styles.ctaBeltMark} aria-hidden="true" />
            <h2 className={styles.ctaTitle}>Ready to level up your Jiu-Jitsu?</h2>
            <p className={styles.ctaLead}>
              Join RollWise and start booking better training sessions with coaches
              who match your goals.
            </p>
            <div className={styles.ctaButtons}>
              <Button to={ROUTES.findCoaches} size="lg" rightIcon={arrow}>
                Find a Coach
              </Button>
              <Button to={ROUTES.becomeCoach} size="lg" variant="secondary">
                Become a Coach
              </Button>
            </div>
          </div>
          <div className={styles.ctaBottomLine} aria-hidden="true" />
        </div>
      </section>
    </div>
  );
}
