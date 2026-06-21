import { Container } from '@/components/layout/Container';
import styles from './Legal.module.css';

export interface LegalSection {
  heading: string;
  body: string[];
}

interface LegalPageProps {
  title: string;
  updated: string;
  intro?: string;
  sections: LegalSection[];
}

/** Shared layout for the Terms of Service and Privacy Policy pages. */
export function LegalPage({ title, updated, intro, sections }: LegalPageProps) {
  return (
    <Container size="narrow" className={styles.wrap}>
      <header className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.updated}>Last updated {updated}</p>
      </header>

      <p className={styles.disclaimer}>
        This document is a general template provided for convenience and is not
        legal advice. Have it reviewed by a qualified attorney before relying on it.
      </p>

      {intro && <p className={styles.intro}>{intro}</p>}

      {sections.map((section, i) => (
        <section key={section.heading} className={styles.section}>
          <h2 className={styles.heading}>
            {i + 1}. {section.heading}
          </h2>
          {section.body.map((paragraph, j) => (
            <p key={j} className={styles.para}>
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </Container>
  );
}
