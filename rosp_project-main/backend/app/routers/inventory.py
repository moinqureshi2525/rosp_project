from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db, InventoryModel, FoodItemModel
from app.schemas.pydantic_models import InventoryResponse, InventoryUpdate

router = APIRouter(prefix="/api/inventory", tags=["Inventory Management"])


def _format_inventory_response(inv: InventoryModel) -> InventoryResponse:
    item_name = inv.food_item.name if inv.food_item else "Unknown Item"
    is_low = inv.current_stock <= inv.minimum_stock_alert
    return InventoryResponse(
        id=inv.id,
        food_item_id=inv.food_item_id,
        food_item_name=item_name,
        current_stock=inv.current_stock,
        minimum_stock_alert=inv.minimum_stock_alert,
        is_low_stock=is_low,
        last_updated=inv.last_updated
    )


@router.get("", response_model=List[InventoryResponse])
def get_inventory(db: Session = Depends(get_db)):
    inventory_items = db.query(InventoryModel).all()
    return [_format_inventory_response(inv) for inv in inventory_items]


@router.put("/{food_item_id}", response_model=InventoryResponse)
def update_inventory(food_item_id: str, request: InventoryUpdate, db: Session = Depends(get_db)):
    inv = db.query(InventoryModel).filter(InventoryModel.food_item_id == food_item_id).first()
    if not inv:
        # Create inventory record if it doesn't exist yet
        food_item = db.query(FoodItemModel).filter(FoodItemModel.id == food_item_id).first()
        if not food_item:
            raise HTTPException(status_code=404, detail="Food item not found.")
        inv = InventoryModel(
            food_item_id=food_item_id,
            current_stock=request.current_stock,
            minimum_stock_alert=request.minimum_stock_alert or 15
        )
        db.add(inv)
    else:
        inv.current_stock = request.current_stock
        if request.minimum_stock_alert is not None:
            inv.minimum_stock_alert = request.minimum_stock_alert

    db.commit()
    db.refresh(inv)
    return _format_inventory_response(inv)
