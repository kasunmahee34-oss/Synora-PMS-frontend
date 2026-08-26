import React, { useEffect, useState } from 'react';
import api from '../api';
import mealPlanApi from '../api/mealPlans';
import { Briefcase, Plus, Percent, Mail, Phone, Calendar, User, Trash2, Edit2 } from 'lucide-react';

const TravelAgents = () => {
  const [agents, setAgents] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentRates, setAgentRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);

  // Agent Form State
  const [agentName, setAgentName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [commissionRate, setCommissionRate] = useState('');
  const [agentError, setAgentError] = useState('');

  // Rate Form State
  const [roomTypeId, setRoomTypeId] = useState('');
  const [rate, setRate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [mealPlans, setMealPlans] = useState([]);
  const [selectedMealPlanId, setSelectedMealPlanId] = useState('');
  const [rateBookingSource, setRateBookingSource] = useState('direct');
  const [rateError, setRateError] = useState('');

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [rateToDelete, setRateToDelete] = useState(null);

  // Edit mode state
  const [editingRateId, setEditingRateId] = useState(null);
  const [expandedRoomTypes, setExpandedRoomTypes] = useState({});
  const safeRoomTypes = Array.isArray(roomTypes) ? roomTypes : [];

  const groupedRateSchedules = React.useMemo(() => {
    if (!Array.isArray(agentRates)) return [];

    const grouped = {};

    agentRates.forEach((rate) => {
      const roomTypeId = rate.roomTypeId ?? rate.roomType?.id ?? `unknown-${rate.id}`;
      const roomTypeName = rate.roomType?.typeName
        ?? safeRoomTypes.find((type) => Number(type.id) === Number(roomTypeId))?.typeName
        ?? `Room Type ${roomTypeId}`;

      if (!grouped[roomTypeId]) {
        grouped[roomTypeId] = { roomTypeId, roomTypeName, rates: [] };
      }

      grouped[roomTypeId].rates.push(rate);
    });

    return Object.values(grouped).sort((a, b) => a.roomTypeName.localeCompare(b.roomTypeName));
  }, [agentRates, safeRoomTypes]);

  const toggleRoomTypeGroup = (roomTypeId) => {
    setExpandedRoomTypes((prev) => ({
      ...prev,
      [roomTypeId]: prev[roomTypeId] === undefined ? true : !prev[roomTypeId],
    }));
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // resilient fetch with retries for transient connection errors
      const fetchWithRetry = async (fn, attempts = 3, delayMs = 500) => {
        for (let i = 0; i < attempts; i++) {
          try {
            return await fn();
          } catch (err) {
            if (i === attempts - 1) throw err;
            await new Promise(r => setTimeout(r, delayMs));
          }
        }
      };

      const [agentsRes, typesRes] = await Promise.all([
        fetchWithRetry(() => api.get('/travel-agents')),
        fetchWithRetry(() => api.get('/room-types')),
      ]);

      const normalizedAgents = Array.isArray(agentsRes.data) ? agentsRes.data : [];
      const normalizedRoomTypes = Array.isArray(typesRes.data?.data)
        ? typesRes.data.data
        : Array.isArray(typesRes.data)
          ? typesRes.data
          : [];

      setAgents(normalizedAgents);
      setRoomTypes(normalizedRoomTypes);
      if (agentsRes.data.length > 0 && !selectedAgent) {
        setSelectedAgent(agentsRes.data[0]);
      }
      // load meal plans for rate selection
      try {
        const mp = await mealPlanApi.getMealPlans({ active: true });
        setMealPlans(mp.data || []);
        if ((mp.data || []).length > 0 && !selectedMealPlanId) {
          // prefer RO by code if available
          const ro = mp.data.find(m => m.code === 'RO');
          setSelectedMealPlanId((ro && ro.id) || mp.data[0].id);
        }
      } catch (err) {
        console.error('Failed to load meal plans', err);
      }
    } catch (err) {
      console.error('Error fetching travel agent data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentRates = async (agentId) => {
    try {
      const res = await api.get(`/travel-agents/${agentId}/rates`);
      setAgentRates(res.data);
    } catch (err) {
      console.error('Error fetching agent rates:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedAgent) {
      fetchAgentRates(selectedAgent.id);
    }
  }, [selectedAgent]);

  const handleCreateAgent = async (e) => {
    e.preventDefault();
    setAgentError('');

    if (!agentName) {
      setAgentError('Agent name is required.');
      return;
    }

    try {
      const res = await api.post('/travel-agents', {
        agentName,
        contactPerson,
        phone,
        email,
        commissionRate,
      });
      setShowAgentModal(false);
      // Reset form
      setAgentName('');
      setContactPerson('');
      setPhone('');
      setEmail('');
      setCommissionRate('');
      setSelectedAgent(res.data);
      fetchData();
    } catch (err) {
      setAgentError(err.response?.data?.error || 'Failed to create agent.');
    }
  };

  const handleCreateRate = async (e) => {
    e.preventDefault();
    setRateError('');

    if (!roomTypeId || !rate || !startDate || !endDate) {
      setRateError('All fields are required.');
      return;
    }

    try {
      if (editingRateId) {
        // Update existing rate
        await api.put(`/travel-agents/rates/${editingRateId}`, {
          rate,
          startDate,
          endDate,
          mealPlanId: selectedMealPlanId || null,
          bookingSource: rateBookingSource,
        });
      } else {
        // Create new rate
        await api.post('/travel-agents/rates', {
          roomTypeId,
          travelAgentId: selectedAgent.id > 0 ? selectedAgent.id : null,
          rate,
          startDate,
          endDate,
          mealPlanId: selectedMealPlanId || null,
          bookingSource: rateBookingSource,
        });
      }
      setShowRateModal(false);
      // Reset form
      setRoomTypeId('');
      setRate('');
      setStartDate('');
      setEndDate('');
      setSelectedMealPlanId(mealPlans.length > 0 ? mealPlans[0].id : '');
      setEditingRateId(null);
      fetchAgentRates(selectedAgent.id);
    } catch (err) {
      setRateError(err.response?.data?.error || 'Failed to save rate plan.');
    }
  };

  const handleEditRate = (rate) => {
    setEditingRateId(rate.id);
    setRoomTypeId(rate.roomTypeId.toString());
    setRate(rate.rate.toString());
    setStartDate(new Date(rate.startDate).toISOString().split('T')[0]);
    setEndDate(new Date(rate.endDate).toISOString().split('T')[0]);
    setSelectedMealPlanId(rate.mealPlanId ? rate.mealPlanId.toString() : '');
    setRateBookingSource(rate.bookingSource || (rate.travelAgentId ? 'travel_agent' : 'direct'));
    setShowRateModal(true);
  };

  const handleDeleteRate = async () => {
    if (!rateToDelete) return;
    try {
      await api.delete(`/travel-agents/rates/${rateToDelete.id}`);
      setShowDeleteConfirm(false);
      setRateToDelete(null);
      fetchAgentRates(selectedAgent.id);
    } catch (err) {
      console.error('Error deleting rate:', err);
      alert('Failed to delete rate plan');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">Travel Agents & Rate Plans</h1>
          <p className="text-slate-400 text-sm mt-1">Manage travel agent contracts, commission terms, and agent-specific room rates.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setSelectedAgent({ id: 0, agentName: 'Direct & Walk-in' });
              setRateBookingSource('direct');
              setShowRateModal(false);
              setTimeout(() => {
                document.getElementById('direct-walkin-details')?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                });
              }, 100);
            }}
            className="px-5 py-2.5 bg-slate-900 border border-amber-500/30 hover:border-amber-500 text-amber-400 font-bold rounded-xl text-sm transition-all duration-300 flex items-center gap-2"
          >
            <Plus size={16} />
            Direct / Walk-in Rates
          </button>
          <button
            onClick={() => setShowAgentModal(true)}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm transition-all duration-300 shadow-lg shadow-amber-500/10 flex items-center gap-2"
          >
            <Plus size={16} />
            Add Travel Agent
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Agents List (1 col) */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-200">Registered Agents</h2>
            <div className="space-y-3">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                    selectedAgent?.id === agent.id
                      ? 'bg-amber-500/10 border-amber-500 text-slate-200 shadow-md shadow-amber-500/5'
                      : 'glass-card text-slate-400'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-slate-200">{agent.agentName}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-amber-500/20 text-amber-500 border border-amber-500/20">
                      {agent.commissionRate}% comm.
                    </span>
                  </div>
                  <p className="text-xs mt-2 text-slate-400 font-medium flex items-center gap-1.5">
                    <User size={12} className="text-slate-500" /> {agent.contactPerson || 'No contact specified'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Agent Rates Panel (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {selectedAgent ? (
              <div
                id={selectedAgent.id === 0 ? 'direct-walkin-details' : undefined}
                className="glass-card p-6 rounded-2xl space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                  <div>
                    <h2 className="text-xl font-bold text-slate-100">{selectedAgent.agentName} Details</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      {selectedAgent.id === 0
                        ? 'Configure room rates separately for direct bookings and walk-in customers.'
                        : 'Configure custom rates for this specific travel agent contract.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowRateModal(true)}
                    className="px-4 py-2 bg-slate-900 border border-slate-800 text-amber-400 font-semibold rounded-xl text-xs hover:border-slate-700 transition-all duration-300 flex items-center gap-1.5 self-start"
                  >
                    <Plus size={14} />
                    {selectedAgent.id === 0 ? 'Add Direct / Walk-in Rate' : 'Add Agent Rate Plan'}
                  </button>
                </div>

                {/* Contact Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-slate-500" />
                    <span>{selectedAgent.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-slate-500" />
                    <span>{selectedAgent.email || 'N/A'}</span>
                  </div>
                </div>

                {/* Active Rate Plans */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">Custom Rate Schedules</h3>
                  {groupedRateSchedules.length === 0 ? (
                    <div className="text-center py-8 bg-slate-900/40 rounded-xl border border-dashed border-slate-800 text-xs text-slate-500">
                      No custom rates set up. Standard base room rates will apply to bookings.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {groupedRateSchedules.map((group) => {
                        const isExpanded = expandedRoomTypes[group.roomTypeId] ?? true;

                        return (
                          <div key={group.roomTypeId} className="border border-slate-800/80 rounded-xl bg-slate-900/40 overflow-hidden">
                            <button
                              type="button"
                              onClick={() => toggleRoomTypeGroup(group.roomTypeId)}
                              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left bg-slate-900/60 hover:bg-slate-900 transition-colors duration-300"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Room Type</span>
                                <span className="font-bold text-slate-200">{group.roomTypeName}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-slate-400">
                                <span>{group.rates.length} schedule{group.rates.length > 1 ? 's' : ''}</span>
                                <span className="text-lg leading-none text-amber-400">{isExpanded ? '−' : '+'}</span>
                              </div>
                            </button>

                            {isExpanded && (
                              <div className="space-y-3 p-3">
                                {group.rates.map((rate) => (
                                  <div
                                    key={rate.id}
                                    className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl flex justify-between items-center text-sm group hover:border-slate-700 transition-all duration-300"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="font-bold text-slate-200 flex flex-wrap items-center gap-2">
                                        {rate.mealPlan && (
                                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                                            {rate.mealPlan.code}
                                          </span>
                                        )}
                                        {selectedAgent?.id === 0 && (
                                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                            rate.bookingSource === 'walk_in'
                                              ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                                              : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                                          }`}>
                                            {rate.bookingSource === 'walk_in' ? 'Walk-in' : 'Direct'}
                                          </span>
                                        )}
                                        {selectedAgent?.id > 0 && (
                                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                                            {rate.bookingSource === 'travel_agent' ? 'Travel Agent' : 'Contract'}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                                        <Calendar size={12} className="text-slate-500" />
                                        {new Date(rate.startDate).toLocaleDateString()} to {new Date(rate.endDate).toLocaleDateString()}
                                      </p>
                                    </div>
                                    <div className="text-right mr-4">
                                      <span className="font-mono font-bold text-amber-400 text-base">LKR {rate.rate.toLocaleString()}</span>
                                      <span className="text-[10px] text-slate-500 block">per night</span>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                      <button
                                        onClick={() => handleEditRate(rate)}
                                        className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg transition-all duration-300"
                                        title="Edit rate"
                                      >
                                        <Edit2 size={14} />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setRateToDelete(rate);
                                          setShowDeleteConfirm(true);
                                        }}
                                        className="p-2 bg-slate-800 hover:bg-rose-900 text-rose-400 rounded-lg transition-all duration-300"
                                        title="Delete rate"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass-card p-10 text-center rounded-2xl">
                <p className="text-slate-400">Please select or register a travel agent to manage contracts.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Agent Modal */}
      {showAgentModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass w-full max-w-md rounded-2xl p-8 relative">
            <h2 className="text-xl font-bold text-slate-100 mb-6">Register Travel Agent</h2>

            {agentError && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                {agentError}
              </div>
            )}

            <form onSubmit={handleCreateAgent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Agent Name *</label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="e.g. AeroTravel Lanka"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Contact Person</label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="e.g. Mr. Jayasekara"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+94..."
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="agent@email.com"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none"
                  />
                </div>
              </div>

              {/* Meal Plan selection moved to Create Agent Rate Plan modal */}

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Commission Rate (%)</span>
                  <Percent size={12} className="text-slate-500" />
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  placeholder="e.g. 10.0"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAgentModal(false)}
                  className="flex-1 py-2.5 bg-slate-900 border border-slate-800 text-slate-400 font-semibold rounded-xl text-sm hover:border-slate-700 hover:text-slate-200 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm transition-all duration-300"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Rate Plan Modal */}
      {showRateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass w-full max-w-md rounded-2xl p-8 relative">
            <h2 className="text-xl font-bold text-slate-100 mb-6">
           {editingRateId ? 'Edit Rate Plan' : selectedAgent?.id === 0 ? 'Create Direct / Walk-in Rate' : 'Create Agent Rate Plan'}
            </h2>

            {rateError && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                {rateError}
              </div>
            )}

            <form onSubmit={handleCreateRate} className="space-y-4">
              <div>
                {selectedAgent?.id === 0 && (
                  <>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Customer Type *</label>
                    <select
                      value={rateBookingSource}
                      onChange={(e) => setRateBookingSource(e.target.value)}
                      className="w-full px-4 py-2.5 mb-4 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none"
                      required
                    >
                      <option value="direct">Direct Customer</option>
                      <option value="walk_in">Walk-in Customer</option>
                    </select>
                  </>
                )}
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Room Type *</label>
                <select
                  value={roomTypeId}
                  onChange={(e) => setRoomTypeId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none"
                  disabled={editingRateId}
                  required
                >
                  <option value="">Select Room Type...</option>
                  {safeRoomTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.typeName} (Base: LKR {Number(t.baseRate || 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {selectedAgent?.id === 0 ? 'Direct / Walk-in Room Rate (LKR) *' : 'Contract Room Rate (LKR) *'}
                </label>
                <input
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="e.g. 12500"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Start Date *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    onClick={(e) => e.target.showPicker?.()}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">End Date *</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    onClick={(e) => e.target.showPicker?.()}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Meal Plan</label>
                <div className="flex flex-wrap gap-3">
                  {mealPlans.map(mp => (
                    <label key={mp.id} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="rateMealPlan"
                        value={mp.id}
                        checked={String(selectedMealPlanId) === String(mp.id)}
                        onChange={() => setSelectedMealPlanId(mp.id)}
                        className="accent-amber-500"
                      />
                      <span className="text-slate-200 text-sm">{mp.code} — {mp.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowRateModal(false);
                    setEditingRateId(null);
                    setRoomTypeId('');
                    setRate('');
                    setStartDate('');
                    setEndDate('');
                    setSelectedMealPlanId(mealPlans.length > 0 ? mealPlans[0].id : '');
                  }}
                  className="flex-1 py-2.5 bg-slate-900 border border-slate-800 text-slate-400 font-semibold rounded-xl text-sm hover:border-slate-700 hover:text-slate-200 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm transition-all duration-300"
                >
                  {editingRateId ? 'Update Rate' : 'Save Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && rateToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass w-full max-w-sm rounded-2xl p-8 relative">
            <h2 className="text-lg font-bold text-slate-100 mb-4">Delete Rate Plan?</h2>
            <p className="text-slate-400 text-sm mb-6">
              Are you sure you want to delete this rate for <strong>{rateToDelete.roomType.typeName}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setRateToDelete(null);
                }}
                className="flex-1 py-2.5 bg-slate-900 border border-slate-800 text-slate-400 font-semibold rounded-xl text-sm hover:border-slate-700 hover:text-slate-200 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRate}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm transition-all duration-300"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TravelAgents;
