import React from 'react';
import { ShoppingBag, AlertCircle } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const FoodCard = ({ item }) => {
  const { addToCart } = useCart();
  const isAvailable = item.is_available ?? true;

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-md hover:-translate-y-1">
      {/* Image container */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
        <img
          src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'}
          alt={item.name}
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            !isAvailable ? 'grayscale opacity-75' : ''
          }`}
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-900/70 text-white backdrop-blur-md">
            {item.category_name || item.category || 'Food'}
          </span>
        </div>
        {!isAvailable && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
              <AlertCircle size={14} /> Currently unavailable
            </span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-display font-semibold text-lg text-slate-800 line-clamp-1 group-hover:text-brand-600 transition-colors">
              {item.name}
            </h3>
            <span className="font-bold text-brand-600 text-base">
              ₹{item.price?.toFixed(2)}
            </span>
          </div>
          <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 mb-4">
            {item.description || 'Delicious freshly prepared canteen item.'}
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => addToCart(item)}
          disabled={!isAvailable}
          className={`w-full py-2.5 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
            isAvailable
              ? 'bg-slate-900 text-white hover:bg-brand-600 hover:shadow-brand-500/20 active:scale-95'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
          }`}
        >
          <ShoppingBag size={16} />
          {isAvailable ? 'Add to Cart' : 'Currently Unavailable'}
        </button>
      </div>
    </div>
  );
};

export default FoodCard;
