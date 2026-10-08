import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Utensils, ShoppingBag, Clock, Sparkles, ArrowRight, Flame, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { canteenAPI } from '../../services/api';
import FoodCard from '../../components/common/FoodCard';
import StatusBadge from '../../components/common/StatusBadge';
import { FoodCardSkeleton } from '../../components/common/LoadingSpinner';

const StudentHome = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [itemsData, catData, ordersData] = await Promise.all([
          canteenAPI.getItems(),
          canteenAPI.getCategories(),
          canteenAPI.getOrders(user?.id),
        ]);
        setItems(itemsData);
        setCategories(catData);
        setRecentOrders(ordersData.slice(0, 2));
      } catch (err) {
        console.error('Failed to fetch home data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id]);

  const getTimeOfDayGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning ☀️';
    if (hour < 17) return 'Good afternoon 👋';
    return 'Good evening 🌙';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Banner / Greeting Hero */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-brand-900 text-white p-8 sm:p-10 overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-brand-500/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-bold uppercase tracking-wider">
            <Sparkles size={14} /> Smart College Canteen
          </div>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-white tracking-tight">
            {getTimeOfDayGreeting()}, <span className="text-brand-400">{user?.full_name?.split(' ')[0] || 'Student'}</span>!
          </h1>
          <p className="text-slate-300 text-base sm:text-lg font-light leading-relaxed">
            What's on the menu today? Freshly prepared meals, quick snacks, and refreshing drinks waiting for you.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              to="/student/menu"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-all shadow-lg shadow-brand-600/30 hover:scale-102"
            >
              <Utensils size={18} /> Explore Full Menu
            </Link>
            <Link
              to="/student/cart"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm backdrop-blur-md transition-all"
            >
              <ShoppingBag size={18} /> View Cart
            </Link>
          </div>
        </div>
      </div>

      {/* Categories quick pill nav */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-xl text-slate-900">Food Categories</h2>
          <Link to="/student/menu" className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-0.5">
            View All <ChevronRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/student/menu?category=${cat.id}`}
              className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-brand-300 hover:bg-brand-50/50 transition-all flex flex-col items-center text-center group"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-100/70 text-brand-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Utensils size={22} />
              </div>
              <span className="font-display font-semibold text-sm text-slate-800 group-hover:text-brand-600 transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Popular Items Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="text-brand-600" size={24} />
            <h2 className="font-display font-bold text-xl text-slate-900">Today's Highlights & Popular Choice</h2>
          </div>
          <Link to="/student/menu" className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1">
            See entire menu <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FoodCardSkeleton />
            <FoodCardSkeleton />
            <FoodCardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.slice(0, 6).map((item) => (
              <FoodCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* Recent Orders Section */}
      {recentOrders.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="text-slate-700" size={20} />
              <h2 className="font-display font-bold text-lg text-slate-900">Recent Orders</h2>
            </div>
            <Link to="/student/orders" className="text-xs font-bold text-brand-600 hover:underline">
              View Order History
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentOrders.map((ord) => (
              <Link
                key={ord.id}
                to={`/student/orders/${ord.id}`}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md transition-all flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-display font-bold text-sm text-slate-900">{ord.id}</span>
                    <StatusBadge status={ord.status} />
                  </div>
                  <p className="text-xs text-slate-500">
                    {ord.items?.length || 1} items • ₹{ord.total_amount?.toFixed(2)}
                  </p>
                </div>
                <ChevronRight size={20} className="text-slate-400" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentHome;
