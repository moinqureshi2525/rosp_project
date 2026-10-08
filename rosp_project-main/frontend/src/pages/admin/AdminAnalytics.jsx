import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, ShoppingBag, Flame } from 'lucide-react';
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { canteenAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

const AdminAnalytics = () => {
  const [days, setDays] = useState(14);
  const [salesTrends, setSalesTrends] = useState([]);
  const [popularItems, setPopularItems] = useState([]);
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const [salesData, popData, dashData] = await Promise.all([
          canteenAPI.getSalesAnalytics(days),
          canteenAPI.getPopularItems(5),
          canteenAPI.getDashboardAnalytics(),
        ]);
        setSalesTrends(salesData);
        setPopularItems(popData);
        setDashboardMetrics(dashData);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [days]);

  if (loading) {
    return <LoadingSpinner fullScreen label="Loading sales analytics & Recharts data..." />;
  }

  const COLORS = ['#ea580c', '#0f172a', '#3b82f6', '#10b981', '#8b5cf6'];

  const totalRevenuePeriod = salesTrends.reduce((sum, p) => sum + (p.total_revenue || 0), 0);
  const totalUnitsPeriod = salesTrends.reduce((sum, p) => sum + (p.quantity_sold || 0), 0);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-slate-900">
            Sales & Demand Analytics 📈
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Historical revenue performance, top-selling canteen items, and order volume insights
          </p>
        </div>

        {/* Time period filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase">Period:</span>
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold bg-white focus:outline-none shadow-2xs"
          >
            <option value={7}>Last 7 Days</option>
            <option value={14}>Last 14 Days</option>
            <option value={30}>Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Summary metric banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Period Revenue</span>
            <DollarSign size={18} className="text-brand-600" />
          </div>
          <p className="font-display font-bold text-3xl text-slate-900">
            ₹{totalRevenuePeriod.toFixed(2)}
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Total Dishes Sold</span>
            <ShoppingBag size={18} className="text-blue-600" />
          </div>
          <p className="font-display font-bold text-3xl text-slate-900">{totalUnitsPeriod} units</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Most Popular Dish</span>
            <Flame size={18} className="text-amber-500" />
          </div>
          <p className="font-display font-bold text-xl text-slate-900 truncate">
            {dashboardMetrics?.popular_food_item || 'Masala Samosa'}
          </p>
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="font-display font-bold text-lg text-slate-900">
          Daily Revenue & Order Volume Trends
        </h3>

        {salesTrends.length > 0 ? (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrends}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="sale_date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip formatter={(val) => [`₹${val}`, 'Daily Revenue']} />
                <Area
                  type="monotone"
                  dataKey="total_revenue"
                  stroke="#ea580c"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState title="No sales data" description="No sales history recorded for this period." />
        )}
      </div>

      {/* Recharts Bar & Pie Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Items Bar Chart */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="font-display font-bold text-lg text-slate-900">
            Top 5 Dishes by Sales Volume
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={popularItems} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                <YAxis dataKey="food_item_name" type="category" stroke="#94a3b8" fontSize={11} width={120} />
                <Tooltip formatter={(val) => [`${val} units`, 'Units Sold']} />
                <Bar dataKey="total_quantity_sold" fill="#ea580c" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Share Pie Chart */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="font-display font-bold text-lg text-slate-900">
            Revenue Share per Dish
          </h3>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={popularItems}
                  dataKey="total_revenue"
                  nameKey="food_item_name"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  innerRadius={50}
                  paddingAngle={4}
                  label={({ food_item_name, percent }) => `${food_item_name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {popularItems.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [`₹${val}`, 'Total Revenue']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
