import { Button } from '@/components/common/Button';
import { ROUTES } from '@/lib/routes';
import styles from './NotFoundPage.module.css';

export function NotFoundPage() {
  return (
    <section className={styles.page}>
      <div className={styles.code}>
        4<span>0</span>4
      </div>
      <h1 className={styles.title}>This page tapped out</h1>
      <p className={styles.text}>
        The page you're looking for doesn't exist or has moved. Let's get you back
        to the mats.
      </p>
      <div className={styles.actions}>
        <Button to={ROUTES.home}>Back to Home</Button>
        <Button to={ROUTES.findCoaches} variant="secondary">
          Find a Coach
        </Button>
      </div>
    </section>
  );
}
