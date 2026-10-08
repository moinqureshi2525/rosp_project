import React, { useEffect, useState } from 'react';
import { Search, RefreshCw, Filter, QrCode, CheckCircle2, AlertCircle, X, Sparkles, ArrowRight } from 'lucide-react';
import { canteenAPI } from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  // QR / Token Verification Modal state
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifiedOrder, setVerifiedOrder] = useState(null);
  const [verifyError, setVerifyError] = useState(null);
  const [pickupSuccess, setPickupSuccess] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await canteenAPI.getOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await canteenAPI.updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleVerifyLookup = async (e) => {
    e?.preventDefault();
    if (!tokenInput.trim()) return;
    setVerifying(true);
    setVerifyError(null);
    setVerifiedOrder(null);
    setPickupSuccess(null);

    try {
      // Try lookup
      const data = await canteenAPI.verifyOrder(tokenInput.trim());
      setVerifiedOrder(data);
    } catch (err) {
      setVerifyError(err.message || 'Order not found.');
    } finally {
      setVerifying(false);
    }
  };

  const handleConfirmPickup = async () => {
    if (!verifiedOrder) return;
    setVerifying(true);
    setVerifyError(null);

    try {
      const res = await canteenAPI.pickupOrder(verifiedOrder.token_number || verifiedOrder.id);
      setPickupSuccess(res.message || 'Order successfully verified and handed over!');
      setVerifiedOrder(res.order);
      // Refresh order list in background
      fetchOrders();
    } catch (err) {
      setVerifyError(err.message || 'Failed to complete pickup.');
    } finally {
      setVerifying(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'all' || o.status?.toLowerCase() === statusFilter;
    const matchesSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.token_number && o.token_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.user_name && o.user_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const statuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-slate-900">
            Live Canteen Orders 📋
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Monitor incoming orders, track pickup tokens, and verify counter handovers
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setVerifyModalOpen(true);
              setVerifiedOrder(null);
              setVerifyError(null);
              setPickupSuccess(null);
              setTokenInput('');
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-amber-500 text-white font-bold text-sm shadow-md shadow-brand-500/20 hover:scale-102 transition-all"
          >
            <QrCode size={18} /> Verify Pickup (Token / QR)
          </button>

          <button
            onClick={fetchOrders}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by Token (e.g. TK-101), Order ID, or Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 uppercase">Status Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold bg-white focus:outline-none capitalize"
          >
            <option value="all">All Statuses</option>
            {statuses.map((st) => (
              <option key={st} value={st} className="capitalize">
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <LoadingSpinner label="Loading live orders..." />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase border-b border-slate-100">
                <tr>
                  <th className="p-4">Pickup Token</th>
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Items</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Time</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-extrabold text-xs tracking-wider">
                        {ord.token_number || `TK-${ord.id.slice(0, 4).toUpperCase()}`}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-600 text-xs">#{ord.id.slice(0, 8)}</td>
                    <td className="p-4 text-slate-800 font-semibold">{ord.user_name || 'Student'}</td>
                    <td className="p-4 max-w-xs text-xs text-slate-600">
                      {ord.items?.map((i) => `${i.quantity}x ${i.food_item_name}`).join(', ')}
                    </td>
                    <td className="p-4 font-bold text-brand-600">₹{ord.total_amount?.toFixed(2)}</td>
                    <td className="p-4 text-xs text-slate-500">
                      {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={ord.status} />
                    </td>
                    <td className="p-4 text-right">
                      <select
                        value={ord.status?.toLowerCase()}
                        disabled={updatingId === ord.id}
                        onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 hover:bg-white focus:ring-2 focus:ring-brand-500 capitalize cursor-pointer"
                      >
                        {statuses.map((st) => (
                          <option key={st} value={st} className="capitalize">
                            Mark as {st}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Verify Pickup Token / QR Modal */}
      {verifyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 relative border border-slate-100">
            <button
              onClick={() => setVerifyModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <QrCode size={24} />
              </div>
              <div>
                <h3 className="font-display font-bold text-xl text-slate-900">
                  Counter Pickup Verification
                </h3>
                <p className="text-slate-500 text-xs">
                  Scan student's QR code or enter their token number (e.g. TK-101)
                </p>
              </div>
            </div>

            <form onSubmit={handleVerifyLookup} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Token (e.g. TK-101) or Order ID..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                autoFocus
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="submit"
                disabled={verifying || !tokenInput.trim()}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-brand-600 text-white text-sm font-bold transition-all disabled:opacity-50"
              >
                {verifying ? 'Searching...' : 'Lookup'}
              </button>
            </form>

            {verifyError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} /> {verifyError}
              </div>
            )}

            {pickupSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2 animate-scale-up">
                <CheckCircle2 size={18} /> {pickupSuccess}
              </div>
            )}

            {/* Verified Order Card */}
            {verifiedOrder && (
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Token</span>
                    <p className="font-display font-extrabold text-2xl text-slate-900">
                      {verifiedOrder.token_number || `TK-${verifiedOrder.id.slice(0, 4).toUpperCase()}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Student</span>
                    <p className="font-semibold text-slate-800 text-sm">{verifiedOrder.user_name || 'Student User'}</p>
                  </div>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Items to Handover</span>
                  {verifiedOrder.items?.map((item) => (
                    <div key={item.id} className="flex justify-between text-xs font-medium">
                      <span className="text-slate-800">{item.quantity}x {item.food_item_name}</span>
                      <span className="text-slate-600 font-semibold">₹{item.subtotal?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-sm font-bold">
                  <span>Status: <StatusBadge status={verifiedOrder.status} /></span>
                  <span className="text-brand-600 text-base">₹{verifiedOrder.total_amount?.toFixed(2)}</span>
                </div>

                {verifiedOrder.status !== 'completed' ? (
                  <button
                    onClick={handleConfirmPickup}
                    disabled={verifying}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={18} /> Confirm Handover & Complete Order
                  </button>
                ) : (
                  <div className="text-center text-xs font-bold text-emerald-700 bg-emerald-50 py-2 rounded-xl border border-emerald-200">
                    ✓ Order has been completed and verified.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
