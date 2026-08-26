import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import { LayoutDashboard, CalendarDays, BookOpen, Users, Briefcase, LogOut, User, Hotel, Menu, X, Moon, PieChart, ShieldCheck, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Layout = ({ children }) => {

  const { user, logout, hasPermission } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'front_office', 'cashier'], permission: 'reports.view' },
    { name: 'Tape Chart', path: '/tape-chart', icon: CalendarDays, roles: ['admin', 'front_office'], permission: 'reservations.view' },
    { name: 'Rooms', path: '/rooms', icon: Hotel, roles: ['admin', 'front_office'], permission: 'rooms.view' },
    { name: 'Reservations', path: '/reservations', icon: BookOpen, roles: ['admin', 'front_office', 'cashier'], permission: 'reservations.view' },
    { name: 'Group Reservations', path: '/group-reservations', icon: CalendarDays, roles: ['admin', 'front_office'], permission: 'group_reservation.view' },
    { name: 'Guests', path: '/guests', icon: Users, roles: ['admin', 'front_office'], permission: 'guests.view' },
    { name: 'Travel Agents', path: '/travel-agents', icon: Briefcase, roles: ['admin', 'front_office'], permission: 'reservations.view' },
    { name: 'Night Audit', path: '/night-audit', icon: Moon, roles: ['admin', 'front_office'], permission: 'night_audit.run' },
    { name: 'Reports', path: '/reports', icon: PieChart, roles: ['admin', 'front_office', 'cashier'], permission: 'reports.view' },
    { name: 'Administration', path: '/administration', icon: ShieldCheck, permission: 'users.view' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'front_office':
        return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
      case 'cashier':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'front_office':
        return 'Front Office';
      case 'cashier':
        return 'Cashier';
      default:
        return role;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="no-print print:hidden w-64 glass border-r border-slate-800 hidden lg:flex flex-col justify-between z-10">
        <div>
          <div className="p-6 flex items-center gap-3 border-b border-slate-800/60">
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500 border border-amber-500/20">
              <Hotel size={24} />
            </div>
            <div>
              <div className="font-bold text-lg leading-tight tracking-wider bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">SYNORA PMS</div>
              <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">Property Management</p>
            </div>
          </div>
          <nav className="p-4 space-y-1.5">
            {menuItems
              .filter(item => user && (!item.roles || item.roles.includes(user.role)) && hasPermission(item.permission))
              .map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                      isActive ? 'bg-amber-500 text-slate-950 font-semibold shadow-lg shadow-amber-500/15' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                    }`}
                  >
                    <Icon size={18} className={isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-slate-100'} />
                    {item.name}
                  </Link>
                );
              })}
          </nav>
        </div>
        <div className="p-4 border-t border-slate-800/60 space-y-4">
          {user && (
            <div className="flex items-center gap-3 px-2 py-1">
              <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                <User size={20} />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-200 truncate">{user.fullName}</p>
                <span className={`inline-block mt-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${getRoleBadgeColor(user.role)}`}>
                  {getRoleLabel(user.role)}
                </span>
              </div>
            </div>
          )}
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/10 transition-all duration-300">
            <LogOut size={18} /> Sign Out
          </button>

        </div>
      </aside>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="no-print print:hidden lg:hidden fixed inset-0 z-50 flex">
          <div onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300" />
          <aside className="relative w-64 bg-slate-950 border-r border-slate-850 h-full flex flex-col justify-between p-4 z-10 animate-slideIn">
            <div>
              <div className="pb-6 mb-4 flex items-center justify-between border-b border-slate-850">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500 border border-amber-500/20"><Hotel size={20} /></div>
                  <div>
                    <div className="font-bold text-base leading-tight bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">SYNORA PMS</div>
                    <p className="text-[9px] text-slate-500 font-medium uppercase tracking-wider">Property Mgmt</p>
                  </div>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 hover:bg-slate-900 border border-transparent hover:border-slate-800 rounded-xl text-slate-400 hover:text-slate-100 transition"><X size={18} /></button>
              </div>
              <nav className="space-y-1.5">
                {menuItems
                  .filter(item => user && (!item.roles || item.roles.includes(user.role)) && hasPermission(item.permission))
                  .map(item => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.name}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                          isActive ? 'bg-amber-500 text-slate-950 font-semibold shadow-lg shadow-amber-500/15' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                        }`}
                      >
                        <Icon size={18} className={isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-slate-100'} />
                        {item.name}
                      </Link>
                    );
                  })}
              </nav>
            </div>
            <div className="border-t border-slate-850 pt-4 space-y-4">
              {user && (
                <div className="flex items-center gap-3 px-2 py-1">
                  <div className="h-9 w-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400"><User size={18} /></div>
                  <div className="overflow-hidden"><p className="text-xs font-semibold text-slate-200 truncate">{user.fullName}</p><span className={`inline-block mt-0.5 text-[8px] px-1.5 py-0.2 rounded-full font-bold uppercase ${getRoleBadgeColor(user.role)}`}>{getRoleLabel(user.role)}</span></div>
                </div>
              )}
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/10 transition-all duration-300"><LogOut size={18} /> Sign Out</button>
              <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:bg-slate-800/30 transition-all duration-300">
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-950 relative">
        <header className="no-print print:hidden lg:hidden flex items-center justify-between bg-slate-950/80 border-b border-slate-800/60 p-4 sticky top-0 z-30 backdrop-blur-md">
          <div className="flex items-center gap-2.5"><div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-500 border border-amber-500/20"><Hotel size={16} /></div><div className="font-bold text-sm tracking-wider bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">SYNORA PMS</div></div>
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-slate-100 hover:border-slate-700 transition"><Menu size={18} /></button>
        </header>
        <div className="no-print print:hidden absolute top-0 left-1/4 right-1/4 h-64 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="flex-1 p-5 sm:p-8 md:p-10 relative z-0">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
