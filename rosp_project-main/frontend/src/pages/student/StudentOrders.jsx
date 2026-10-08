import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ChevronRight, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { canteenAPI } from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const StudentOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const data = await canteenAPI.getOrders(user?.id);
        setOrders(data);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user?.id]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900">
          My Order History 📜
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          View all your previous and current food orders
        </p>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading your orders..." />
      ) : orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((ord) => (
            <Link
              key={ord.id}
              to={`/student/orders/${ord.id}`}
              className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-display font-bold text-lg text-slate-900 group-hover:text-brand-600 transition-colors">
                    Order #{ord.id}
                  </span>
                  <StatusBadge status={ord.status} />
                </div>
                <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                  <span>{new Date(ord.created_at).toLocaleString()}</span>
                  <span>•</span>
                  <span>{ord.items?.length || 1} Item(s)</span>
                </div>
                <div className="text-sm font-semibold text-slate-700">
                  {ord.items?.map((i) => `${i.quantity}x ${i.food_item_name}`).join(', ')}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100">
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Total Amount</span>
                  <span className="font-display font-bold text-lg text-brand-600">
                    ₹{ord.total_amount?.toFixed(2)}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-100 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                  <ChevronRight size={20} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Clock}
          title="No orders yet"
          description="You haven't placed any food orders yet. Check out today's canteen menu!"
          actionText="Explore Canteen Menu"
          actionLink="/student/menu"
        />
      )}
    </div>
  );
};

export default StudentOrders;
