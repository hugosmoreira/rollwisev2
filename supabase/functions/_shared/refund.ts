// Shared Stripe refund helper for RollWise Edge Functions (web + mobile).
//
// Co-maintained: the mobile app added the no-associated-transfer fallback so a
// refund never hard-crashes on legacy/seed charges. Keep this behavior if you
// reconcile the cancel-* functions.

import Stripe from 'npm:stripe@^16.12.0';

/**
 * Refund a charge identified by its PaymentIntent.
 *
 * Prefers a destination-charge refund (reverse_transfer + refund_application_fee).
 * If the charge has no associated transfer — e.g. legacy/seed charges or a
 * non-destination charge — it falls back to a plain refund. An already-refunded
 * charge is treated as success (idempotent). Resolves when the money has moved
 * (or had already moved); throws on a genuine failure.
 */
export async function refundChargeByPaymentIntent(
  stripe: Stripe,
  paymentIntent: string,
): Promise<void> {
  const alreadyRefunded = (e: unknown) =>
    (e as { code?: string }).code === 'charge_already_refunded';

  try {
    await stripe.refunds.create({
      payment_intent: paymentIntent,
      reverse_transfer: true,
      refund_application_fee: true,
    });
  } catch (e) {
    if (alreadyRefunded(e)) return;
    const msg = (e as { message?: string }).message?.toLowerCase() ?? '';
    const noTransfer =
      msg.includes('associated transfer') || msg.includes('reverse a transfer');
    if (!noTransfer) throw e;
    // Legacy/seed or non-destination charge: refund without reversing a transfer.
    try {
      await stripe.refunds.create({ payment_intent: paymentIntent });
    } catch (e2) {
      if (alreadyRefunded(e2)) return;
      throw e2;
    }
  }
}
