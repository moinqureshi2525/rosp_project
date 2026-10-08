-- SmartCanteen AI Seed Data

-- Insert Categories
INSERT INTO categories (id, name, description) VALUES
('c1000000-0000-0000-0000-000000000001', 'Snacks', 'Quick & crispy college favorites'),
('c1000000-0000-0000-0000-000000000002', 'South Indian', 'Fresh dosas, idlis, and vadas'),
('c1000000-0000-0000-0000-000000000003', 'Main Course', 'Filling meal plates and rice dishes'),
('c1000000-0000-0000-0000-000000000004', 'Beverages', 'Hot tea, coffee, and cold drinks')
ON CONFLICT (name) DO NOTHING;

-- Insert Food Items (12 authentic Indian college canteen items)
INSERT INTO food_items (id, name, description, price, category_id, image_url, is_available) VALUES
('f1000000-0000-0000-0000-000000000001', 'Samosa', 'Crispy spiced potato & green pea stuffed pastry (2 pcs)', 20.00, 'c1000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=80', TRUE),
('f1000000-0000-0000-0000-000000000002', 'Vada Pav', 'Classic Mumbai burger with fried potato patty & chutney', 25.00, 'c1000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=400&q=80', TRUE),
('f1000000-0000-0000-0000-000000000003', 'Masala Dosa', 'Golden crispy crepe served with spiced potato chutney & sambar', 60.00, 'c1000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=400&q=80', TRUE),
('f1000000-0000-0000-0000-000000000004', 'Idli Sambar', 'Soft steamed rice cakes served with hot lentil sambar (3 pcs)', 40.00, 'c1000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80', TRUE),
('f1000000-0000-0000-0000-000000000005', 'Veg Sandwich', 'Grilled double decker sandwich with fresh veggies & cheese', 45.00, 'c1000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80', TRUE),
('f1000000-0000-0000-0000-000000000006', 'Veg Biryani', 'Aromatic basmati rice with veggies & authentic spices', 90.00, 'c1000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80', TRUE),
('f1000000-0000-0000-0000-000000000007', 'Chicken Biryani', 'Hyderabadi style tender chicken biryani served with raita', 130.00, 'c1000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=400&q=80', TRUE),
('f1000000-0000-0000-0000-000000000008', 'Pav Bhaji', 'Butter-toasted pav served with spicy mashed vegetable gravy', 70.00, 'c1000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=400&q=80', TRUE),
('f1000000-0000-0000-0000-000000000009', 'Noodles', 'Indo-Chinese stir fried Hakka noodles with crunchy veggies', 55.00, 'c1000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80', TRUE),
('f1000000-0000-0000-0000-000000000010', 'Cutting Chai', 'Hot spiced Indian cardamom ginger tea', 12.00, 'c1000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80', TRUE),
('f1000000-0000-0000-0000-000000000011', 'Filter Coffee', 'Authentic South Indian aromatic hot filter coffee', 18.00, 'c1000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80', TRUE),
('f1000000-0000-0000-0000-000000000012', 'Cold Drink', 'Chilled 300ml bottled soft drink', 25.00, 'c1000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Initial Inventory
INSERT INTO inventory (food_item_id, current_stock, minimum_stock_alert) VALUES
('f1000000-0000-0000-0000-000000000001', 95, 20),
('f1000000-0000-0000-0000-000000000002', 80, 20),
('f1000000-0000-0000-0000-000000000003', 45, 10),
('f1000000-0000-0000-0000-000000000004', 50, 15),
('f1000000-0000-0000-0000-000000000005', 60, 15),
('f1000000-0000-0000-0000-000000000006', 35, 10),
('f1000000-0000-0000-0000-000000000007', 40, 10),
('f1000000-0000-0000-0000-000000000008', 30, 10),
('f1000000-0000-0000-0000-000000000009', 55, 15),
('f1000000-0000-0000-0000-000000000010', 200, 30),
('f1000000-0000-0000-0000-000000000011', 150, 25),
('f1000000-0000-0000-0000-000000000012', 120, 20)
ON CONFLICT (food_item_id) DO NOTHING;

-- Initial Demo Users
INSERT INTO profiles (id, full_name, email, role) VALUES
('u1000000-0000-0000-0000-000000000001', 'Rahul Sharma (Student)', 'student@canteen.edu', 'student'),
('u1000000-0000-0000-0000-000000000002', 'Canteen Manager (Admin)', 'admin@canteen.edu', 'admin')
ON CONFLICT (email) DO NOTHING;
