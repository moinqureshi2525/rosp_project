import React from 'react';
import { Clock, ChefHat, CheckCircle2, CheckCheck, XCircle, AlertTriangle } from 'lucide-react';

const StatusBadge = ({ status, type = 'order' }) => {
  const normalized = (status || '').toLowerCase();

  if (type === 'inventory') {
    if (normalized === 'out' || normalized === 'out of stock' || status === 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
          <XCircle size={14} /> Out of Stock
        </span>
      );
    }
    if (normalized === 'low' || normalized === 'low stock' || status === true) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
          <AlertTriangle size={14} /> Low Stock
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
        <CheckCircle2 size={14} /> Healthy Stock
      </span>
    );
  }

  // Order status badges
  switch (normalized) {
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock size={13} className="animate-pulse" /> Pending
        </span>
      );
    case 'preparing':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <ChefHat size={13} className="animate-bounce" /> Preparing
        </span>
      );
    case 'ready':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <CheckCircle2 size={13} /> Ready for Pickup
        </span>
      );
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCheck size={13} /> Completed
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          <XCircle size={13} /> Cancelled
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          {status}
        </span>
      );
  }
};

export default StatusBadge;
