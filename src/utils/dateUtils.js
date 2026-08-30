/**
 * UTC-safe date formatting utilities.
 *
 * Dates coming from the API (checkIn, checkOut, auditDate, etc.) are stored as
 * UTC-midnight timestamps (e.g. "2026-08-29T00:00:00.000Z"). They represent
 * calendar dates, not instants.  Using new Date(str).toLocaleDateString() in a
 * UTC- timezone shifts them back one day (at 10 PM UTC-7, UTC is already the
 * next day, so the displayed date is one day behind the intended calendar date).
 *
 * These helpers always read the UTC date components so the displayed date always
 * matches the calendar date that was stored, regardless of the browser's timezone.
 */

/**
 * Returns the YYYY-MM-DD date portion of a UTC-midnight ISO string without any
 * timezone conversion.  Safe to use for date-only fields from the API.
 *
 * @param {string|Date|null|undefined} value - ISO date string or Date object
 * @returns {string} "YYYY-MM-DD" or '' if invalid / null
 */
export function utcDatePart(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return d.toISOString().slice(0, 10); // always UTC
}

/**
 * Formats a UTC-midnight date string for display as M/D/YYYY (matching the
 * en-US toLocaleDateString format the app uses elsewhere), but reading the UTC
 * date components so no timezone shift occurs.
 *
 * @param {string|Date|null|undefined} value - ISO date string or Date object
 * @param {string} [locale='en-US'] - BCP 47 locale tag
 * @returns {string} Formatted date string, or '—' for null / invalid input
 */
export function formatUtcDate(value, locale = 'en-US') {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  // Use timeZone:'UTC' so the displayed date matches the stored calendar date
  // regardless of where the browser is running.
  return d.toLocaleDateString(locale, { timeZone: 'UTC' });
}

/**
 * Same as formatUtcDate but returns en-GB format (D/M/YYYY) to match the
 * en-GB toLocaleDateString calls used in payment/refund tables.
 */
export function formatUtcDateGB(value) {
  return formatUtcDate(value, 'en-GB');
}
