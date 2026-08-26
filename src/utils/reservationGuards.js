import { normalizeReservationStatus } from './reservationStatus';

export const LOCKED_STATUSES = ['checked_out', 'completed', 'closed', 'cancelled', 'no_show'];

export function isReservationLocked(reservation) {
  const normalized = normalizeReservationStatus(reservation?.status);
  return LOCKED_STATUSES.includes(normalized);
}
