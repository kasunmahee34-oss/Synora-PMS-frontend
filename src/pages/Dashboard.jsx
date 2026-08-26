import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { normalizeReservationStatus, getReservationStatusClasses, formatReservationStatus } from '../utils/reservationStatus';
import { 
  Users, 
  Calendar, 
  ArrowRight,
  Percent,
  Plus,
  Compass,
  ArrowUpRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomsRes, resRes] = await Promise.all([
          api.get('/rooms'),
          api.get('/reservations')
        ]);
        setRooms(roomsRes.data);
        setReservations(resRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
      </div>
    );
  }

  // Calculate statistics
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
  const maintenanceRooms = rooms.filter(r => r.status === 'maintenance').length;
  const dirtyRooms = rooms.filter(r => r.status === 'dirty').length;
  const cleanRooms = rooms.filter(r => r.status === 'clean' || r.status === 'available').length;
  
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / (totalRooms - maintenanceRooms)) * 100) : 0;

  const todayStr = new Date().toISOString().slice(0, 10);
  const arrivalsToday = reservations.filter(r => {
    if (!r?.checkIn) return false;
    const normalized = normalizeReservationStatus(r.status);
    return r.checkIn.slice(0, 10) === todayStr && ['tentative', 'guaranteed', 'room_assigned', 'checked_in'].includes(normalized);
  });
  const departuresToday = reservations.filter(r => {
    if (!r?.checkOut) return false;
    const normalized = normalizeReservationStatus(r.status);
    return r.checkOut.slice(0, 10) === todayStr && ['checked_in', 'in_house'].includes(normalized);
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">Synora PMS Dashboard</h1>
          <h2 className="sr-only">Dashboard</h2>
          <h2 className="text-xl font-semibold mt-2">Dashboard</h2>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/tape-chart"
            className="px-5 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 font-semibold rounded-xl text-sm hover:border-slate-700 transition-all duration-300 flex items-center gap-2"
          >
            <Compass size={16} />
            Tape Chart
          </Link>
          <Link
            to="/reservations/new"
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm transition-all duration-300 shadow-lg shadow-amber-500/10 flex items-center gap-2"
          >
            <Plus size={16} />
            Quick Booking
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Occupancy Card */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Occupancy Rate</span>
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500 border border-amber-500/10">
              <Percent size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-slate-100">{occupancyRate}%</span>
            <span className="text-xs font-medium text-slate-400">({occupiedRooms}/{totalRooms - maintenanceRooms} rooms)</span>
          </div>
          <div className="mt-4 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500" style={{ width: `${occupancyRate}%` }}></div>
          </div>
        </div>

        {/* Arrivals Today */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Arrivals Today</span>
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/10">
              <Calendar size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-slate-100">{arrivalsToday.length}</span>
            <span className="text-xs font-medium text-slate-400">guests pending check-in</span>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
            <Link to="/reservations" className="hover:text-amber-400 transition-colors flex items-center gap-1">
              View active list <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>

        {/* Departures Today */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Departures Today</span>
            <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400 border border-rose-500/10">
              <Calendar size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-slate-100">{departuresToday.length}</span>
            <span className="text-xs font-medium text-slate-400">guests scheduled check-out</span>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
            <Link to="/reservations" className="hover:text-amber-400 transition-colors flex items-center gap-1">
              Reconcile folios <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>

        {/* Room Inventory Summary */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Room Inventory</span>
            <div className="p-2 bg-sky-500/10 rounded-xl text-sky-400 border border-sky-500/10">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-y-2 text-xs">
            <div className="flex items-center justify-between pr-4 border-r border-slate-800">
              <span className="text-slate-400">Clean/Avail</span>
              <span className="font-bold text-slate-100">{cleanRooms}</span>
            </div>
            <div className="flex items-center justify-between pl-4">
              <span className="text-slate-400">Dirty</span>
              <span className="font-bold text-rose-400">{dirtyRooms}</span>
            </div>
            <div className="flex items-center justify-between pr-4 border-r border-slate-800">
              <span className="text-slate-400">Occupied</span>
              <span className="font-bold text-amber-500">{occupiedRooms}</span>
            </div>
            <div className="flex items-center justify-between pl-4">
              <span className="text-slate-400">Maintenance</span>
              <span className="font-bold text-slate-500">{maintenanceRooms}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Live Arrivals/Departures & Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Operations Pane (Left 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Recent Bookings
              </h2>
              <Link to="/reservations" className="text-xs font-semibold text-amber-400 hover:text-amber-500 flex items-center gap-1 transition-colors">
                View All <ArrowRight size={14} />
              </Link>
            </div>

            {reservations.length === 0 ? (
              <div className="text-center py-10">
                <AlertCircle className="mx-auto text-slate-600 mb-2" size={32} />
                <p className="text-slate-400 text-sm">No reservations found in database.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                      <th className="pb-3">Confo No</th>
                      <th className="pb-3">Guest</th>
                      <th className="pb-3">Room</th>
                      <th className="pb-3">Dates</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-sm">
                    {reservations.slice(0, 5).map((res) => (
                      <tr key={res.id} className="group hover:bg-slate-800/20 transition-colors">
                        <td className="py-3.5 font-mono text-xs font-bold text-amber-500">
                          {res.confoNo}
                        </td>
                        <td className="py-3.5 font-semibold text-slate-200">
                          {res.guest.fullName}
                        </td>
                        <td className="py-3.5 text-slate-300">
                          Room {res.room.roomNumber} ({res.room.roomType.typeName})
                        </td>
                        <td className="py-3.5 text-xs text-slate-400">
                          {new Date(res.checkIn).toLocaleDateString()} – {new Date(res.checkOut).toLocaleDateString()}
                        </td>
                        <td className="py-3.5">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${getReservationStatusClasses(res.status)}`}>
                            {formatReservationStatus(res.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Room Status Widget (Right 1 column) */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-2xl">
            <h2 className="text-lg font-bold text-slate-100 mb-4">Room List Overview</h2>
            <div className="grid grid-cols-3 gap-2">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className={`p-3 rounded-xl border text-center transition-all duration-300 ${
                    room.status === 'available' ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' :
                    room.status === 'clean' ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' :
                    room.status === 'occupied' ? 'bg-amber-950/20 border-amber-500/20 text-amber-500' :
                    room.status === 'dirty' ? 'bg-rose-950/20 border-rose-500/20 text-rose-400' :
                    'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  <p className="text-xs font-bold font-mono">Room {room.roomNumber}</p>
                  <span className="text-[9px] uppercase font-bold tracking-wider opacity-85 block mt-1">{room.status}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Ground Floor Rooms: 1xx</span>
              <span>First Floor Rooms: 2xx</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
