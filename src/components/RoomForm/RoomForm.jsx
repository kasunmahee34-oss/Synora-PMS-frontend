import { useEffect, useState } from 'react';
import { createRoom, fetchRoomTypes } from '../../api/rooms';
import { fetchFloors } from '../../api/floors';

const STATUS_OPTIONS = ['available', 'occupied', 'maintenance', 'dirty', 'clean'];

export default function RoomForm({ onCreated }) {
  const [roomTypes, setRoomTypes] = useState([]);
  const [floors, setFloors] = useState([]);
  const [form, setForm] = useState({
    roomNumber: '',
    roomTypeId: '',
    floorId: '',
    status: 'available',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    fetchRoomTypes()
      .then(setRoomTypes)
      .catch(() => setServerError('Could not load room types.'));
    fetchFloors()
      .then(setFloors)
      .catch(() => setServerError('Could not load floors.'));
  }, []);

  function validate() {
    const next = {};
    if (!form.roomNumber.trim()) next.roomNumber = 'Room number is required';
    if (!form.roomTypeId) next.roomTypeId = 'Select a room type';
    if (!form.floorId) next.floorId = 'Select a floor';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const room = await createRoom({
        roomNumber: form.roomNumber.trim(),
        roomTypeId: Number(form.roomTypeId),
        floorId: Number(form.floorId),
        status: form.status,
      });
      setForm({ roomNumber: '', roomTypeId: '', floorId: '', status: 'available' });
      onCreated?.(room);
    } catch (err) {
      setServerError(err?.response?.data?.error || 'Failed to create room.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-card max-w-md space-y-5 rounded-2xl p-6 shadow-xl relative"
    >
      <h2 className="text-lg font-bold text-amber-500">Add New Room</h2>

      {serverError && (
        <p className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 text-xs font-semibold text-rose-450">
          {serverError}
        </p>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Room Number *</label>
          <input
            type="text"
            value={form.roomNumber}
            onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none transition"
            placeholder="e.g. 204"
          />
          {errors.roomNumber && <p className="mt-1.5 text-xs text-rose-400 font-medium">{errors.roomNumber}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Room Type *</label>
          <select
            value={form.roomTypeId}
            onChange={(e) => setForm({ ...form, roomTypeId: e.target.value })}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none transition cursor-pointer"
          >
            <option value="">Select type...</option>
            {roomTypes.map((rt) => (
              <option key={rt.id} value={rt.id}>
                {rt.typeName} (LKR {rt.baseRate.toLocaleString()}/night)
              </option>
            ))}
          </select>
          {errors.roomTypeId && <p className="mt-1.5 text-xs text-rose-400 font-medium">{errors.roomTypeId}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Floor *</label>
          <select
            value={form.floorId}
            onChange={(e) => setForm({ ...form, floorId: e.target.value })}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none transition cursor-pointer"
          >
            <option value="">Select floor...</option>
            {floors.map((f) => (
              <option key={f.id} value={f.id}>
                {f.floorName}
              </option>
            ))}
          </select>
          {errors.floorId && <p className="mt-1.5 text-xs text-rose-400 font-medium">{errors.floorId}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Initial Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
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

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition"
      >
        {submitting ? 'Creating...' : 'Create Room'}
      </button>
    </form>
  );
}
