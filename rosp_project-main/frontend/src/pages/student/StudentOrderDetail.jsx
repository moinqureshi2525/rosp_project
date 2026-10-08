import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, ChefHat, CheckCircle2, CheckCheck, Star, Send, AlertCircle, QrCode, Sparkles } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { canteenAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const StudentOrderDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Feedback state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackError, setFeedbackError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const data = await canteenAPI.getOrder(id);
        setOrder(data);
      } catch (err) {
        console.error('Failed to load order:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!order) return;
    setFeedbackSubmitting(true);
    setFeedbackError(null);
    try {
      const firstItemId = order.items?.[0]?.food_item_id || 'item-1';
      await canteenAPI.submitFeedback({
        order_id: order.id,
        user_id: user?.id || 'demo-student',
        food_item_id: firstItemId,
        rating,
        comment,
      });
      setFeedbackSuccess(true);
    } catch (err) {
      setFeedbackError(err.message || 'Failed to submit feedback.');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen label="Loading order details..." />;
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Order Not Found</h2>
        <Link to="/student/orders" className="text-brand-600 font-semibold hover:underline">
          Return to Order History
        </Link>
      </div>
    );
  }

  const tokenDisplay = order.token_number || `TK-${order.id.slice(0, 4).toUpperCase()}`;
  const qrPayload = JSON.stringify({
    order_id: order.id,
    token: tokenDisplay,
    amount: order.total_amount,
  });

  const steps = [
    { label: 'Pending', icon: Clock, key: 'pending' },
    { label: 'Preparing', icon: ChefHat, key: 'preparing' },
    { label: 'Ready', icon: CheckCircle2, key: 'ready' },
    { label: 'Completed', icon: CheckCheck, key: 'completed' },
  ];

  const statusOrderIndex = ['pending', 'preparing', 'ready', 'completed'];
  const currentIndex = statusOrderIndex.indexOf(order.status?.toLowerCase());
  const isCancelled = order.status?.toLowerCase() === 'cancelled';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header with back link */}
      <div>
        <Link
          to="/student/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-3"
        >
          <ArrowLeft size={16} /> Back to My Orders
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900">
              Order #{order.id.slice(0, 8)}
            </h1>
            <p className="text-slate-500 text-xs mt-1">
              Placed on {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} />
          </div>
        </div>
      </div>

      {/* Digital Pickup Token & QR Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <span className="text-xs font-bold text-brand-400 uppercase tracking-widest flex items-center justify-center sm:justify-start gap-1">
            <Sparkles size={14} /> Pickup Token Verification
          </span>
          <div className="font-display font-extrabold text-4xl sm:text-5xl text-white tracking-wider">
            {tokenDisplay}
          </div>
          <p className="text-slate-300 text-xs max-w-sm">
            Show this token or let counter staff scan your QR code when order is <strong className="text-emerald-400 font-semibold">Ready</strong>.
          </p>
        </div>

        <div className="bg-white p-3 rounded-2xl shadow-md shrink-0">
          <QRCodeSVG
            value={qrPayload}
            size={120}
            level="M"
            includeMargin={false}
          />
        </div>
      </div>

      {/* Visual Status Progression Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <h3 className="font-display font-bold text-base text-slate-800 mb-6">
          Order Status Tracker
        </h3>

        {isCancelled ? (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold text-center">
            This order was cancelled.
          </div>
        ) : (
          <div className="relative flex items-center justify-between max-w-2xl mx-auto">
            {/* Background progress line */}
            <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1 bg-slate-100 z-0" />
            <div
              className="absolute top-1/2 left-6 -translate-y-1/2 h-1 bg-brand-500 z-0 transition-all duration-500"
              style={{
                width: `${currentIndex >= 0 ? (currentIndex / (steps.length - 1)) * 100 : 0}%`,
              }}
            />

            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isDone = currentIndex >= idx;
              const isCurrent = currentIndex === idx;

              return (
                <div key={step.key} className="relative z-10 flex flex-col items-center gap-2">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-brand-600 text-white ring-4 ring-brand-100 shadow-md scale-110'
                        : isDone
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <Icon size={20} />
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      isCurrent
                        ? 'text-brand-600 font-bold'
                        : isDone
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Items Breakdown */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
        <h3 className="font-display font-bold text-lg text-slate-900 border-b border-slate-100 pb-3">
          Ordered Items
        </h3>

        <div className="divide-y divide-slate-100">
          {order.items?.map((item) => (
            <div key={item.id} className="py-4 flex justify-between items-center text-sm">
              <div>
                <h4 className="font-semibold text-slate-800">{item.food_item_name}</h4>
                <p className="text-xs text-slate-400">
                  Quantity: {item.quantity} × ₹{item.unit_price?.toFixed(2)}
                </p>
              </div>
              <span className="font-bold text-slate-900">₹{item.subtotal?.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-base font-bold">
          <span className="text-slate-900">Total Paid</span>
          <span className="text-brand-600 text-xl">₹{order.total_amount?.toFixed(2)}</span>
        </div>
      </div>

      {/* Student Feedback Section (Available if order is Completed) */}
      {order.status?.toLowerCase() === 'completed' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-4">
          <h3 className="font-display font-bold text-lg text-slate-900">
            Rate Your Meal & Experience ⭐
          </h3>

          {feedbackSuccess ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold flex items-center gap-2">
              <CheckCheck size={20} /> Thank you! Your feedback has been submitted to the canteen team.
            </div>
          ) : (
            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              {feedbackError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-semibold">
                  {feedbackError}
                </div>
              )}

              {/* Star Rating */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase">Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 text-amber-400 hover:scale-125 transition-transform"
                    >
                      <Star
                        size={28}
                        className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                      />
                    </button>
                  ))}
                  <span className="text-sm font-bold text-slate-700 ml-2">{rating} / 5 Stars</span>
                </div>
              </div>

              {/* Comment text */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase">Comments (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="How was the taste, packaging, or speed of service?"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <button
                type="submit"
                disabled={feedbackSubmitting}
                className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-brand-600 transition-colors shadow-sm flex items-center gap-2"
              >
                <Send size={16} /> {feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentOrderDetail;
