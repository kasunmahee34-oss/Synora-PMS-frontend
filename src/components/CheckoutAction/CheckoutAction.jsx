import { useState } from 'react';
import { checkInReservation, updateReservationStatus } from '../../api/reservations';
import api from '../../api';
import { AlertCircle, CheckCircle, RefreshCw, LogIn, Clock } from 'lucide-react';
import { normalizeReservationStatus } from '../../utils/reservationStatus';

export default function CheckoutAction({ reservation, balance, onCheckedIn, onCheckedOut }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showEarlyCheckoutConfirm, setShowEarlyCheckoutConfirm] = useState(false);
  const [earlyCheckoutReason, setEarlyCheckoutReason] = useState('');

  const normalizedStatus = normalizeReservationStatus(reservation?.status);
  const settled = Number(balance || 0) <= 0.009;

  async function handleAction(targetStatus, actionLabel) {
    setError('');

    if (targetStatus === 'checked_out' && !settled) {
      setError(`Outstanding balance of LKR ${Number(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} must be settled before checkout. No role can bypass payment settlement.`);
      return;
    }

    if (targetStatus === 'completed' && !settled) {
      setError('Outstanding balance must be settled before completion. No role can bypass payment settlement.');
      return;
    }

    setSubmitting(true);
    try {
      const updated = targetStatus === 'in_house'
        ? await checkInReservation(reservation.id)
        : await updateReservationStatus(reservation.id, targetStatus);
      if (targetStatus === 'checked_in' || targetStatus === 'in_house') {
        onCheckedIn?.(updated);
      } else {
        onCheckedOut?.(updated);
      }
    } catch (err) {
      setError(err?.response?.data?.error || `${actionLabel} failed.`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEarlyCheckout() {
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post(`/reservations/${reservation.id}/early-checkout`, {
        reason: earlyCheckoutReason || null,
      });
      onCheckedOut?.(res.data);
      setShowEarlyCheckoutConfirm(false);
      setEarlyCheckoutReason('');
    } catch (err) {
      setError(err?.response?.data?.error || 'Early checkout failed.');
    } finally {
      setSubmitting(false);
    }
  }

  // Show for active and checkout-flow statuses
  if (!['tentative', 'guaranteed', 'room_assigned', 'checked_in', 'in_house', 'due_checkout', 'early_checkout', 'checked_out'].includes(normalizedStatus)) {
    return null;
  }

  const showBalanceWarning = !settled && ['checked_in', 'in_house', 'due_checkout', 'early_checkout'].includes(normalizedStatus);

  return (
    <div className="space-y-3">
      {showBalanceWarning && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-xs text-amber-400 flex items-start gap-2.5 leading-relaxed">
          <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <p>
            Outstanding balance: <span className="font-bold text-amber-300">LKR {Number(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>. Payment must be completed before checkout can be finalized.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-xs text-rose-450 flex items-start gap-2.5">
          <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Check-In button: tentative, guaranteed, room_assigned */}
      {['tentative', 'guaranteed', 'room_assigned'].includes(normalizedStatus) && (
        <button
          onClick={() => handleAction('in_house', 'Check-In')}
          disabled={submitting}
          className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-amber-500/10"
        >
          {submitting ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              Processing Check-In...
            </>
          ) : (
            <>
              <LogIn size={14} />
              Check In Guest
            </>
          )}
        </button>
      )}

      {/* Checkout button: in_house, due_checkout, early_checkout, checked_in */}
      {['in_house', 'due_checkout', 'early_checkout', 'checked_in'].includes(normalizedStatus) && (
        <button
          onClick={() => handleAction('checked_out', 'Checkout')}
          disabled={submitting || !settled}
          className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-amber-500/10"
        >
          {submitting ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              Processing Checkout...
            </>
          ) : (
            <>
              <CheckCircle size={14} />
              {!settled ? 'Settle Balance to Checkout' : 'Checkout Guest'}
            </>
          )}
        </button>
      )}

      {/* Early Checkout button: only when in_house */}
      {normalizedStatus === 'in_house' && (
        <>
          {!showEarlyCheckoutConfirm ? (
            <button
              onClick={() => setShowEarlyCheckoutConfirm(true)}
              disabled={submitting}
              className="w-full py-2.5 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 text-pink-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <Clock size={14} />
              Early Checkout
            </button>
          ) : (
            <div className="p-4 bg-slate-900 border border-pink-500/20 rounded-xl space-y-3">
              <p className="text-xs text-pink-300 font-semibold">
                Early Checkout — Guest is leaving before the expected checkout date ({new Date(reservation.checkOut).toLocaleDateString()}).
              </p>
              <input
                type="text"
                value={earlyCheckoutReason}
                onChange={(e) => setEarlyCheckoutReason(e.target.value)}
                placeholder="Reason (optional)"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-pink-500 rounded-lg text-slate-200 text-xs outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowEarlyCheckoutConfirm(false); setEarlyCheckoutReason(''); }}
                  className="flex-1 py-2 bg-slate-800 text-slate-400 rounded-lg text-xs hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEarlyCheckout}
                  disabled={submitting}
                  className="flex-1 py-2 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-lg text-xs"
                >
                  {submitting ? 'Processing...' : 'Confirm Early Checkout'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Complete button: only when checked_out and balance settled */}
      {normalizedStatus === 'checked_out' && (
        <button
          onClick={() => handleAction('completed', 'Complete')}
          disabled={submitting || !settled}
          className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-500/10"
        >
          {submitting ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              Completing...
            </>
          ) : (
            <>
              <CheckCircle size={14} />
              {!settled ? 'Settle Balance to Complete' : 'Mark Completed'}
            </>
          )}
        </button>
      )}
    </div>
  );
}
