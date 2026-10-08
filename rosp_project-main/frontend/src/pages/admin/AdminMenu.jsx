import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { canteenAPI } from '../../services/api';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminMenu = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    image_url: '',
    is_available: true,
  });

  // Delete Confirm Modal
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const [itemsData, catData] = await Promise.all([
        canteenAPI.getItems(),
        canteenAPI.getCategories(),
      ]);
      setItems(itemsData);
      setCategories(catData);
    } catch (err) {
      console.error('Failed to load admin menu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category_id: categories[0]?.id || '',
      image_url: '',
      is_available: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price,
      category_id: item.category_id || categories[0]?.id || '',
      image_url: item.image_url || '',
      is_available: item.is_available ?? true,
    });
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category_id: formData.category_id || categories[0]?.id,
        image_url: formData.image_url,
        is_available: formData.is_available,
      };

      if (editingItem) {
        await canteenAPI.updateFoodItem(editingItem.id, payload);
      } else {
        await canteenAPI.createFoodItem(payload);
      }
      setIsModalOpen(false);
      fetchMenu();
    } catch (err) {
      console.error('Failed to save item:', err);
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      await canteenAPI.updateFoodItem(item.id, {
        is_available: !item.is_available,
      });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_available: !i.is_available } : i))
      );
    } catch (err) {
      console.error('Failed to toggle availability:', err);
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteConfirmItem) return;
    try {
      await canteenAPI.deleteFoodItem(deleteConfirmItem.id);
      setDeleteConfirmItem(null);
      fetchMenu();
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesCat = selectedCategory === 'all' || item.category_id === selectedCategory;
    const matchesQuery = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-slate-900">
            Food Menu Management 🍲
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Add, update, or remove canteen food items and manage daily availability
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-brand-600 transition-colors shadow-md"
        >
          <Plus size={18} /> Add New Food Item
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search items by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 uppercase">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold bg-white focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Food Items Table */}
      {loading ? (
        <LoadingSpinner label="Fetching menu items..." />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase border-b border-slate-100">
                <tr>
                  <th className="p-4">Item</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Availability</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <img
                        src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'}
                        alt={item.name}
                        className="w-12 h-12 rounded-xl object-cover bg-slate-100"
                      />
                      <div>
                        <p className="font-bold text-slate-900 text-base">{item.name}</p>
                        <p className="text-xs text-slate-500 line-clamp-1 max-w-xs">{item.description}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                        {item.category_name || 'General'}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-brand-600">₹{item.price?.toFixed(2)}</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                          item.is_available
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                        }`}
                      >
                        {item.is_available ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                        {item.is_available ? 'Available' : 'Disabled'}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          title="Edit Food"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmItem(item)}
                          className="p-2 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                          title="Delete Food"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Food Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Food Item' : 'Add New Food Item'}
      >
        <form onSubmit={handleSaveItem} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 uppercase">Food Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Paneer Tikka Roll"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 uppercase">Description</label>
            <textarea
              rows={2}
              placeholder="Brief description..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 uppercase">Price (₹)</label>
              <input
                type="number"
                step="0.5"
                required
                placeholder="50"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 uppercase">Category</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 uppercase">Image URL</label>
            <input
              type="url"
              placeholder="https://..."
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_available"
              checked={formData.is_available}
              onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
              className="w-4 h-4 rounded text-brand-600"
            />
            <label htmlFor="is_available" className="text-sm font-semibold text-slate-700">
              Available for Student Orders
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-slate-900 text-white hover:bg-brand-600 text-sm font-semibold shadow-sm"
            >
              Save Item
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmItem}
        onClose={() => setDeleteConfirmItem(null)}
        title="Confirm Deletion"
      >
        <div className="space-y-4 text-slate-700 text-sm">
          <p>
            Are you sure you want to delete <strong className="text-slate-900">{deleteConfirmItem?.name}</strong> from the menu? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setDeleteConfirmItem(null)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteItem}
              className="px-5 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 font-semibold shadow-sm"
            >
              Delete Item
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminMenu;
