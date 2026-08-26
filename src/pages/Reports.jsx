import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart3, 
  Calendar, 
  DollarSign, 
  Users, 
  History, 
  Settings, 
  Download, 
  Printer, 
  RefreshCw, 
  Search, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight,
  ShieldAlert,
  Loader2,
  AlertCircle,
  TrendingUp,
  Percent,
  CheckCircle2,
  XCircle,
  FileText,
  Hotel
} from 'lucide-react';
import * as reportsApi from '../api/reports';
import mealPlanApi from '../api/mealPlans';

const Reports = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Navigation state
  const [activeCategory, setActiveCategory] = useState('Dashboard');
  const [activeReport, setActiveReport] = useState('Dashboard Summary');

  // Query filters state
  const [filters, setFilters] = useState({
    dateFrom: new Date().toISOString().slice(0, 10),
    dateTo: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
    mealPlan: '',
    status: '',
    minVisits: '3',
    page: 1,
    limit: 20
  });

  // Check-in Report independent filters
  const [checkInFilterType, setCheckInFilterType] = useState('single');
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().slice(0, 10));
  const [checkInDateFrom, setCheckInDateFrom] = useState(new Date().toISOString().slice(0, 10));
  const [checkInDateTo, setCheckInDateTo] = useState(new Date().toISOString().slice(0, 10));

  // Check-out Report independent filters
  const [checkOutFilterType, setCheckOutFilterType] = useState('single');
  const [checkOutDate, setCheckOutDate] = useState(new Date().toISOString().slice(0, 10));
  const [checkOutDateFrom, setCheckOutDateFrom] = useState(new Date().toISOString().slice(0, 10));
  const [checkOutDateTo, setCheckOutDateTo] = useState(new Date().toISOString().slice(0, 10));

  // Table sorting state
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // API Data state
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [mealPlans, setMealPlans] = useState([]);
  const [mealPlansLoading, setMealPlansLoading] = useState(false);

  // Categories definition
  const categories = [
    { id: 'Dashboard', label: 'Dashboard', icon: BarChart3, roles: ['admin', 'front_office', 'cashier'] },
    { id: 'Reservations', label: 'Reservations', icon: Calendar, roles: ['admin', 'front_office', 'cashier'] },
    { id: 'Rooms', label: 'Rooms', icon: TrendingUp, roles: ['admin', 'front_office'] },
    { id: 'Check-in', label: 'Check-in/Out', icon: Users, roles: ['admin', 'front_office'] },
    { id: 'Financial', label: 'Financial', icon: DollarSign, roles: ['admin'] },
    { id: 'Guests', label: 'Guests', icon: History, roles: ['admin', 'front_office'] },
    { id: 'Audit', label: 'Audit Log', icon: Settings, roles: ['admin'] }
  ];

  // Specific reports map
  const reportsList = {
    Dashboard: ['Dashboard Summary'],
    Reservations: ['Daily Reservations', 'Upcoming Reservations', 'Reservation Status', 'Cancellations', 'No-Shows', 'Meal Plan Distribution'],
    Rooms: ['Room Availability', 'Room Occupancy', 'Room Status', 'Room Type Occupancy'],
    'Check-in': ['Daily Check-ins', 'Daily Check-outs', 'Expected Arrivals', 'Expected Departures'],
    Financial: [
      'Daily Revenue', 'Monthly Revenue', 'Revenue by Room Type', 
      'Revenue by Booking Source', 'Payment Collection', 'Outstanding Payments', 
      'Refunds Report', 'Discounts Report', 'Taxes Report'
    ],
    Guests: ['Guest List', 'Frequent Guests'],
    Audit: ['User Activity Log', 'Reservation Audit Log', 'Payment Audit Log']
  };

  // Change category helper
  const selectCategory = (catId) => {
    setActiveCategory(catId);
    setActiveReport(reportsList[catId][0]);
    // Reset page on filter changes
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  // Trigger Fetching
  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      let res;
      const apiParams = {
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        status: filters.status,
        minVisits: filters.minVisits,
        page: filters.page,
        limit: filters.limit
      };

      switch (activeReport) {
        // Dashboard
        case 'Dashboard Summary':
          res = await reportsApi.getDashboardSummary();
          break;
        // Reservations
        case 'Daily Reservations':
          res = await reportsApi.getDailyReservations({ date: filters.dateFrom, page: filters.page, limit: filters.limit, mealPlan: filters.mealPlan });
          break;
        case 'Upcoming Reservations':
          res = await reportsApi.getUpcomingReservations({ dateFrom: filters.dateFrom, page: filters.page, limit: filters.limit, mealPlan: filters.mealPlan });
          break;
        case 'Reservation Status':
          res = await reportsApi.getReservationStatus({ status: filters.status, page: filters.page, limit: filters.limit, mealPlan: filters.mealPlan });
          break;
        case 'Cancellations':
          res = await reportsApi.getCancellations({ dateFrom: filters.dateFrom, dateTo: filters.dateTo, page: filters.page, limit: filters.limit, mealPlan: filters.mealPlan });
          break;
        case 'No-Shows':
          res = await reportsApi.getNoShows({ dateFrom: filters.dateFrom, dateTo: filters.dateTo, page: filters.page, limit: filters.limit, mealPlan: filters.mealPlan });
          break;
        case 'Meal Plan Distribution':
          res = await reportsApi.getMealPlanDistribution({ dateFrom: filters.dateFrom, dateTo: filters.dateTo, mealPlan: filters.mealPlan });
          break;
        // Rooms
        case 'Room Availability':
          res = await reportsApi.getRoomAvailability({ dateFrom: filters.dateFrom, dateTo: filters.dateTo });
          break;
        case 'Room Occupancy':
          res = await reportsApi.getRoomOccupancy({ date: filters.dateFrom });
          break;
        case 'Room Status':
          res = await reportsApi.getRoomStatus();
          break;
        case 'Room Type Occupancy':
          res = await reportsApi.getRoomTypeOccupancy({ date: filters.dateFrom });
          break;
        // Check-ins / outs
        case 'Daily Check-ins':
          if (checkInFilterType === 'single') {
            res = await reportsApi.getDailyCheckIns({ date: checkInDate, page: filters.page, limit: filters.limit });
          } else {
            if (checkInDateFrom > checkInDateTo) {
              throw new Error("From date cannot be later than To date.");
            }
            res = await reportsApi.getDailyCheckIns({ dateFrom: checkInDateFrom, dateTo: checkInDateTo, page: filters.page, limit: filters.limit });
          }
          break;
        case 'Daily Check-outs':
          if (checkOutFilterType === 'single') {
            res = await reportsApi.getDailyCheckOuts({ date: checkOutDate, page: filters.page, limit: filters.limit });
          } else {
            if (checkOutDateFrom > checkOutDateTo) {
              throw new Error("From date cannot be later than To date.");
            }
            res = await reportsApi.getDailyCheckOuts({ dateFrom: checkOutDateFrom, dateTo: checkOutDateTo, page: filters.page, limit: filters.limit });
          }
          break;
        case 'Expected Arrivals':
          res = await reportsApi.getExpectedArrivals({ date: filters.dateFrom, page: filters.page, limit: filters.limit });
          break;
        case 'Expected Departures':
          res = await reportsApi.getExpectedDepartures({ date: filters.dateFrom, page: filters.page, limit: filters.limit });
          break;
        // Financial (restricted)
        case 'Daily Revenue':
          res = await reportsApi.getDailyRevenue({ date: filters.dateFrom });
          break;
        case 'Monthly Revenue':
          const [year, month] = filters.dateFrom.split('-');
          res = await reportsApi.getMonthlyRevenue({ year, month });
          break;
        case 'Revenue by Room Type':
          res = await reportsApi.getRevenueByRoomType({ dateFrom: filters.dateFrom, dateTo: filters.dateTo });
          break;
        case 'Revenue by Booking Source':
          res = await reportsApi.getRevenueByBookingSource({ dateFrom: filters.dateFrom, dateTo: filters.dateTo });
          break;
        case 'Payment Collection':
          res = await reportsApi.getPaymentCollection({ dateFrom: filters.dateFrom, dateTo: filters.dateTo, page: filters.page, limit: filters.limit });
          break;
        case 'Outstanding Payments':
          res = await reportsApi.getOutstandingPayments({ page: filters.page, limit: filters.limit });
          break;
        case 'Refunds Report':
          res = await reportsApi.getRefunds({ dateFrom: filters.dateFrom, dateTo: filters.dateTo, page: filters.page, limit: filters.limit });
          break;
        case 'Discounts Report':
          res = await reportsApi.getDiscounts({ dateFrom: filters.dateFrom, dateTo: filters.dateTo, page: filters.page, limit: filters.limit });
          break;
        case 'Taxes Report':
          res = await reportsApi.getTaxes({ dateFrom: filters.dateFrom, dateTo: filters.dateTo, page: filters.page, limit: filters.limit });
          break;
        // Guests
        case 'Guest List':
          res = await reportsApi.getGuests({ page: filters.page, limit: filters.limit });
          break;
        case 'Frequent Guests':
          res = await reportsApi.getFrequentGuests({ minVisits: filters.minVisits });
          break;
        // Audit
        case 'User Activity Log':
          res = await reportsApi.getUserActivity({ dateFrom: filters.dateFrom, dateTo: filters.dateTo, page: filters.page, limit: filters.limit });
          break;
        case 'Reservation Audit Log':
          res = await reportsApi.getReservationAudit({ dateFrom: filters.dateFrom, dateTo: filters.dateTo, page: filters.page, limit: filters.limit });
          break;
        case 'Payment Audit Log':
          res = await reportsApi.getPaymentAudit({ dateFrom: filters.dateFrom, dateTo: filters.dateTo, page: filters.page, limit: filters.limit });
          break;
        default:
          throw new Error('Unsupported report selection');
      }

      if (res && res.data) {
        setData(res.data.data);
        if (res.data.meta) {
          setTotalRecords(res.data.meta.total || 0);
        } else {
          setTotalRecords(Array.isArray(res.data.data) ? res.data.data.length : 0);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Failed to calculate report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [
    activeReport, filters.page, filters.limit,
    checkInFilterType, checkInDate, checkInDateFrom, checkInDateTo,
    checkOutFilterType, checkOutDate, checkOutDateFrom, checkOutDateTo
  ]);

  // Load active meal plans for filter dropdown
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setMealPlansLoading(true);
      try {
        const res = await mealPlanApi.getMealPlans({ active: true });
        if (mounted && res?.data) setMealPlans(res.data);
      } catch (err) {
        console.error('Failed to load meal plans', err);
      } finally {
        if (mounted) setMealPlansLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const getReportSummaryText = () => {
    const formatDateFriendly = (dateStr) => {
      if (!dateStr) return '';
      const parts = dateStr.split('-');
      if (parts.length !== 3) return dateStr;
      const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
      return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
    };

    if (activeReport === 'Daily Check-ins') {
      if (checkInFilterType === 'single') {
        return {
          title: `Check-ins for ${formatDateFriendly(checkInDate)}`,
          kpi: `Total Check-ins: ${totalRecords}`
        };
      } else {
        return {
          title: `Check-ins from ${formatDateFriendly(checkInDateFrom)} to ${formatDateFriendly(checkInDateTo)}`,
          kpi: `Total Check-ins: ${totalRecords}`
        };
      }
    }

    if (activeReport === 'Daily Check-outs') {
      if (checkOutFilterType === 'single') {
        return {
          title: `Check-outs for ${formatDateFriendly(checkOutDate)}`,
          kpi: `Total Check-outs: ${totalRecords}`
        };
      } else {
        return {
          title: `Check-outs from ${formatDateFriendly(checkOutDateFrom)} to ${formatDateFriendly(checkOutDateTo)}`,
          kpi: `Total Check-outs: ${totalRecords}`
        };
      }
    }

    return null;
  };

  // Export helper
  const handleExportCSV = () => {
    let rows = [];
    if (Array.isArray(data)) {
      rows = data;
    } else if (data && typeof data === 'object') {
      if (data.reservations && Array.isArray(data.reservations)) {
        rows = data.reservations;
      } else {
        rows = [data];
      }
    }

    if (rows.length === 0) return;

    // Flatten keys
    const headers = Object.keys(rows[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const row of rows) {
      const values = headers.map(header => {
        const val = row[header];
        // Handle object sub-structures
        if (typeof val === 'object' && val !== null) {
          return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
        }
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeReport.toLowerCase().replace(/ /g, '_')}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print helper
  const handlePrint = () => {
    window.print();
  };

  // Dynamic filters layout
  const renderFilterInputs = () => {
    if (activeReport === 'Daily Check-ins') {
      return (
        <div className="flex flex-wrap gap-6 items-end bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 mb-6 print:hidden no-print">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Filter Type</span>
            <div className="flex gap-4 py-2">
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input 
                  type="radio" 
                  name="checkInFilterType" 
                  value="single" 
                  checked={checkInFilterType === 'single'} 
                  onChange={() => setCheckInFilterType('single')}
                  className="accent-amber-500"
                />
                Single Date
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input 
                  type="radio" 
                  name="checkInFilterType" 
                  value="range" 
                  checked={checkInFilterType === 'range'} 
                  onChange={() => setCheckInFilterType('range')}
                  className="accent-amber-500"
                />
                Date Range
              </label>
            </div>
          </div>

          {checkInFilterType === 'single' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Check-in Date</label>
              <input 
                type="date"
                value={checkInDate}
                onChange={e => setCheckInDate(e.target.value)}
                className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3.5 py-2 text-sm focus:border-amber-500/50 outline-none"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">From</label>
                <input 
                  type="date"
                  value={checkInDateFrom}
                  onChange={e => setCheckInDateFrom(e.target.value)}
                  className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3.5 py-2 text-sm focus:border-amber-500/50 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">To</label>
                <input 
                  type="date"
                  value={checkInDateTo}
                  onChange={e => setCheckInDateTo(e.target.value)}
                  className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3.5 py-2 text-sm focus:border-amber-500/50 outline-none"
                />
              </div>
            </>
          )}

          <div className="flex gap-2">
            <button 
              onClick={fetchReport}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2 rounded-lg text-sm font-bold transition shadow-lg shadow-amber-500/10"
            >
              Search
            </button>
            <button 
              onClick={() => {
                setCheckInFilterType('single');
                const todayStr = new Date().toISOString().slice(0, 10);
                setCheckInDate(todayStr);
                setCheckInDateFrom(todayStr);
                setCheckInDateTo(todayStr);
                setFilters(prev => ({ ...prev, page: 1 }));
              }}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm font-semibold transition"
            >
              Reset
            </button>
          </div>
        </div>
      );
    }

    // Meal Plan filter input for reservation reports
    if (activeCategory === 'Reservations' || activeReport === 'Meal Plan Distribution') {
      return (
        <div className="flex flex-wrap gap-6 items-end bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 mb-6 print:hidden no-print">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Meal Plan</label>
            <select
              value={filters.mealPlan}
              onChange={(e) => setFilters(prev => ({ ...prev, mealPlan: e.target.value, page: 1 }))}
              className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3.5 py-2 text-sm focus:border-amber-500/50 outline-none"
            >
              <option value="">All Meal Plans</option>
              {mealPlansLoading && <option>Loading...</option>}
              {mealPlans.map(mp => (
                <option key={mp.id} value={mp.code}>{mp.code} - {mp.name}</option>
              ))}
            </select>
          </div>
        </div>
      );
    }

    if (activeReport === 'Daily Check-outs') {
      return (
        <div className="flex flex-wrap gap-6 items-end bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 mb-6 print:hidden no-print">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Filter Type</span>
            <div className="flex gap-4 py-2">
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input 
                  type="radio" 
                  name="checkOutFilterType" 
                  value="single" 
                  checked={checkOutFilterType === 'single'} 
                  onChange={() => setCheckOutFilterType('single')}
                  className="accent-amber-500"
                />
                Single Date
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input 
                  type="radio" 
                  name="checkOutFilterType" 
                  value="range" 
                  checked={checkOutFilterType === 'range'} 
                  onChange={() => setCheckOutFilterType('range')}
                  className="accent-amber-500"
                />
                Date Range
              </label>
            </div>
          </div>

          {checkOutFilterType === 'single' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Check-out Date</label>
              <input 
                type="date"
                value={checkOutDate}
                onChange={e => setCheckOutDate(e.target.value)}
                className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3.5 py-2 text-sm focus:border-amber-500/50 outline-none"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">From</label>
                <input 
                  type="date"
                  value={checkOutDateFrom}
                  onChange={e => setCheckOutDateFrom(e.target.value)}
                  className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3.5 py-2 text-sm focus:border-amber-500/50 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">To</label>
                <input 
                  type="date"
                  value={checkOutDateTo}
                  onChange={e => setCheckOutDateTo(e.target.value)}
                  className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3.5 py-2 text-sm focus:border-amber-500/50 outline-none"
                />
              </div>
            </>
          )}

          <div className="flex gap-2">
            <button 
              onClick={fetchReport}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2 rounded-lg text-sm font-bold transition shadow-lg shadow-amber-500/10"
            >
              Search
            </button>
            <button 
              onClick={() => {
                setCheckOutFilterType('single');
                const todayStr = new Date().toISOString().slice(0, 10);
                setCheckOutDate(todayStr);
                setCheckOutDateFrom(todayStr);
                setCheckOutDateTo(todayStr);
                setFilters(prev => ({ ...prev, page: 1 }));
              }}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm font-semibold transition"
            >
              Reset
            </button>
          </div>
        </div>
      );
    }

    const showDateFrom = [
      'Daily Reservations', 'Upcoming Reservations', 'Cancellations', 'No-Shows',
      'Room Availability', 'Room Occupancy', 'Room Type Occupancy',
      'Expected Arrivals', 'Expected Departures', 'Daily Revenue',
      'Monthly Revenue', 'Revenue by Room Type', 'Revenue by Booking Source',
      'Payment Collection', 'Refunds Report', 'Discounts Report', 'Taxes Report',
      'User Activity Log', 'Reservation Audit Log', 'Payment Audit Log'
    ].includes(activeReport);

    const showDateTo = [
      'Cancellations', 'No-Shows', 'Room Availability', 'Revenue by Room Type', 
      'Revenue by Booking Source', 'Payment Collection', 'Refunds Report', 
      'Discounts Report', 'Taxes Report', 'User Activity Log', 
      'Reservation Audit Log', 'Payment Audit Log'
    ].includes(activeReport);

    const showStatus = ['Reservation Status'].includes(activeReport);
    const showFrequent = ['Frequent Guests'].includes(activeReport);

    return (
      <div className="flex flex-wrap gap-4 items-end bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 mb-6 print:hidden no-print">
        {showDateFrom && (
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              {activeReport === 'Monthly Revenue' ? 'Month / Year' : 'Date / From'}
            </label>
            <input 
              type={activeReport === 'Monthly Revenue' ? 'month' : 'date'}
              value={filters.dateFrom}
              onChange={e => setFilters(prev => ({ ...prev, dateFrom: e.target.value, page: 1 }))}
              className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3.5 py-2 text-sm focus:border-amber-500/50 outline-none"
            />
          </div>
        )}

        {showDateTo && (
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Date To</label>
            <input 
              type="date"
              value={filters.dateTo}
              onChange={e => setFilters(prev => ({ ...prev, dateTo: e.target.value, page: 1 }))}
              className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3.5 py-2 text-sm focus:border-amber-500/50 outline-none"
            />
          </div>
        )}

        {showStatus && (
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Reservation Status</label>
            <select
              value={filters.status}
              onChange={e => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
              className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3.5 py-2 text-sm focus:border-amber-500/50 outline-none"
            >
              <option value="">All Statuses</option>
              <option value="tentative">Tentative</option>
              <option value="guaranteed">Guaranteed</option>
              <option value="room_assigned">Room Assigned</option>
              <option value="checked_in">Checked In</option>
              <option value="in_house">In House</option>
              <option value="checked_out">Checked Out</option>
              <option value="closed">Closed</option>
              <option value="no_show">No Show</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        )}

        {showFrequent && (
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Minimum Stays</label>
            <input 
              type="number"
              min="1"
              value={filters.minVisits}
              onChange={e => setFilters(prev => ({ ...prev, minVisits: e.target.value }))}
              className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3.5 py-2 text-sm focus:border-amber-500/50 outline-none w-28"
            />
          </div>
        )}

        <button 
          onClick={fetchReport}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm font-semibold transition"
        >
          <RefreshCw size={15} />
          Reload
        </button>
      </div>
    );
  };

  // Rendering table headers and rows based on active report
  const renderReportContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="animate-spin text-amber-500" size={32} />
          <p className="text-slate-400 text-sm">Aggregating report database entries...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-3 bg-rose-500/5 border border-rose-500/10 rounded-xl">
          <AlertCircle className="text-rose-500" size={36} />
          <p className="text-rose-400 font-semibold">Report compilation error</p>
          <p className="text-slate-400 text-xs">{error}</p>
        </div>
      );
    }

    if (!data || (Array.isArray(data) && data.length === 0)) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-slate-900/20 border border-slate-900 rounded-xl">
          <FileText className="text-slate-600" size={40} />
          <p className="text-slate-400 font-medium">No records found for the selected filters</p>
        </div>
      );
    }

    // A. DASHBOARD VIEW
    if (activeReport === 'Dashboard Summary') {
      return (
        <div className="space-y-8">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Occupancy Rate', val: `${data.occupancyPercentage}%`, icon: Percent, color: 'text-amber-500' },
              { label: 'Today Revenue', val: `LKR ${data.todayRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-500' },
              { label: 'ADR', val: `LKR ${data.adr.toLocaleString()}`, icon: CheckCircle2, color: 'text-sky-500' },
              { label: 'RevPAR', val: `LKR ${data.revpar.toLocaleString()}`, icon: TrendingUp, color: 'text-indigo-500' },
              { label: 'Occupied Rooms', val: `${data.occupiedRooms} / ${data.totalRooms}`, icon: Hotel, color: 'text-slate-400' },
              { label: 'Expected Arrivals', val: data.todayCheckIns, icon: Users, color: 'text-slate-400' },
              { label: 'Expected Departures', val: data.todayCheckOuts, icon: Users, color: 'text-slate-400' },
              { label: 'Folio Outstanding', val: `LKR ${data.outstandingPayments.toLocaleString()}`, icon: XCircle, color: 'text-rose-400' }
            ].map(k => {
              const Icon = k.icon;
              return (
                <div key={k.label} className="bg-slate-900/60 p-5 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{k.label}</span>
                    <Icon className={k.color} size={18} />
                  </div>
                  <p className="text-xl font-bold text-slate-100">{k.val}</p>
                </div>
              );
            })}
          </div>

          {/* Graphical Trends (Native responsive SVG charts) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Occupancy Trend Gauge chart */}
            <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-800">
              <h3 className="font-bold text-sm text-slate-300 mb-4 uppercase tracking-wider">Occupancy Allocation</h3>
              <div className="flex justify-center py-6 relative">
                <svg width="200" height="120" viewBox="0 0 200 120">
                  <path d="M20,110 A80,80 0 0,1 180,110" fill="none" stroke="#1e293b" strokeWidth="18" strokeLinecap="round" />
                  <path 
                    d="M20,110 A80,80 0 0,1 180,110" 
                    fill="none" 
                    stroke="#f59e0b" 
                    strokeWidth="18" 
                    strokeLinecap="round" 
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * data.occupancyPercentage) / 100}
                  />
                </svg>
                <div className="absolute bottom-4 flex flex-col items-center">
                  <span className="text-2xl font-black text-slate-100">{data.occupancyPercentage}%</span>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">Occupied Stays</span>
                </div>
              </div>
            </div>

            {/* Revenue Trend visualization */}
            <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-800">
              <h3 className="font-bold text-sm text-slate-300 mb-4 uppercase tracking-wider">Revenue Breakdown</h3>
              <div className="space-y-4 py-3">
                {[
                  { label: 'Today Room Revenue', val: data.todayRevenue, color: 'bg-amber-500' },
                  { label: 'This Month Total Revenue', val: data.monthlyRevenue, color: 'bg-emerald-500' },
                  { label: 'Net Outstanding Folios', val: data.outstandingPayments, color: 'bg-rose-500' }
                ].map(r => (
                  <div key={r.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{r.label}</span>
                      <span className="font-semibold text-slate-200">LKR {r.val.toLocaleString()}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                      <div className={`h-full ${r.color}`} style={{ width: `${Math.min((r.val / Math.max(data.monthlyRevenue, 1)) * 100, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // B. LIST / TABLES VIEW
    let rows = [];
    let isGuestHistory = false;
    let guestInfo = null;

    if (Array.isArray(data)) {
      rows = data;
    } else if (data && typeof data === 'object') {
      if (data.reservations && Array.isArray(data.reservations)) {
        rows = data.reservations;
        isGuestHistory = true;
        guestInfo = data.guest || null;
      } else {
        rows = [data];
      }
    }

    if (rows.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-slate-900/20 border border-slate-900 rounded-xl">
          <FileText className="text-slate-600" size={40} />
          <p className="text-slate-400 font-medium">No records found for the selected filters</p>
        </div>
      );
    }

    const columns = Object.keys(rows[0]).filter(k => k !== 'id');
    const summary = getReportSummaryText();

    return (
      <div className="space-y-6">
        {summary && (
          <div className="flex justify-between items-center bg-slate-900/40 px-5 py-4 rounded-xl border border-slate-800/80">
            <span className="text-sm font-bold text-slate-200">{summary.title}</span>
            <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">{summary.kpi}</span>
          </div>
        )}
        {isGuestHistory && guestInfo && (
          <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Guest Name</span>
              <span className="text-sm font-bold text-slate-200">{guestInfo.fullName}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Email Address</span>
              <span className="text-sm font-bold text-slate-200">{guestInfo.email || 'N/A'}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Phone Number</span>
              <span className="text-sm font-bold text-slate-200">{guestInfo.phone || 'N/A'}</span>
            </div>
          </div>
        )}
        <div className="bg-slate-900/60 rounded-xl border border-slate-800/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40">
                  {columns.map(col => (
                    <th key={col} className="px-5 py-4 font-semibold text-slate-400 uppercase tracking-wider text-xs">
                      {col.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                    {columns.map(col => {
                      const val = row[col];
                      let displayVal = String(val);

                      // Handle objects (like Guest name or Room details)
                      if (typeof val === 'object' && val !== null) {
                        displayVal = val.fullName || val.roomNumber || JSON.stringify(val);
                      }
                      if (col.toLowerCase().includes('date') || col.toLowerCase().includes('at')) {
                        displayVal = new Date(val).toLocaleDateString() + ' ' + (new Date(val).toLocaleTimeString() !== '12:00:00 AM' ? new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');
                      }

                      // Format amounts
                      if (typeof val === 'number' && (col.toLowerCase().includes('amount') || col.toLowerCase().includes('revenue') || col.toLowerCase().includes('rate') || col.toLowerCase().includes('spending') || col.toLowerCase().includes('outstanding') || col.toLowerCase().includes('total') || col.toLowerCase().includes('paid'))) {
                        displayVal = 'LKR ' + val.toLocaleString();
                      }

                      return (
                        <td key={col} className="px-5 py-4 text-slate-300 font-medium whitespace-nowrap max-w-xs truncate">
                          {displayVal}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Security authorization lock out check
  const hasAccess = (() => {
    const activeCategoryItem = categories.find(c => c.id === activeCategory);
    return activeCategoryItem && activeCategoryItem.roles.includes(user?.role);
  })();

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 bg-slate-900/30 border border-slate-900 rounded-2xl max-w-2xl mx-auto mt-10">
        <div className="p-3.5 bg-rose-500/10 rounded-2xl text-rose-500 border border-rose-500/20">
          <ShieldAlert size={36} />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-200">Access Restricted</h2>
          <p className="text-slate-400 text-sm mt-1 px-6">This category contains financial audits that are only available to System Administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Main Header Title & Printable Layout Section */}
      <div className="flex justify-between items-center print:hidden no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight uppercase">{activeReport}</h1>
          <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase mt-0.5">PMS Reports Subsystem</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition"
          >
            <Printer size={16} />
            Print Report
          </button>
          {data && activeReport !== 'Dashboard Summary' && (
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2.5 rounded-xl text-sm font-black transition shadow-lg shadow-amber-500/10"
            >
              <Download size={16} />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* 2. Category list & Sub-reports tabs wrapper */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side: Sidebar categories menu */}
        <div className="w-full lg:w-64 space-y-2 print:hidden no-print">
          {categories
            .filter(cat => cat.roles.includes(user?.role))
            .map(cat => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => selectCategory(cat.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    isActive 
                      ? 'bg-slate-900 text-amber-500 border-l-2 border-amber-500 shadow-md' 
                      : 'text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'
                  }`}
                >
                  <Icon size={17} />
                  {cat.label}
                </button>
              );
            })}
        </div>

        {/* Right Side: Specific Sub-report selector & Content rendering area */}
        <div className="flex-1 min-w-0">
          {/* Sub-reports selector tabs bar */}
          {reportsList[activeCategory].length > 1 && (
            <div className="flex flex-wrap gap-2 mb-4 border-b border-slate-900 pb-3 print:hidden no-print">
              {reportsList[activeCategory].map(rep => (
                <button
                  key={rep}
                  onClick={() => {
                    setActiveReport(rep);
                    setFilters(prev => ({ ...prev, page: 1 }));
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                    activeReport === rep
                      ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                      : 'bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                  }`}
                >
                  {rep}
                </button>
              ))}
            </div>
          )}

          {/* Report Filters block */}
          {renderFilterInputs()}

          {/* PRINT ONLY HEADER */}
          <div className="hidden print:block mb-8">
            <h1 className="text-3xl font-bold text-black uppercase tracking-wider mb-2">SYNORA PMS Property Management</h1>
            <p className="text-md text-gray-700 uppercase tracking-widest font-semibold">Reports Ledger: {activeReport}</p>
            <div className="grid grid-cols-2 text-xs text-gray-500 mt-4 border-t border-b border-gray-300 py-3 gap-2">
              <div><strong>Generated:</strong> {new Date().toLocaleString()}</div>
              <div><strong>User Profile:</strong> {user?.fullName} ({user?.role.toUpperCase()})</div>
              {activeReport === 'Daily Check-ins' && (
                <div><strong>Selected Filter:</strong> {checkInFilterType === 'single' ? checkInDate : `${checkInDateFrom} to ${checkInDateTo}`}</div>
              )}
              {activeReport === 'Daily Check-outs' && (
                <div><strong>Selected Filter:</strong> {checkOutFilterType === 'single' ? checkOutDate : `${checkOutDateFrom} to ${checkOutDateTo}`}</div>
              )}
              {activeReport !== 'Daily Check-ins' && activeReport !== 'Daily Check-outs' && (
                <>
                  <div><strong>Start Bound:</strong> {filters.dateFrom}</div>
                  <div><strong>End Bound:</strong> {filters.dateTo}</div>
                </>
              )}
            </div>
          </div>

          {/* Central Report Data Render */}
          {renderReportContent()}

          {/* Pagination controls for lists */}
          {Array.isArray(data) && data.length > 0 && totalRecords > filters.limit && (
            <div className="flex justify-between items-center mt-6 print:hidden no-print">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Showing {((filters.page - 1) * filters.limit) + 1} - {Math.min(filters.page * filters.limit, totalRecords)} of {totalRecords} records
              </span>
              <div className="flex gap-2">
                <button
                  disabled={filters.page === 1}
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                  className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={filters.page * filters.limit >= totalRecords}
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                  className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
