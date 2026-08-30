import React, { useEffect, useMemo, useState } from 'react';
import api from '../api';
import mealPlanApi from '../api/mealPlans';
import { formatUtcDate } from '../utils/dateUtils';

const emptyRoomLine = () => ({ roomTypeId: '', quantity: 1 });

const GroupReservations = () => {
  const [groups, setGroups] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [mealPlans, setMealPlans] = useState([]);
  const [travelAgents, setTravelAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    groupName: '',
    travelAgentId: '',
    checkInDate: '',
    checkInTime: '14:00',
    checkOutDate: '',
    checkOutTime: '11:00',
    mealPlanId: '',
    notes: '',
    rooms: [emptyRoomLine()],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [groupsRes, roomTypesRes, mealPlansRes, agentsRes] = await Promise.all([
        api.get('/group-reservations'),
        api.get('/room-types'),
        mealPlanApi.getMealPlans({ active: true }),
        api.get('/travel-agents'),
      ]);

      setGroups(Array.isArray(groupsRes.data) ? groupsRes.data : []);
      setRoomTypes(Array.isArray(roomTypesRes.data?.data) ? roomTypesRes.data.data : Array.isArray(roomTypesRes.data) ? roomTypesRes.data : []);
      setMealPlans(Array.isArray(mealPlansRes.data) ? mealPlansRes.data : []);
      setTravelAgents(Array.isArray(agentsRes.data) ? agentsRes.data : []);
    } catch (error) {
      console.error('Failed to load group reservation data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalRooms = useMemo(() => form.rooms.reduce((sum, room) => sum + (Number(room.quantity) || 0), 0), [form.rooms]);

  const updateRoomRow = (index, field, value) => {
    setForm((current) => ({
      ...current,
      rooms: current.rooms.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row
      ),
    }));
  };

  const addRoomRow = () => {
    setForm((current) => ({ ...current, rooms: [...current.rooms, emptyRoomLine()] }));
  };

  const removeRoomRow = (index) => {
    setForm((current) => ({
      ...current,
      rooms: current.rooms.filter((_, rowIndex) => rowIndex !== index),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!form.groupName || !form.checkInDate || !form.checkOutDate || form.rooms.some((room) => !room.roomTypeId || !room.quantity)) {
      setFormError('Group name, date range, and all room entries are required.');
      return;
    }

    try {
      await api.post('/group-reservations', {
        groupName: form.groupName,
        travelAgentId: form.travelAgentId || undefined,
        checkInDate: form.checkInDate,
        checkInTime: form.checkInTime,
        checkOutDate: form.checkOutDate,
        checkOutTime: form.checkOutTime,
        mealPlanId: form.mealPlanId || undefined,
        notes: form.notes,
        rooms: form.rooms.map((room) => ({
          roomTypeId: Number(room.roomTypeId),
          quantity: Number(room.quantity || 1),
        })),
      });

      setForm({
        groupName: '',
        travelAgentId: '',
        checkInDate: '',
        checkInTime: '14:00',
        checkOutDate: '',
        checkOutTime: '11:00',
        mealPlanId: '',
        notes: '',
        rooms: [emptyRoomLine()],
      });
      await fetchData();
    } catch (error) {
      setFormError(error.response?.data?.error || 'Failed to create group reservation.');
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return '—';
    return formatUtcDate(dateValue);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Group Reservations</h1>
          <p className="text-slate-400 text-sm mt-1">Create and manage multi-room bookings for corporate and group stays.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.1fr,0.9fr] gap-6">
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-xl font-bold text-slate-100 mb-5">Create Group Reservation</h2>
          {formError && (
            <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-xs p-3">{formError}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Group Name *</label>
                <input value={form.groupName} onChange={(e) => setForm({ ...form, groupName: e.target.value })} className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200" placeholder="ABC Company" required />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Travel Agent</label>
                <select value={form.travelAgentId} onChange={(e) => setForm({ ...form, travelAgentId: e.target.value })} className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200">
                  <option value="">No travel agent</option>
                  {travelAgents.map((agent) => (
                    <option key={agent.id} value={agent.id}>{agent.agentName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Check-in Date *</label>
                <input type="date" value={form.checkInDate} onChange={(e) => setForm({ ...form, checkInDate: e.target.value })} className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200" required />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Check-in Time</label>
                <input type="time" value={form.checkInTime} onChange={(e) => setForm({ ...form, checkInTime: e.target.value })} className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Check-out Date *</label>
                <input type="date" value={form.checkOutDate} onChange={(e) => setForm({ ...form, checkOutDate: e.target.value })} className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200" required />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Check-out Time</label>
                <input type="time" value={form.checkOutTime} onChange={(e) => setForm({ ...form, checkOutTime: e.target.value })} className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Meal Plan</label>
              <select value={form.mealPlanId} onChange={(e) => setForm({ ...form, mealPlanId: e.target.value })} className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200">
                <option value="">No meal plan</option>
                {mealPlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>{plan.code} - {plan.name}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-semibold uppercase text-slate-400">Room Allocation</label>
                <button type="button" onClick={addRoomRow} className="text-xs bg-slate-800 text-amber-400 rounded-lg px-3 py-1.5">+ Add room type</button>
              </div>

              <div className="space-y-3">
                {form.rooms.map((room, index) => (
                  <div key={index} className="grid md:grid-cols-[1fr,120px,auto] gap-3 items-end">
                    <div>
                      <select value={room.roomTypeId} onChange={(e) => updateRoomRow(index, 'roomTypeId', e.target.value)} className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200" required>
                        <option value="">Select room type</option>
                        {roomTypes.map((type) => (
                          <option key={type.id} value={type.id}>{type.typeName}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <input type="number" min="1" value={room.quantity} onChange={(e) => updateRoomRow(index, 'quantity', Number(e.target.value) || 1)} className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200" />
                    </div>
                    <button type="button" onClick={() => removeRoomRow(index)} className="px-3 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:border-rose-500 hover:text-rose-400">Remove</button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows="3" className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200" placeholder="Corporate group check-in instructions" />
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-sm text-slate-300">
              Total rooms requested: <span className="font-bold text-amber-400">{totalRooms}</span>
            </div>

            <button type="submit" className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors">
              Create Group Reservation
            </button>
          </form>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-xl font-bold text-slate-100 mb-5">Group Summary</h2>

          {loading ? (
            <div className="text-sm text-slate-400">Loading group reservations...</div>
          ) : groups.length === 0 ? (
            <div className="text-sm text-slate-400">No group reservations created yet.</div>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => (
                <div key={group.id} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-100">{group.groupName}</div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{group.groupCode}</div>
                    </div>
                    <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">{group.status}</span>
                  </div>
                  <div className="mt-3 text-xs text-slate-400 space-y-1">
                    <div>Arrival: {formatDate(group.checkInDate)}</div>
                    <div>Departure: {formatDate(group.checkOutDate)}</div>
                    <div>Rooms: {group.reservations?.length || 0}</div>
                    <div>Travel Agent: {group.travelAgent?.agentName || 'Direct / Walk-in'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupReservations;
