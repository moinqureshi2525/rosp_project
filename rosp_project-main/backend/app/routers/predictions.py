from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db, DemandPredictionModel, FoodItemModel
from app.schemas.pydantic_models import DemandPredictionResponse
from app.services.ml_service import execute_ml_predictions

router = APIRouter(prefix="/api/predictions", tags=["Demand Predictions"])


def _format_prediction_response(pred: DemandPredictionModel) -> DemandPredictionResponse:
    item_name = pred.food_item.name if pred.food_item else "Unknown Item"
    return DemandPredictionResponse(
        id=pred.id,
        food_item_id=pred.food_item_id,
        food_item_name=item_name,
        prediction_date=str(pred.prediction_date),
        predicted_demand=pred.predicted_demand,
        recommended_prep_qty=pred.recommended_prep_qty,
        confidence_score=pred.confidence_score,
        model_name=pred.model_name,
        created_at=pred.created_at
    )


@router.get("", response_model=List[DemandPredictionResponse])
def get_all_predictions(db: Session = Depends(get_db)):
    preds = db.query(DemandPredictionModel).order_by(DemandPredictionModel.prediction_date.desc()).all()
    return [_format_prediction_response(p) for p in preds]


@router.get("/latest", response_model=List[DemandPredictionResponse])
def get_latest_predictions(db: Session = Depends(get_db)):
    # Fetch distinct latest prediction per food item
    subquery = db.query(
        DemandPredictionModel.food_item_id,
        DemandPredictionModel.prediction_date
    ).order_by(DemandPredictionModel.prediction_date.desc()).all()

    seen_items = set()
    latest_preds = []

    for pred in db.query(DemandPredictionModel).order_by(DemandPredictionModel.prediction_date.desc()).all():
        if pred.food_item_id not in seen_items:
            seen_items.add(pred.food_item_id)
            latest_preds.append(pred)

    return [_format_prediction_response(p) for p in latest_preds]


@router.post("/generate", response_model=List[DemandPredictionResponse])
def trigger_predictions(db: Session = Depends(get_db)):
    """Triggers Phase 2 ML engine to forecast next day demand."""
    saved_preds = execute_ml_predictions(db)
    return [_format_prediction_response(p) for p in saved_preds]
