/** YYYY-MM-DD in the viewer's local timezone — safe to feed into an
 * <input type="date">. Naively slicing an ISO string's first 10 chars reads
 * the UTC date, which can be off by a day from what the user sees elsewhere
 * (headers, labels) that correctly render in local time. */
export function toLocalISODate(d: Date): string {
  const offsetMs = d.getTimezoneOffset() * 60 * 1000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 10);
}
