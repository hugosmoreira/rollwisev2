/**
 * Thrown by every service method that isn't wired to the backend yet.
 * The message is always "Not implemented yet" (per project rules); the
 * `method` field carries the operation name for easier debugging.
 */
export class NotImplementedError extends Error {
  readonly method: string;

  constructor(method: string) {
    super('Not implemented yet');
    this.name = 'NotImplementedError';
    this.method = method;
  }
}

/**
 * Throws a NotImplementedError. Returns `never`, so it can stand in for any
 * return type while a service is still a stub:
 *
 *   async getProfile(id: string): Promise<Profile> {
 *     return notImplemented('profileService.getProfile');
 *   }
 */
export function notImplemented(method: string): never {
  throw new NotImplementedError(method);
}

/**
 * Pull a useful message out of a Supabase Edge Function error. A
 * `FunctionsHttpError` carries the function's JSON `{ error }` body on its
 * `context` (a `Response`); fall back to the raw error message otherwise.
 */
export async function functionError(error: unknown): Promise<string> {
  const ctx = (error as { context?: Response })?.context;
  if (ctx && typeof ctx.json === 'function') {
    try {
      const body = await ctx.json();
      if (body?.error) return String(body.error);
    } catch {
      /* fall through */
    }
  }
  return error instanceof Error ? error.message : 'Request failed.';
}
