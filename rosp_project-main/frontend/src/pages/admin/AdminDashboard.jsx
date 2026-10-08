import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  DollarSign,
  Utensils,
  AlertTriangle,
  Flame,
  TrendingUp,
  Bot,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { canteenAPI } from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [salesTrends, setSalesTrends] = useState([]);
  const [popularItems, setPopularItems] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [dashData, salesData, popData, predData] = await Promise.all([
          canteenAPI.getDashboardAnalytics(),
          canteenAPI.getSalesAnalytics(7),
          canteenAPI.getPopularItems(5),
          canteenAPI.getLatestPredictions(),
        ]);
        setMetrics(dashData);
        setSalesTrends(salesData);
        setPopularItems(popData);
        setPredictions(predData.slice(0, 3));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner fullScreen label="Loading canteen admin dashboard..." />;
  }

  const statCards = [
    { title: "Today's Orders", value: metrics?.todays_order_count || 0, icon: ShoppingBag, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { title: "Today's Revenue", value: `₹${(metrics?.todays_revenue || 0).toFixed(2)}`, icon: DollarSign, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { title: 'Total Food Items', value: metrics?.total_food_items || 0, icon: Utensils, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    { title: 'Low Stock Items', value: metrics?.low_stock_count || 0, icon: AlertTriangle, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { title: 'Popular Food Item', value: metrics?.popular_food_item || 'Samosa', icon: Flame, color: 'text-brand-600 bg-brand-50 border-brand-200' },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-slate-900 flex items-center gap-2">
            Canteen Operations Dashboard 📊
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Real-time sales, inventory alerts, and ML food demand prediction
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/ai-assistant"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-xs sm:text-sm shadow-md hover:opacity-95 transition-all"
          >
            <Bot size={18} /> Ask AI Assistant <Sparkles size={14} />
          </Link>
          <Link
            to="/admin/predictions"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs sm:text-sm shadow-md hover:bg-brand-600 transition-all"
          >
            <TrendingUp size={18} /> View Predictions
          </Link>
        </div>
      </div>

      {/* 5 Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase">{card.title}</span>
                <div className={`p-2 rounded-xl border ${card.color}`}>
                  <Icon size={18} />
                </div>
              </div>
              <p className="font-display font-bold text-2xl text-slate-900">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Recharts Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Revenue Trend */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-slate-800">
              Sales & Revenue Trend (Last 7 Days)
            </h3>
            <Link to="/admin/analytics" className="text-xs font-bold text-brand-600 hover:underline">
              Detailed Analytics
            </Link>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrends}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="sale_date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip formatter={(val) => [`₹${val}`, 'Revenue']} />
                <Area type="monotone" dataKey="total_revenue" stroke="#ea580c" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Food Items */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-slate-800">
              Popular Items (Units Sold)
            </h3>
            <span className="text-xs font-semibold text-slate-400">By Quantity</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={popularItems}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="food_item_name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip formatter={(val) => [`${val} units`, 'Quantity Sold']} />
                <Bar dataKey="total_quantity_sold" fill="#0f172a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Demand Prediction & AI Assistant Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ML Demand Prediction Preview */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-brand-600" size={22} />
              <h3 className="font-display font-bold text-lg text-slate-900">
                Tomorrow's Predicted Demand Preview
              </h3>
            </div>
            <Link to="/admin/predictions" className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1">
              View All Predictions <ArrowRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase">
                <tr>
                  <th className="p-3">Food Item</th>
                  <th className="p-3">Predicted Demand</th>
                  <th className="p-3">Rec. Prep Qty</th>
                  <th className="p-3">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {predictions.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-semibold">{p.food_item_name}</td>
                    <td className="p-3 text-slate-700">{p.predicted_demand} units</td>
                    <td className="p-3 font-bold text-brand-600">{p.recommended_prep_qty} units</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                        {(p.confidence_score * 100).toFixed(0)}% Match
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Assistant Quick Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Bot size={26} />
            </div>
            <h3 className="font-display font-bold text-xl text-white">SmartCanteen AI Insights</h3>
            <p className="text-slate-300 text-xs leading-relaxed">
              Ask questions about sales forecasts, inventory status, stock replenishment, and strategies to minimize daily food wastage.
            </p>
          </div>

          <Link
            to="/admin/ai-assistant"
            className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2"
          >
            Launch AI Assistant <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-lg text-slate-900">Recent Customer Orders</h3>
          <Link to="/admin/orders" className="text-xs font-bold text-brand-600 hover:underline">
            Manage All Orders
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase">
              <tr>
                <th className="p-3">Order ID</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Items Summary</th>
                <th className="p-3">Total Amount</th>
                <th className="p-3">Date</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {metrics?.recent_orders?.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/80">
                  <td className="p-3 font-bold text-slate-900">{ord.id}</td>
                  <td className="p-3 text-slate-700">{ord.user_name || 'Student'}</td>
                  <td className="p-3 text-slate-600 max-w-xs truncate">
                    {ord.items?.map((i) => `${i.quantity}x ${i.food_item_name}`).join(', ')}
                  </td>
                  <td className="p-3 font-bold text-brand-600">₹{ord.total_amount?.toFixed(2)}</td>
                  <td className="p-3 text-xs text-slate-500">{new Date(ord.created_at).toLocaleTimeString()}</td>
                  <td className="p-3">
                    <StatusBadge status={ord.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
