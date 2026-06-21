import { MessagesSquare } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/common/Button';
import { ROUTES } from '@/lib/routes';
import shared from './Student.module.css';

export function MessagesPage() {
  return (
    <div>
      <p className={shared.intro}>
        Message your coaches about sessions, scheduling, and training questions.
      </p>

      <EmptyState
        icon={<MessagesSquare size={26} strokeWidth={1.7} />}
        title="Messaging is coming soon"
        description="Direct messaging with your coaches isn't available yet. For now, your booking confirmation email includes your coach's details."
        action={
          <Button to={ROUTES.student.findClasses} variant="secondary">
            Find Classes
          </Button>
        }
      />
    </div>
  );
}
