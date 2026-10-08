import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, Plus, Minus, Trash2, ArrowRight, CheckCircle, AlertCircle, Utensils, QrCode, Sparkles } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { canteenAPI } from '../../services/api';
import EmptyState from '../../components/common/EmptyState';

const StudentCart = () => {
  const { cart, updateQuantity, removeFromCart, clearCart, totalAmount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [placedOrder, setPlacedOrder] = useState(null);

  const handlePlaceOrder = async () => {
    if (!cart || cart.length === 0) {
      setError('Your cart is empty.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      // Send item IDs and quantities to backend for server-side total calculation
      const order = await canteenAPI.createOrder(user?.id || 'demo-student', cart);
      setPlacedOrder(order);
      clearCart();
    } catch (err) {
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (placedOrder) {
    const tokenDisplay = placedOrder.token_number || `TK-${placedOrder.id.slice(0, 4).toUpperCase()}`;
    const qrPayload = JSON.stringify({
      order_id: placedOrder.id,
      token: tokenDisplay,
      amount: placedOrder.total_amount,
    });

    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-6 animate-scale-up">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
          <CheckCircle size={36} />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider border border-emerald-200">
            Order Confirmed & Sent to Kitchen
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900">
            Order #{placedOrder.id.slice(0, 8)}
          </h1>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Your food is now being queued. Show your Token Number or QR Code at the counter when ready.
          </p>
        </div>

        {/* Digital Pickup Token & QR Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 shadow-2xl border border-slate-700 relative overflow-hidden space-y-5">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
            <div className="text-left">
              <span className="text-[11px] font-semibold text-brand-400 uppercase tracking-widest block">Counter Pickup Token</span>
              <span className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-wider">
                {tokenDisplay}
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5">
              <Sparkles size={14} /> Counter 1
            </div>
          </div>

          {/* QR Code Graphic */}
          <div className="bg-white p-4 rounded-2xl w-fit mx-auto shadow-md">
            <QRCodeSVG
              value={qrPayload}
              size={150}
              level="M"
              includeMargin={false}
            />
          </div>

          <p className="text-xs text-slate-300 flex items-center justify-center gap-1.5 font-medium">
            <QrCode size={15} className="text-brand-400" /> Present this QR code or Token at counter for pickup verification
          </p>
        </div>

        {/* Order summary box */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 text-left space-y-4 shadow-sm">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-500 uppercase">Live Status</span>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Pending Kitchen Acceptance
            </span>
          </div>
          <div className="space-y-2">
            {placedOrder.items?.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-slate-700 font-medium">
                  {item.quantity}x {item.food_item_name}
                </span>
                <span className="text-slate-900 font-bold">₹{item.subtotal?.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t border-slate-100 flex justify-between items-center font-bold text-base">
            <span>Total Paid Amount</span>
            <span className="text-brand-600">₹{placedOrder.total_amount?.toFixed(2)}</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to={`/student/orders/${placedOrder.id}`}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-500 transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            Track Order Live <ArrowRight size={16} />
          </Link>
          <Link
            to="/student/menu"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
          >
            Order More Food
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Looks like you haven't added any food items to your cart yet."
          actionText="Browse Canteen Menu"
          actionLink="/student/menu"
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900">
          Your Shopping Cart 🛒
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Review your items before placing your canteen order
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Item list */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-4 transition-all hover:shadow-xs"
            >
              <img
                src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'}
                alt={item.name}
                className="w-20 h-20 rounded-xl object-cover bg-slate-100"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-semibold text-slate-800 text-base truncate">
                  {item.name}
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">Unit Price: ₹{item.price?.toFixed(2)}</p>
                <div className="text-brand-600 font-bold text-sm mt-1">
                  Subtotal: ₹{(item.price * item.quantity).toFixed(2)}
                </div>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-1 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="px-3 text-sm font-bold text-slate-800">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-1 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Remove item"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary & Checkout Card */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
            <h3 className="font-display font-bold text-lg text-slate-800 pb-3 border-b border-slate-100">
              Payment Summary
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-semibold text-slate-800">₹{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Canteen Service Fee</span>
                <span className="text-emerald-600 font-semibold">FREE</span>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center font-bold text-lg text-slate-900">
                <span>Total Amount</span>
                <span className="text-brand-600">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-brand-600 transition-all shadow-md flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? (
                'Processing Order...'
              ) : (
                <>
                  Place Order <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentCart;
