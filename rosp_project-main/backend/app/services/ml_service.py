import os
import sys
from datetime import datetime, timedelta
import pandas as pd
from sqlalchemy.orm import Session
from app.database import DemandPredictionModel, FoodItemModel, SalesModel

# Include ml directory in sys.path to import Phase 2 modules seamlessly
ML_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../ml"))
if ML_DIR not in sys.path:
    sys.path.append(ML_DIR)




def execute_ml_predictions(db: Session):
    """
    Executes the ML prediction pipeline using live sales records from the database
    and syncs updated demand forecasts into the database.
    """
    print("[ML SERVICE] Running ML demand prediction pipeline on live sales data...")
    # Lazy import: only load the ML module when actually running predictions
    # pyrefly: ignore [missing-import]
    from train_and_predict import run_pipeline  # noqa: PLC0415
    
    # Extract live sales from SQLite / PostgreSQL
    sales_records = db.query(SalesModel).all()
    df_sales = None
    if sales_records:
        sales_data = []
        for s in sales_records:
            if s.food_item:
                sales_data.append({
                    "date": str(s.sale_date),
                    "food_item": s.food_item.name,
                    "price": float(s.food_item.price),
                    "quantity_sold": s.quantity_sold
                })
        if sales_data:
            df_sales = pd.DataFrame(sales_data)

    metrics, pred_df = run_pipeline(df_sales=df_sales)

    db_items = db.query(FoodItemModel).all()
    item_map = {item.name: item.id for item in db_items}

    saved_records = []
    for _, row in pred_df.iterrows():
        item_name = row['food_item']
        if item_name in item_map:
            food_item_id = item_map[item_name]
            pred_date = pd.to_datetime(row['prediction_date']).date()

            # Check if prediction for this item and date already exists
            existing = db.query(DemandPredictionModel).filter(
                DemandPredictionModel.food_item_id == food_item_id,
                DemandPredictionModel.prediction_date == pred_date
            ).first()

            if existing:
                existing.predicted_demand = int(row['predicted_demand'])
                existing.recommended_prep_qty = int(row['recommended_prep_qty'])
                existing.confidence_score = float(row['confidence_score'])
                saved_records.append(existing)
            else:
                new_pred = DemandPredictionModel(
                    food_item_id=food_item_id,
                    prediction_date=pred_date,
                    predicted_demand=int(row['predicted_demand']),
                    recommended_prep_qty=int(row['recommended_prep_qty']),
                    confidence_score=float(row['confidence_score']),
                    model_name="RandomForest_v1"
                )
                db.add(new_pred)
                saved_records.append(new_pred)

    db.commit()
    print(f"[ML SERVICE] Successfully synced {len(saved_records)} predictions into DB.")
    return saved_records
