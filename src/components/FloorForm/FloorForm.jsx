import { useState } from 'react';
import { createFloor } from '../../api/floors';

export default function FloorForm({ onCreated }) {
  const [form, setForm] = useState({ floorName: '', floorNumber: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  function validate() {
    const next = {};
    if (!form.floorName.trim()) next.floorName = 'Floor name is required';
    if (form.floorNumber === '' || isNaN(Number(form.floorNumber))) {
      next.floorNumber = 'Floor number must be a number';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const floor = await createFloor({
        floorName: form.floorName.trim(),
        floorNumber: Number(form.floorNumber),
      });
      setForm({ floorName: '', floorNumber: '' });
      onCreated?.(floor);
    } catch (err) {
      setServerError(err?.response?.data?.error || 'Failed to create floor.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-card max-w-md space-y-5 rounded-2xl p-6 shadow-xl relative"
    >
      <h2 className="text-lg font-bold text-amber-500">Add New Floor</h2>

      {serverError && (
        <p className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 text-xs font-semibold text-rose-400">
          {serverError}
        </p>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Floor Name *</label>
          <input
            type="text"
            value={form.floorName}
            onChange={(e) => setForm({ ...form, floorName: e.target.value })}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none transition"
            placeholder="e.g. Ground Floor"
          />
          {errors.floorName && <p className="mt-1.5 text-xs text-rose-400 font-medium">{errors.floorName}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Floor Number *</label>
          <input
            type="number"
            value={form.floorNumber}
            onChange={(e) => setForm({ ...form, floorNumber: e.target.value })}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none transition"
            placeholder="e.g. 0 for Ground, 1, 2..."
          />
          {errors.floorNumber && <p className="mt-1.5 text-xs text-rose-400 font-medium">{errors.floorNumber}</p>}
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition"
      >
        {submitting ? 'Creating...' : 'Create Floor'}
      </button>
    </form>
  );
}
