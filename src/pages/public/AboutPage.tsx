import type { ReactNode } from 'react';
import { ShieldCheck, Target, HeartHandshake, Compass } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { ROUTES } from '@/lib/routes';
import styles from './MarketingPage.module.css';

const VALUES: { icon: ReactNode; title: string; text: string }[] = [
  {
    icon: <ShieldCheck size={23} strokeWidth={1.8} />,
    title: 'Verified, not anonymous',
    text: 'Every coach is checked for belt rank, lineage, and teaching experience before they appear.',
  },
  {
    icon: <Compass size={23} strokeWidth={1.8} />,
    title: 'Built around BJJ',
    text: 'Filters and profiles are designed around how Jiu-Jitsu is actually trained — gi, no-gi, position, and focus.',
  },
  {
    icon: <Target size={23} strokeWidth={1.8} />,
    title: 'Train with purpose',
    text: 'Book private or small-group sessions with clear goals, then track what you worked over time.',
  },
  {
    icon: <HeartHandshake size={23} strokeWidth={1.8} />,
    title: 'Fair to coaches',
    text: 'Coaches set their own price and schedule, keep ownership of their students, and grow a real business.',
  },
];

export function AboutPage() {
  return (
    <Container as="section" className={styles.page}>
      <PageHeader
        eyebrow="About RollWise"
        title="The home for serious Jiu-Jitsu coaching"
        subtitle="RollWise is a marketplace built only for private and small-group BJJ training. We connect students with verified coaches and make booking the right session effortless — no DMs, no guesswork."
      />

      <div className={styles.grid}>
        {VALUES.map((value) => (
          <div key={value.title} className={styles.card}>
            <div className={styles.cardIcon}>{value.icon}</div>
            <h3 className={styles.cardTitle}>{value.title}</h3>
            <p className={styles.cardText}>{value.text}</p>
          </div>
        ))}
      </div>

      <div className={styles.band}>
        <div className={styles.bandGlow} aria-hidden="true" />
        <div className={styles.bandInner}>
          <h2 className={styles.bandTitle}>
            Find a coach who matches your goals
          </h2>
          <p className={styles.bandText}>
            Whether you're prepping for competition, sharpening your guard, or
            stepping on the mats for the first time, RollWise helps you train with
            the right coach.
          </p>
          <div className={styles.bandActions}>
            <Button to={ROUTES.findCoaches} size="lg">
              Find a Coach
            </Button>
            <Button to={ROUTES.becomeCoach} size="lg" variant="secondary">
              Become a Coach
            </Button>
          </div>
        </div>
      </div>
    </Container>
  );
}
