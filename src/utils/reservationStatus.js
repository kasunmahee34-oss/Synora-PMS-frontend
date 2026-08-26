export function normalizeReservationStatus(status) {
  if (!status) return status;

  const value = String(status).trim();
  const legacyMapping = {
    confirmed: 'guaranteed',
    do_check_in: 'checked_in',
    checked_in: 'checked_in',
    due_checkout: 'due_checkout',
    early_checkout: 'early_checkout',
    checked_out: 'checked_out',
    completed: 'completed',
    room_assigned: 'room_assigned',
    closed: 'closed',
    cancelled: 'cancelled',
    no_show: 'no_show',
    tentative: 'tentative',
    guaranteed: 'guaranteed',
    in_house: 'in_house',
  };

  return legacyMapping[value] || value;
}

export function formatReservationStatus(status) {
  const normalized = normalizeReservationStatus(status);
  const labels = {
    tentative: 'Tentative',
    guaranteed: 'Guaranteed',
    room_assigned: 'Room Assigned',
    checked_in: 'Checked In',
    in_house: 'In House',
    due_checkout: 'Due to Checkout',
    early_checkout: 'Early Checkout',
    checked_out: 'Checked Out',
    completed: 'Completed',
    closed: 'Closed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
  };

  if (labels[normalized]) return labels[normalized];
  if (typeof normalized === 'string') {
    return normalized.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
  }
  return 'Unknown';
}

export function getReservationStatusClasses(status) {
  const normalized = normalizeReservationStatus(status);
  switch (normalized) {
    case 'tentative':
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    case 'guaranteed':
      return 'bg-violet-500/10 text-violet-400 border border-violet-500/20';
    case 'room_assigned':
      return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    case 'checked_in':
      return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
    case 'in_house':
      return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
    case 'due_checkout':
      return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
    case 'early_checkout':
      return 'bg-pink-500/10 text-pink-400 border border-pink-500/20';
    case 'checked_out':
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    case 'completed':
      return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30';
    case 'closed':
      return 'bg-slate-500/10 text-slate-300 border border-slate-500/20';
    case 'cancelled':
      return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    case 'no_show':
      return 'bg-rose-500/10 text-rose-450 border border-rose-500/20';
    default:
      return 'bg-slate-800 text-slate-400 border border-slate-700';
  }
}
