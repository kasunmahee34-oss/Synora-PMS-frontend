import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Hotel, Lock, User as UserIcon } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const res = await login(username, password);
    setSubmitting(false);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.error);
    }
  };

  const fillCredentials = (userType) => {
    if (userType === 'admin') {
      setUsername('admin');
      setPassword('123');
    } else if (userType === 'fo') {
      setUsername('front');
      setPassword('123');
    } else if (userType === 'cashier') {
      setUsername('cashier');
      setPassword('123');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden px-4">
      {/* Background glow ornaments */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 bg-amber-500/5 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 bg-amber-500/5 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="w-full max-w-md glass p-8 rounded-2xl relative z-10">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-amber-500/10 rounded-2xl text-amber-500 border border-amber-500/20 mb-3">
            <Hotel size={36} />
          </div>
          <h1 className="text-2xl font-bold tracking-wider bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">SYNORA PMS</h1>
          <p className="text-xs text-slate-400 font-medium tracking-widest uppercase mt-1">Property Management System</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <UserIcon size={16} />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 placeholder-slate-500 outline-none text-sm transition-all duration-300"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Lock size={16} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 placeholder-slate-500 outline-none text-sm transition-all duration-300"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm transition-all duration-300 shadow-lg shadow-amber-500/10 disabled:opacity-50"
          >
            {submitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Fast Login Options */}
        <div className="mt-8 pt-6 border-t border-slate-800/85">
          <p className="text-[10px] text-center text-slate-500 uppercase tracking-wider font-semibold mb-3">Quick Login (Demo Accounts)</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => fillCredentials('admin')}
              className="py-2 bg-slate-900 border border-slate-800/80 rounded-lg text-[10px] font-bold text-slate-300 hover:border-amber-500/30 transition-all duration-300"
            >
              Admin
            </button>
            <button
              onClick={() => fillCredentials('fo')}
              className="py-2 bg-slate-900 border border-slate-800/80 rounded-lg text-[10px] font-bold text-slate-300 hover:border-amber-500/30 transition-all duration-300"
            >
              Front Office
            </button>
            <button
              onClick={() => fillCredentials('cashier')}
              className="py-2 bg-slate-900 border border-slate-800/80 rounded-lg text-[10px] font-bold text-slate-300 hover:border-amber-500/30 transition-all duration-300"
            >
              Cashier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
