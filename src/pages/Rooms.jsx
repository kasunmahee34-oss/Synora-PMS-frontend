import React, { useEffect, useState } from 'react';
import { fetchRooms, updateRoom, fetchRoomTypes } from '../api/rooms';
import { fetchFloors } from '../api/floors';
import RoomForm from '../components/RoomForm/RoomForm';
import FloorForm from '../components/FloorForm/FloorForm';
import { 
  Hotel, 
  Plus, 
  Layers, 
  CheckCircle,
  AlertCircle,
  Wrench,
  Sparkles,
  Info,
  Layers2
} from 'lucide-react';

const STATUS_BADGES = {
  available: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  occupied: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
  maintenance: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  dirty: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  clean: 'bg-teal-500/10 text-teal-400 border border-teal-500/20',
};

const STATUS_ICONS = {
  available: Sparkles,
  occupied: Hotel,
  maintenance: Wrench,
  dirty: AlertCircle,
  clean: CheckCircle,
};

const STATUS_OPTIONS = ['available', 'occupied', 'maintenance', 'dirty', 'clean'];

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [floorFilter, setFloorFilter] = useState('');
  
  // Selection / Editing State
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [editForm, setEditForm] = useState({
    roomNumber: '',
    roomTypeId: '',
    floorId: '',
    status: 'available',
  });
  const [editErrors, setEditErrors] = useState({});
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editServerError, setEditServerError] = useState('');

  // Toggle Forms / Panel type
  const [showAddForm, setShowAddForm] = useState(false);
  const [creationTab, setCreationTab] = useState('room'); // 'room' or 'floor'

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (floorFilter) params.floorId = floorFilter;
      
      const [roomsData, typesData, floorsData] = await Promise.all([
        fetchRooms(params),
        fetchRoomTypes(),
        fetchFloors()
      ]);
      
      setRooms(roomsData);
      setRoomTypes(typesData);
      setFloors(floorsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, floorFilter]);

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
    setEditForm({
      roomNumber: room.roomNumber,
      roomTypeId: room.roomTypeId.toString(),
      floorId: room.floorId ? room.floorId.toString() : '',
      status: room.status,
    });
    setEditErrors({});
    setEditServerError('');
    setShowAddForm(false);

    // Smooth scroll to form on mobile
    setTimeout(() => {
      document.getElementById('room-detail-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditServerError('');
    
    // validation
    const nextErrors = {};
    if (!editForm.roomNumber.trim()) nextErrors.roomNumber = 'Room number is required';
    if (!editForm.roomTypeId) nextErrors.roomTypeId = 'Select a room type';
    if (!editForm.floorId) nextErrors.floorId = 'Select a floor';
    setEditErrors(nextErrors);
    
    if (Object.keys(nextErrors).length > 0) return;

    setEditSubmitting(true);
    try {
      const updated = await updateRoom(selectedRoom.id, {
        roomNumber: editForm.roomNumber.trim(),
        roomTypeId: Number(editForm.roomTypeId),
        floorId: Number(editForm.floorId),
        status: editForm.status,
      });
      
      setSelectedRoom(updated);
      await loadData();
      alert('Room updated successfully!');
    } catch (err) {
      setEditServerError(err?.response?.data?.error || 'Failed to update room.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleRoomCreated = () => {
    setShowAddForm(false);
    loadData();
    alert('Room created successfully!');
  };

  const handleFloorCreated = () => {
    setShowAddForm(false);
    loadData();
    alert('Floor created successfully!');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">Room Inventory</h1>
          <p className="text-slate-400 text-sm mt-1">Configure and manage hotel rooms, floors, and housekeeping statuses.</p>
        </div>
        <button
          onClick={() => {
            const nextVal = !showAddForm;
            setShowAddForm(nextVal);
            setSelectedRoom(null);
            if (nextVal) {
              setTimeout(() => {
                document.getElementById('room-detail-form')?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }
          }}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 self-start md:self-auto"
        >
          <Plus size={14} />
          {showAddForm ? 'View Inventory' : 'Add Room / Floor'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side (Rooms Grid & Filters) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters Bar */}
          <div className="glass-card p-4 rounded-xl flex flex-col sm:flex-row gap-4 items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
              <Layers size={14} className="text-amber-500" />
              Filter Inventory
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <select
                value={floorFilter}
                onChange={(e) => setFloorFilter(e.target.value)}
                className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-xs outline-none cursor-pointer"
              >
                <option value="">All Floors</option>
                {floors.map(f => (
                  <option key={f.id} value={f.id}>{f.floorName}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-xs outline-none cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="dirty">Dirty</option>
                <option value="clean">Clean</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          {/* Rooms Grid */}
          {loading ? (
            <div className="flex h-[30vh] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
            </div>
          ) : rooms.length === 0 ? (
            <div className="glass-card p-10 text-center rounded-2xl text-slate-400">
              No rooms match your filter.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {rooms.map((room) => {
                const StatusIcon = STATUS_ICONS[room.status] || Hotel;
                return (
                  <div
                    key={room.id}
                    onClick={() => handleRoomSelect(room)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 flex flex-col justify-between h-36 ${
                      selectedRoom?.id === room.id
                        ? 'bg-amber-500/10 border-amber-500 text-slate-200 shadow-md shadow-amber-500/5'
                        : 'glass-card text-slate-400 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xl font-extrabold tracking-tight text-slate-100">
                          {room.roomNumber}
                        </span>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {room.floor ? room.floor.floorName : 'No Floor'}
                        </p>
                      </div>
                      <div className={`p-1.5 rounded-lg ${STATUS_BADGES[room.status]}`}>
                        <StatusIcon size={14} />
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-200 truncate text-xs">
                        {room.roomType.typeName}
                      </h4>
                      <div className="flex justify-between items-center mt-2 border-t border-slate-800/40 pt-1.5">
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">Status</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider">
                          {room.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side (Form Control) */}
        <div id="room-detail-form">
          {showAddForm ? (
            <div className="sticky top-8 space-y-4 animate-fadeIn">
              {/* Creator tab switcher */}
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setCreationTab('room')}
                  className={`flex-1 py-1.5 font-semibold rounded-lg transition-all ${
                    creationTab === 'room' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Create Room
                </button>
                <button
                  type="button"
                  onClick={() => setCreationTab('floor')}
                  className={`flex-1 py-1.5 font-semibold rounded-lg transition-all ${
                    creationTab === 'floor' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Create Floor
                </button>
              </div>

              {creationTab === 'room' ? (
                <RoomForm onCreated={handleRoomCreated} />
              ) : (
                <FloorForm onCreated={handleFloorCreated} />
              )}
            </div>
          ) : selectedRoom ? (
            /* Edit Room Details */
            <form
              onSubmit={handleEditSubmit}
              className="glass-card sticky top-8 p-6 rounded-2xl shadow-xl space-y-5 animate-fadeIn"
            >
              <div className="border-b border-slate-800 pb-4">
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Selected Room</span>
                <h2 className="text-xl font-extrabold text-slate-200 mt-0.5">Room {selectedRoom.roomNumber}</h2>
              </div>

              {editServerError && (
                <p className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 text-xs font-semibold text-rose-400">
                  {editServerError}
                </p>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Room Number *</label>
                  <input
                    type="text"
                    value={editForm.roomNumber}
                    onChange={(e) => setEditForm({ ...editForm, roomNumber: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none transition"
                  />
                  {editErrors.roomNumber && <p className="mt-1.5 text-xs text-rose-400 font-medium">{editErrors.roomNumber}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Room Type *</label>
                  <select
                    value={editForm.roomTypeId}
                    onChange={(e) => setEditForm({ ...editForm, roomTypeId: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none transition cursor-pointer"
                  >
                    {roomTypes.map((rt) => (
                      <option key={rt.id} value={rt.id}>
                        {rt.typeName} (LKR {rt.baseRate.toLocaleString()}/night)
                      </option>
                    ))}
                  </select>
                  {editErrors.roomTypeId && <p className="mt-1.5 text-xs text-rose-400 font-medium">{editErrors.roomTypeId}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Floor *</label>
                  <select
                    value={editForm.floorId}
                    onChange={(e) => setEditForm({ ...editForm, floorId: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none transition cursor-pointer"
                  >
                    <option value="">Select floor...</option>
                    {floors.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.floorName}
                      </option>
                    ))}
                  </select>
                  {editErrors.floorId && <p className="mt-1.5 text-xs text-rose-400 font-medium">{editErrors.floorId}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none transition cursor-pointer"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRoom(null)}
                  className="flex-1 py-2.5 bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-400 font-semibold rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition"
                >
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="glass-card sticky top-8 p-6 text-center rounded-2xl text-slate-450 flex items-center justify-center flex-col gap-3 h-40">
              <Info size={24} className="text-slate-500" />
              <p className="text-xs text-slate-400 max-w-[200px]">Select a room from the inventory to edit details or update status.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
