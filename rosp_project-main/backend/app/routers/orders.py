from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import (
    get_db, OrderModel, OrderItemModel, FoodItemModel,
    InventoryModel, ProfileModel, SalesModel
)
from app.schemas.pydantic_models import (
    OrderCreate, OrderResponse, OrderItemResponse, OrderStatusUpdate,
    PickupVerificationResponse
)

router = APIRouter(prefix="/api/orders", tags=["Orders"])


def _format_order_response(order: OrderModel) -> OrderResponse:
    item_responses = []
    for item in order.items:
        item_name = item.food_item.name if item.food_item else "Unknown Item"
        item_responses.append(OrderItemResponse(
            id=item.id,
            food_item_id=item.food_item_id,
            food_item_name=item_name,
            quantity=item.quantity,
            unit_price=item.unit_price,
            subtotal=item.subtotal
        ))
    
    user_name = order.user.full_name if order.user else "Student"
    return OrderResponse(
        id=order.id,
        user_id=order.user_id,
        user_name=user_name,
        token_number=order.token_number or f"TK-{order.id[:4].upper()}",
        total_amount=order.total_amount,
        status=order.status,
        items=item_responses,
        created_at=order.created_at
    )


def record_order_sales(order: OrderModel, db: Session):
    """
    Feeds completed live orders directly into the SalesModel table,
    closing the loop so ML demand forecasting continually learns from real canteen sales.
    """
    sale_date = order.created_at.date() if order.created_at else datetime.utcnow().date()
    for item in order.items:
        sale = db.query(SalesModel).filter(
            SalesModel.food_item_id == item.food_item_id,
            SalesModel.sale_date == sale_date
        ).first()

        if sale:
            sale.quantity_sold += item.quantity
            sale.total_revenue = round(sale.total_revenue + item.subtotal, 2)
        else:
            new_sale = SalesModel(
                food_item_id=item.food_item_id,
                sale_date=sale_date,
                quantity_sold=item.quantity,
                total_revenue=round(item.subtotal, 2)
            )
            db.add(new_sale)
    db.commit()


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(request: OrderCreate, db: Session = Depends(get_db)):
    if not request.items:
        raise HTTPException(status_code=400, detail="Order must contain at least one item.")

    # Validate User
    user = db.query(ProfileModel).filter(ProfileModel.id == request.user_id).first()
    if not user:
        # Fallback to demo student if user_id does not exist
        user = db.query(ProfileModel).filter(ProfileModel.role == "student").first()
        if not user:
            raise HTTPException(status_code=404, detail="User profile not found.")

    calculated_total = 0.0
    order_items_to_create = []

    # Calculate prices server-side
    for item_req in request.items:
        food_item = db.query(FoodItemModel).filter(FoodItemModel.id == item_req.food_item_id).first()
        if not food_item or not food_item.is_available:
            raise HTTPException(status_code=400, detail=f"Food item '{item_req.food_item_id}' is unavailable.")

        # Check stock
        inventory = db.query(InventoryModel).filter(InventoryModel.food_item_id == food_item.id).first()
        if inventory and inventory.current_stock < item_req.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for '{food_item.name}'. Available: {inventory.current_stock}")

        unit_price = float(food_item.price)
        subtotal = unit_price * item_req.quantity
        calculated_total += subtotal

        # Decrement stock
        if inventory:
            inventory.current_stock -= item_req.quantity

        order_items_to_create.append({
            "food_item_id": food_item.id,
            "quantity": item_req.quantity,
            "unit_price": unit_price,
            "subtotal": subtotal
        })

    # Generate sequential daily Pickup Token (e.g., TK-101, TK-102...)
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_orders_count = db.query(OrderModel).filter(OrderModel.created_at >= today_start).count()
    token_number = f"TK-{101 + today_orders_count}"

    # Save Order
    new_order = OrderModel(
        user_id=user.id,
        token_number=token_number,
        total_amount=calculated_total,
        status="pending"
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    # Save Order Items
    for item_data in order_items_to_create:
        oi = OrderItemModel(
            order_id=new_order.id,
            food_item_id=item_data["food_item_id"],
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
            subtotal=item_data["subtotal"]
        )
        db.add(oi)
    
    db.commit()
    db.refresh(new_order)

    return _format_order_response(new_order)


@router.get("", response_model=List[OrderResponse])
def get_orders(user_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(OrderModel).order_by(OrderModel.created_at.desc())
    if user_id:
        query = query.filter(OrderModel.user_id == user_id)
    orders = query.all()
    return [_format_order_response(o) for o in orders]


@router.get("/verify/{token_or_id}", response_model=OrderResponse)
def verify_order(token_or_id: str, db: Session = Depends(get_db)):
    """
    Looks up order by pickup token number (e.g. 'TK-101') or Order ID.
    Used for QR Code scanning and counter pickup validation.
    """
    clean_query = token_or_id.strip()
    order = db.query(OrderModel).filter(
        (OrderModel.token_number.ilike(clean_query)) |
        (OrderModel.id == clean_query)
    ).first()

    if not order:
        raise HTTPException(
            status_code=404,
            detail=f"Order with token or ID '{token_or_id}' was not found."
        )

    return _format_order_response(order)


@router.post("/verify/{token_or_id}/pickup", response_model=PickupVerificationResponse)
def pickup_order(token_or_id: str, db: Session = Depends(get_db)):
    """
    Validates pickup at the canteen counter, marks order as 'completed',
    and automatically feeds order item quantities into SalesModel for ML retraining.
    """
    clean_query = token_or_id.strip()
    order = db.query(OrderModel).filter(
        (OrderModel.token_number.ilike(clean_query)) |
        (OrderModel.id == clean_query)
    ).first()

    if not order:
        raise HTTPException(
            status_code=404,
            detail=f"Order with token or ID '{token_or_id}' not found."
        )

    if order.status == "completed":
        return PickupVerificationResponse(
            success=True,
            message=f"Order {order.token_number or order.id} was already picked up.",
            order=_format_order_response(order)
        )

    order.status = "completed"
    record_order_sales(order, db)
    db.commit()
    db.refresh(order)

    return PickupVerificationResponse(
        success=True,
        message=f"Order {order.token_number or order.id} successfully verified & handed over! Sales recorded.",
        order=_format_order_response(order)
    )


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: str, db: Session = Depends(get_db)):
    order = db.query(OrderModel).filter(OrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    return _format_order_response(order)


@router.patch("/{order_id}/status", response_model=OrderResponse)
def update_order_status(order_id: str, request: OrderStatusUpdate, db: Session = Depends(get_db)):
    order = db.query(OrderModel).filter(OrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    
    old_status = order.status
    order.status = request.status

    # If transitioning to completed, automatically record sales in database
    if request.status == "completed" and old_status != "completed":
        record_order_sales(order, db)

    db.commit()
    db.refresh(order)
    return _format_order_response(order)
