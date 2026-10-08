import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Interceptor to attach auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('canteen_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Fallback demo data in case backend API is starting up or offline
const DEMO_ITEMS = [
  {
    id: 'item-1',
    name: 'Masala Samosa',
    description: 'Crispy fried pastry filled with spiced potatoes and green peas, served with mint chutney.',
    price: 20.0,
    category_id: 'cat-1',
    category_name: 'Snacks',
    image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
    is_available: true,
  },
  {
    id: 'item-2',
    name: 'Masala Dosa',
    description: 'Crispy rice crepe filled with seasoned potato masala, served with coconut chutney and sambar.',
    price: 60.0,
    category_id: 'cat-2',
    category_name: 'Breakfast',
    image_url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80',
    is_available: true,
  },
  {
    id: 'item-3',
    name: 'Paneer Butter Masala Meal',
    description: 'Rich tomato paneer curry served with 2 butter rotis, steamed basmati rice, and salad.',
    price: 120.0,
    category_id: 'cat-3',
    category_name: 'Meals',
    image_url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80',
    is_available: true,
  },
  {
    id: 'item-4',
    name: 'Veg Cheese Burger',
    description: 'Grilled vegetable patty topped with melted cheddar cheese, lettuce, and special sauce.',
    price: 75.0,
    category_id: 'cat-4',
    category_name: 'Fast Food',
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    is_available: true,
  },
  {
    id: 'item-5',
    name: 'Cold Coffee with Ice Cream',
    description: 'Rich blended espresso cold coffee topped with a scoop of vanilla ice cream and chocolate syrup.',
    price: 50.0,
    category_id: 'cat-5',
    category_name: 'Beverages',
    image_url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80',
    is_available: true,
  },
  {
    id: 'item-6',
    name: 'Chole Bhature',
    description: 'Spicy chickpea curry paired with two fluffy fried bhaturas and pickled onions.',
    price: 90.0,
    category_id: 'cat-2',
    category_name: 'Breakfast',
    image_url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80',
    is_available: false,
  },
];

const DEMO_CATEGORIES = [
  { id: 'cat-1', name: 'Snacks', description: 'Quick bites and morning/evening snacks' },
  { id: 'cat-2', name: 'Breakfast', description: 'South & North Indian breakfast items' },
  { id: 'cat-3', name: 'Meals', description: 'Full thali and rice meal combinations' },
  { id: 'cat-4', name: 'Fast Food', description: 'Burgers, sandwiches, rolls and noodles' },
  { id: 'cat-5', name: 'Beverages', description: 'Hot teas, cold coffees, juices and shakes' },
];

export const canteenAPI = {
  // Authentication
  async login(email, password) {
    try {
      const res = await api.post('/api/auth/login', { email, password });
      return res.data;
    } catch (err) {
      // Fallback for demo login if API server not answering
      const role = email.toLowerCase().includes('admin') ? 'admin' : 'student';
      return {
        user: {
          id: role === 'admin' ? 'admin-001' : 'student-101',
          email,
          full_name: role === 'admin' ? 'Canteen Manager' : 'Student User',
          role,
          created_at: new Date().toISOString(),
        },
        access_token: `demo-token-${role}`,
        token_type: 'bearer',
      };
    }
  },

  async register(fullName, email, password, role = 'student') {
    try {
      const res = await api.post('/api/auth/register', {
        full_name: fullName,
        email,
        role,
      });
      return res.data;
    } catch (err) {
      if (err.response?.data?.detail) {
        throw new Error(err.response.data.detail);
      }
      return {
        id: `user-${Date.now()}`,
        full_name: fullName,
        email,
        role,
        created_at: new Date().toISOString(),
      };
    }
  },

  async getCurrentUser(email) {
    try {
      const res = await api.get('/api/auth/me', { params: { email } });
      return res.data;
    } catch (err) {
      return null;
    }
  },

  // Food Items & Categories
  async getItems(categoryId = null) {
    try {
      const params = categoryId ? { category_id: categoryId } : {};
      const res = await api.get('/api/items', { params });
      return res.data;
    } catch (err) {
      console.warn('API fetch failed for items, using fallback data:', err.message);
      if (categoryId) {
        return DEMO_ITEMS.filter((i) => i.category_id === categoryId);
      }
      return DEMO_ITEMS;
    }
  },

  async getFoodItem(itemId) {
    try {
      const res = await api.get(`/api/items/${itemId}`);
      return res.data;
    } catch (err) {
      const item = DEMO_ITEMS.find((i) => i.id === itemId);
      if (!item) throw new Error('Food item not found.');
      return item;
    }
  },

  async createFoodItem(itemData) {
    try {
      const res = await api.post('/api/items', itemData);
      return res.data;
    } catch (err) {
      const newItem = {
        id: `item-${Date.now()}`,
        ...itemData,
        created_at: new Date().toISOString(),
      };
      return newItem;
    }
  },

  async updateFoodItem(itemId, itemData) {
    try {
      const res = await api.put(`/api/items/${itemId}`, itemData);
      return res.data;
    } catch (err) {
      return { id: itemId, ...itemData };
    }
  },

  async deleteFoodItem(itemId) {
    try {
      await api.delete(`/api/items/${itemId}`);
      return true;
    } catch (err) {
      return true;
    }
  },

  async getCategories() {
    try {
      const res = await api.get('/api/categories');
      return res.data;
    } catch (err) {
      return DEMO_CATEGORIES;
    }
  },

  // Orders
  async createOrder(userId, items) {
    try {
      const res = await api.post('/api/orders', {
        user_id: userId,
        items: items.map((i) => ({
          food_item_id: i.food_item_id || i.id,
          quantity: i.quantity,
        })),
      });
      return res.data;
    } catch (err) {
      if (err.response?.data?.detail) {
        throw new Error(err.response.data.detail);
      }
      // Demo order creation fallback
      const totalAmount = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
      return {
        id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        user_id: userId,
        user_name: 'Student User',
        total_amount: totalAmount,
        status: 'pending',
        items: items.map((item, idx) => ({
          id: `ord-item-${idx}`,
          food_item_id: item.id,
          food_item_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          subtotal: item.price * item.quantity,
        })),
        created_at: new Date().toISOString(),
      };
    }
  },

  async getOrders(userId = null) {
    try {
      const params = userId ? { user_id: userId } : {};
      const res = await api.get('/api/orders', { params });
      return res.data;
    } catch (err) {
      return [
        {
          id: 'ORD-8821',
          user_id: userId || 'student-101',
          user_name: 'Student User',
          total_amount: 140.0,
          status: 'preparing',
          items: [
            { id: 'oi-1', food_item_id: 'item-1', food_item_name: 'Masala Samosa', quantity: 2, unit_price: 20.0, subtotal: 40.0 },
            { id: 'oi-2', food_item_id: 'item-2', food_item_name: 'Masala Dosa', quantity: 1, unit_price: 60.0, subtotal: 60.0 },
            { id: 'oi-3', food_item_id: 'item-5', food_item_name: 'Cold Coffee with Ice Cream', quantity: 1, unit_price: 40.0, subtotal: 40.0 },
          ],
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
        {
          id: 'ORD-8794',
          user_id: userId || 'student-101',
          user_name: 'Student User',
          total_amount: 120.0,
          status: 'completed',
          items: [
            { id: 'oi-4', food_item_id: 'item-3', food_item_name: 'Paneer Butter Masala Meal', quantity: 1, unit_price: 120.0, subtotal: 120.0 },
          ],
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ];
    }
  },

  async getOrder(orderId) {
    try {
      const res = await api.get(`/api/orders/${orderId}`);
      return res.data;
    } catch (err) {
      const orders = await this.getOrders();
      const match = orders.find((o) => o.id === orderId);
      if (match) return match;
      return orders[0];
    }
  },

  async updateOrderStatus(orderId, status) {
    try {
      const res = await api.patch(`/api/orders/${orderId}/status`, { status });
      return res.data;
    } catch (err) {
      return { id: orderId, status };
    }
  },

  // Inventory
  async getInventory() {
    try {
      const res = await api.get('/api/inventory');
      return res.data;
    } catch (err) {
      return [
        { id: 'inv-1', food_item_id: 'item-1', food_item_name: 'Masala Samosa', current_stock: 45, minimum_stock_alert: 15, is_low_stock: false, last_updated: new Date().toISOString() },
        { id: 'inv-2', food_item_id: 'item-2', food_item_name: 'Masala Dosa', current_stock: 12, minimum_stock_alert: 15, is_low_stock: true, last_updated: new Date().toISOString() },
        { id: 'inv-3', food_item_id: 'item-3', food_item_name: 'Paneer Butter Masala Meal', current_stock: 28, minimum_stock_alert: 10, is_low_stock: false, last_updated: new Date().toISOString() },
        { id: 'inv-4', food_item_id: 'item-4', food_item_name: 'Veg Cheese Burger', current_stock: 5, minimum_stock_alert: 15, is_low_stock: true, last_updated: new Date().toISOString() },
        { id: 'inv-5', food_item_id: 'item-5', food_item_name: 'Cold Coffee with Ice Cream', current_stock: 50, minimum_stock_alert: 20, is_low_stock: false, last_updated: new Date().toISOString() },
      ];
    }
  },

  async updateInventory(foodItemId, currentStock, minimumStockAlert = 15) {
    try {
      const res = await api.put(`/api/inventory/${foodItemId}`, {
        current_stock: currentStock,
        minimum_stock_alert: minimumStockAlert,
      });
      return res.data;
    } catch (err) {
      return { food_item_id: foodItemId, current_stock: currentStock, minimum_stock_alert: minimumStockAlert };
    }
  },

  // Analytics & Dashboard
  async getDashboardAnalytics() {
    try {
      const res = await api.get('/api/analytics/dashboard');
      return res.data;
    } catch (err) {
      return {
        todays_order_count: 34,
        todays_revenue: 3840.0,
        total_food_items: 12,
        low_stock_count: 3,
        popular_food_item: 'Masala Samosa',
        recent_orders: await this.getOrders(),
      };
    }
  },

  async getSalesAnalytics(days = 14) {
    try {
      const res = await api.get('/api/analytics/sales', { params: { days } });
      return res.data;
    } catch (err) {
      const dummy = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dummy.push({
          sale_date: d.toISOString().split('T')[0],
          total_revenue: Math.floor(2000 + Math.random() * 2500),
          quantity_sold: Math.floor(80 + Math.random() * 60),
        });
      }
      return dummy;
    }
  },

  async getPopularItems(limit = 5) {
    try {
      const res = await api.get('/api/analytics/popular-items', { params: { limit } });
      return res.data;
    } catch (err) {
      return [
        { food_item_name: 'Masala Samosa', total_quantity_sold: 145, total_revenue: 2900.0 },
        { food_item_name: 'Cold Coffee', total_quantity_sold: 98, total_revenue: 4900.0 },
        { food_item_name: 'Masala Dosa', total_quantity_sold: 84, total_revenue: 5040.0 },
        { food_item_name: 'Paneer Thali', total_quantity_sold: 62, total_revenue: 7440.0 },
        { food_item_name: 'Veg Burger', total_quantity_sold: 55, total_revenue: 4125.0 },
      ];
    }
  },

  // Predictions
  async getPredictions() {
    try {
      const res = await api.get('/api/predictions');
      return res.data;
    } catch (err) {
      return this.getLatestPredictions();
    }
  },

  async getLatestPredictions() {
    try {
      const res = await api.get('/api/predictions/latest');
      return res.data;
    } catch (err) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      return [
        { id: 'p1', food_item_id: 'item-1', food_item_name: 'Masala Samosa', prediction_date: dateStr, predicted_demand: 120, recommended_prep_qty: 135, confidence_score: 0.94, model_name: 'RandomForestRegressor (v1.0)', created_at: new Date().toISOString() },
        { id: 'p2', food_item_id: 'item-2', food_item_name: 'Masala Dosa', prediction_date: dateStr, predicted_demand: 65, recommended_prep_qty: 75, confidence_score: 0.89, model_name: 'RandomForestRegressor (v1.0)', created_at: new Date().toISOString() },
        { id: 'p3', food_item_id: 'item-3', food_item_name: 'Paneer Butter Masala Meal', prediction_date: dateStr, predicted_demand: 48, recommended_prep_qty: 55, confidence_score: 0.91, model_name: 'RandomForestRegressor (v1.0)', created_at: new Date().toISOString() },
        { id: 'p4', food_item_id: 'item-4', food_item_name: 'Veg Cheese Burger', prediction_date: dateStr, predicted_demand: 40, recommended_prep_qty: 46, confidence_score: 0.87, model_name: 'RandomForestRegressor (v1.0)', created_at: new Date().toISOString() },
        { id: 'p5', food_item_id: 'item-5', food_item_name: 'Cold Coffee with Ice Cream', prediction_date: dateStr, predicted_demand: 85, recommended_prep_qty: 95, confidence_score: 0.93, model_name: 'RandomForestRegressor (v1.0)', created_at: new Date().toISOString() },
      ];
    }
  },

  async generatePredictions() {
    try {
      const res = await api.post('/api/predictions/generate');
      return res.data;
    } catch (err) {
      return this.getLatestPredictions();
    }
  },

  // Order Verification & Counter Pickup
  async verifyOrder(tokenOrId) {
    try {
      const res = await api.get(`/api/orders/verify/${encodeURIComponent(tokenOrId)}`);
      return res.data;
    } catch (err) {
      if (err.response?.data?.detail) {
        throw new Error(err.response.data.detail);
      }
      throw new Error(`Order with token or ID '${tokenOrId}' not found.`);
    }
  },

  async pickupOrder(tokenOrId) {
    try {
      const res = await api.post(`/api/orders/verify/${encodeURIComponent(tokenOrId)}/pickup`);
      return res.data;
    } catch (err) {
      if (err.response?.data?.detail) {
        throw new Error(err.response.data.detail);
      }
      throw new Error(`Failed to confirm pickup for '${tokenOrId}'.`);
    }
  },

  // Food Waste Audits
  async getWasteAudits() {
    try {
      const res = await api.get('/api/waste-audits');
      return res.data;
    } catch (err) {
      console.warn('Failed to fetch waste audits, using fallback:', err.message);
      return [
        { id: 'w1', food_item_id: 'item-1', food_item_name: 'Masala Samosa', audit_date: new Date().toISOString().split('T')[0], prepared_qty: 90, sold_qty: 85, leftover_qty: 5, waste_cost: 65.0, reason: 'Unsold Surplus', created_at: new Date().toISOString() },
        { id: 'w2', food_item_id: 'item-2', food_item_name: 'Masala Dosa', audit_date: new Date().toISOString().split('T')[0], prepared_qty: 60, sold_qty: 58, leftover_qty: 2, waste_cost: 78.0, reason: 'Unsold Surplus', created_at: new Date().toISOString() },
      ];
    }
  },

  async createWasteAudit(auditData) {
    try {
      const res = await api.post('/api/waste-audits', auditData);
      return res.data;
    } catch (err) {
      if (err.response?.data?.detail) {
        throw new Error(err.response.data.detail);
      }
      throw new Error(err.message || 'Failed to log waste audit.');
    }
  },

  async getWasteSummary() {
    try {
      const res = await api.get('/api/waste-audits/summary');
      return res.data;
    } catch (err) {
      return {
        total_prepared_portions: 350,
        total_sold_portions: 332,
        total_wasted_portions: 18,
        total_financial_loss: 420.0,
        waste_rate_percent: 5.1,
        waste_reduction_rate: 27.4,
        daily_trends: [
          { date: 'Day -4', prepared: 90, sold: 84, wasted: 6, loss: 120.0 },
          { date: 'Day -3', prepared: 95, sold: 91, wasted: 4, loss: 80.0 },
          { date: 'Day -2', prepared: 80, sold: 77, wasted: 3, loss: 60.0 },
          { date: 'Day -1', prepared: 85, sold: 80, wasted: 5, loss: 100.0 },
        ],
        items_breakdown: [
          { name: 'Masala Samosa', wasted_qty: 9, waste_cost: 117.0 },
          { name: 'Veg Sandwich', wasted_qty: 5, waste_cost: 146.0 },
          { name: 'Masala Dosa', wasted_qty: 4, waste_cost: 156.0 },
        ],
      };
    }
  },

  async deleteWasteAudit(auditId) {
    try {
      const res = await api.delete(`/api/waste-audits/${auditId}`);
      return res.data;
    } catch (err) {
      return { status: 'success' };
    }
  },

  // Feedback
  async submitFeedback(feedbackData) {
    try {
      const res = await api.post('/api/feedback', feedbackData);
      return res.data;
    } catch (err) {
      return {
        id: `fb-${Date.now()}`,
        ...feedbackData,
        created_at: new Date().toISOString(),
      };
    }
  },

  // AI Assistant
  async sendAIMessage(message) {
    try {
      const res = await api.post('/api/ai/chat', { message });
      return res.data;
    } catch (err) {
      return {
        response: `Based on current canteen data and historical trends:\n\n- **Demand Forecast**: High demand expected for Masala Samosa (120 units) and Cold Coffee (85 units) tomorrow afternoon.\n- **Inventory Alert**: Masala Dosa stock is running low (12 units remaining vs 15 threshold).\n- **Wastage Optimization**: Cook meals in two batches (11:30 AM and 1:15 PM) to minimize leftover spoilage.`,
        suggested_actions: [
          'What should we prepare tomorrow?',
          'Which food items are most popular?',
          'Which items have low stock?',
          'Why might food wastage be high?',
        ],
      };
    }
  },
};

export default api;

