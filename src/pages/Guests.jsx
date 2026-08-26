import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, User, Phone, Mail, Globe, Award, Landmark } from 'lucide-react';

const Guests = () => {
  const { hasPermission } = useAuth();
  const [guests, setGuests] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [nationality, setNationality] = useState('');
  const [idPassportNo, setIdPassportNo] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');

  const fetchGuests = async (query = '') => {
    setLoading(true);
    try {
      const res = await api.get(`/guests?search=${query}`);
      setGuests(res.data);
    } catch (err) {
      console.error('Error fetching guests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, []);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    fetchGuests(e.target.value);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName) {
      setError('Full Name is required.');
      return;
    }

    try {
      await api.post('/guests', {
        fullName,
        phone,
        email,
        nationality,
        idPassportNo,
        address
      });
      // Reset form
      setFullName('');
      setPhone('');
      setEmail('');
      setNationality('');
      setIdPassportNo('');
      setAddress('');
      setShowModal(false);
      fetchGuests(search);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create guest.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">Guest Management</h1>
          <p className="text-slate-400 text-sm mt-1">Manage guest database, lookup passports, and record guest preferences.</p>
        </div>
        {hasPermission('guests.create') && <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm transition-all duration-300 shadow-lg shadow-amber-500/10 flex items-center gap-2"
        >
          <Plus size={16} />
          Add New Guest
        </button>}
      </div>

      {/* Search Filter */}
      <div className="glass-card p-4 rounded-xl flex items-center gap-3">
        <Search size={18} className="text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Search guests by name, phone, email, or passport..."
          className="bg-transparent border-none outline-none text-slate-200 text-sm w-full placeholder-slate-500"
        />
      </div>

      {/* Guests List */}
      {loading ? (
        <div className="flex h-[30vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
        </div>
      ) : guests.length === 0 ? (
        <div className="glass-card p-10 text-center rounded-2xl">
          <p className="text-slate-400">No guests found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guests.map((g) => (
            <div key={g.id} className="glass-card p-6 rounded-2xl flex flex-col justify-between group transition-all duration-300">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/10 flex items-center justify-center text-amber-500 font-bold">
                    {g.fullName[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-200 group-hover:text-amber-400 transition-colors">{g.fullName}</h3>
                    <p className="text-xs text-slate-400">ID / Passport: {g.idPassportNo || 'N/A'}</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-400 border-t border-slate-800/60 pt-4">
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-slate-500" />
                    <span>{g.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-slate-500" />
                    <span className="truncate">{g.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe size={14} className="text-slate-500" />
                    <span>{g.nationality || 'N/A'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Landmark size={14} className="text-slate-500 mt-0.5" />
                    <span className="leading-relaxed">{g.address || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Guest Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass w-full max-w-lg rounded-2xl p-8 relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-100 mb-6">Create New Guest Profile</h2>

            {error && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
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
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +94 77 123 4567"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
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
                    placeholder="e.g. Sri Lankan"
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
                  placeholder="Street name, City, Zip Code"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 text-sm outline-none h-20 resize-none"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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

export default Guests;
