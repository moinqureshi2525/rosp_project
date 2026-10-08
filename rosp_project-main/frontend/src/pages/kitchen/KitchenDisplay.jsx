import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  CheckCheck,
  Volume2,
  VolumeX,
  RefreshCw,
  Flame,
  Utensils,
  ArrowLeft,
  Sparkles,
  CheckSquare,
  Square,
  BellRing,
} from 'lucide-react';
import { canteenAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const playChimeSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.6);
  } catch (err) {
    // Audio context may be restricted before user interaction
  }
};

const KitchenDisplay = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [statusFilter, setStatusFilter] = useState('active'); // active, preparing, ready
  const [currentTime, setCurrentTime] = useState(new Date());
  const [checkedItems, setCheckedItems] = useState({}); // { "orderId-itemId": true }
  const [updatingId, setUpdatingId] = useState(null);

  const prevOrdersCount = useRef(0);

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchKitchenOrders = async () => {
    try {
      const data = await canteenAPI.getOrders();
      // Filter out completed & cancelled
      const active = data.filter(
        (o) => o.status !== 'completed' && o.status !== 'cancelled'
      );

      // Sound notification if new orders arrived
      if (active.length > prevOrdersCount.current && soundEnabled && !loading) {
        playChimeSound();
      }
      prevOrdersCount.current = active.length;
      setOrders(active);
    } catch (err) {
      console.error('Failed to load kitchen orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKitchenOrders();
    const interval = setInterval(fetchKitchenOrders, 8000); // Polling every 8s for live kitchen
    return () => clearInterval(interval);
  }, [soundEnabled]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await canteenAPI.updateOrderStatus(orderId, newStatus);
      if (newStatus === 'ready' && soundEnabled) {
        playChimeSound();
      }
      // If completed, remove from active list or update
      if (newStatus === 'completed') {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      } else {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } catch (err) {
      console.error('Failed to update kitchen status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleItemCheck = (orderId, itemId) => {
    const key = `${orderId}-${itemId}`;
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getElapsedTime = (createdDateStr) => {
    const created = new Date(createdDateStr);
    const diffMs = currentTime - created;
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    return { mins: diffMins, secs: diffSecs, totalMins: diffMins };
  };

  // Filtered orders
  const displayedOrders = orders.filter((o) => {
    if (statusFilter === 'preparing') return o.status === 'preparing';
    if (statusFilter === 'ready') return o.status === 'ready';
    return true; // 'active' includes pending, preparing, ready
  });

  // Calculate live station item counts (What needs to be cooked right now)
  const stationAggregates = {};
  orders
    .filter((o) => o.status === 'pending' || o.status === 'preparing')
    .forEach((ord) => {
      ord.items?.forEach((item) => {
        stationAggregates[item.food_item_name] =
          (stationAggregates[item.food_item_name] || 0) + item.quantity;
      });
    });

  if (loading) {
    return <LoadingSpinner fullScreen label="Connecting to Kitchen Display System (KDS)..." />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col">
      {/* Top KDS Header Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-xl">
        <div className="flex items-center gap-4">
          <Link
            to="/admin"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Return to Admin"
          >
            <ArrowLeft size={16} /> Admin Portal
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-red-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <ChefHat size={22} />
            </div>
            <div>
              <h1 className="font-display font-extrabold text-lg text-white tracking-wide flex items-center gap-2">
                Kitchen Display System <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase">KDS</span>
              </h1>
              <p className="text-slate-400 text-xs">Live Chef Prep & Counter Handover Queue</p>
            </div>
          </div>
        </div>

        {/* Center Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-4 py-2 rounded-xl transition-all ${
              statusFilter === 'active'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Active ({orders.length})
          </button>
          <button
            onClick={() => setStatusFilter('preparing')}
            className={`px-4 py-2 rounded-xl transition-all ${
              statusFilter === 'preparing'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Cooking Now ({orders.filter((o) => o.status === 'preparing').length})
          </button>
          <button
            onClick={() => setStatusFilter('ready')}
            className={`px-4 py-2 rounded-xl transition-all ${
              statusFilter === 'ready'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Ready for Counter ({orders.filter((o) => o.status === 'ready').length})
          </button>
        </div>

        {/* Right Controls & Clock */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playChimeSound();
            }}
            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              soundEnabled
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title="Audio Bell Alerts"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span className="hidden sm:inline">{soundEnabled ? 'Bell ON' : 'Bell Muted'}</span>
          </button>

          <button
            onClick={fetchKitchenOrders}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh Queue"
          >
            <RefreshCw size={16} />
          </button>

          <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 font-mono font-bold text-amber-400 text-sm tracking-wider">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
      </header>

      {/* On-Fire Summary Banner (Items currently on cook stations) */}
      {Object.keys(stationAggregates).length > 0 && (
        <div className="bg-slate-900/80 border-b border-slate-800/80 px-6 py-2.5 flex items-center gap-3 overflow-x-auto text-xs">
          <span className="font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1 shrink-0">
            <Flame size={15} /> Station Demand:
          </span>
          <div className="flex items-center gap-2">
            {Object.entries(stationAggregates).map(([itemName, count]) => (
              <span
                key={itemName}
                className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 shrink-0"
              >
                <strong className="text-amber-400 font-bold">{count}x</strong> {itemName}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Order Cards Grid */}
      <main className="flex-1 p-6 overflow-y-auto">
        {displayedOrders.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center text-slate-600">
              <ChefHat size={40} />
            </div>
            <h2 className="font-display font-bold text-2xl text-slate-400">No Active Kitchen Orders</h2>
            <p className="text-slate-500 text-sm max-w-md">
              The kitchen queue is clear. New incoming student orders will appear here automatically in real time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedOrders.map((ord) => {
              const elapsed = getElapsedTime(ord.created_at);
              const isUrgent = elapsed.totalMins >= 10;
              const isWarning = elapsed.totalMins >= 5 && elapsed.totalMins < 10;
              const token = ord.token_number || `TK-${ord.id.slice(0, 4).toUpperCase()}`;

              // Header color based on status & delay
              let cardBorder = 'border-slate-800';
              let badgeColor = 'bg-slate-800 text-slate-300';
              if (ord.status === 'pending') {
                badgeColor = 'bg-blue-950 text-blue-300 border-blue-800/50';
              } else if (ord.status === 'preparing') {
                cardBorder = 'border-amber-500/50';
                badgeColor = 'bg-amber-950 text-amber-300 border-amber-800/50';
              } else if (ord.status === 'ready') {
                cardBorder = 'border-emerald-500/50';
                badgeColor = 'bg-emerald-950 text-emerald-300 border-emerald-800/50';
              }

              return (
                <div
                  key={ord.id}
                  className={`bg-slate-900 rounded-3xl border ${cardBorder} shadow-2xl flex flex-col justify-between overflow-hidden transition-all hover:border-slate-700 ${
                    isUrgent ? 'ring-2 ring-red-500/40' : ''
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-5 border-b border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-black text-2xl sm:text-3xl text-white tracking-wider">
                        {token}
                      </span>
                      <div
                        className={`px-3 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 ${
                          isUrgent
                            ? 'bg-red-950 text-red-400 border border-red-800 animate-pulse'
                            : isWarning
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        <Clock size={13} /> {elapsed.mins}m {elapsed.secs}s
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold text-slate-300">{ord.user_name || 'Student'}</span>
                      <span className="capitalize px-2.5 py-0.5 rounded-full border text-[11px] font-bold">
                        {ord.status}
                      </span>
                    </div>
                  </div>

                  {/* Items Checklist */}
                  <div className="p-5 flex-1 space-y-2.5">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                      Kitchen Items ({ord.items?.length || 0})
                    </span>
                    <div className="space-y-2">
                      {ord.items?.map((item) => {
                        const key = `${ord.id}-${item.id}`;
                        const isDone = !!checkedItems[key];
                        return (
                          <div
                            key={item.id}
                            onClick={() => toggleItemCheck(ord.id, item.id)}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                              isDone
                                ? 'bg-slate-950/60 border-slate-800 text-slate-500 line-through'
                                : 'bg-slate-800/80 border-slate-700/80 text-white font-semibold'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {isDone ? (
                                <CheckSquare size={18} className="text-emerald-500 shrink-0" />
                              ) : (
                                <Square size={18} className="text-slate-400 shrink-0" />
                              )}
                              <span className="text-sm">
                                <strong className="text-amber-400 font-extrabold text-base mr-1">
                                  {item.quantity}x
                                </strong>{' '}
                                {item.food_item_name}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="p-4 bg-slate-950/80 border-t border-slate-800 space-y-2">
                    {ord.status === 'pending' && (
                      <button
                        onClick={() => handleUpdateStatus(ord.id, 'preparing')}
                        disabled={updatingId === ord.id}
                        className="w-full py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-2"
                      >
                        <ChefHat size={18} /> Start Cooking
                      </button>
                    )}

                    {ord.status === 'preparing' && (
                      <button
                        onClick={() => handleUpdateStatus(ord.id, 'ready')}
                        disabled={updatingId === ord.id}
                        className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                      >
                        <BellRing size={18} /> Mark Ready for Pickup
                      </button>
                    )}

                    {ord.status === 'ready' && (
                      <button
                        onClick={() => handleUpdateStatus(ord.id, 'completed')}
                        disabled={updatingId === ord.id}
                        className="w-full py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-md shadow-brand-600/20 transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCheck size={18} /> Order Picked Up (Complete)
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default KitchenDisplay;
