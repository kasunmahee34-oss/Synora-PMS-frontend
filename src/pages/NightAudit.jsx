import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchNightAuditStatus, runNightAudit, fetchNightAuditHistory } from '../api/nightAudit';
import { 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  Play, 
  Clock, 
  User, 
  UserCheck, 
  ArrowRight,
  RefreshCw,
  LogOut,
  Moon
} from 'lucide-react';

export default function NightAudit() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Status info
  const [businessDate, setBusinessDate] = useState('');
  const [serverTime, setServerTime] = useState(null); // Date object kept in sync locally
  const [lastAudit, setLastAudit] = useState(null);
  const [todayAlreadyCompleted, setTodayAlreadyCompleted] = useState(false);
  const [pendingArrivals, setPendingArrivals] = useState([]);
  const [pendingDepartures, setPendingDepartures] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  const loadStatus = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchNightAuditStatus();
      setBusinessDate(data.businessDate);
      setLastAudit(data.lastAudit);
      setTodayAlreadyCompleted(!!data.todayAlreadyCompleted);
      setPendingArrivals(data.pendingArrivals);
      setPendingDepartures(data.pendingDepartures);
      
      const historyData = await fetchNightAuditHistory();
      setHistory(historyData);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || 'Failed to load Night Audit status details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  // Tick the local browser clock every second for the live clock display.
  // businessDate is now a date-only string (YYYY-MM-DD) from the server, so we
  // cannot use it as a timestamp seed — we use the browser's own clock instead.
  useEffect(() => {
    setServerTime(new Date());
    const id = setInterval(() => setServerTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const handleRunAudit = async () => {
    const hasWarnings = pendingArrivals.length > 0 || pendingDepartures.length > 0;
    
    let confirmMsg = 'Are you sure you want to run the Night Audit? This will close the current business day, lock all historical postings, auto-post nightly room charges, and force-logout all other users.';
    if (hasWarnings) {
      confirmMsg = `WARNING: There are pending check-ins or check-outs for today. Running the Night Audit will force-stay checked-in rooms (posting nightly charges) and close the day anyway.\n\n${confirmMsg}`;
    }
    
    if (!window.confirm(confirmMsg)) return;

    setSubmitting(true);
    setError('');
    try {
      const res = await runNightAudit();
      alert(`${res.message}\n\nYou will now be signed out to refresh your session.`);
      logout();
      navigate('/login');
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || 'Night Audit execution failed.');
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatBusinessDateTime = (value) => {
    if (!value) return 'Loading...';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'medium'
    });
  };

  const formatDateOnly = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    // Force UTC so a UTC-midnight date (e.g. auditDate stored as 2026-09-01T00:00:00Z)
    // never renders as the previous day in UTC- browser timezones.
    return date.toLocaleDateString(undefined, { timeZone: 'UTC' });
  };

  const formatTimeOnly = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent flex items-center gap-3">
            <Moon className="text-amber-500 animate-pulse" size={28} />
            Night Audit & Day Close
          </h1>
          <p className="text-slate-400 text-sm mt-1">Reconcile daily operations, post nightly room charges, and lock business date accounts.</p>
        </div>
        <button
          onClick={loadStatus}
          disabled={loading || submitting}
          className="px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 self-start md:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Status
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm font-semibold text-rose-450 flex items-center gap-2.5">
          <AlertTriangle size={18} className="text-rose-400" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Business Date & Last Audit info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Active Business Date Card */}
            <div className="glass-card p-6 rounded-2xl border-l-4 border-amber-500 space-y-4">
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">Current Date & Time</span>
              <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-3">
                <Calendar className="text-amber-400" size={20} />
                <div>
                  <span className="text-lg font-semibold">{formatBusinessDateTime(serverTime)}</span>
                  <div className="text-xs text-slate-400">Active Business Date: <span className="font-mono text-amber-500">{formatDateOnly(businessDate)}</span></div>
                </div>
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed pt-1.5 border-t border-slate-800/60">
                Active business date is derived from the last completed Night Audit.
                Room charges and postings will be applied to this date.
              </p>
            </div>

            {/* Last Run Info Card */}
            <div className="glass-card p-6 rounded-2xl space-y-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Last Completed Run</span>
              {lastAudit ? (
                <div className="space-y-3.5 text-xs text-slate-350">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Audited Date:</span>
                    <span className="font-semibold text-slate-200">{formatDateOnly(lastAudit.auditDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Completed By:</span>
                    <span className="font-semibold text-slate-200 flex items-center gap-1">
                      <User size={12} className="text-slate-500" />
                      {lastAudit.user?.fullName || lastAudit.user?.username || 'System'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Completed At:</span>
                    <span className="font-semibold text-slate-200 flex items-center gap-1">
                      <Clock size={12} className="text-slate-500" />
                      {new Date(lastAudit.completedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-2.5 border-t border-slate-850 flex items-center gap-2 text-emerald-400 font-semibold">
                    <CheckCircle size={14} />
                    Audit Complete & Locked
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-2">No historical Night Audit runs found in this database.</p>
              )}
            </div>

            {/* Run Actions Card */}
            <div className="glass-card p-6 rounded-2xl space-y-5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Execute Day Close</span>

              {todayAlreadyCompleted ? (
                /* Today's audit is already done — show a clear status instead of the run button */
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-emerald-400">Today's Night Audit is Complete</p>
                      <p className="text-[10px] text-emerald-600 mt-0.5">
                        Business date <span className="font-mono">{formatDateOnly(businessDate)}</span> has already been closed. Come back tomorrow.
                      </p>
                    </div>
                  </div>
                  <button
                    disabled
                    className="w-full py-3 bg-slate-800 opacity-50 text-slate-500 font-bold rounded-xl text-xs flex items-center justify-center gap-2.5 cursor-not-allowed"
                  >
                    <CheckCircle size={14} />
                    Audit Already Completed
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Ready to close out the day? This operation is irreversible and will execute the following steps:
                  </p>
                  <ul className="space-y-2 text-xs text-slate-350 list-disc list-inside">
                    <li>Post room charges for currently stayed rooms.</li>
                    <li>Lock active business date <span className="font-mono text-amber-500">{formatDateOnly(businessDate)}</span>.</li>
                    <li>Log out all active cashier/front-office user tokens.</li>
                  </ul>

                  <button
                    onClick={handleRunAudit}
                    disabled={submitting}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2.5 transition shadow-lg shadow-amber-500/10"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="animate-spin" size={14} />
                        Processing Audit...
                      </>
                    ) : (
                      <>
                        <Play size={14} fill="currentColor" />
                        Close Day &amp; Run Audit
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Pre-Audit Checklist Warnings (2 cols span) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Arrivals Check */}
            <div className="glass-card p-6 rounded-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-200">1. Arrivals Check (Pending Check-Ins)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Reservations expecting arrival on or before the current business date.</p>
                </div>
                {pendingArrivals.length === 0 ? (
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase rounded-lg flex items-center gap-1">
                    <CheckCircle size={10} /> Clear
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-rose-500/10 text-rose-450 border border-rose-500/20 text-[10px] font-bold uppercase rounded-lg flex items-center gap-1">
                    <AlertTriangle size={10} /> {pendingArrivals.length} Pending
                  </span>
                )}
              </div>

              <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
                {pendingArrivals.length > 0 ? (
                  pendingArrivals.map((arr) => (
                    <div 
                      key={arr.id}
                      onClick={() => navigate('/reservations')}
                      className="p-3 bg-slate-900/40 border border-slate-850 hover:border-slate-800 rounded-xl flex justify-between items-center cursor-pointer transition text-xs group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-amber-500">{arr.confoNo}</span>
                          <span className="text-slate-600">|</span>
                          <span className="font-semibold text-slate-300">Room {arr.room.roomNumber}</span>
                        </div>
                        <p className="font-bold text-slate-200">{arr.guest.fullName}</p>
                        <p className="text-[10px] text-slate-500">
                          Scheduled Stay: {new Date(arr.checkIn).toLocaleDateString()} to {new Date(arr.checkOut).toLocaleDateString()}
                        </p>
                      </div>
                      <ArrowRight size={14} className="text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-slate-500">
                    All scheduled arrivals for this date are checked in or resolved.
                  </div>
                )}
              </div>
            </div>

            {/* Departures Check */}
            <div className="glass-card p-6 rounded-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-200">2. Departures Check (Pending Check-Outs)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Checked-in guests scheduled to depart on or before the current business date.</p>
                </div>
                {pendingDepartures.length === 0 ? (
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase rounded-lg flex items-center gap-1">
                    <CheckCircle size={10} /> Clear
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-rose-500/10 text-rose-450 border border-rose-500/20 text-[10px] font-bold uppercase rounded-lg flex items-center gap-1">
                    <AlertTriangle size={10} /> {pendingDepartures.length} Pending
                  </span>
                )}
              </div>

              <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
                {pendingDepartures.length > 0 ? (
                  pendingDepartures.map((dep) => (
                    <div 
                      key={dep.id}
                      onClick={() => navigate('/reservations')}
                      className="p-3 bg-slate-900/40 border border-slate-850 hover:border-slate-800 rounded-xl flex justify-between items-center cursor-pointer transition text-xs group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-amber-500">{dep.confoNo}</span>
                          <span className="text-slate-600">|</span>
                          <span className="font-semibold text-slate-300">Room {dep.room.roomNumber}</span>
                        </div>
                        <p className="font-bold text-slate-200">{dep.guest.fullName}</p>
                        <p className="text-[10px] text-slate-500">
                          Departure Date: {new Date(dep.checkOut).toLocaleDateString()}
                        </p>
                      </div>
                      <ArrowRight size={14} className="text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-slate-500">
                    All departing guests for this date have successfully checked out.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historical Audit Logs */}
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-200">Historical Audit Summaries</h3>
            <p className="text-xs text-slate-500 mt-0.5">Logs and reservation status changes recorded during previous Day Close operations.</p>
          </div>
        </div>

        {history.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No night audit logs found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="pb-3">Business Date</th>
                  <th className="pb-3">Completed At</th>
                  <th className="pb-3">Completed By</th>
                  <th className="pb-3 text-center">Tentative Reviewed</th>
                  <th className="pb-3 text-center">Auto-Cancelled</th>
                  <th className="pb-3 text-center">Guaranteed Reviewed</th>
                  <th className="pb-3 text-center">Auto-No-Show</th>
                  <th className="pb-3 text-center">Errors</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {history.map((audit) => (
                  <tr key={audit.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="py-3 font-semibold text-slate-200">{formatDateOnly(audit.auditDate)}</td>
                    <td className="py-3 text-slate-400">{new Date(audit.completedAt).toLocaleString()}</td>
                    <td className="py-3 text-slate-400">{audit.user?.fullName || audit.user?.username || 'System'}</td>
                    <td className="py-3 text-center font-mono text-slate-300">{audit.tentativeReviewed}</td>
                    <td className="py-3 text-center font-mono text-rose-450">{audit.autoCancelled}</td>
                    <td className="py-3 text-center font-mono text-slate-300">{audit.guaranteedReviewed}</td>
                    <td className="py-3 text-center font-mono text-amber-500">{audit.autoNoShow}</td>
                    <td className="py-3 text-center font-mono text-rose-550 font-bold">{audit.errorsCount}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedAudit(audit);
                          setShowDetailsModal(true);
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-semibold transition"
                      >
                        Inspect Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit Detail Modal */}
      {showDetailsModal && selectedAudit && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden max-h-[85vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Moon className="text-amber-500" size={20} />
                  Night Audit Details — {formatDateOnly(selectedAudit.auditDate)}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Completed on {new Date(selectedAudit.completedAt).toLocaleString()} by {selectedAudit.user?.fullName || selectedAudit.user?.username || 'System'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedAudit(null);
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-405 hover:text-slate-100 transition text-xs font-semibold border border-slate-700"
              >
                Close
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Counts Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Tentative Reviewed</span>
                  <span className="text-xl font-bold font-mono text-slate-200 mt-1 block">{selectedAudit.tentativeReviewed}</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-center">
                  <span className="text-[10px] font-bold text-rose-500 uppercase block tracking-wider">Auto-Cancelled</span>
                  <span className="text-xl font-bold font-mono text-rose-400 mt-1 block">{selectedAudit.autoCancelled}</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Guaranteed Reviewed</span>
                  <span className="text-xl font-bold font-mono text-slate-200 mt-1 block">{selectedAudit.guaranteedReviewed}</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-center">
                  <span className="text-[10px] font-bold text-amber-550 uppercase block tracking-wider">Auto-No-Show</span>
                  <span className="text-xl font-bold font-mono text-amber-500 mt-1 block">{selectedAudit.autoNoShow}</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-center col-span-2 md:col-span-1">
                  <span className="text-[10px] font-bold text-rose-500 uppercase block tracking-wider">Errors Encountered</span>
                  <span className="text-xl font-bold font-mono text-rose-500 mt-1 block">{selectedAudit.errorsCount}</span>
                </div>
              </div>

              {/* Affected Reservations Log */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Affected Reservations & Action Logs</h4>
                {(!selectedAudit.details || selectedAudit.details.length === 0) ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center bg-slate-950 rounded-xl border border-slate-800">
                    No reservations were modified during this Day Close execution.
                  </p>
                ) : (
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                    <div className="overflow-x-auto max-h-64">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-850 bg-slate-900/40 text-slate-400 font-semibold uppercase tracking-wider text-[9px]">
                            <th className="px-4 py-2.5">Confo No</th>
                            <th className="px-4 py-2.5">Guest Name</th>
                            <th className="px-4 py-2.5">Action Taken</th>
                            <th className="px-4 py-2.5">Details / Reason</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {selectedAudit.details.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/20">
                              <td className="px-4 py-2.5 font-mono text-amber-500 font-bold">{item.confoNo}</td>
                              <td className="px-4 py-2.5 font-medium text-slate-350">{item.guestName}</td>
                              <td className="px-4 py-2.5">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                  item.action === 'Auto-Cancelled' ? 'bg-rose-500/10 text-rose-450 border border-rose-500/20' :
                                  item.action === 'Auto-No-Show' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                  'bg-rose-500/10 text-rose-500 border border-rose-500/20 font-bold'
                                }`}>
                                  {item.action}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-slate-400 italic">{item.detail}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
