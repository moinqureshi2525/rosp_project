import React, { useEffect, useState } from 'react';
import { Boxes, AlertTriangle, Edit, RefreshCw } from 'lucide-react';
import { canteenAPI } from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Update Stock Modal State
  const [editingItem, setEditingItem] = useState(null);
  const [stockInput, setStockInput] = useState('');
  const [minStockInput, setMinStockInput] = useState('15');

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const data = await canteenAPI.getInventory();
      setInventory(data);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleOpenEdit = (inv) => {
    setEditingItem(inv);
    setStockInput(inv.current_stock?.toString() || '0');
    setMinStockInput(inv.minimum_stock_alert?.toString() || '15');
  };

  const handleSaveStock = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      await canteenAPI.updateInventory(
        editingItem.food_item_id,
        parseInt(stockInput) || 0,
        parseInt(minStockInput) || 15
      );
      setEditingItem(null);
      fetchInventory();
    } catch (err) {
      console.error('Failed to update stock:', err);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-slate-900">
            Inventory & Stock Control 📦
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Monitor raw ingredient levels, current dish availability, and minimum stock alerts
          </p>
        </div>

        <button
          onClick={fetchInventory}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh Inventory
        </button>
      </div>

      {/* Inventory Table */}
      {loading ? (
        <LoadingSpinner label="Loading inventory status..." />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase border-b border-slate-100">
                <tr>
                  <th className="p-4">Food Item</th>
                  <th className="p-4">Current Stock</th>
                  <th className="p-4">Minimum Alert Threshold</th>
                  <th className="p-4">Stock Status</th>
                  <th className="p-4">Last Updated</th>
                  <th className="p-4 text-right">Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {inventory.map((inv) => {
                  const isLow = inv.current_stock <= inv.minimum_stock_alert;
                  return (
                    <tr
                      key={inv.id}
                      className={`transition-colors ${
                        isLow ? 'bg-amber-50/60 hover:bg-amber-50' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="p-4 font-bold text-slate-900">{inv.food_item_name}</td>
                      <td className="p-4 font-display font-bold text-base">
                        <span className={isLow ? 'text-amber-600' : 'text-slate-800'}>
                          {inv.current_stock} units
                        </span>
                      </td>
                      <td className="p-4 text-slate-500">{inv.minimum_stock_alert} units</td>
                      <td className="p-4">
                        <StatusBadge
                          status={inv.current_stock === 0 ? 'out' : isLow ? 'low' : 'healthy'}
                          type="inventory"
                        />
                      </td>
                      <td className="p-4 text-xs text-slate-500">
                        {new Date(inv.last_updated).toLocaleString()}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(inv)}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-brand-600 text-white font-semibold text-xs transition-colors shadow-2xs flex items-center gap-1.5 ml-auto"
                        >
                          <Edit size={13} /> Update Stock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Stock Modal */}
      <Modal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title={`Update Stock: ${editingItem?.food_item_name}`}
      >
        <form onSubmit={handleSaveStock} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 uppercase">Current Stock Quantity</label>
            <input
              type="number"
              min="0"
              required
              value={stockInput}
              onChange={(e) => setStockInput(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 uppercase">Minimum Stock Alert Threshold</label>
            <input
              type="number"
              min="0"
              required
              value={minStockInput}
              onChange={(e) => setMinStockInput(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditingItem(null)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-slate-900 text-white hover:bg-brand-600 text-sm font-semibold shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminInventory;
