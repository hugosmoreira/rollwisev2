import { useCallback, useState } from 'react';

/** Map common Supabase auth errors to friendlier copy. */
function humanizeAuthError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials')) {
    return 'That email or password is incorrect.';
  }
  if (lower.includes('already registered') || lower.includes('already been registered')) {
    return 'An account with this email already exists. Try logging in.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Please confirm your email address, then log in.';
  }
  if (lower.includes('not configured')) {
    return 'The app isn’t connected to Supabase yet. Check your environment configuration.';
  }
  return message || 'Something went wrong. Please try again.';
}

/**
 * Runs an async auth action with a pending flag and surfaces a friendly
 * error message on failure. The action handles its own success (e.g.
 * navigation).
 */
export function useAuthAction() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (action: () => Promise<unknown>) => {
    setError(null);
    setPending(true);
    try {
      await action();
    } catch (err) {
      setError(humanizeAuthError(err));
    } finally {
      setPending(false);
    }
  }, []);

  return { pending, error, setError, run };
}
