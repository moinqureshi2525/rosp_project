import os
import uuid
from datetime import datetime, date, timedelta
from typing import Generator
import pandas as pd
from sqlalchemy import (
    create_engine, Column, String, Float, Integer, Boolean,
    DateTime, Date, ForeignKey, Text, text
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session, relationship
from app.config import settings

# Determine Database Engine Connection
db_url = settings.DATABASE_URL

# Fix postgresql:// prefix if using old postgres:// style URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

connect_args = {}
if "sqlite" in db_url:
    connect_args = {"check_same_thread": False}

engine = create_engine(db_url, connect_args=connect_args, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ==========================================
# SQLAlchemy Models (Matching database/schema.sql)
# ==========================================

class ProfileModel(Base):
    __tablename__ = "profiles"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), unique=True, nullable=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    role = Column(String(20), nullable=False, default="student")
    created_at = Column(DateTime, default=datetime.utcnow)

    orders = relationship("OrderModel", back_populates="user", cascade="all, delete-orphan")


class CategoryModel(Base):
    __tablename__ = "categories"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(50), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    items = relationship("FoodItemModel", back_populates="category")


class FoodItemModel(Base):
    __tablename__ = "food_items"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    category_id = Column(String(36), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    image_url = Column(Text, nullable=True)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    category = relationship("CategoryModel", back_populates="items")
    inventory = relationship("InventoryModel", back_populates="food_item", uselist=False, cascade="all, delete-orphan")


class OrderModel(Base):
    __tablename__ = "orders"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    token_number = Column(String(20), nullable=True)
    total_amount = Column(Float, nullable=False)
    status = Column(String(20), nullable=False, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("ProfileModel", back_populates="orders")
    items = relationship("OrderItemModel", back_populates="order", cascade="all, delete-orphan")


class OrderItemModel(Base):
    __tablename__ = "order_items"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    food_item_id = Column(String(36), ForeignKey("food_items.id", ondelete="RESTRICT"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)

    order = relationship("OrderModel", back_populates="items")
    food_item = relationship("FoodItemModel")


class InventoryModel(Base):
    __tablename__ = "inventory"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    food_item_id = Column(String(36), ForeignKey("food_items.id", ondelete="CASCADE"), unique=True, nullable=False)
    current_stock = Column(Integer, nullable=False, default=0)
    minimum_stock_alert = Column(Integer, nullable=False, default=10)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    food_item = relationship("FoodItemModel", back_populates="inventory")


class SalesModel(Base):
    __tablename__ = "sales"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    food_item_id = Column(String(36), ForeignKey("food_items.id", ondelete="CASCADE"), nullable=False)
    sale_date = Column(Date, nullable=False)
    quantity_sold = Column(Integer, nullable=False)
    total_revenue = Column(Float, nullable=False)

    food_item = relationship("FoodItemModel")


class DemandPredictionModel(Base):
    __tablename__ = "demand_predictions"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    food_item_id = Column(String(36), ForeignKey("food_items.id", ondelete="CASCADE"), nullable=False)
    prediction_date = Column(Date, nullable=False)
    predicted_demand = Column(Integer, nullable=False)
    recommended_prep_qty = Column(Integer, nullable=False)
    confidence_score = Column(Float, default=0.85)
    model_name = Column(String(50), default="RandomForest_v1")
    created_at = Column(DateTime, default=datetime.utcnow)

    food_item = relationship("FoodItemModel")


class WasteAuditModel(Base):
    __tablename__ = "waste_audits"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    food_item_id = Column(String(36), ForeignKey("food_items.id", ondelete="CASCADE"), nullable=False)
    audit_date = Column(Date, nullable=False)
    prepared_qty = Column(Integer, nullable=False, default=0)
    sold_qty = Column(Integer, nullable=False, default=0)
    leftover_qty = Column(Integer, nullable=False, default=0)
    waste_cost = Column(Float, nullable=False, default=0.0)
    reason = Column(String(100), default="Unsold Surplus")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    food_item = relationship("FoodItemModel")


class FeedbackModel(Base):
    __tablename__ = "feedback"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="SET NULL"), nullable=True)
    user_id = Column(String(36), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    food_item_id = Column(String(36), ForeignKey("food_items.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("ProfileModel")
    food_item = relationship("FoodItemModel")


# ==========================================
# Dependency & Seeding
# ==========================================

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed_initial_data(db: Session):
    """Populates initial seed data into DB if categories/food_items are empty."""
    if db.query(CategoryModel).first():
        return  # Data already seeded

    print("[INFO] Seeding initial categories and food items...")
    
    # 1. Seed Categories
    cat_map = {
        "Snacks": ("c1000000-0000-0000-0000-000000000001", "Quick & crispy college favorites"),
        "South Indian": ("c1000000-0000-0000-0000-000000000002", "Fresh dosas, idlis, and vadas"),
        "Main Course": ("c1000000-0000-0000-0000-000000000003", "Filling meal plates and rice dishes"),
        "Beverages": ("c1000000-0000-0000-0000-000000000004", "Hot tea, coffee, and cold drinks"),
        "Fast Food": ("c1000000-0000-0000-0000-000000000005", "Delicious fast snacks and rolls")
    }
    
    db_cats = {}
    for name, (cat_id, desc) in cat_map.items():
        cat_obj = CategoryModel(id=cat_id, name=name, description=desc)
        db.add(cat_obj)
        db_cats[name] = cat_id

    # 2. Seed Food Items
    items_data = [
        ("f1000000-0000-0000-0000-000000000001", "Samosa", "Crispy spiced potato & green pea stuffed pastry (2 pcs)", 20.00, db_cats["Snacks"], "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=80", 95),
        ("f1000000-0000-0000-0000-000000000002", "Vada Pav", "Classic Mumbai burger with fried potato patty & chutney", 25.00, db_cats["Snacks"], "https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=400&q=80", 80),
        ("f1000000-0000-0000-0000-000000000003", "Masala Dosa", "Golden crispy crepe served with spiced potato chutney & sambar", 60.00, db_cats["South Indian"], "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=400&q=80", 45),
        ("f1000000-0000-0000-0000-000000000004", "Idli", "Soft steamed rice cakes served with hot lentil sambar (3 pcs)", 40.00, db_cats["South Indian"], "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80", 50),
        ("f1000000-0000-0000-0000-000000000005", "Veg Sandwich", "Grilled double decker sandwich with fresh veggies & cheese", 45.00, db_cats["Snacks"], "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80", 60),
        ("f1000000-0000-0000-0000-000000000006", "Veg Biryani", "Aromatic basmati rice with veggies & authentic spices", 90.00, db_cats["Main Course"], "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80", 35),
        ("f1000000-0000-0000-0000-000000000007", "Chicken Biryani", "Hyderabadi style tender chicken biryani served with raita", 130.00, db_cats["Main Course"], "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=400&q=80", 40),
        ("f1000000-0000-0000-0000-000000000008", "Pav Bhaji", "Butter-toasted pav served with spicy mashed vegetable gravy", 70.00, db_cats["Main Course"], "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=400&q=80", 30),
        ("f1000000-0000-0000-0000-000000000009", "Noodles", "Indo-Chinese stir fried Hakka noodles with crunchy veggies", 55.00, db_cats["Main Course"], "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80", 55),
        ("f1000000-0000-0000-0000-000000000010", "Tea", "Hot spiced Indian cardamom ginger tea", 12.00, db_cats["Beverages"], "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80", 200),
        ("f1000000-0000-0000-0000-000000000011", "Coffee", "Authentic South Indian aromatic hot filter coffee", 18.00, db_cats["Beverages"], "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80", 150),
        ("f1000000-0000-0000-0000-000000000012", "Cold Drink", "Chilled 300ml bottled soft drink", 25.00, db_cats["Beverages"], "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80", 120)
    ]

    item_id_by_name = {}

    for item_id, name, desc, price, cat_id, img, stock in items_data:
        food_obj = FoodItemModel(
            id=item_id, name=name, description=desc,
            price=price, category_id=cat_id, image_url=img, is_available=True
        )
        db.add(food_obj)
        item_id_by_name[name] = item_id

        inv_obj = InventoryModel(
            food_item_id=item_id,
            current_stock=stock,
            minimum_stock_alert=15
        )
        db.add(inv_obj)

    # 3. Seed Default Profiles
    student_profile = ProfileModel(
        id="u1000000-0000-0000-0000-000000000001",
        full_name="Rahul Sharma (Student)",
        email="student@canteen.edu",
        role="student"
    )
    admin_profile = ProfileModel(
        id="u1000000-0000-0000-0000-000000000002",
        full_name="Canteen Manager (Admin)",
        email="admin@canteen.edu",
        role="admin"
    )
    db.add(student_profile)
    db.add(admin_profile)
    db.commit()

    # 4. Load Sales CSV from Phase 2 into database
    sales_csv = "ml/data/historical_sales.csv"
    if not os.path.exists(sales_csv) and os.path.exists("../ml/data/historical_sales.csv"):
        sales_csv = "../ml/data/historical_sales.csv"

    if os.path.exists(sales_csv):
        print(f"[INFO] Importing Phase 2 sales records from {sales_csv}...")
        sales_df = pd.read_csv(sales_csv)
        for _, row in sales_df.iterrows():
            item_name = row['food_item']
            if item_name in item_id_by_name:
                sale_obj = SalesModel(
                    food_item_id=item_id_by_name[item_name],
                    sale_date=pd.to_datetime(row['date']).date(),
                    quantity_sold=int(row['quantity_sold']),
                    total_revenue=float(row['quantity_sold'] * row['price'])
                )
                db.add(sale_obj)
        db.commit()

    # 5. Load Predictions CSV from Phase 2 into database
    preds_csv = "ml/data/predictions.csv"
    if not os.path.exists(preds_csv) and os.path.exists("../ml/data/predictions.csv"):
        preds_csv = "../ml/data/predictions.csv"

    if os.path.exists(preds_csv):
        print(f"[INFO] Importing Phase 2 prediction records from {preds_csv}...")
        preds_df = pd.read_csv(preds_csv)
        for _, row in preds_df.iterrows():
            item_name = row['food_item']
            if item_name in item_id_by_name:
                pred_obj = DemandPredictionModel(
                    food_item_id=item_id_by_name[item_name],
                    prediction_date=pd.to_datetime(row['prediction_date']).date(),
                    predicted_demand=int(row['predicted_demand']),
                    recommended_prep_qty=int(row['recommended_prep_qty']),
                    confidence_score=float(row['confidence_score'])
                )
                db.add(pred_obj)
        db.commit()

    # 6. Seed Sample Waste Audits if empty
    if not db.query(WasteAuditModel).first():
        print("[INFO] Seeding initial waste audit history...")
        today = datetime.utcnow().date()
        sample_audits = [
            # Day -4
            ("Samosa", today - timedelta(days=4), 90, 84, 6, "Unsold Surplus"),
            ("Masala Dosa", today - timedelta(days=4), 50, 48, 2, "Unsold Surplus"),
            ("Veg Biryani", today - timedelta(days=4), 40, 36, 4, "Over-preparation"),
            # Day -3
            ("Veg Sandwich", today - timedelta(days=3), 60, 57, 3, "Unsold Surplus"),
            ("Pav Bhaji", today - timedelta(days=3), 35, 32, 3, "Unsold Surplus"),
            ("Samosa", today - timedelta(days=3), 95, 91, 4, "Quality / Crushed"),
            # Day -2
            ("Masala Dosa", today - timedelta(days=2), 52, 50, 2, "Unsold Surplus"),
            ("Chicken Biryani", today - timedelta(days=2), 45, 42, 3, "Unsold Surplus"),
            ("Noodles", today - timedelta(days=2), 55, 52, 3, "Unsold Surplus"),
            # Day -1 (Yesterday)
            ("Samosa", today - timedelta(days=1), 88, 85, 3, "Unsold Surplus"),
            ("Veg Biryani", today - timedelta(days=1), 38, 36, 2, "Unsold Surplus"),
            ("Veg Sandwich", today - timedelta(days=1), 55, 53, 2, "Unsold Surplus"),
        ]

        # Fetch all items to get prices and IDs
        all_items = {it.name: it for it in db.query(FoodItemModel).all()}
        for item_name, audit_dt, prep_q, sold_q, left_q, reas in sample_audits:
            if item_name in all_items:
                item_obj = all_items[item_name]
                w_cost = round(left_q * (item_obj.price * 0.65), 2)  # Raw cost ~65% of sale price
                db.add(WasteAuditModel(
                    food_item_id=item_obj.id,
                    audit_date=audit_dt,
                    prepared_qty=prep_q,
                    sold_qty=sold_q,
                    leftover_qty=left_q,
                    waste_cost=w_cost,
                    reason=reas,
                    notes=f"End of shift audit for {item_name}."
                ))
        db.commit()

    print("[SUCCESS] Database initial seeding completed.")


def init_db():
    """Initializes tables, applies column migrations, and seeds data on startup."""
    Base.metadata.create_all(bind=engine)

    # Migrate columns if existing DB
    with engine.connect() as conn:
        try:
            res = conn.execute(text("PRAGMA table_info(orders)"))
            cols = [r[1] for r in res.fetchall()]
            if cols and "token_number" not in cols:
                print("[MIGRATION] Adding token_number column to orders table...")
                conn.execute(text("ALTER TABLE orders ADD COLUMN token_number VARCHAR(20)"))
                conn.commit()
        except Exception as e:
            # PostgreSQL or already exists
            pass

    db = SessionLocal()
    try:
        # Backfill tokens on existing orders if any exist without token
        orders_without_token = db.query(OrderModel).filter(
            (OrderModel.token_number == None) | (OrderModel.token_number == "")
        ).all()
        for idx, o in enumerate(orders_without_token, start=101):
            o.token_number = f"TK-{idx}"
        if orders_without_token:
            db.commit()

        seed_initial_data(db)
    finally:
        db.close()
