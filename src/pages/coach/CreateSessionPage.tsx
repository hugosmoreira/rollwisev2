import { SessionForm } from './SessionForm';
import shared from './Coach.module.css';

export function CreateSessionPage() {
  return (
    <div>
      <p className={shared.intro}>
        Publish a private or small-group session. Students will be able to find and
        book it once it's live.
      </p>
      <SessionForm submitLabel="Publish session" />
    </div>
  );
}
