import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Utensils, ShoppingBag, Clock, Home, Menu as MenuIcon, LogOut, User, Sparkles, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { totalItemsCount, toastMessage } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', path: '/student', icon: Home },
    { name: 'Menu', path: '/student/menu', icon: Utensils },
    { name: 'My Orders', path: '/student/orders', icon: Clock },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/student') return location.pathname === '/student';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/student" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Utensils size={20} />
            </div>
            <div>
              <span className="font-display font-bold text-lg text-slate-900 tracking-tight flex items-center gap-1">
                SmartCanteen <span className="text-brand-600 text-xs px-1.5 py-0.5 rounded-full bg-brand-50 font-bold border border-brand-200 flex items-center gap-0.5"><Sparkles size={10} /> AI</span>
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-brand-50 text-brand-600 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon size={17} />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Cart Icon */}
            <Link
              to="/student/cart"
              className="relative p-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-brand-50 hover:text-brand-600 transition-all flex items-center justify-center"
              title="View Cart"
            >
              <ShoppingBag size={20} />
              {totalItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center shadow-xs animate-pulse">
                  {totalItemsCount}
                </span>
              )}
            </Link>

            {/* Profile Info & Logout */}
            <div className="hidden md:flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold">
                  {user?.full_name?.charAt(0) || 'S'}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="font-semibold text-slate-800 text-xs leading-tight line-clamp-1">{user?.full_name || 'Student'}</p>
                  <p className="text-slate-400 text-[10px]">Student</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2 shadow-lg">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium ${
                    active ? 'bg-brand-50 text-brand-600 font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={20} />
                  {link.name}
                </Link>
              );
            })}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <User size={18} className="text-slate-500" />
                <span className="text-sm font-semibold text-slate-800">{user?.full_name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-sm font-semibold text-red-600 hover:underline"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Cart Add Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-800 animate-slide-up">
          <ShoppingBag size={18} className="text-brand-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}
    </>
  );
};

export default Navbar;
