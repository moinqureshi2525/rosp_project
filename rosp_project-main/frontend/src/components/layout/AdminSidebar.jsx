import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  UtensilsCrossed,
  Boxes,
  BarChart3,
  TrendingUp,
  Bot,
  LogOut,
  Sparkles,
  Menu as MenuIcon,
  X,
  Recycle,
  ChefHat,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AdminSidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Orders & Pickup', path: '/admin/orders', icon: ClipboardList },
    { name: 'Kitchen Display (KDS)', path: '/kitchen', icon: ChefHat },
    { name: 'Menu Management', path: '/admin/menu', icon: UtensilsCrossed },
    { name: 'Inventory', path: '/admin/inventory', icon: Boxes },
    { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { name: 'Demand Prediction', path: '/admin/predictions', icon: TrendingUp },
    { name: 'Waste Audit', path: '/admin/waste', icon: Recycle },
    { name: 'AI Assistant', path: '/admin/ai-assistant', icon: Bot, highlight: true },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-white w-64 p-5 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to="/admin" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-amber-400 flex items-center justify-center text-slate-900 shadow-md">
            <UtensilsCrossed size={20} className="font-bold" />
          </div>
          <div>
            <h1 className="font-display font-bold text-base tracking-tight text-white flex items-center gap-1">
              SmartCanteen
            </h1>
            <span className="text-xs font-semibold text-brand-400 flex items-center gap-1">
              Admin Portal <Sparkles size={11} />
            </span>
          </div>
        </Link>
        <button onClick={() => setMobileOpen(false)} className="md:hidden text-slate-400 hover:text-white">
          <X size={20} />
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30 font-semibold'
                  : item.highlight
                  ? 'text-amber-300 hover:bg-slate-800 bg-slate-800/60 border border-amber-500/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={18} className={active ? 'text-white' : item.highlight ? 'text-amber-400' : 'text-slate-400'} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 font-bold flex items-center justify-center text-xs border border-brand-500/30">
            A
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-white truncate">{user?.full_name || 'Admin Manager'}</p>
            <p className="text-[10px] text-slate-400 truncate">Administrator</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block h-screen sticky top-0 z-30 shadow-lg">
        {sidebarContent}
      </aside>

      {/* Mobile Header Bar */}
      <div className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <Link to="/admin" className="flex items-center gap-2">
          <UtensilsCrossed size={20} className="text-brand-400" />
          <span className="font-display font-bold text-sm">SmartCanteen Admin</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
        >
          <MenuIcon size={20} />
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-900/80 backdrop-blur-sm">
          {sidebarContent}
          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  );
};

export default AdminSidebar;
