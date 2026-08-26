import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

import { 
  Search, 
  Printer, 
  Plus, 
  CreditCard, 
  RefreshCw,
  AlertCircle,
  Calendar,
  Layers,
  FileText,
  DollarSign,
  Briefcase,
  XCircle,
  FileSpreadsheet,
  Bell
} from 'lucide-react';

import { isReservationLocked } from '../utils/reservationGuards';
import { formatReservationStatus, getReservationStatusClasses, normalizeReservationStatus } from '../utils/reservationStatus';
import CheckoutAction from '../components/CheckoutAction/CheckoutAction';

const Reservations = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Highlight check from quick confirmation
  const queryParams = new URLSearchParams(location.search);
  const highlightConfo = queryParams.get('newConfo') || '';

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [selectedRes, setSelectedRes] = useState(null);
  
  // Tab control
  const [activeTab, setActiveTab] = useState('general');
  const [folio, setFolio] = useState(null);
  const [folioLoading, setFolioLoading] = useState(false);
  const [chargeTypes, setChargeTypes] = useState([]);

  // Post Charge state
  const [showPostCharge, setShowPostCharge] = useState(false);
  const [chargeTypeSelected, setChargeTypeSelected] = useState('');
  const [chargeAmount, setChargeAmount] = useState('');
  const [chargeDesc, setChargeDesc] = useState('');
  const [postChargeError, setPostChargeError] = useState('');

  // Void Charge state
  const [showVoidDialog, setShowVoidDialog] = useState(false);
  const [chargeToVoid, setChargeToVoid] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const [voidError, setVoidError] = useState('');

  // Payment Modal state
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payType, setPayType] = useState('cash');
  const [paymentCategory, setPaymentCategory] = useState('advance');
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState('');

  // Refund Modal state
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [selectedRefundPayment, setSelectedRefundPayment] = useState(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundMethod, setRefundMethod] = useState('cash');
  const [refundReference, setRefundReference] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundError, setRefundError] = useState('');
  const [refundSuccess, setRefundSuccess] = useState('');

  // Change Room state
  const [showRoomChange, setShowRoomChange] = useState(false);
  const [availRoomsForChange, setAvailRoomsForChange] = useState([]);
  const [selectedNewRoomId, setSelectedNewRoomId] = useState('');
  const [roomChangeError, setRoomChangeError] = useState('');

  // Invoice state
  const [invoiceDetails, setInvoiceDetails] = useState(null);
  const [savingInvoice, setSavingInvoice] = useState(false);

  // Edit dates state
  const [editCheckIn, setEditCheckIn] = useState('');
  const [editCheckOut, setEditCheckOut] = useState('');
  const [editCheckInTime, setEditCheckInTime] = useState('14:00');
  const [editCheckOutTime, setEditCheckOutTime] = useState('12:00');
  const [savingDates, setSavingDates] = useState(false);
  const [dateError, setDateError] = useState('');

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const start = dateFrom || today;
      const end = dateTo || today;
      console.log('Fetching reservations with URL:', `/reservations?search=${search}&status=${statusFilter}&startDate=${start}&endDate=${end}`);
      const res = await api.get(`/reservations?search=${search}&status=${statusFilter}&startDate=${start}&endDate=${end}`);
      setReservations(res.data);
      
      // Auto highlight/open details if confoNo matches highlight
      if (highlightConfo) {
        const found = res.data.find(r => r.confoNo === highlightConfo);
        if (found) {
          setSelectedRes(found);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchFolio = async (id) => {
    setFolioLoading(true);
    try {
      const res = await api.get(`/reservations/${id}/folio`);
      setFolio(res.data);
    } catch (e) {
      console.error('Error compiling folio:', e);
    } finally {
      setFolioLoading(false);
    }
  };

  const fetchChargeTypes = async () => {
    try {
      const res = await api.get('/reservations/charge-types');
      setChargeTypes(res.data);
    } catch (e) {
      console.error('Error fetching charge types:', e);
    }
  };

  useEffect(() => {
    fetchReservations();
    fetchChargeTypes();
  }, [search, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    if (selectedRes) {
      fetchFolio(selectedRes.id);
      setInvoiceDetails(null);
      setEditCheckIn(selectedRes.checkIn.slice(0, 10));
      setEditCheckOut(selectedRes.checkOut.slice(0, 10));
      setEditCheckInTime(selectedRes.expectedCheckInAt?.slice(11, 16) || '14:00');
      setEditCheckOutTime(selectedRes.expectedCheckOutAt?.slice(11, 16) || '12:00');
      setDateError('');
    }
  }, [selectedRes]);

  const datesChanged = selectedRes && (
    editCheckIn !== selectedRes.checkIn.slice(0, 10) ||
    editCheckOut !== selectedRes.checkOut.slice(0, 10) ||
    editCheckInTime !== (selectedRes.expectedCheckInAt?.slice(11, 16) || '14:00') ||
    editCheckOutTime !== (selectedRes.expectedCheckOutAt?.slice(11, 16) || '12:00')
  );

  const handleSaveDates = async () => {
    setDateError('');
    setSavingDates(true);
    try {
      const response = await api.put(`/reservations/${selectedRes.id}`, {
        checkIn: editCheckIn,
        checkOut: editCheckOut,
        expected_check_in_at: `${editCheckIn}T${editCheckInTime}:00Z`,
        expected_check_out_at: `${editCheckOut}T${editCheckOutTime}:00Z`,
      });
      // Reload reservation data
      setReservations(prev => prev.map(r => r.id === selectedRes.id ? response.data : r));
      setSelectedRes(response.data);
      fetchFolio(selectedRes.id);
    } catch (err) {
      setDateError(err.response?.data?.error || 'Failed to update reservation dates.');
    } finally {
      setSavingDates(false);
    }
  };

  const handleStatusChange = async (resId, newStatus) => {
    const normalizedTargetStatus = normalizeReservationStatus(newStatus);
    const hasBalanceDue = folio && typeof folio.totals?.balance === 'number' && folio.totals.balance > 0.009;

    // Block checkout if balance is outstanding — no bypass allowed
    if (normalizedTargetStatus === 'checked_out' && hasBalanceDue) {
      alert(`Outstanding balance of LKR ${folio.totals.balance.toLocaleString()} must be settled before checkout. No role can bypass payment settlement.`);
      return;
    }

    // Block completion if balance is outstanding
    if (normalizedTargetStatus === 'completed' && hasBalanceDue) {
      alert('Outstanding balance must be settled before completion. No role can bypass payment settlement.');
      return;
    }

    // Cancellation requires reason
    if (normalizedTargetStatus === 'cancelled') {
      const reason = window.prompt('Please provide a cancellation reason:');
      if (!reason || !reason.trim()) {
        alert('Cancellation reason is required.');
        return;
      }
      try {
        const response = await api.post(`/reservations/${resId}/cancel`, { reason: reason.trim() });
        setReservations(prev => prev.map(r => r.id === resId ? { ...r, status: response.data.status } : r));
        setSelectedRes(prev => prev && prev.id === resId ? { ...prev, status: response.data.status } : prev);
        fetchFolio(resId);
      } catch (err) {
        alert(err.response?.data?.error || 'Cancellation failed');
      }
      return;
    }

    // No-show via dedicated endpoint
    if (normalizedTargetStatus === 'no_show') {
      if (!window.confirm('Mark this reservation as No-Show? This action is irreversible.')) return;
      try {
        const response = await api.post(`/reservations/${resId}/no-show`);
        setReservations(prev => prev.map(r => r.id === resId ? { ...r, status: response.data.status } : r));
        setSelectedRes(prev => prev && prev.id === resId ? { ...prev, status: response.data.status } : prev);
        fetchFolio(resId);
      } catch (err) {
        alert(err.response?.data?.error || 'No-show marking failed');
      }
      return;
    }

    try {
      const response = await api.put(`/reservations/${resId}/status`, { status: newStatus });
      setReservations(prev => prev.map(r => r.id === resId ? { ...r, status: response.data.status } : r));
      setSelectedRes(prev => prev && prev.id === resId ? { ...prev, status: response.data.status } : prev);
      fetchFolio(resId);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update reservation status');
    }
  };

  const handleOpenRoomChange = async () => {
    if (!selectedRes) return;
    setShowRoomChange(true);
    setRoomChangeError('');
    try {
      const res = await api.get(`/rooms/availability?checkIn=${selectedRes.checkIn.slice(0, 10)}&checkOut=${selectedRes.checkOut.slice(0, 10)}`);
      setAvailRoomsForChange(res.data);
    } catch (e) {
      console.error(e);
      setRoomChangeError('Failed to load available rooms.');
    }
  };

  const handleChangeRoom = async (e) => {
    e.preventDefault();
    if (!selectedNewRoomId) return;
    try {
      const res = await api.put(`/reservations/${selectedRes.id}/change-room`, { newRoomId: selectedNewRoomId });
      setShowRoomChange(false);
      setSelectedNewRoomId('');
      // Reload reservation data
      const updatedRes = await api.get(`/reservations/${selectedRes.id}`);
      setSelectedRes(updatedRes.data);
      fetchReservations();
    } catch (err) {
      setRoomChangeError(err.response?.data?.error || 'Failed to move room.');
    }
  };

  const handlePostPayment = async (e) => {
    e.preventDefault();
    setPaymentError('');
    setPaymentSuccess('');
    if (!payAmount || parseFloat(payAmount) <= 0) {
      setPaymentError('Enter a valid payment amount.');
      return;
    }

    try {
      const response = await api.post('/payments', {
        reservationId: selectedRes.id,
        amount: parseFloat(payAmount),
        paymentMethod: payType,
        paymentCategory: paymentCategory,
        userId: user?.id
      });
      
      // Check if reservation status changed
      if (response.data.reservation && response.data.reservation.status !== selectedRes.status) {
        setPaymentSuccess(`✓ Payment posted. Reservation guaranteed!`);
        setTimeout(() => setPaymentSuccess(''), 4000);
      }
      
      setPayAmount('');
      setPaymentCategory('advance');
      setShowPaymentForm(false);
      // Reload reservation details to see updated payments and status
      const updatedRes = await api.get(`/reservations/${selectedRes.id}`);
      setSelectedRes(updatedRes.data);
      fetchFolio(selectedRes.id);
    } catch (err) {
      setPaymentError(err.response?.data?.error || 'Failed to post payment.');
    }
  };

  const handleRefund = async (e) => {
    e.preventDefault();
    setRefundError('');
    setRefundSuccess('');

    if (!selectedRes || !selectedRefundPayment) {
      setRefundError('Select a payment to refund.');
      return;
    }
    if (!refundAmount || Number(refundAmount) <= 0) {
      setRefundError('Enter a valid refund amount.');
      return;
    }
    if (!refundReason || !refundReason.trim()) {
      setRefundError('Refund reason is required.');
      return;
    }

    if (Number(refundAmount) > Number(selectedRefundPayment.refundableAmount || 0)) {
      setRefundError(`Refund exceeds the remaining refundable amount of LKR ${Number(selectedRefundPayment.refundableAmount || 0).toLocaleString()}.`);
      return;
    }

    try {
      await api.post(`/payments/${selectedRefundPayment.id}/refunds`, {
        reservationId: selectedRes.id,
        amount: Number(refundAmount),
        refundMethod,
        reference: refundReference || undefined,
        reason: refundReason,
      });

      setRefundAmount('');
      setRefundReference('');
      setRefundReason('');
      setRefundMethod('cash');
      setSelectedRefundPayment(null);
      setShowRefundForm(false);
      setRefundSuccess('Refund processed successfully.');
      setTimeout(() => setRefundSuccess(''), 3500);
      const updatedRes = await api.get(`/reservations/${selectedRes.id}`);
      setSelectedRes(updatedRes.data);
      fetchFolio(selectedRes.id);
    } catch (err) {
      setRefundError(err.response?.data?.error || 'Failed to process refund.');
    }
  };

  const handlePostCharge = async (e) => {
    e.preventDefault();
    setPostChargeError('');
    if (!chargeTypeSelected || !chargeAmount || parseFloat(chargeAmount) <= 0) {
      setPostChargeError('Please select a charge type and enter a valid amount.');
      return;
    }

    try {
      await api.post(`/reservations/${selectedRes.id}/charges`, {
        chargeTypeId: chargeTypeSelected,
        description: chargeDesc,
        amount: parseFloat(chargeAmount),
        postedBy: user?.id
      });
      setChargeTypeSelected('');
      setChargeAmount('');
      setChargeDesc('');
      setShowPostCharge(false);
      fetchFolio(selectedRes.id);
    } catch (err) {
      setPostChargeError(err.response?.data?.error || 'Failed to post guest charge.');
    }
  };

  const handleVoidCharge = async (e) => {
    e.preventDefault();
    setVoidError('');
    if (!voidReason) {
      setVoidError('Void reason is required.');
      return;
    }

    try {
      await api.put(`/reservations/charges/${chargeToVoid.id}/void`, {
        voidReason
      });
      setVoidReason('');
      setChargeToVoid(null);
      setShowVoidDialog(false);
      fetchFolio(selectedRes.id);
    } catch (err) {
      setVoidError(err.response?.data?.error || 'Failed to void charge.');
    }
  };

  const handleGenerateInvoice = async (res) => {
    const checkInDate = new Date(res.checkIn);
    const checkOutDate = new Date(res.checkOut);
    const diffTime = Math.abs(checkOutDate - checkInDate);
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    const roomRevenue = res.rate * nights;

    try {
      const response = await api.get(`/travel-agent-invoices/calculate?roomRevenue=${roomRevenue}`);
      const data = response.data;

      const inv = {
        confoNo: res.confoNo,
        guestName: res.guest.fullName,
        agentName: res.travelAgent?.agentName || 'Direct Booking',
        commissionRate: res.travelAgent?.commissionRate || 0,
        roomNumber: res.room.roomNumber,
        roomTypeName: res.room.roomType.typeName,
        rate: res.rate,
        nights,
        roomRevenue: data.roomRevenue,
        sc: data.sc,
        vat: data.vat,
        tdl: data.tdl,
        nbt: data.nbt,
        amount: data.totalAmount,
      };

      setInvoiceDetails(inv);
    } catch (err) {
      console.error('Error calculating tax invoice:', err);
      // Fallback in case of server/connection issues
      const sc = roomRevenue * 0.10;
      const subtotal = roomRevenue + sc;
      const vat = subtotal * 0.18;
      const tdl = roomRevenue * 0.01;
      const nbt = roomRevenue * 0.02;
      const totalAmount = roomRevenue + sc + vat + tdl + nbt;

      const inv = {
        confoNo: res.confoNo,
        guestName: res.guest.fullName,
        agentName: res.travelAgent?.agentName || 'Direct Booking',
        commissionRate: res.travelAgent?.commissionRate || 0,
        roomNumber: res.room.roomNumber,
        roomTypeName: res.room.roomType.typeName,
        rate: res.rate,
        nights,
        roomRevenue,
        sc,
        vat,
        tdl,
        nbt,
        amount: totalAmount,
      };

      setInvoiceDetails(inv);
    }
  };

  function buildInvoiceHtml(inv, res, folioData) {
    const data = inv || {};
    const now = new Date();
    const invoice = {
      confoNo: data.confoNo || (res && res.confoNo) || 'N/A',
      invoiceDate: now.toLocaleDateString(),
      guestName: data.guestName || (res && res.guest?.fullName) || 'Guest',
      agentName: data.agentName || (res && (res.travelAgent?.agentName || 'Direct Booking')) || 'Direct Booking',
      roomNumber: data.roomNumber || (res && res.room?.roomNumber) || 'N/A',
      roomTypeName: data.roomTypeName || (res && res.room?.roomType?.typeName) || '',
      nights: data.nights || (folioData && folioData.nights) || 1,
      roomRevenue: typeof data.roomRevenue === 'number' ? data.roomRevenue : (folioData && folioData.roomRevenue) || 0,
      sc: typeof data.sc === 'number' ? data.sc : (folioData && folioData.roomTaxes?.sc) || 0,
      vat: typeof data.vat === 'number' ? data.vat : (folioData && folioData.roomTaxes?.vat) || 0,
      tdl: typeof data.tdl === 'number' ? data.tdl : (folioData && folioData.roomTaxes?.tdl) || 0,
      nbt: typeof data.nbt === 'number' ? data.nbt : (folioData && folioData.roomTaxes?.nbt) || 0,
      amount: typeof data.amount === 'number' ? data.amount : (folioData && folioData.totals ? folioData.totals.base + folioData.totals.tax : 0)
    };

    const style = `
      <style>
        @page { size: A4; margin: 20mm; }
        html, body { height: 100%; margin: 0; padding: 0; }
        body { font-family: Arial, Helvetica, sans-serif; color: #111; background: #fff; }
        .print-area { width: 100%; max-width: 800px; margin: 0 auto; padding: 16px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { padding: 6px 8px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        h1,h2,h3,h4 { margin: 0 0 8px 0; }
        .totals { margin-top: 12px; width: 100%; }
        .totals .row { display:flex; justify-content:space-between; padding:4px 0; }
      </style>
    `;

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Tax Invoice ${invoice.confoNo}</title>
          ${style}
        </head>
        <body>
          <div class="print-area">
            <h1>SYNORA PMS — TAX INVOICE</h1>
            <p>Ella Hotel & Resort Sri Lanka</p>
            <div style="margin-top:12px">
              <p><strong>Confirmation No:</strong> ${invoice.confoNo}</p>
              <p><strong>Invoice Date:</strong> ${invoice.invoiceDate}</p>
            </div>

            <h2 style="margin-top:12px">Guest Details</h2>
            <p>${invoice.guestName}</p>
            <p>Room: ${invoice.roomNumber} ${invoice.roomTypeName ? `(${invoice.roomTypeName})` : ''}</p>

            <h2 style="margin-top:12px">Billing To</h2>
            <p>${invoice.agentName}</p>

            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th style="text-align:right">Quantity</th>
                  <th style="text-align:right">Unit Price</th>
                  <th style="text-align:right">Total (LKR)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Room Charges: Room ${invoice.roomNumber}</td>
                  <td style="text-align:right">${invoice.nights} Night(s)</td>
                  <td style="text-align:right">${Number(invoice.roomRevenue / invoice.nights).toLocaleString()}</td>
                  <td style="text-align:right">${Number(invoice.roomRevenue).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

              ${folioData && folioData.incidentals && folioData.incidentals.charges && folioData.incidentals.charges.length > 0 ? `
                <h2 style="margin-top:12px">Incidental Charges</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th style="text-align:right">Qty</th>
                      <th style="text-align:right">Unit Price</th>
                      <th style="text-align:right">Total (LKR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${folioData.incidentals.charges.map(c => {
                      const totalTax = (c.taxes || []).reduce((a, t) => a + (t.amount || 0), 0);
                      const line = (c.amount + totalTax) || 0;
                      return `<tr><td>${c.chargeType?.name || 'Charge'}${c.description ? ' - ' + c.description : ''}</td><td style="text-align:right">1</td><td style="text-align:right">${Number(c.amount).toLocaleString()}</td><td style="text-align:right">${Number(line).toLocaleString()}</td></tr>`;
                    }).join('')}
                  </tbody>
                </table>
              ` : ''}

            <div class="totals">
              <div class="row"><span>Room Revenue:</span><span>LKR ${Number(invoice.roomRevenue).toLocaleString()}</span></div>
              <div class="row"><span>Service Charge (SC):</span><span>LKR ${Number(invoice.sc).toLocaleString()}</span></div>
              <div class="row"><span>Subtotal (for VAT):</span><span>LKR ${Number(invoice.roomRevenue + invoice.sc).toLocaleString()}</span></div>
              <div class="row"><span>VAT (18% on Subtotal):</span><span>LKR ${Number(invoice.vat).toLocaleString()}</span></div>
              <div class="row"><span>TDL (Tourism Dev Levy 1%):</span><span>LKR ${Number(invoice.tdl).toLocaleString()}</span></div>
              <div class="row"><span>NBT (Nation Building Tax 2%):</span><span>LKR ${Number(invoice.nbt).toLocaleString()}</span></div>
              <div class="row" style="font-weight:bold; padding-top:8px; border-top:1px solid #ddd;"><span>Total Amount:</span><span>LKR ${Number(invoice.amount).toLocaleString()}</span></div>
            </div>

            <p style="margin-top:18px; font-size:11px; color:#666">Thank you for choosing Synora PMS. This is a computer generated tax invoice.</p>
          </div>
        </body>
      </html>
    `;

    return html;
  }

  async function openInvoicePdf(inv, res, folioData) {
    // Use server-side PDF endpoint to produce a PDF and open/download it.
    try {
      if (!res) return;
      const response = await api.get(`/reservations/${res.id}/invoice/pdf`, { responseType: 'blob' });
      const contentType = response.headers && (response.headers['content-type'] || response.headers['Content-Type']);
      // If server returned JSON/error as blob, try to surface it instead of opening a broken PDF
      if (!contentType || !contentType.includes('pdf')) {
        try {
          const text = await response.data.text();
          console.error('Invoice PDF endpoint returned non-PDF:', text);
          alert('Failed to generate PDF: ' + (text || 'server returned unexpected response'));
          return;
        } catch (e) {
          console.error('Non-PDF response and failed to parse body', e);
          alert('Failed to generate PDF.');
          return;
        }
      }
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const newTab = window.open(url, '_blank', 'noopener');
      if (!newTab) {
        // fallback: force download
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice_${res.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (err) {
      console.error('Failed to open PDF:', err);
      alert('Failed to open PDF. Please try downloading instead.');
    }
  }

  const handleSaveInvoice = async () => {
    if (!invoiceDetails) return;
    setSavingInvoice(true);
    try {
      await api.post('/travel-agent-invoices', {
        confoNo: invoiceDetails.confoNo,
        roomRevenue: invoiceDetails.roomRevenue,
        paymentType: 1, // Card / Agent credit
        amount: invoiceDetails.amount,
        vat: invoiceDetails.vat,
        sc: invoiceDetails.sc,
        tdl: invoiceDetails.tdl,
        nbt: invoiceDetails.nbt,
        userId: user?.id,
      });
      alert('Tax Invoice successfully saved to database!');
    } catch (e) {
      console.error(e);
      alert('Failed to save tax invoice.');
    } finally {
      setSavingInvoice(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!selectedRes) return;
    try {
      const response = await api.get(`/reservations/${selectedRes.id}/invoice/pdf`, { responseType: 'blob' });
      const contentType = response.headers && (response.headers['content-type'] || response.headers['Content-Type']);
      if (!contentType || !contentType.includes('pdf')) {
        const text = await response.data.text().catch(() => '');
        console.error('Invoice PDF endpoint returned non-PDF:', text);
        alert('Failed to download PDF: ' + (text || 'server returned unexpected response'));
        return;
      }
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      // Open in new tab
      const newTab = window.open(url, '_blank', 'noopener');
      if (!newTab) {
        // fallback to download
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice_${selectedRes.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      // revoke after some time
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      alert('Failed to download PDF.');
    }
  };

  const getReservationNights = (res) => {
    if (!res) return 1;
    const checkInDate = new Date(res.checkIn);
    const checkOutDate = new Date(res.checkOut);
    const diffTime = Math.abs(checkOutDate - checkInDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  };

  const isCheckoutToday = (res) => {
    if (!res?.checkOut) return false;
    const checkout = new Date(res.checkOut);
    const today = new Date();
    return checkout.getFullYear() === today.getFullYear()
      && checkout.getMonth() === today.getMonth()
      && checkout.getDate() === today.getDate();
  };

  const isPendingCheckout = (res) => {
    const status = normalizeReservationStatus(res?.status);
    return ['in_house', 'checked_in', 'due_checkout', 'early_checkout'].includes(status)
      && (status === 'due_checkout' || isCheckoutToday(res));
  };

  const reservationStatusOptions = [
    'tentative',
    'guaranteed',
    'room_assigned',
    'checked_in',
    'in_house',
    'due_checkout',
    'early_checkout',
    'checked_out',
    'completed',
    'closed',
    'no_show',
    'cancelled',
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">Reservations Folio</h1>
          <p className="text-slate-400 text-sm mt-1">Manage guest folios, incidentals posting, payments, and tax invoices.</p>
        </div>
      </div>

      {/* Invoice Print Layout (only visible in print mode) */}
      {invoiceDetails && (
        <div className="hidden print-area p-8 text-black bg-white" id="tax-invoice-print">
          <div className="flex justify-between items-start border-b-2 border-slate-300 pb-5">
            <div>
              <h1 className="text-2xl font-bold font-serif tracking-wide text-slate-800">SYNORA PMS — TAX INVOICE</h1>
              <p className="text-sm text-slate-500">Ella Hotel & Resort Sri Lanka</p>
            </div>
            <div className="text-right text-xs">
              <p className="font-bold">Confirmation No: {invoiceDetails.confoNo}</p>
              <p>Invoice Date: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="my-8 grid grid-cols-2 gap-4 text-sm">
            <div>
              <h2 className="font-bold text-slate-700 uppercase text-xs tracking-wider mb-2">Guest Details</h2>
              <p className="font-semibold">{invoiceDetails.guestName}</p>
              <p className="text-xs text-slate-500">Room: {invoiceDetails.roomNumber} ({invoiceDetails.roomTypeName})</p>
            </div>
            <div className="text-right">
              <h2 className="font-bold text-slate-700 uppercase text-xs tracking-wider mb-2">Billing To</h2>
              <p className="font-semibold">{invoiceDetails.agentName}</p>
              {invoiceDetails.commissionRate > 0 && <p className="text-xs text-slate-500">Contract Commission: {invoiceDetails.commissionRate}%</p>}
            </div>
          </div>

          <table className="w-full text-left border-collapse text-sm mt-8">
            <thead>
              <tr className="border-b border-slate-300 text-slate-700 font-bold">
                <th className="py-2">Description</th>
                <th className="py-2 text-right">Quantity</th>
                <th className="py-2 text-right">Unit Price</th>
                <th className="py-2 text-right">Total (LKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="py-3">Room Charges: Room {invoiceDetails.roomNumber}</td>
                <td className="py-3 text-right">{invoiceDetails.nights} Night(s)</td>
                <td className="py-3 text-right">{invoiceDetails.rate.toLocaleString()}</td>
                <td className="py-3 text-right">{invoiceDetails.roomRevenue.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-8 border-t border-slate-300 pt-5 flex justify-end">
            <div className="w-80 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Room Revenue:</span>
                <span className="font-semibold">LKR {invoiceDetails.roomRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Service Charge (SC 10%):</span>
                <span>LKR {invoiceDetails.sc.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-700">
                <span>Subtotal (for VAT):</span>
                <span>LKR {(invoiceDetails.roomRevenue + invoiceDetails.sc).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT (18% on Subtotal):</span>
                <span>LKR {invoiceDetails.vat.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>TDL (Tourism Dev Levy 1%):</span>
                <span>LKR {invoiceDetails.tdl.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>NBT (Nation Building Tax 2%):</span>
                <span>LKR {invoiceDetails.nbt.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t-2 border-slate-400 pt-2 font-extrabold text-base text-slate-900">
                <span>Total Amount:</span>
                <span>LKR {invoiceDetails.amount.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="mt-16 text-center text-[10px] text-slate-400 border-t border-slate-200 pt-4">
            Thank you for choosing Synora PMS. This is a computer generated tax invoice.
          </div>
        </div>
      )}

      {/* Main List and details (no-print) */}
      <div className="no-print grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Side (Reservations List) */}
        <div className="xl:col-span-2">
          <div className="space-y-6 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2 scroll-smooth" style={{ scrollBehavior: 'smooth' }}>
            <div className="sticky top-0 z-20 bg-slate-900/80 border-b border-slate-800/60 py-3 px-3">
              <div className="glass-card p-4 rounded-xl flex flex-col sm:flex-row gap-4 items-center justify-between bg-transparent">
            <div className="flex items-center gap-3 w-full sm:max-w-md bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5">
              <Search size={16} className="text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Guest name or confirmation number..."
                className="bg-transparent border-none outline-none text-slate-200 text-sm w-full placeholder-slate-500"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:max-w-md bg-slate-900/60 border border-slate-800 rounded-xl p-2">
              <Calendar size={12} className="text-slate-500" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                onClick={(e) => e.target.showPicker?.()}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none cursor-pointer"
                style={{ colorScheme: 'dark' }}
                required
              />
              <span className="text-slate-400 mx-2">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                onClick={(e) => e.target.showPicker?.()}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none cursor-pointer"
                style={{ colorScheme: 'dark' }}
                required
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-sm outline-none w-full sm:w-auto"
            >
              <option value="">All Statuses</option>
              {reservationStatusOptions.map((status) => (
                <option key={status} value={status}>{formatReservationStatus(status)}</option>
              ))}
            </select>
            </div>
              </div>

          {reservations.some(isPendingCheckout) && (
            <div className="mb-4 rounded-2xl border border-orange-500/30 bg-orange-500/10 px-5 py-4 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-orange-500/15 text-orange-300">
                <AlertCircle size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-orange-200">
                  Pending Check-Outs ({reservations.filter(isPendingCheckout).length})
                </p>
                <p className="text-xs text-orange-300/80 mt-0.5">
                  These guests are due to check out. Settle the folio balance before completing checkout.
                </p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex h-[30vh] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
            </div>
          ) : reservations.length === 0 ? (
            <div className="glass-card p-10 text-center rounded-2xl text-slate-400">
              No reservations match the query.
            </div>
          ) : (
            <div className="space-y-4">
              {reservations.map((res) => (
                <div
                  key={res.id}
                  onClick={() => {
                    setSelectedRes(res);
                    setInvoiceDetails(null);
                    setActiveTab('general');
                    setTimeout(() => {
                      document.getElementById('res-detail-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                  }}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all duration-300 ${
                    selectedRes?.id === res.id
                      ? 'bg-amber-500/10 border-amber-500 text-slate-200 shadow-md shadow-amber-500/5'
                      : isPendingCheckout(res)
                        ? 'bg-orange-500/10 border-orange-500/40 text-slate-200 shadow-md shadow-orange-500/5'
                      : 'glass-card text-slate-400 hover:border-slate-800'
                  } ${highlightConfo === res.confoNo ? 'border-amber-500 animate-pulse' : ''}`}
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-500">{res.confoNo}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getReservationStatusClasses(res.status)}`}>
                          {formatReservationStatus(res.status)}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-200 mt-2 text-base">{res.guest.fullName}</h3>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-500" />
                        {new Date(res.checkIn).toLocaleDateString()} to {new Date(res.checkOut).toLocaleDateString()}
                        <span className="text-slate-600">|</span>
                        <span>{getReservationNights(res)} Night(s)</span>
                      </p>
                      {isPendingCheckout(res) && (
                        <span className="inline-flex items-center gap-1.5 mt-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-orange-300">
                          <AlertCircle size={11} />
                          Pending Check-Out
                        </span>
                      )}
                      {isCheckoutToday(res) && !['checked_out', 'completed', 'closed', 'cancelled', 'no_show'].includes(normalizeReservationStatus(res.status)) && (
                        <span className="inline-flex items-center gap-1.5 mt-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-orange-300">
                          <Bell size={11} />
                          Checkout Today
                        </span>
                      )}
                    </div>

                    <div className="text-right flex sm:flex-col justify-between sm:justify-start items-center sm:items-end">
                      <span className="text-xs text-slate-400">Room {res.room.roomNumber}</span>
                      <span className="font-mono font-bold text-slate-100 text-sm mt-1">LKR {res.rate.toLocaleString()} / night</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>

        {/* Right Side (Folio details) */}
        <div id="res-detail-panel" style={{ scrollMarginTop: '96px' }} className="max-h-[calc(100vh-6rem)] overflow-auto">
          {selectedRes ? (
            <div className="glass-card p-6 rounded-2xl sticky top-8 space-y-6">
              {/* Header Info */}
              <div className="border-b border-slate-800 pb-4">
                <p className="font-mono text-xs font-bold text-amber-500">{selectedRes.confoNo}</p>
                <h2 className="text-xl font-bold text-slate-200 mt-1">{selectedRes.guest.fullName}</h2>
              </div>

              {isReservationLocked(selectedRes) && (
                <div className="rounded-xl bg-slate-900/60 border border-slate-800 px-4 py-3 text-xs text-slate-400 flex items-start gap-2.5">
                  <AlertCircle size={16} className="text-slate-500 shrink-0 mt-0.5" />
                  <p>
                    This reservation is <span className="font-bold text-amber-500 uppercase">{formatReservationStatus(selectedRes.status)}</span> and can no longer be edited.
                  </p>
                </div>
              )}

              {/* Tab Selector */}
              <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800/80 text-xs">
                <button
                  onClick={() => setActiveTab('general')}
                  className={`flex-1 py-2 font-semibold rounded-lg transition-all ${
                    activeTab === 'general' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  General Info
                </button>
                <button
                  onClick={() => setActiveTab('folio')}
                  className={`flex-1 py-2 font-semibold rounded-lg transition-all ${
                    activeTab === 'folio' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Folio Ledger
                </button>
              </div>

              {activeTab === 'general' ? (
                /* Tab 1: General Info */
                <div className="space-y-6 animate-fadeIn">
                  {/* Status Update Control */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Folio Status</label>
                    <select
                      value={normalizeReservationStatus(selectedRes.status)}
                      onChange={(e) => handleStatusChange(selectedRes.id, e.target.value)}
                      disabled={isReservationLocked(selectedRes)}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-xs outline-none font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {reservationStatusOptions.map((status) => (
                        <option key={status} value={status}>{formatReservationStatus(status)}</option>
                      ))}
                    </select>
                  </div>

                  {['tentative', 'guaranteed', 'room_assigned', 'checked_in', 'in_house', 'due_checkout', 'early_checkout', 'checked_out'].includes(normalizeReservationStatus(selectedRes.status)) && (
                    <CheckoutAction 
                      reservation={selectedRes} 
                      balance={folio?.totals?.balance || 0} 
                      onCheckedIn={(updated) => {
                        setReservations(prev => prev.map(r => r.id === selectedRes.id ? { ...r, status: updated.status } : r));
                        setSelectedRes(prev => prev && prev.id === selectedRes.id ? { ...prev, status: updated.status } : prev);
                        fetchFolio(selectedRes.id);
                      }}
                      onCheckedOut={(updated) => {
                        setReservations(prev => prev.map(r => r.id === selectedRes.id ? { ...r, status: updated.status } : r));
                        setSelectedRes(prev => prev && prev.id === selectedRes.id ? { ...prev, status: updated.status } : prev);
                        fetchFolio(selectedRes.id);
                      }}
                    />
                  )}

                  {/* Date Editing Fields */}
                  <div className="space-y-4 border-t border-b border-slate-800/60 py-4 my-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stay Dates</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1.5">Check-In</label>
                        <input
                          type="date"
                          value={editCheckIn}
                          onChange={(e) => {
                            setEditCheckIn(e.target.value);
                            setDateError('');
                          }}
                          onClick={(e) => e.target.showPicker?.()}
                          disabled={isReservationLocked(selectedRes) || selectedRes.status === 'checked_in'}
                          style={{ colorScheme: 'dark' }}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-xs outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1.5">Check-In Time</label>
                        <input
                          type="time"
                          value={editCheckInTime}
                          onChange={(e) => {
                            setEditCheckInTime(e.target.value);
                            setDateError('');
                          }}
                          disabled={isReservationLocked(selectedRes) || selectedRes.status === 'checked_in'}
                          style={{ colorScheme: 'dark' }}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-xs outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1.5">Check-Out</label>
                        <input
                          type="date"
                          value={editCheckOut}
                          onChange={(e) => {
                            setEditCheckOut(e.target.value);
                            setDateError('');
                          }}
                          onClick={(e) => e.target.showPicker?.()}
                          disabled={isReservationLocked(selectedRes)}
                          style={{ colorScheme: 'dark' }}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-xs outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1.5">Check-Out Time</label>
                        <input
                          type="time"
                          value={editCheckOutTime}
                          onChange={(e) => {
                            setEditCheckOutTime(e.target.value);
                            setDateError('');
                          }}
                          disabled={isReservationLocked(selectedRes)}
                          style={{ colorScheme: 'dark' }}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-xs outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                    {dateError && (
                      <p className="text-[11px] font-semibold text-rose-455 mt-1 leading-normal">{dateError}</p>
                    )}
                    
                    {!isReservationLocked(selectedRes) && datesChanged && (
                      <button
                        onClick={handleSaveDates}
                        disabled={savingDates}
                        className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-all duration-300 flex items-center justify-center gap-1.5"
                      >
                        {savingDates ? (
                          <>
                            <RefreshCw size={12} className="animate-spin" />
                            Saving Dates...
                          </>
                        ) : (
                          'Save Date Changes'
                        )}
                      </button>
                    )}
                  </div>

                  {/* Details table */}
                  <div className="space-y-3.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Room Assigned:</span>
                       <span className="font-semibold text-slate-200">Room {selectedRes.room?.roomNumber ?? 'N/A'} ({selectedRes.room?.roomType?.typeName ?? 'N/A'})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Floor:</span>
                      <span className="font-semibold text-slate-200">{selectedRes.room.floor ? selectedRes.room.floor.floorName : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Adults/Children:</span>
                      <span className="font-semibold text-slate-200">{selectedRes.adults} Adults, {selectedRes.children} Children</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Booking Source:</span>
                      <span className="font-semibold text-slate-200 uppercase">{(selectedRes.bookingSource?.replace('_', ' ') || '')}</span>
                    </div>
                    {selectedRes.travelAgent && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Travel Agent:</span>
                        <span className="font-semibold text-slate-200">{selectedRes.travelAgent.agentName}</span>
                      </div>
                    )}
                    {/* Meal Plan Snapshot */}
                    {selectedRes.mealPlanCode && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Meal Plan:</span>
                        <span className="font-semibold text-slate-200">{selectedRes.mealPlanCode} - {selectedRes.mealPlanName}</span>
                      </div>
                    )}
                    {selectedRes.mealPlanCode && (
                      <div className="mt-2 text-[12px] grid grid-cols-2 gap-2">
                        <div className="text-slate-400">Included:</div>
                        <div className="font-semibold text-slate-200">
                          <div>Breakfast: {selectedRes.mp_breakfast_inc ? '✓' : '✗'}</div>
                          <div>Lunch: {selectedRes.mp_lunch_inc ? '✓' : (selectedRes.mealPlanCode === 'HB' ? '○ Lunch/Dinner' : '✗')}</div>
                          <div>Dinner: {selectedRes.mp_dinner_inc ? '✓' : (selectedRes.mealPlanCode === 'HB' ? '○ Lunch/Dinner' : '✗')}</div>
                          {selectedRes.mp_drinks_inc !== undefined && (<div>Drinks: {selectedRes.mp_drinks_inc ? '✓' : '✗'}</div>)}
                          {selectedRes.mp_snacks_inc !== undefined && (<div>Snacks: {selectedRes.mp_snacks_inc ? '✓' : '✗'}</div>)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Room Change Trigger */}
                  <button
                    onClick={handleOpenRoomChange}
                    disabled={isReservationLocked(selectedRes)}
                    className="w-full py-2 bg-slate-900 border border-slate-800 text-slate-300 font-semibold rounded-xl text-xs hover:border-slate-700 transition-all duration-300 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Layers size={14} />
                    Transfer / Change Room
                  </button>

                  {/* Quick Payment posting list */}
                  <div className="border-t border-slate-800 pt-5 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-semibold text-slate-300">Payments Folio</h3>
                      {!isReservationLocked(selectedRes) && (
                        <button
                          onClick={() => setShowPaymentForm(true)}
                          className="text-xs font-semibold text-amber-500 hover:text-amber-400 flex items-center gap-1 transition-colors"
                        >
                          <Plus size={12} /> Post Payment
                        </button>
                      )}
                    </div>

                    <div className="space-y-2 text-xs">
                          {selectedRes.payments && selectedRes.payments.length > 0 ? (
                        selectedRes.payments.map((p) => (
                          <div key={p.id} className="p-2.5 bg-slate-900/60 border border-slate-850 rounded-lg flex justify-between items-center">
                            <div>
                              <p className="font-semibold text-slate-200 capitalize">{p.paymentType?.replace('_', ' ') || ''}</p>
                              <p className="text-[10px] text-slate-500">{new Date(p.paidAt).toLocaleString()}</p>
                            </div>
                            <span className="font-mono font-bold text-emerald-400">+LKR {p.amount.toLocaleString()}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-500 text-center py-2">No payments posted yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Tab 2: Folio Ledger */
                <div className="space-y-6 animate-fadeIn">
                  {folioLoading ? (
                    <div className="flex justify-center py-6">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent"></div>
                    </div>
                  ) : folio ? (
                    <div className="space-y-5">
                      {/* Top Action buttons */}
                      {!isReservationLocked(selectedRes) && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowPostCharge(true)}
                            className="flex-1 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                          >
                            <Plus size={14} />
                            Post Charge
                          </button>
                          <button
                            onClick={() => setShowPaymentForm(true)}
                            className="flex-1 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                          >
                            <CreditCard size={14} />
                            Post Payment
                          </button>
                        </div>
                      )}

                      {/* Stay Charges Section */}
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">1. Room Stay Charges</h3>
                        <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-300 font-semibold">Room Charge ({folio.nights} Night(s))</span>
                            <span className="font-mono font-semibold text-slate-200">LKR {folio.roomRevenue.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-400 border-t border-slate-800/40 pt-1.5">
                            <span>Taxes Breakdown (SC/VAT/TDL/NBT):</span>
                            <span className="font-mono">LKR {folio.roomTaxes.total.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Incidentals List */}
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">2. Incidental Charges</h3>
                        <div className="space-y-2">
                          {folio.incidentals.charges && folio.incidentals.charges.length > 0 ? (
                            folio.incidentals.charges.map((c) => {
                              const totalTax = c.taxes.reduce((acc, curr) => acc + curr.amount, 0);
                              return (
                                <div 
                                  key={c.id} 
                                  className={`p-3 bg-slate-900/60 border border-slate-850 rounded-xl flex justify-between items-center text-xs relative group ${
                                    c.isVoid ? 'opacity-40 line-through' : ''
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-semibold text-slate-200">{c.chargeType.name}</span>
                                      {c.isVoid && (
                                        <span className="text-[9px] px-1.5 py-0.2 bg-rose-500/10 text-rose-400 rounded border border-rose-500/20 uppercase font-bold">
                                          Void
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1">{c.description || 'No description'}</p>
                                    {!c.isVoid && totalTax > 0 && (
                                      <p className="text-[9px] text-slate-500 mt-0.5">Includes LKR {totalTax.toLocaleString()} tax</p>
                                    )}
                                  </div>
                                  <div className="text-right flex items-center gap-3">
                                    <span className="font-mono font-bold text-slate-200">
                                      LKR {c.amount.toLocaleString()}
                                    </span>
                                    {!c.isVoid && !isReservationLocked(selectedRes) && (
                                      <button
                                        onClick={() => {
                                          setChargeToVoid(c);
                                          setShowVoidDialog(true);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-500/10 rounded text-rose-400 transition-opacity"
                                        title="Void Charge"
                                      >
                                        <XCircle size={14} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-[11px] text-slate-500 text-center py-2 bg-slate-900/20 border border-dashed border-slate-850 rounded-xl">
                              No incidental charges posted yet.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Summary Balance Card */}
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payments & Refundable Balances</h3>
                        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
                          <table className="min-w-[720px] w-full text-left text-[11px] text-slate-300">
                            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider">
                              <tr>
                                <th className="px-2 py-2">Payment</th>
                                <th className="px-2 py-2">Date</th>
                                <th className="px-2 py-2">Method</th>
                                <th className="px-2 py-2">Amount</th>
                                <th className="px-2 py-2">Refunded</th>
                                <th className="px-2 py-2">Refundable</th>
                                <th className="px-2 py-2 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {folio.payments && folio.payments.length > 0 ? (
                                folio.payments.map((payment) => {
                                  const baseAmount = Number(payment.amount || 0);
                                  const alreadyRefunded = Number(payment.alreadyRefunded || 0);
                                  const fallbackRefundableAmount = Math.max(baseAmount - alreadyRefunded, 0);
                                  const displayRefundableAmount = (
                                    payment.refundableAmount === undefined ||
                                    payment.refundableAmount === null ||
                                    (payment.refundableAmount === 0 && alreadyRefunded === 0 && baseAmount > 0)
                                  )
                                    ? fallbackRefundableAmount
                                    : Number(payment.refundableAmount || 0);
                                  const canRefund = displayRefundableAmount > 0 && (user?.role === 'admin' || user?.permissions?.includes('refund.create') || user?.permissions?.includes('refund.process'));

                                  return (
                                    <tr key={payment.id} className="border-t border-slate-800 align-top">
                                      <td className="px-2 py-2 font-mono text-slate-200">{payment.reference || `PAY-${payment.id}`}</td>
                                      <td className="px-2 py-2">{new Date(payment.createdAt || payment.created_at || Date.now()).toLocaleDateString('en-GB')}</td>
                                      <td className="px-2 py-2 capitalize">{payment.method || payment.paymentMethod || 'Cash'}</td>
                                      <td className="px-2 py-2 font-mono">LKR {baseAmount.toLocaleString()}</td>
                                      <td className="px-2 py-2 font-mono text-rose-300">LKR {alreadyRefunded.toLocaleString()}</td>
                                      <td className="px-2 py-2 font-mono text-emerald-300">LKR {displayRefundableAmount.toLocaleString()}</td>
                                      <td className="px-2 py-2 text-right">
                                        <button
                                          type="button"
                                          disabled={!canRefund}
                                          onClick={() => {
                                            setSelectedRefundPayment({
                                              ...payment,
                                              refundableAmount: displayRefundableAmount,
                                              alreadyRefunded,
                                              amount: baseAmount,
                                            });
                                            setRefundError('');
                                            setRefundSuccess('');
                                            setRefundAmount('');
                                            setRefundReference('');
                                            setRefundReason('');
                                            setShowRefundForm(true);
                                          }}
                                          className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold ${canRefund ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:border-rose-400' : 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed'}`}
                                        >
                                          Refund
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })
                              ) : (
                                <tr>
                                  <td colSpan="7" className="px-2 py-4 text-center text-slate-500">No payments posted yet.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Total Base Charges:</span>
                          <span className="font-semibold text-slate-200">LKR {folio.totals.base.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Total Tax & SC:</span>
                          <span className="font-semibold text-slate-200">LKR {folio.totals.tax.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800 pb-2">
                          <span className="text-slate-400">Total Payments:</span>
                          <span className="font-semibold text-emerald-400">LKR {folio.totals.payments.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800 pb-2">
                          <span className="text-slate-400">Total Refunds:</span>
                          <span className="font-semibold text-rose-400">LKR {(folio.totals.refunds || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Net Paid:</span>
                          <span className="font-semibold text-slate-200">LKR {(folio.totals.netPaid || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-sm font-bold text-slate-300">Balance Due:</span>
                          <span className={`font-mono text-base font-extrabold ${
                            folio.totals.balance === 0 ? 'text-emerald-400' : 'text-rose-500'
                          }`}>
                            LKR {folio.totals.balance.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {folio.refunds && folio.refunds.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Refund History</h3>
                          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
                            <table className="min-w-[620px] w-full text-left text-[11px] text-slate-300">
                              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider">
                                <tr>
                                  <th className="px-2 py-2">Refund ID</th>
                                  <th className="px-2 py-2">Payment</th>
                                  <th className="px-2 py-2">Date</th>
                                  <th className="px-2 py-2">Amount</th>
                                  <th className="px-2 py-2">Method</th>
                                  <th className="px-2 py-2">Reason</th>
                                </tr>
                              </thead>
                              <tbody>
                                {folio.refunds.map((refund) => (
                                  <tr key={refund.id} className="border-t border-slate-800">
                                    <td className="px-2 py-2 font-mono text-slate-200">{refund.reference || `REF-${refund.id}`}</td>
                                    <td className="px-2 py-2 font-mono text-slate-300">{refund.paymentId ? `PAY-${refund.paymentId}` : '—'}</td>
                                    <td className="px-2 py-2">{new Date(refund.refundDate || refund.createdAt).toLocaleDateString('en-GB')}</td>
                                    <td className="px-2 py-2 font-mono text-rose-300">LKR {Number(refund.amount || 0).toLocaleString()}</td>
                                    <td className="px-2 py-2 capitalize">{refund.refundMethod || 'Cash'}</td>
                                    <td className="px-2 py-2 text-slate-300">{refund.reason || '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Print Invoice Button */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                      onClick={() => handleGenerateInvoice(selectedRes)}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                        >
                      <FileText size={14} />
                      Calculate & Print Tax Invoice
                        </button>
                        <button
                          onClick={() => openInvoicePdf(invoiceDetails, selectedRes, folio)}
                          className="w-full py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                        >
                          <FileSpreadsheet size={14} />
                          View PDF
                        </button>
                      </div>

                      {invoiceDetails && (
                        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3 text-xs animate-fadeIn">
                          <h4 className="font-bold text-slate-200 border-b border-slate-800 pb-2">Tax Invoice Calculations</h4>
                          <div className="space-y-1.5">
                            <div className="flex justify-between">
                              <span>Revenue:</span>
                              <span>LKR {invoiceDetails.roomRevenue.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Service Charge (SC):</span>
                              <span>LKR {invoiceDetails.sc.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>VAT:</span>
                              <span>LKR {invoiceDetails.vat.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>TDL:</span>
                              <span>LKR {invoiceDetails.tdl.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>NBT:</span>
                              <span>LKR {invoiceDetails.nbt.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-850 pt-2 font-bold">
                              <span>Invoice Total:</span>
                              <span className="text-amber-500">LKR {invoiceDetails.amount.toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-850">
                            <button
                              onClick={handleSaveInvoice}
                              disabled={savingInvoice}
                              className="py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold rounded-lg text-[10px] transition-all"
                            >
                              {savingInvoice ? 'Saving...' : 'Save In DB'}
                            </button>
                            <button
                              onClick={handleDownloadPdf}
                              className="py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-[10px] transition-all flex items-center justify-center gap-1"
                            >
                              <Printer size={10} /> Download PDF
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-xs text-center py-4">Failed to compile folio statement.</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card p-10 text-center rounded-2xl text-slate-400">
              Select a reservation from the list to view its active folio, post payments, or print invoices.
            </div>
          )}
        </div>
      </div>

      {/* Post Charge Modal */}
      {showPostCharge && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass w-full max-w-sm rounded-2xl p-8 relative">
            <h2 className="text-lg font-bold text-slate-100 mb-5">Post Incidental Charge</h2>

            {postChargeError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                {postChargeError}
              </div>
            )}

            <form onSubmit={handlePostCharge} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Charge Type *</label>
                <select
                  value={chargeTypeSelected}
                  onChange={(e) => setChargeTypeSelected(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none"
                  required
                >
                  <option value="">Select Type...</option>
                  {chargeTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Amount (LKR) *</label>
                <input
                  type="number"
                  value={chargeAmount}
                  onChange={(e) => setChargeAmount(e.target.value)}
                  placeholder="e.g. 1500"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description / Note</label>
                <input
                  type="text"
                  value={chargeDesc}
                  onChange={(e) => setChargeDesc(e.target.value)}
                  placeholder="e.g. Mini Bar soft drinks"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPostCharge(false)}
                  className="flex-1 py-2.5 bg-slate-900 border border-slate-800 text-slate-400 font-semibold rounded-xl text-xs hover:border-slate-700 hover:text-slate-200 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all duration-300"
                >
                  Post Charge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Void Charge Dialog */}
      {showVoidDialog && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass w-full max-w-sm rounded-2xl p-8 relative">
            <h2 className="text-lg font-bold text-slate-150 text-rose-400 mb-2">Void Incidental Charge</h2>
            <p className="text-[11px] text-slate-400 mb-5">
              Voiding will reverse the charge amount and its associated taxes from the active room account folio.
            </p>

            {voidError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                {voidError}
              </div>
            )}

            <form onSubmit={handleVoidCharge} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Void Reason *</label>
                <input
                  type="text"
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  placeholder="e.g. Posted to wrong room / duplicate entry"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none"
                  required
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setChargeToVoid(null);
                    setShowVoidDialog(false);
                  }}
                  className="flex-1 py-2.5 bg-slate-900 border border-slate-800 text-slate-400 font-semibold rounded-xl text-xs hover:border-slate-700 hover:text-slate-200 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-slate-950 font-bold rounded-xl text-xs transition-all duration-300"
                >
                  Void Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post Payment Modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass w-full max-w-sm rounded-2xl p-8 relative">
            <h2 className="text-lg font-bold text-slate-100 mb-5">Post Payment to Folio</h2>

            {paymentError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                {paymentError}
              </div>
            )}

            {paymentSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold">
                {paymentSuccess}
              </div>
            )}

            <form onSubmit={handlePostPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Payment Amount (LKR) *</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Payment Method *</label>
                <select
                  value={payType}
                  onChange={(e) => setPayType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="agent_credit">Travel Agent Credit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Payment Category *</label>
                <select
                  value={paymentCategory}
                  onChange={(e) => setPaymentCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none"
                >
                  <option value="advance">Advance Payment</option>
                  <option value="full">Full Payment</option>
                  <option value="balance">Balance Payment</option>
                  <option value="refund">Refund</option>
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentForm(false)}
                  className="flex-1 py-2.5 bg-slate-900 border border-slate-800 text-slate-400 font-semibold rounded-xl text-xs hover:border-slate-700 hover:text-slate-200 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all duration-300"
                >
                  Post Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass w-full max-w-md rounded-2xl p-8 relative">
            <h2 className="text-lg font-bold text-slate-100 mb-5">Process Refund</h2>

            {refundError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                {refundError}
              </div>
            )}

            {refundSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold">
                {refundSuccess}
              </div>
            )}

            {selectedRefundPayment && (
              <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900/50 p-3 space-y-2 text-[11px] text-slate-300">
                <div className="flex justify-between"><span className="text-slate-400">Payment:</span><span className="font-mono font-semibold text-slate-200">{selectedRefundPayment.reference || `PAY-${selectedRefundPayment.id}`}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Original Payment:</span><span className="font-mono">LKR {Number(selectedRefundPayment.amount || 0).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Already Refunded:</span><span className="font-mono text-rose-300">LKR {Number(selectedRefundPayment.alreadyRefunded || 0).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Refundable:</span><span className="font-mono text-emerald-300">LKR {Number(selectedRefundPayment.refundableAmount || 0).toLocaleString()}</span></div>
              </div>
            )}

            <form onSubmit={handleRefund} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Refund Amount (LKR) *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={refundAmount}
                  onChange={(e) => {
                    const next = e.target.value.replace(/[^\d.]/g, '');
                    const dotCount = (next.match(/\./g) || []).length;
                    const cleaned = dotCount > 1 ? next.replace(/\.(?=.*\.)/g, '') : next;
                    setRefundAmount(cleaned);
                  }}
                  placeholder="e.g. 5000"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Refund Method *</label>
                <select
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="agent_credit">Agent Credit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Reference</label>
                <input
                  type="text"
                  value={refundReference}
                  onChange={(e) => setRefundReference(e.target.value)}
                  placeholder="REF-001"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Reason *</label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Customer cancellation / early checkout"
                  className="w-full h-24 px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none resize-none"
                  required
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowRefundForm(false);
                    setSelectedRefundPayment(null);
                  }}
                  className="flex-1 py-2.5 bg-slate-900 border border-slate-800 text-slate-400 font-semibold rounded-xl text-xs hover:border-slate-700 hover:text-slate-200 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-slate-950 font-bold rounded-xl text-xs transition-all duration-300"
                >
                  Process Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Room Change Modal */}
      {showRoomChange && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass w-full max-w-sm rounded-2xl p-8 relative">
            <h2 className="text-lg font-bold text-slate-100 mb-5">Change Room Assignment</h2>

            {roomChangeError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                {roomChangeError}
              </div>
            )}

            <form onSubmit={handleChangeRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Available Rooms</label>
                <select
                  value={selectedNewRoomId}
                  onChange={(e) => setSelectedNewRoomId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none"
                  required
                >
                  <option value="">Choose Room...</option>
                  {availRoomsForChange.map((room) => (
                    <option key={room.id} value={room.id}>
                      Room {room.roomNumber} ({room.roomType.typeName}) - Floor {room.floor ? room.floor.floorName : 'N/A'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRoomChange(false)}
                  className="flex-1 py-2.5 bg-slate-900 border border-slate-800 text-slate-400 font-semibold rounded-xl text-xs hover:border-slate-700 hover:text-slate-200 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all duration-300"
                >
                  Assign Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reservations;
