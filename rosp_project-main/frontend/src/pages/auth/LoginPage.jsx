import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Utensils, Lock, Mail, ArrowRight, Sparkles, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    setError(null);
    try {
      const loggedInUser = await login(email, password || 'password');
      if (loggedInUser.role === 'admin') {
        navigate('/admin');
      } else {
        const from = location.state?.from?.pathname || '/student';
        navigate(from);
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    }
  };

  const handleQuickDemo = (role) => {
    if (role === 'student') {
      setEmail('student@canteen.edu');
      setPassword('password123');
    } else {
      setEmail('admin@canteen.edu');
      setPassword('admin123');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-6">
        {/* Brand logo header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-500 items-center justify-center text-white shadow-xl shadow-brand-500/20 mb-2">
            <Utensils size={28} />
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight flex items-center justify-center gap-1.5">
            SmartCanteen <span className="text-brand-600 font-extrabold text-sm px-2 py-0.5 rounded-full bg-brand-50 border border-brand-200 flex items-center gap-0.5"><Sparkles size={12} /> AI</span>
          </h1>
          <p className="text-slate-500 text-sm">
            Sign in to order food or manage canteen operations
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl p-8 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium animate-shake">
              {error}
            </div>
          )}

          {/* Quick Demo Credentials Bar */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
              ⚡ Demo Quick Fill
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('student')}
                className="py-2 px-3 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-300 transition-all flex items-center justify-center gap-1 shadow-2xs"
              >
                <UserCheck size={14} /> Student Demo
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="py-2 px-3 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-1 shadow-2xs"
              >
                <ShieldCheck size={14} /> Admin Demo
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                <input
                  type="email"
                  required
                  placeholder="student@canteen.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Password</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-brand-600 transition-all shadow-md flex items-center justify-center gap-2 group"
            >
              {loading ? (
                'Signing in...'
              ) : (
                <>
                  Sign In <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer link */}
          <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-brand-600 hover:underline">
              Create student profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
