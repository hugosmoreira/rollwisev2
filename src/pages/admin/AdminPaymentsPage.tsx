import { DollarSign, Percent, Wallet, RotateCcw, CreditCard, Receipt } from 'lucide-react';
import { StatCard } from '@/components/domain/StatCard';
import { SectionHeading } from '@/components/common/SectionHeading';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Banner } from '@/components/common/Banner';
import { LoadingState } from '@/components/common/LoadingState';
import { Card } from '@/components/common/Card';
import { useAsync } from '@/hooks/useAsync';
import { paymentService } from '@/services/paymentService';
import { formatCurrency, formatDate } from '@/lib/format';
import shared from './Admin.module.css';
import styles from './AdminPayments.module.css';
import txnStyles from '@/pages/coach/Earnings.module.css';

export function AdminPaymentsPage() {
  const { data: totals, error } = useAsync(
    () => paymentService.getPlatformPayments(),
    [],
  );
  const { data: payments, loading } = useAsync(
    () => paymentService.listPayments(),
    [],
  );
  const txns = payments ?? [];

  return (
    <div className={shared.sections}>
      <div>
        <p className={shared.intro}>
          Platform payments overview — gross volume, fees, coach payouts, and
          refunds. Managed through Stripe.
        </p>

        {error && (
          <Banner variant="error" className={shared.banner}>
            {error}
          </Banner>
        )}

        <div className={shared.statGrid}>
          <StatCard label="Gross volume" value={totals ? formatCurrency(totals.grossVolume) : '—'} hint="All payments" icon={<DollarSign size={20} strokeWidth={1.9} />} />
          <StatCard label="Platform fees" value={totals ? formatCurrency(totals.platformFees) : '—'} hint="RollWise revenue" icon={<Percent size={20} strokeWidth={1.9} />} />
          <StatCard label="Coach payouts" value={totals ? formatCurrency(totals.coachPayouts) : '—'} hint="Paid to coaches" icon={<Wallet size={20} strokeWidth={1.9} />} />
          <StatCard label="Refunds" value={totals ? formatCurrency(totals.refunds) : '—'} hint="Returned to students" icon={<RotateCcw size={20} strokeWidth={1.9} />} />
        </div>
      </div>

      {/* Stripe dashboard */}
      <section className={shared.panel}>
        <div className={styles.connect}>
          <span className={styles.connectIcon}>
            <CreditCard size={26} strokeWidth={1.8} />
          </span>
          <div className={styles.connectBody}>
            <div className={styles.connectTitleRow}>
              <span className={styles.connectTitle}>Platform payments via Stripe</span>
              <Badge variant="success">Stripe</Badge>
            </div>
            <p className={styles.connectText}>
              Payments, fees, and coach payouts are processed by Stripe. Manage
              disputes, refunds, and payouts in the Stripe dashboard.
            </p>
          </div>
          <div className={styles.connectAction}>
            <Button
              href="https://dashboard.stripe.com/test/payments"
              target="_blank"
              rel="noreferrer"
            >
              Open Stripe
            </Button>
          </div>
        </div>
      </section>

      <section>
        <SectionHeading
          title="Transactions"
          description="A live feed of payments across the platform."
        />
        {loading ? (
          <LoadingState label="Loading…" />
        ) : txns.length === 0 ? (
          <EmptyState
            icon={<Receipt size={26} strokeWidth={1.7} />}
            title="No transactions yet"
            description="Once payments are made, every transaction will be listed here."
          />
        ) : (
          <div className={txnStyles.txnList}>
            {txns.map((p) => (
              <Card key={p.id} padding="sm" className={txnStyles.txnRow}>
                <span className={txnStyles.txnAmount}>{formatCurrency(p.amount)}</span>
                <span className={txnStyles.txnDate}>{formatDate(p.createdAt)}</span>
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
