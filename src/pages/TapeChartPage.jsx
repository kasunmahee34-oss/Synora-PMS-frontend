import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { ChevronLeft, ChevronRight, Calendar, Plus } from 'lucide-react';

const TapeChartPage = () => {
  const navigate = useNavigate();
  
  // Start date default to today
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [daysCount, setDaysCount] = useState(10); // Show 10 days
  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  const getDatesArray = () => {
    const dates = [];
    const start = new Date(startDate);
    for (let i = 0; i < daysCount; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const dates = getDatesArray();
  const endDate = new Date(dates[dates.length - 1]);
  endDate.setDate(endDate.getDate() + 1);
  const endDateStr = endDate.toISOString().slice(0, 10);

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
    const current = new Date(startDate);
    current.setDate(current.getDate() + days);
    setStartDate(current.toISOString().slice(0, 10));
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

      const currentDate = dates[i];
      const currentDateStr = currentDate.toISOString().slice(0, 10);

      // Find if there is an active reservation covering this cell's date
      const activeRes = roomReservations.find(r => {
        const checkInStr = new Date(r.checkIn).toISOString().slice(0, 10);
        const checkOutStr = new Date(r.checkOut).toISOString().slice(0, 10);
        return currentDateStr >= checkInStr && currentDateStr < checkOutStr;
      });

      if (activeRes) {
        const checkInDate = new Date(activeRes.checkIn);
        const checkOutDate = new Date(activeRes.checkOut);
        
        // Calculate the span within our current view
        const checkInStr = checkInDate.toISOString().slice(0, 10);
        let span = 0;
        let tempIndex = i;
        
        while (tempIndex < dates.length) {
          const tempDateStr = dates[tempIndex].toISOString().slice(0, 10);
          if (tempDateStr >= checkInStr && tempDateStr < checkOutDate.toISOString().slice(0, 10)) {
            span++;
            tempIndex++;
          } else {
            break;
          }
        }

        skipCount = span - 1;

        cells.push(
          <td
            key={`res-${activeRes.id}`}
            colSpan={span}
            onClick={() => navigate(`/reservations?newConfo=${activeRes.confoNo}`)}
            className="p-1.5 cursor-pointer align-middle"
          >
            <div className={`h-12 px-3 rounded-xl flex flex-col justify-center border text-xs font-semibold shadow-sm transition-all duration-300 ${
             activeRes.status === 'tentative' ? 'bg-amber-500/20 border-amber-500/40 hover:bg-amber-500/30 text-amber-300 hover:scale-[0.99]' :
              activeRes.status === 'guaranteed' ? 'bg-violet-500/20 border-violet-500/40 hover:bg-violet-500/30 text-violet-300 hover:scale-[0.99]' :
              activeRes.status === 'room_assigned' ? 'bg-blue-500/20 border-blue-500/40 hover:bg-blue-500/30 text-blue-300 hover:scale-[0.99]' :
             activeRes.status === 'checked_in' ? 'bg-cyan-500/20 border-cyan-500/40 hover:bg-cyan-500/30 text-cyan-300 hover:scale-[0.99]' :
              activeRes.status === 'in_house' ? 'bg-sky-500/20 border-sky-500/40 hover:bg-sky-500/30 text-sky-300 hover:scale-[0.99]' :
              activeRes.status === 'early_checkout' ? 'bg-pink-500/20 border-pink-500/40 hover:bg-pink-500/30 text-pink-300 hover:scale-[0.99]' :
              activeRes.status === 'checked_out' ? 'bg-emerald-500/20 border-emerald-500/40 hover:bg-emerald-500/30 text-emerald-300 hover:scale-[0.99]' :
             activeRes.status === 'closed' ? 'bg-slate-500/20 border-slate-500/40 hover:bg-slate-500/30 text-slate-300 hover:scale-[0.99]' :
             activeRes.status === 'cancelled' || activeRes.status === 'no_show' ? 'bg-rose-500/20 border-rose-500/40 hover:bg-rose-500/30 text-rose-300 hover:scale-[0.99]' :
             'bg-slate-800 border-slate-700 text-slate-400 hover:scale-[0.99]'
            }`}>
              <p className="truncate font-bold text-slate-100">{activeRes.guest.fullName}</p>
              <p className="text-[9px] opacity-75 truncate">{activeRes.confoNo}</p>
            </div>
          </td>
        );
      } else {
        const nextDay = new Date(currentDate);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDayStr = nextDay.toISOString().slice(0, 10);

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
          <p className="text-slate-400 text-sm mt-1">Room allocation grid. Double-click reservations to inspect, click empty slots to book.</p>
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
                  {dates.map((date) => {
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                    const dateNum = date.getDate();
                    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
                    const isToday = new Date().toISOString().slice(0, 10) === date.toISOString().slice(0, 10);
                    return (
                      <th
                        key={date.toISOString()}
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
