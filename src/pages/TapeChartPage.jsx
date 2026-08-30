import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { ChevronLeft, ChevronRight, Calendar, Plus } from 'lucide-react';

/**
 * Returns today's date as a YYYY-MM-DD string in the LOCAL timezone.
 * new Date().toISOString() gives UTC, which is "tomorrow" in UTC- zones at night.
 */
function localTodayStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Build an array of YYYY-MM-DD strings starting from startDateStr (YYYY-MM-DD),
 * entirely in UTC so there is no local-offset drift when iterating days.
 */
function buildDatesArray(startDateStr, count) {
  const dates = [];
  // Parse as UTC midnight (YYYY-MM-DD strings parse as UTC by spec)
  const start = new Date(startDateStr + 'T00:00:00Z');
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    dates.push(d.toISOString().slice(0, 10)); // "YYYY-MM-DD"
  }
  return dates;
}

/**
 * Advance a YYYY-MM-DD string by `days` days (UTC-safe).
 */
function shiftDateStr(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Format a YYYY-MM-DD string for column header display using UTC components,
 * so the day number and month name always match the stored calendar date.
 */
function formatHeaderDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  const dayName = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
  const dateNum = d.getUTCDate();
  const monthName = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
  return { dayName, dateNum, monthName };
}

const STATUS_CLASSES = {
  tentative:      'bg-amber-500/20 border-amber-500/40 hover:bg-amber-500/30 text-amber-300',
  guaranteed:     'bg-violet-500/20 border-violet-500/40 hover:bg-violet-500/30 text-violet-300',
  room_assigned:  'bg-blue-500/20 border-blue-500/40 hover:bg-blue-500/30 text-blue-300',
  checked_in:     'bg-cyan-500/20 border-cyan-500/40 hover:bg-cyan-500/30 text-cyan-300',
  in_house:       'bg-sky-500/20 border-sky-500/40 hover:bg-sky-500/30 text-sky-300',
  early_checkout: 'bg-pink-500/20 border-pink-500/40 hover:bg-pink-500/30 text-pink-300',
  checked_out:    'bg-emerald-500/20 border-emerald-500/40 hover:bg-emerald-500/30 text-emerald-300',
  closed:         'bg-slate-500/20 border-slate-500/40 hover:bg-slate-500/30 text-slate-300',
  cancelled:      'bg-rose-500/20 border-rose-500/40 hover:bg-rose-500/30 text-rose-300',
  no_show:        'bg-rose-500/20 border-rose-500/40 hover:bg-rose-500/30 text-rose-300',
};

