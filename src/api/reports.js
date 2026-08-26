import api from './index';

export const getDashboardSummary = () => api.get('/reports/dashboard/summary');

// Reservation Reports
export const getDailyReservations = (params) => api.get('/reports/reservations/daily', { params });
export const getUpcomingReservations = (params) => api.get('/reports/reservations/upcoming', { params });
export const getReservationStatus = (params) => api.get('/reports/reservations/status', { params });
export const getCancellations = (params) => api.get('/reports/reservations/cancellations', { params });
export const getNoShows = (params) => api.get('/reports/reservations/no-shows', { params });

// Meal Plan reports
export const getMealPlanDistribution = (params) => api.get('/reports/meal-plans/distribution', { params });

// Room Reports
export const getRoomAvailability = (params) => api.get('/reports/rooms/availability', { params });
export const getRoomOccupancy = (params) => api.get('/reports/rooms/occupancy', { params });
export const getRoomStatus = () => api.get('/reports/rooms/status');
export const getRoomTypeOccupancy = (params) => api.get('/reports/rooms/type-occupancy', { params });

// Check-ins / Check-outs
export const getDailyCheckIns = (params) => api.get('/reports/check-ins/daily', { params });
export const getDailyCheckOuts = (params) => api.get('/reports/check-outs/daily', { params });
export const getExpectedArrivals = (params) => api.get('/reports/check-ins/expected-arrivals', { params });
export const getExpectedDepartures = (params) => api.get('/reports/check-outs/expected-departures', { params });

// Financial Reports
export const getDailyRevenue = (params) => api.get('/reports/financial/daily-revenue', { params });
export const getMonthlyRevenue = (params) => api.get('/reports/financial/monthly-revenue', { params });
export const getRevenueByRoomType = (params) => api.get('/reports/financial/revenue-by-room-type', { params });
export const getRevenueByBookingSource = (params) => api.get('/reports/financial/revenue-by-booking-source', { params });
export const getPaymentCollection = (params) => api.get('/reports/financial/payment-collection', { params });
export const getOutstandingPayments = (params) => api.get('/reports/financial/outstanding', { params });
export const getRefunds = (params) => api.get('/reports/financial/refunds', { params });
export const getDiscounts = (params) => api.get('/reports/financial/discounts', { params });
export const getTaxes = (params) => api.get('/reports/financial/taxes', { params });

// Guest Reports
export const getGuests = (params) => api.get('/reports/guests', { params });
export const getGuestHistory = (guestId) => api.get(`/reports/guests/${guestId}/history`);
export const getFrequentGuests = (params) => api.get('/reports/guests/frequent', { params });

// Audit Reports
export const getUserActivity = (params) => api.get('/reports/audit/user-activity', { params });
export const getReservationAudit = (params) => api.get('/reports/audit/reservations', { params });
export const getPaymentAudit = (params) => api.get('/reports/audit/payments', { params });
