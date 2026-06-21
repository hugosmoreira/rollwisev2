/** Small client-side form validators shared by the auth screens. */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function isFilled(value: string): boolean {
  return value.trim().length > 0;
}

export function minLength(value: string, n: number): boolean {
  return value.length >= n;
}
