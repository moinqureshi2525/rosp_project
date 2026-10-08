from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db, FoodItemModel, CategoryModel, InventoryModel
from app.schemas.pydantic_models import (
    FoodItemCreate, FoodItemUpdate, FoodItemResponse,
    CategoryCreate, CategoryResponse
)

router = APIRouter(prefix="/api", tags=["Menu & Categories"])


@router.get("/items", response_model=List[FoodItemResponse])
def get_food_items(category_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(FoodItemModel)
    if category_id:
        query = query.filter(FoodItemModel.category_id == category_id)
    items = query.all()
    
    response = []
    for item in items:
        resp = FoodItemResponse.model_validate(item)
        if item.category:
            resp.category_name = item.category.name
        response.append(resp)
    return response


@router.get("/items/{item_id}", response_model=FoodItemResponse)
def get_food_item(item_id: str, db: Session = Depends(get_db)):
    item = db.query(FoodItemModel).filter(FoodItemModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Food item not found.")
    resp = FoodItemResponse.model_validate(item)
    if item.category:
        resp.category_name = item.category.name
    return resp


@router.post("/items", response_model=FoodItemResponse, status_code=status.HTTP_201_CREATED)
def create_food_item(request: FoodItemCreate, db: Session = Depends(get_db)):
    new_item = FoodItemModel(
        name=request.name,
        description=request.description,
        price=request.price,
        category_id=request.category_id,
        image_url=request.image_url,
        is_available=request.is_available
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    # Initialize inventory record for new food item
    new_inv = InventoryModel(
        food_item_id=new_item.id,
        current_stock=50,
        minimum_stock_alert=15
    )
    db.add(new_inv)
    db.commit()

    resp = FoodItemResponse.model_validate(new_item)
    if new_item.category:
        resp.category_name = new_item.category.name
    return resp


@router.put("/items/{item_id}", response_model=FoodItemResponse)
def update_food_item(item_id: str, request: FoodItemUpdate, db: Session = Depends(get_db)):
    item = db.query(FoodItemModel).filter(FoodItemModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Food item not found.")

    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)

    resp = FoodItemResponse.model_validate(item)
    if item.category:
        resp.category_name = item.category.name
    return resp


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_food_item(item_id: str, db: Session = Depends(get_db)):
    item = db.query(FoodItemModel).filter(FoodItemModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Food item not found.")
    db.delete(item)
    db.commit()
    return None


@router.get("/categories", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(CategoryModel).all()
    return [CategoryResponse.model_validate(cat) for cat in categories]


@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(request: CategoryCreate, db: Session = Depends(get_db)):
    existing = db.query(CategoryModel).filter(CategoryModel.name == request.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category name already exists.")
    
    new_cat = CategoryModel(name=request.name, description=request.description)
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return CategoryResponse.model_validate(new_cat)
