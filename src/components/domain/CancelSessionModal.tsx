import { useEffect, useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Banner } from '@/components/common/Banner';
import { sessionService } from '@/services/sessionService';

interface CancelSessionModalProps {
  /** The session being cancelled (id + title for the prompt). */
  session: { id: string; title: string } | null;
  open: boolean;
  onClose: () => void;
  /** Called after a successful cancellation (e.g. to reload a list or navigate). */
  onCancelled: () => void;
}

/**
 * Confirmation dialog for cancelling a published session. Owns the call to
 * `sessionService.cancelSession`, which routes through the `cancel-session` Edge
 * Function: every paid booking is refunded via Stripe and each student's seat is
 * released. Shared by the coach's session list and the edit page so the wording
 * and behaviour stay identical.
 */
export function CancelSessionModal({
  session,
  open,
  onClose,
  onCancelled,
}: CancelSessionModalProps) {
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear any stale error whenever the dialog is reopened.
  useEffect(() => {
    if (open) setError(null);
  }, [open]);

  const onConfirm = async () => {
    if (!session) return;
    setError(null);
    setCancelling(true);
    try {
      await sessionService.cancelSession(session.id);
      onCancelled();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not cancel the session.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Modal
      open={open && Boolean(session)}
      onClose={() => {
        if (!cancelling) onClose();
      }}
      title="Cancel this session?"
      subtitle="This can't be undone."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={cancelling}>
            Keep session
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={cancelling}>
            Cancel &amp; refund
          </Button>
        </>
      }
    >
      {error && (
        <div style={{ marginBottom: 'var(--rw-space-4)' }}>
          <Banner variant="error">{error}</Banner>
        </div>
      )}
      <p>
        Cancelling{session ? ' ' : ''}
        {session && <strong>“{session.title}”</strong>} removes it from the
        schedule and <strong>refunds every student who paid</strong> through
        Stripe. Each student is notified and their seat is released.
      </p>
    </Modal>
  );
}
