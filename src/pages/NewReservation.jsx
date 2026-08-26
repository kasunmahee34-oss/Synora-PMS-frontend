import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import { User, Calendar, Plus, Search, Tag, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NewReservation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Parse query params (passed from tape chart click)
  const queryParams = new URLSearchParams(location.search);
  const initialCheckIn = queryParams.get('checkIn') || '';
  const initialCheckOut = queryParams.get('checkOut') || '';
  const initialRoomId = queryParams.get('roomId') || '';

  // Search Guest state
  const [guestQuery, setGuestQuery] = useState('');
  const [guests, setGuests] = useState([]);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [showAddGuest, setShowAddGuest] = useState(false);

  // New Guest Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [nationality, setNationality] = useState('');
  const [idPassportNo, setIdPassportNo] = useState('');
  const [address, setAddress] = useState('');
  const [guestError, setGuestError] = useState('');

  // Booking Form State
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [checkInTime, setCheckInTime] = useState('14:00');
  const [checkOutTime, setCheckOutTime] = useState('12:00');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [bookingSource, setBookingSource] = useState('direct');
  const [travelAgentId, setTravelAgentId] = useState('');
  const [travelAgents, setTravelAgents] = useState([]);
  const [mealPlans, setMealPlans] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [calculatedRate, setCalculatedRate] = useState(0);
  const [selectedRatePlan, setSelectedRatePlan] = useState(null);
  const [selectedMealPlan, setSelectedMealPlan] = useState(null);
  const [activeRatePlanRoomTypeIds, setActiveRatePlanRoomTypeIds] = useState([]);
  const [rateByRoomType, setRateByRoomType] = useState({});
  const [hbSelection, setHbSelection] = useState('');
  const [searchingRooms, setSearchingRooms] = useState(false);
  const [error, setError] = useState('');
  const [guaranteed, setGuaranteed] = useState(false);
  const [guaranteeReason, setGuaranteeReason] = useState('');
  const [isComplimentary, setIsComplimentary] = useState(false);
  const [complimentaryReason, setComplimentaryReason] = useState('');

  // Auto search guests
  useEffect(() => {
    if (guestQuery.length >= 2) {
      const delayDebounce = setTimeout(async () => {
        try {
          const res = await api.get(`/guests?search=${guestQuery}`);
          setGuests(res.data);
        } catch (e) {
          console.error(e);
        }
      }, 300);
      return () => clearTimeout(delayDebounce);
    } else {
      setGuests([]);
    }
  }, [guestQuery]);

  // Load travel agents
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await api.get('/travel-agents');
        setTravelAgents(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchAgents();
  }, []);

  // Load active meal plans
  useEffect(() => {
    const fetchMealPlans = async () => {
      try {
        const res = await api.get('/meal-plans?active=true');
        setMealPlans(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchMealPlans();
  }, []);

  // Fetch the current rate-plan room types for the selected booking source/date range.
  useEffect(() => {
    if (!checkIn || !checkOut || !selectedMealPlan) {
      setActiveRatePlanRoomTypeIds([]);
      setRateByRoomType({});
      setAvailableRooms([]);
      return;
    }

    const fetchApplicableRatePlans = async () => {
      try {
        const endpoint = bookingSource === 'travel_agent' && travelAgentId
          ? `/travel-agents/${travelAgentId}/rates`
          : `/travel-agents/0/rates?bookingSource=${bookingSource}`;
        const res = await api.get(endpoint);

        const matchingPlans = res.data
          .filter((plan) => {
            const start = new Date(plan.startDate);
            const end = new Date(plan.endDate);
            const cin = new Date(checkIn);
            const cout = new Date(checkOut);
            return cin <= end
              && cout >= start
              && (!selectedMealPlan || plan.mealPlanId === selectedMealPlan.id);
          });
        const rates = {};
        matchingPlans.forEach((plan) => {
          rates[plan.roomTypeId] = plan.rate;
        });

        setRateByRoomType(rates);
        setActiveRatePlanRoomTypeIds(Object.keys(rates).map(Number));
      } catch (e) {
        console.error('Error loading applicable rate plans:', e);
        setActiveRatePlanRoomTypeIds([]);
      }
    };

    fetchApplicableRatePlans();
  }, [checkIn, checkOut, bookingSource, travelAgentId, selectedMealPlan]);

  // Fetch availability and select initial room if provided
  useEffect(() => {
    if (checkIn && checkOut && selectedMealPlan) {
      searchAvailableRooms();
    } else {
      setAvailableRooms([]);
    }
  }, [checkIn, checkOut, bookingSource, travelAgentId, selectedMealPlan, activeRatePlanRoomTypeIds]);

  const searchAvailableRooms = async () => {
    if (!checkIn || !checkOut) return;

    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    if (isNaN(inDate.getTime()) || isNaN(outDate.getTime()) || inDate >= outDate) {
      return; // Skip invalid or partial ranges
    }
    const inYear = inDate.getFullYear();
    const outYear = outDate.getFullYear();
    if (inYear < 1900 || inYear > 2100 || outYear < 1900 || outYear > 2100) {
      return; // Skip intermediate values while user is typing
    }

    setSearchingRooms(true);
    setSelectedRoom(null);
    setCalculatedRate(0);
    setError(''); // Clear any previous errors

    try {
      const res = await api.get('/rooms/availability', {
        params: {
          checkIn,
          checkOut,
        },
      });

      const filteredRooms = res.data.filter((room) => activeRatePlanRoomTypeIds.includes(room.roomTypeId));

      setAvailableRooms(filteredRooms);
      setError(filteredRooms.length === 0
        ? 'No rooms are configured for this booking source, meal plan, and date range.'
        : '');

      // If initialRoomId was passed from Tape Chart, find and select it
      if (initialRoomId) {
        const room = filteredRooms.find(r => r.id === parseInt(initialRoomId));
        if (room) {
          handleRoomSelect(room);
        }
      }
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.error || 'Failed to load room availability.');
    } finally {
      setSearchingRooms(false);
    }
  };

  const handleRoomSelect = async (room) => {
    setSelectedRoom(room);
    // Calculate rate (check for seasonal rate plan or agent rate plan)
    let rateToUse = room.roomType.baseRate;
    try {
      if (bookingSource === 'travel_agent' && travelAgentId) {
        // Fetch agent rate plans
        const res = await api.get(`/travel-agents/${travelAgentId}/rates`);
        const matchingRate = res.data.find(r => {
          const start = new Date(r.startDate);
          const end = new Date(r.endDate);
          const cin = new Date(checkIn);
          return r.roomTypeId === room.roomTypeId
            && cin >= start
            && cin <= end
            && (!selectedMealPlan || r.mealPlanId === selectedMealPlan.id);
        });
        if (matchingRate) {
          rateToUse = matchingRate.rate;
          setSelectedRatePlan(matchingRate);
          if (!selectedMealPlan) setSelectedMealPlan(matchingRate.mealPlan || null);
        }
      } else {
        // Fetch seasonal/general rate plans (non-agent)
        const res = await api.get(`/travel-agents/0/rates?bookingSource=${bookingSource}`);
        const matchingRate = res.data.find(r => {
          const start = new Date(r.startDate);
          const end = new Date(r.endDate);
          const cin = new Date(checkIn);
          return r.roomTypeId === room.roomTypeId
            && r.travelAgentId === null
            && cin >= start
            && cin <= end
            && (!selectedMealPlan || r.mealPlanId === selectedMealPlan.id);
        });
        if (matchingRate) {
          rateToUse = matchingRate.rate;
          setSelectedRatePlan(matchingRate);
          if (!selectedMealPlan) setSelectedMealPlan(matchingRate.mealPlan || null);
        }
      }
    } catch (e) {
      console.error('Error matching rate plans:', e);
    }
    setCalculatedRate(rateToUse);
  };

  useEffect(() => {
    if (selectedRoom && selectedMealPlan) {
      handleRoomSelect(selectedRoom);
    }
  }, [selectedMealPlan]);

  const handleCreateGuest = async (e) => {
    e.preventDefault();
    setGuestError('');
    if (!fullName) {
      setGuestError('Full name is required');
      return;
    }
    try {
      const res = await api.post('/guests', {
        fullName,
        phone,
        email,
        nationality,
        idPassportNo,
        address
      });
      setSelectedGuest(res.data);
      setShowAddGuest(false);
      // Reset guest form
      setFullName('');
      setPhone('');
      setEmail('');
      setNationality('');
      setIdPassportNo('');
      setAddress('');
    } catch (err) {
      setGuestError(err.response?.data?.error || 'Failed to create guest profile');
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedGuest) {
      setError('Please select or create a guest profile.');
      return;
    }
    if (!selectedRoom) {
      setError('Please select a room.');
      return;
    }

    const expectedCheckInAt = `${checkIn}T${checkInTime}:00Z`;
    const expectedCheckOutAt = `${checkOut}T${checkOutTime}:00Z`;
    if (!checkIn || !checkOut || new Date(expectedCheckOutAt) <= new Date(expectedCheckInAt)) {
      setError('Expected check-out date and time must be after expected check-in date and time.');
      return;
    }

    if (guaranteed && !guaranteeReason.trim()) {
      setError('Please provide a guarantee reason when marking reservation as guaranteed.');
      return;
    }

    if (isComplimentary && !complimentaryReason.trim()) {
      setError('Please provide a reason when marking this reservation as complimentary.');
      return;
    }

    try {
      const res = await api.post('/reservations', {
        guestId: selectedGuest.id,
        roomId: selectedRoom.id,
        checkIn,
        checkOut,
        expected_check_in_at: expectedCheckInAt,
        expected_check_out_at: expectedCheckOutAt,
        adults,
        children,
        bookingSource,
        travelAgentId: bookingSource === 'travel_agent' ? parseInt(travelAgentId) : null,
        mealPlanId: selectedMealPlan ? selectedMealPlan.id : null,
        rate: calculatedRate,
        ratePlanId: selectedRatePlan ? selectedRatePlan.id : null,
        hbSelection: hbSelection || null,
        createdBy: user?.id,
        status: guaranteed ? 'guaranteed' : 'tentative',
        guaranteeMethod: guaranteed ? 'advance_payment' : null,
        guaranteeReason: guaranteed ? guaranteeReason : null,
        isComplimentary,
        complimentaryReason: isComplimentary ? complimentaryReason.trim() : null,
      });
      // Redirect to reservation detail page or listing
      navigate(`/reservations?newConfo=${res.data.confoNo}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to confirm booking.');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">New Reservation</h1>
        <p className="text-slate-400 text-sm mt-1">Quick booking engine. Create profiles, fetch room inventory, and confirm rates.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-semibold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Reservation Details Form (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Guest Selection */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <User size={18} className="text-amber-500" />
              1. Guest Profile
            </h2>

            {selectedGuest ? (
              <div className="p-4 bg-slate-900 border border-amber-500/20 rounded-xl flex justify-between items-center text-sm">
                <div>
                  <p className="font-bold text-slate-200">{selectedGuest.fullName}</p>
                  <p className="text-xs text-slate-400">Passport / NIC: {selectedGuest.idPassportNo || 'N/A'}</p>
                </div>
                <button
                  onClick={() => setSelectedGuest(null)}
                  className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
                >
                  Change Guest
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1 glass-card px-4 py-2 flex items-center gap-3 rounded-xl">
                    <Search size={16} className="text-slate-500" />
                    <input
                      type="text"
                      value={guestQuery}
                      onChange={(e) => setGuestQuery(e.target.value)}
                      placeholder="Type guest name, phone, or passport to lookup..."
                      className="bg-transparent border-none outline-none text-slate-200 text-sm w-full placeholder-slate-500"
                    />
                  </div>
                  <button
                    onClick={() => setShowAddGuest(true)}
                    className="px-4 bg-slate-900 border border-slate-800 text-amber-500 hover:border-amber-500/30 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all duration-300"
                  >
                    <Plus size={16} /> New Profile
                  </button>
                </div>

                {guests.length > 0 && (
                  <div className="glass-card divide-y divide-slate-800/60 rounded-xl max-h-48 overflow-y-auto">
                    {guests.map((g) => (
                      <div
                        key={g.id}
                        onClick={() => setSelectedGuest(g)}
                        className="p-3 hover:bg-slate-850 cursor-pointer flex justify-between items-center text-sm transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-slate-200">{g.fullName}</p>
                          <p className="text-xs text-slate-500">Phone: {g.phone || 'N/A'} | Pass: {g.idPassportNo || 'N/A'}</p>
                        </div>
                        <span className="text-xs text-amber-500 font-semibold">Select</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dates & Source */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Calendar size={18} className="text-amber-500" />
              2. Dates & Booking Source
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Check-in Date *</label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  onClick={(e) => e.target.showPicker?.()}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none cursor-pointer"
                  style={{ colorScheme: 'dark' }}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Check-in Time *</label>
                <input
                  type="time"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none cursor-pointer"
                  style={{ colorScheme: 'dark' }}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Check-out Date *</label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  onClick={(e) => e.target.showPicker?.()}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none cursor-pointer"
                  style={{ colorScheme: 'dark' }}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Check-out Time *</label>
                <input
                  type="time"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none cursor-pointer"
                  style={{ colorScheme: 'dark' }}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Adults</label>
                <input
                  type="number"
                  value={adults}
                  onChange={(e) => setAdults(e.target.value)}
                  min="1"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Children</label>
                <input
                  type="number"
                  value={children}
                  onChange={(e) => setChildren(e.target.value)}
                  min="0"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Source *</label>
                <select
                  value={bookingSource}
                  onChange={(e) => setBookingSource(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none"
                >
                  <option value="direct">Direct Booking</option>
                  <option value="walk_in">Walk-in Customer</option>
                  <option value="travel_agent">Travel Agent</option>
                  <option value="online">Online Booking</option>
                </select>
              </div>
            </div>

            {bookingSource === 'travel_agent' && (
              <div className="pt-2 animate-fadeIn">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Select Travel Agent *</label>
                <select
                  value={travelAgentId}
                  onChange={(e) => setTravelAgentId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none"
                  required
                >
                  <option value="" >Choose Travel Agent...</option>
                  {travelAgents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.agentName} ({agent.commissionRate}% comm)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Meal Plan Picker (shown when meal plans are available) */}
          {mealPlans.length > 0 && (
            <div className="pt-2 animate-fadeIn">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Select Meal Plan *</label>
              <select
                value={selectedMealPlan ? selectedMealPlan.id : ''}
                onChange={(e) => {
                  const mp = mealPlans.find((m) => m.id === parseInt(e.target.value));
                  setSelectedMealPlan(mp || null);
                }}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none"
                required
              >
                <option value="">Choose Meal Plan...</option>
                {mealPlans.map((mp) => (
                  <option key={mp.id} value={mp.id}>
                    {mp.code} - {mp.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Rooms Availability List */}
          {checkIn && checkOut && (
            <div className="glass-card p-6 rounded-2xl space-y-4">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Users size={18} className="text-amber-500" />
                3. Choose Available Room
              </h2>

              {!selectedMealPlan ? (
                <p className="text-xs text-amber-400">Select a meal plan to load rooms with configured rates.</p>
              ) : searchingRooms ? (
                <div className="flex justify-center py-6">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent"></div>
                </div>
              ) : availableRooms.length === 0 ? (
                <p className="text-xs text-rose-400">No rooms available for the selected dates.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {availableRooms.map((room) => (
                    <div
                      key={room.id}
                      onClick={() => handleRoomSelect(room)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 flex justify-between items-center ${
                        selectedRoom?.id === room.id
                          ? 'bg-amber-500/10 border-amber-500 text-slate-200'
                          : 'glass-card hover:border-slate-700 text-slate-400'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-slate-200">Room {room.roomNumber}</p>
                        <p className="text-xs text-slate-400 mt-1">{room.roomType.typeName}</p>
                        <span className="text-[10px] text-slate-500">Floor: {room.floor ? room.floor.floorName : 'N/A'}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-xs font-semibold text-slate-300 block">Base Rate:</span>
                        <span className="font-mono text-sm font-bold text-amber-500">
                          LKR {Number(rateByRoomType[room.roomTypeId]).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Confirmation panel (1 col) */}
        <div>
          <div className="glass-card p-6 rounded-2xl sticky top-8 space-y-6">
            <h2 className="text-lg font-bold text-slate-100 border-b border-slate-800 pb-3">Booking Summary</h2>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Guest:</span>
                <span className="font-semibold text-slate-200 truncate max-w-[150px]">
                  {selectedGuest ? selectedGuest.fullName : 'Not Selected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dates:</span>
                <span className="font-semibold text-slate-200">
                  {checkIn && checkOut ? `${checkIn} to ${checkOut}` : 'Select dates'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Room:</span>
                <span className="font-semibold text-slate-200">
                  {selectedRoom ? `Room ${selectedRoom.roomNumber}` : 'Not Selected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Booking Source:</span>
                <span className="font-semibold text-slate-200 uppercase text-xs">
                  {bookingSource.replace('_', ' ')}
                </span>
              </div>
              {selectedMealPlan && (
                <div className="flex justify-between mt-2">
                  <span className="text-slate-400">Meal Plan:</span>
                  <span className="font-semibold text-slate-200">{selectedMealPlan.code} - {selectedMealPlan.name}</span>
                </div>
              )}
              {selectedMealPlan && selectedMealPlan.code === 'HB' && (
                <div className="pt-2">
                  <label className="text-xs text-slate-400 block mb-1">Half-Board Selection</label>
                  <div className="flex gap-2 text-sm">
                    <label className="inline-flex items-center gap-2">
                      <input type="radio" name="hb" value="LUNCH" checked={hbSelection==='LUNCH'} onChange={(e)=>setHbSelection(e.target.value)} /> Lunch
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input type="radio" name="hb" value="DINNER" checked={hbSelection==='DINNER'} onChange={(e)=>setHbSelection(e.target.value)} /> Dinner
                    </label>
                  </div>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-800 pt-4 items-center">
                <span className="text-slate-400 font-bold">Nightly Rate:</span>
                <div className="text-right">
                  <span className="font-mono font-bold text-amber-400 text-lg">LKR {calculatedRate.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-3">
                <label className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={guaranteed}
                    onChange={(e) => {
                      setGuaranteed(e.target.checked);
                      setError('');
                      if (!e.target.checked) setGuaranteeReason('');
                    }}
                    className="w-4 h-4 rounded"
                  />
                  <span className="font-semibold text-slate-200">Mark as Guaranteed</span>
                </label>

                {guaranteed && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Guarantee Reason *</label>
                    <input
                      type="text"
                      value={guaranteeReason}
                      onChange={(e) => { setGuaranteeReason(e.target.value); setError(''); }}
                      placeholder="Reason for guarantee (e.g. paid deposit, credit card guaranteed)"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none"
                    />
                  </div>
                )}

                <label className="flex items-center gap-3 text-sm pt-2">
                  <input
                    type="checkbox"
                    checked={isComplimentary}
                    onChange={(e) => {
                      setIsComplimentary(e.target.checked);
                      setError('');
                      if (!e.target.checked) setComplimentaryReason('');
                    }}
                    className="w-4 h-4 rounded"
                  />
                  <span className="font-semibold text-slate-200">Complimentary Stay</span>
                </label>

                {isComplimentary && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Reason for complimentary stay *</label>
                    <input
                      type="text"
                      value={complimentaryReason}
                      onChange={(e) => { setComplimentaryReason(e.target.value); setError(''); }}
                      placeholder="e.g. Owner's guest, service recovery, staff family"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleConfirmBooking}
              disabled={!selectedGuest || !selectedRoom}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-sm transition-all duration-300 shadow-lg shadow-amber-500/10"
            >
              Confirm Reservation
            </button>
          </div>
        </div>
      </div>

      {/* Add Guest Modal */}
      {showAddGuest && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass w-full max-w-md rounded-2xl p-8 relative">
            <h2 className="text-xl font-bold text-slate-100 mb-6">Create Guest Profile</h2>

            {guestError && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                {guestError}
              </div>
            )}

            <form onSubmit={handleCreateGuest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Name *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none"
                  required
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
                    placeholder="email@example.com"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nationality</label>
                  <input
                    type="text"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    placeholder="e.g. American"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">ID / Passport Number</label>
                  <input
                    type="text"
                    value={idPassportNo}
                    onChange={(e) => setIdPassportNo(e.target.value)}
                    placeholder="Passport passport/NIC no"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address..."
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none h-16 resize-none"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddGuest(false)}
                  className="flex-1 py-2.5 bg-slate-900 border border-slate-800 text-slate-400 font-semibold rounded-xl text-sm hover:border-slate-700 hover:text-slate-200 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm transition-all duration-300"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewReservation;
