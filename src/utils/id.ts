/**
 * Generates a collision-safe unique ID string with an optional prefix.
 * Uses crypto.randomUUID() which is available in all modern browsers and Node 14.17+.
 *
 * @param prefix - Short prefix for readability (e.g. 'b', 't', 'c', 'r', 'h')
 */
export function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}
