/**
 * Tiny className joiner. Filters falsy values so conditional classes
 * read cleanly: cn(styles.base, active && styles.active).
 */
export function cn(
  ...classes: Array<string | number | false | null | undefined>
): string {
  return classes.filter((c): c is string => typeof c === 'string' && c.length > 0).join(' ');
}
