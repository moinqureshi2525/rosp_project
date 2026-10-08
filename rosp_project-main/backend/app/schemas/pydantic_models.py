from typing import List, Optional
from datetime import datetime, date
from pydantic import BaseModel, Field, EmailStr, ConfigDict


# ==========================================
# User & Authentication Schemas
# ==========================================

class LoginRequest(BaseModel):
    email: EmailStr
    password: Optional[str] = "password"


class ProfileBase(BaseModel):
    full_name: str
    email: EmailStr
    role: str = "student"


class ProfileCreate(ProfileBase):
    pass


class ProfileResponse(ProfileBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuthResponse(BaseModel):
    user: ProfileResponse
    access_token: str = "demo-access-token"
    token_type: str = "bearer"


# ==========================================
# Category Schemas
# ==========================================

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Food Item Schemas
# ==========================================

class FoodItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float = Field(..., gt=0)
    category_id: Optional[str] = None
    image_url: Optional[str] = None
    is_available: bool = True


class FoodItemCreate(FoodItemBase):
    pass


class FoodItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    category_id: Optional[str] = None
    image_url: Optional[str] = None
    is_available: Optional[bool] = None


class FoodItemResponse(FoodItemBase):
    id: str
    category_name: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Inventory Schemas
# ==========================================

class InventoryUpdate(BaseModel):
    current_stock: int = Field(..., ge=0)
    minimum_stock_alert: Optional[int] = Field(15, ge=0)


class InventoryResponse(BaseModel):
    id: str
    food_item_id: str
    food_item_name: str
    current_stock: int
    minimum_stock_alert: int
    is_low_stock: bool
    last_updated: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Order Schemas
# ==========================================

class OrderItemCreate(BaseModel):
    food_item_id: str
    quantity: int = Field(..., gt=0)


class OrderCreate(BaseModel):
    user_id: str
    items: List[OrderItemCreate]


class OrderItemResponse(BaseModel):
    id: str
    food_item_id: str
    food_item_name: str
    quantity: int
    unit_price: float
    subtotal: float

    model_config = ConfigDict(from_attributes=True)


class OrderResponse(BaseModel):
    id: str
    user_id: str
    user_name: Optional[str] = None
    token_number: Optional[str] = None
    total_amount: float
    status: str
    items: List[OrderItemResponse]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrderStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(pending|preparing|ready|completed|cancelled)$")


# ==========================================
# Feedback Schemas
# ==========================================

class FeedbackCreate(BaseModel):
    order_id: Optional[str] = None
    user_id: str
    food_item_id: str
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None


class FeedbackResponse(BaseModel):
    id: str
    order_id: Optional[str] = None
    user_id: str
    user_name: Optional[str] = None
    food_item_id: str
    food_item_name: Optional[str] = None
    rating: int
    comment: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Analytics & Prediction Schemas
# ==========================================

class DashboardAnalyticsResponse(BaseModel):
    todays_order_count: int
    todays_revenue: float
    total_food_items: int
    low_stock_count: int
    popular_food_item: Optional[str] = "Samosa"
    recent_orders: List[OrderResponse]


class SalesAnalyticsPoint(BaseModel):
    sale_date: str
    total_revenue: float
    quantity_sold: int


class PopularItemResponse(BaseModel):
    food_item_name: str
    total_quantity_sold: int
    total_revenue: float


class DemandPredictionResponse(BaseModel):
    id: str
    food_item_id: str
    food_item_name: str
    prediction_date: str
    predicted_demand: int
    recommended_prep_qty: int
    confidence_score: float
    model_name: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# AI Assistant Schemas
# ==========================================

class AIChatRequest(BaseModel):
    message: str


class AIChatResponse(BaseModel):
    response: str
    suggested_actions: Optional[List[str]] = None


# ==========================================
# Pickup Verification Schemas
# ==========================================

class PickupVerificationResponse(BaseModel):
    success: bool
    message: str
    order: OrderResponse


# ==========================================
# Waste Audit Schemas
# ==========================================

class WasteAuditCreate(BaseModel):
    food_item_id: str
    audit_date: Optional[date] = None
    prepared_qty: int = Field(..., ge=0)
    sold_qty: int = Field(..., ge=0)
    leftover_qty: Optional[int] = Field(None, ge=0)
    reason: Optional[str] = "Unsold Surplus"
    notes: Optional[str] = None


class WasteAuditResponse(BaseModel):
    id: str
    food_item_id: str
    food_item_name: str
    audit_date: str
    prepared_qty: int
    sold_qty: int
    leftover_qty: int
    waste_cost: float
    reason: str
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WasteAuditSummaryResponse(BaseModel):
    total_prepared_portions: int
    total_sold_portions: int
    total_wasted_portions: int
    total_financial_loss: float
    waste_rate_percent: float
    waste_reduction_rate: float
    daily_trends: List[dict]
    items_breakdown: List[dict]
