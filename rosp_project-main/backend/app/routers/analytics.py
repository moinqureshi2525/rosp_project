from typing import List
from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import (
    get_db, OrderModel, FoodItemModel, InventoryModel, SalesModel
)
from app.schemas.pydantic_models import (
    DashboardAnalyticsResponse, SalesAnalyticsPoint, PopularItemResponse
)
from app.routers.orders import _format_order_response

router = APIRouter(prefix="/api/analytics", tags=["Analytics & Dashboard"])


@router.get("/dashboard", response_model=DashboardAnalyticsResponse)
def get_dashboard_metrics(db: Session = Depends(get_db)):
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    # 1. Today's order count & revenue
    today_orders = db.query(OrderModel).filter(OrderModel.created_at >= today_start).all()
    todays_count = len(today_orders)
    todays_rev = sum([o.total_amount for o in today_orders])

    # 2. Total items & low stock count
    total_items = db.query(FoodItemModel).count()
    low_stock_cnt = db.query(InventoryModel).filter(
        InventoryModel.current_stock <= InventoryModel.minimum_stock_alert
    ).count()

    # 3. Popular item
    popular_item_name = "Samosa"
    top_sale = db.query(
        SalesModel.food_item_id,
        func.sum(SalesModel.quantity_sold).label("total_sold")
    ).group_by(SalesModel.food_item_id).order_by(func.sum(SalesModel.quantity_sold).desc()).first()

    if top_sale:
        item = db.query(FoodItemModel).filter(FoodItemModel.id == top_sale.food_item_id).first()
        if item:
            popular_item_name = item.name

    # 4. Recent 5 orders
    recent_orders_db = db.query(OrderModel).order_by(OrderModel.created_at.desc()).limit(5).all()
    recent_orders_formatted = [_format_order_response(o) for o in recent_orders_db]

    return DashboardAnalyticsResponse(
        todays_order_count=todays_count,
        todays_revenue=round(todays_rev, 2),
        total_food_items=total_items,
        low_stock_count=low_stock_cnt,
        popular_food_item=popular_item_name,
        recent_orders=recent_orders_formatted
    )


@router.get("/sales", response_model=List[SalesAnalyticsPoint])
def get_sales_analytics(days: int = 14, db: Session = Depends(get_db)):
    sales_data = db.query(
        SalesModel.sale_date,
        func.sum(SalesModel.total_revenue).label("revenue"),
        func.sum(SalesModel.quantity_sold).label("quantity")
    ).group_by(SalesModel.sale_date).order_by(SalesModel.sale_date.desc()).limit(days).all()

    sales_data.reverse()

    return [
        SalesAnalyticsPoint(
            sale_date=str(row.sale_date),
            total_revenue=float(row.revenue or 0.0),
            quantity_sold=int(row.quantity or 0)
        )
        for row in sales_data
    ]


@router.get("/popular-items", response_model=List[PopularItemResponse])
def get_popular_items(limit: int = 5, db: Session = Depends(get_db)):
    popular = db.query(
        SalesModel.food_item_id,
        func.sum(SalesModel.quantity_sold).label("total_qty"),
        func.sum(SalesModel.total_revenue).label("total_rev")
    ).group_by(SalesModel.food_item_id).order_by(func.sum(SalesModel.quantity_sold).desc()).limit(limit).all()

    results = []
    for row in popular:
        item = db.query(FoodItemModel).filter(FoodItemModel.id == row.food_item_id).first()
        if item:
            results.append(PopularItemResponse(
                food_item_name=item.name,
                total_quantity_sold=int(row.total_qty),
                total_revenue=float(row.total_rev)
            ))
    return results
