import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Wallet, TrendingUp, Clock, CreditCard, Receipt } from 'lucide-react';
import { StatCard } from '@/components/domain/StatCard';
import { SectionHeading } from '@/components/common/SectionHeading';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Banner } from '@/components/common/Banner';
import { LoadingState } from '@/components/common/LoadingState';
import { Card } from '@/components/common/Card';
import { useAuth } from '@/lib/auth';
import { useAsync } from '@/hooks/useAsync';
import { paymentService } from '@/services/paymentService';
import { formatCurrency, formatDate } from '@/lib/format';
import shared from './Coach.module.css';
import styles from './Earnings.module.css';

export function EarningsPage() {
  const { profile } = useAuth();
  const coachId = profile?.id;
  const [params] = useSearchParams();
  const justConnected = params.get('stripe') === 'connected';
  const [notice, setNotice] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const { data: earnings, loading } = useAsync(
    () =>
      coachId
        ? paymentService.getCoachEarnings(coachId)
        : Promise.resolve(null),
    [coachId],
  );
  const { data: connect, reload: reloadConnect } = useAsync(
    () =>
      coachId
        ? paymentService.getStripeConnectStatus(coachId)
        : Promise.resolve({ connected: false, ready: false }),
    [coachId],
  );
  const { data: payments } = useAsync(
    () =>
      coachId ? paymentService.listPayments({ coachId }) : Promise.resolve([]),
    [coachId],
  );

  const connected = connect?.connected ?? false;
  const ready = connect?.ready ?? false;
  const txns = payments ?? [];

  // Returning from onboarding, the "charges enabled" flag is set by the
  // account.updated webhook a moment later — re-check a couple of times.
  useEffect(() => {
    if (!justConnected) return;
    const timers = [2000, 5000].map((ms) =>
      window.setTimeout(() => reloadConnect(), ms),
    );
    return () => timers.forEach((t) => clearTimeout(t));
  }, [justConnected, reloadConnect]);

  const statusLabel = ready
    ? 'Ready for payouts'
    : connected
      ? 'Finishing setup'
      : 'Not connected';
  const statusVariant = ready ? 'success' : connected ? 'warning' : 'muted';
  const statusText = ready
    ? 'Your Stripe account is set up. Payouts from booked sessions go to your bank, minus the platform fee.'
    : connected
      ? "You've started Stripe onboarding but haven't finished it. Complete it to start receiving payouts."
      : 'Connect a Stripe account to receive payouts from your booked sessions.';
  const buttonLabel = ready
    ? 'Manage payouts'
    : connected
      ? 'Finish setup'
      : 'Connect Stripe';

  const onConnect = async () => {
    setNotice(null);
    setConnecting(true);
    try {
      const { url } = await paymentService.createStripeConnectLink();
      window.location.href = url;
    } catch (e) {
      setNotice(
        e instanceof Error
          ? e.message
          : 'Could not start Stripe onboarding. Make sure the Edge Functions are deployed.',
      );
      setConnecting(false);
    }
  };

  return (
    <div className={shared.sections}>
      <div>
        <p className={shared.intro}>
          Track your revenue, paid sessions, and payouts. Connect Stripe to start
          receiving payments.
        </p>

        {justConnected && (
          <Banner variant="success" className={shared.banner}>
            Stripe account connected — you can now receive payouts.
          </Banner>
        )}
        {notice && (
          <Banner variant="error" className={shared.banner}>
            {notice}
          </Banner>
        )}

        <div className={shared.statGrid}>
          <StatCard label="Total earned" value={earnings ? formatCurrency(earnings.totalEarned) : '—'} hint="Lifetime" icon={<Wallet size={20} strokeWidth={1.9} />} />
          <StatCard label="This month" value={earnings ? formatCurrency(earnings.thisMonth) : '—'} hint="Paid sessions" icon={<TrendingUp size={20} strokeWidth={1.9} />} />
          <StatCard label="Pending payout" value={earnings ? formatCurrency(earnings.pendingPayout) : '—'} hint="Awaiting transfer" icon={<Clock size={20} strokeWidth={1.9} />} />
          <StatCard label="Paid sessions" value={earnings ? String(earnings.paidSessions) : '—'} hint="Completed & paid" icon={<CreditCard size={20} strokeWidth={1.9} />} />
        </div>
      </div>

      {/* Stripe Connect */}
      <section className={shared.panel}>
        <div className={styles.connect}>
          <span className={styles.connectIcon}>
            <CreditCard size={26} strokeWidth={1.8} />
          </span>
          <div className={styles.connectBody}>
            <div className={styles.connectTitleRow}>
              <span className={styles.connectTitle}>Payouts via Stripe</span>
              <Badge variant={statusVariant}>{statusLabel}</Badge>
            </div>
            <p className={styles.connectText}>{statusText}</p>
          </div>
          <div className={styles.connectAction}>
            <Button type="button" onClick={onConnect} loading={connecting}>
              {buttonLabel}
            </Button>
          </div>
        </div>
      </section>

      <section>
        <SectionHeading
          title="Transactions"
          description="Payments from your booked sessions."
        />
        {loading ? (
          <LoadingState label="Loading…" />
        ) : txns.length === 0 ? (
          <EmptyState
            icon={<Receipt size={26} strokeWidth={1.7} />}
            title="No transactions yet"
            description="Once students pay for your sessions, every payment will be listed here."
          />
        ) : (
          <div className={styles.txnList}>
            {txns.map((p) => (
              <Card key={p.id} padding="sm" className={styles.txnRow}>
                <span className={styles.txnAmount}>{formatCurrency(p.amount)}</span>
                <span className={styles.txnDate}>{formatDate(p.createdAt)}</span>
                <Badge variant={p.status === 'paid' ? 'success' : 'muted'}>
                  {p.status}
                </Badge>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