const TapeChartPage = () => {
  const navigate = useNavigate();

  // Default to today in LOCAL timezone (not UTC)
  const [startDate, setStartDate] = useState(localTodayStr());
  const [daysCount, setDaysCount] = useState(10);
  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Build dates as YYYY-MM-DD strings using pure UTC arithmetic
  const dates = buildDatesArray(startDate, daysCount);
  // endDate for API: the day after the last visible column
  const endDateStr = shiftDateStr(dates[dates.length - 1], 1);
  const todayStr = localTodayStr();

  const fetchTapeChart = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/tape-chart?startDate=${startDate}&endDate=${endDateStr}`);
      setRooms(res.data.rooms);
      setReservations(res.data.reservations);
    } catch (e) {
      console.error('Error fetching tape chart:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTapeChart();
  }, [startDate, daysCount]);

  const shiftDates = (days) => {
    setStartDate(prev => shiftDateStr(prev, days));
  };

  const renderRoomRow = (room) => {
    const cells = [];
    const roomReservations = reservations.filter(r => r.roomId === room.id);

    let skipCount = 0;

    for (let i = 0; i < dates.length; i++) {
      if (skipCount > 0) {
        skipCount--;
        continue;
      }

      const currentDateStr = dates[i]; // already "YYYY-MM-DD"

      // checkIn/checkOut from API may have time components (e.g. group reservations).
      // Always use .toISOString().slice(0,10) to get the UTC calendar date.
      const activeRes = roomReservations.find(r => {
        const checkInStr  = new Date(r.checkIn).toISOString().slice(0, 10);
        const checkOutStr = new Date(r.checkOut).toISOString().slice(0, 10);
        return currentDateStr >= checkInStr && currentDateStr < checkOutStr;
      });

      if (activeRes) {
        const checkInStr  = new Date(activeRes.checkIn).toISOString().slice(0, 10);
        const checkOutStr = new Date(activeRes.checkOut).toISOString().slice(0, 10);

        // Count how many of our visible columns this reservation spans
        let span = 0;
        let tempIndex = i;
        while (tempIndex < dates.length) {
          const tempDateStr = dates[tempIndex];
          if (tempDateStr >= checkInStr && tempDateStr < checkOutStr) {
            span++;
            tempIndex++;
          } else {
            break;
          }
        }

        skipCount = span - 1;

        const statusClass = STATUS_CLASSES[activeRes.status] || 'bg-slate-800 border-slate-700 text-slate-400';

        cells.push(
          <td
            key={`res-${activeRes.id}-${i}`}
            colSpan={span}
            onClick={() => navigate(`/reservations?newConfo=${activeRes.confoNo}`)}
            className="p-1.5 cursor-pointer align-middle"
          >
            <div className={`h-12 px-3 rounded-xl flex flex-col justify-center border text-xs font-semibold shadow-sm transition-all duration-300 hover:scale-[0.99] ${statusClass}`}>
              <p className="truncate font-bold text-slate-100">{activeRes.guest.fullName}</p>
              <p className="text-[9px] opacity-75 truncate">{activeRes.confoNo}</p>
            </div>
          </td>
        );
      } else {
        const nextDayStr = shiftDateStr(currentDateStr, 1);

        cells.push(
          <td
            key={`empty-${room.id}-${currentDateStr}`}
            onClick={() => navigate(`/reservations/new?checkIn=${currentDateStr}&checkOut=${nextDayStr}&roomId=${room.id}`)}
            className="h-16 border-r border-b border-slate-800/50 p-2 cursor-pointer hover:bg-slate-900/40 transition-colors relative group"
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Plus size={14} className="text-amber-500/40" />
            </div>
          </td>
        );
      }
    }

    return (
      <tr key={room.id} className="hover:bg-slate-900/10">
        <td className="p-4 border-r border-b border-slate-800/80 sticky left-0 bg-slate-950/95 font-bold text-sm text-slate-200 z-10">
          Room {room.roomNumber}
          <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-500 mt-1">{room.roomType.typeName}</span>
        </td>
        {cells}
      </tr>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">Interactive Tape Chart</h1>
          <p className="text-slate-400 text-sm mt-1">Room allocation grid. Click reservations to inspect, click empty slots to book.</p>
        </div>

        {/* Chart Navigation controls */}
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <button
              onClick={() => shiftDates(-daysCount)}
              className="p-2.5 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border-r border-slate-800 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="px-4 py-2 flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Calendar size={14} className="text-amber-500" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                onClick={(e) => e.target.showPicker?.()}
                className="bg-transparent border-none outline-none text-slate-200 cursor-pointer"
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <button
              onClick={() => shiftDates(daysCount)}
              className="p-2.5 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border-l border-slate-800 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <select
            value={daysCount}
            onChange={(e) => setDaysCount(parseInt(e.target.value))}
            className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-xs font-semibold outline-none"
          >
            <option value={7}>7 Days View</option>
            <option value={10}>10 Days View</option>
            <option value={14}>14 Days View</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-800/80">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left min-w-[800px]">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-800">
                  <th className="p-4 border-r border-slate-800/80 sticky left-0 bg-slate-900 font-bold text-xs uppercase text-slate-400 w-44 z-20">
                    Rooms / Dates
                  </th>
                  {dates.map((dateStr) => {
                    const { dayName, dateNum, monthName } = formatHeaderDate(dateStr);
                    const isToday = dateStr === todayStr;
                    return (
                      <th
                        key={dateStr}
                        className={`p-3 border-r border-slate-850 text-center w-24 text-xs select-none ${
                          isToday ? 'bg-amber-500/10 text-amber-400 font-bold' : 'text-slate-400 font-semibold'
                        }`}
                      >
                        <span className="block text-[10px] uppercase opacity-75">{dayName}</span>
                        <span className="block text-sm mt-0.5">{dateNum} {monthName}</span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {rooms.map(renderRoomRow)}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TapeChartPage;
