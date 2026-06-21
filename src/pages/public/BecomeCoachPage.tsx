import type { ReactNode } from 'react';
import { Check, UserPlus, BadgeCheck, CalendarCheck } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { ROUTES } from '@/lib/routes';
import styles from './MarketingPage.module.css';

const BENEFITS = [
  'Create private or small-group sessions',
  'Set your own price and schedule',
  'Add social and profile links',
  'Get discovered by local students',
  'Track bookings and earnings in one place',
  'Keep ownership of your students',
];

const STEPS: { icon: ReactNode; title: string; text: string }[] = [
  {
    icon: <UserPlus size={23} strokeWidth={1.8} />,
    title: '1 · Apply',
    text: 'Create your coach profile with your belt, academy, and the styles you teach.',
  },
  {
    icon: <BadgeCheck size={23} strokeWidth={1.8} />,
    title: '2 · Get verified',
    text: 'We confirm your belt rank and lineage so students can book with confidence.',
  },
  {
    icon: <CalendarCheck size={23} strokeWidth={1.8} />,
    title: '3 · Start teaching',
    text: 'Publish sessions, accept bookings, and turn your mat time into a business.',
  },
];

export function BecomeCoachPage() {
  return (
    <Container as="section" className={styles.page}>
      <PageHeader
        eyebrow="For Coaches"
        title="Grow your private-lesson business"
        subtitle="RollWise handles discovery, scheduling, and bookings so you can focus on teaching. Set your own rates, get discovered by local students, and run everything from one coach dashboard."
        actions={
          <Button to={`${ROUTES.signup}?role=coach`} size="lg">
            Apply as a Coach
          </Button>
        }
      />

      <div className={styles.split}>
        <div>
          <h2 className={styles.sectionTitle}>Everything you need to teach</h2>
          <div className={styles.checklist}>
            {BENEFITS.map((benefit) => (
              <div key={benefit} className={styles.checkItem}>
                <span className={styles.checkIcon}>
                  <Check size={14} strokeWidth={2.4} />
                </span>
                {benefit}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.grid}>
          {STEPS.map((step) => (
            <div key={step.title} className={styles.card}>
              <div className={styles.cardIcon}>{step.icon}</div>
              <h3 className={styles.cardTitle}>{step.title}</h3>
              <p className={styles.cardText}>{step.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.band}>
        <div className={styles.bandGlow} aria-hidden="true" />
        <div className={styles.bandInner}>
          <h2 className={styles.bandTitle}>Ready to start coaching on RollWise?</h2>
          <p className={styles.bandText}>
            Create your coach account and build your profile. Verification and your
            first session are just a few steps away.
          </p>
          <div className={styles.bandActions}>
            <Button to={ROUTES.signup} size="lg">
              Apply as a Coach
            </Button>
            <Button to={ROUTES.about} size="lg" variant="secondary">
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </Container>
  );
}
