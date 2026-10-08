"""
SmartCanteen AI - Main ML Execution & Demonstration Pipeline
Loads/generates historical canteen sales, trains RandomForest demand predictor,
evaluates performance metrics, and predicts next-day demand & preparation quantities.
"""

import os
import pandas as pd
from datetime import datetime, timedelta
from dataset_generator import generate_canteen_sales_data, save_dataset
from demand_predictor import CanteenDemandPredictor


def run_pipeline(df_sales: pd.DataFrame = None):
    print("\n==================================================")
    print("      SMARTCANTEEN AI - DEMAND PREDICTION         ")
    print("==================================================\n")

    sales_csv_path = "ml/data/historical_sales.csv"
    predictions_csv_path = "ml/data/predictions.csv"

    # Step 1: Generate or Load Historical Data if not provided
    if df_sales is None or df_sales.empty:
        if not os.path.exists(sales_csv_path):
            print("[INFO] Historical sales data not found. Generating 90-day synthetic dataset...")
            df_sales = generate_canteen_sales_data(days=90, seed=42)
            save_dataset(df_sales, sales_csv_path)
        else:
            print(f"[INFO] Loading historical sales data from {sales_csv_path}...")
            df_sales = pd.read_csv(sales_csv_path)
    else:
        print(f"[INFO] Using live database sales records ({len(df_sales)} records across items)...")

    print(f"[INFO] Dataset loaded successfully ({len(df_sales)} total sales records across items).")

    # Step 2: Train and Evaluate Model
    predictor = CanteenDemandPredictor(n_estimators=100, random_state=42)
    print("[INFO] Training Random Forest Regressor models for each food item...")
    metrics = predictor.train_and_evaluate(df_sales, train_ratio=0.8)

    print("\nModel Performance")
    print("-----------------")
    print(f"MAE  (Mean Absolute Error)     : {metrics['MAE']} units")
    print(f"RMSE (Root Mean Squared Error) : {metrics['RMSE']} units")
    print(f"MAPE (Mean Absolute % Error)   : {metrics['MAPE']}%\n")

    print("Metric Explanations (For Viva Voce):")
    print(" - MAE: Average absolute difference between predicted and actual item portions sold.")
    print(" - RMSE: Error metric penalizing larger deviations more heavily.")
    print(" - MAPE: Average percentage deviation relative to actual customer demand.\n")

    # Step 3: Predict Next Day Demand
    last_date_str = df_sales['date'].max()
    last_date = datetime.strptime(last_date_str, "%Y-%m-%d").date()
    target_date = last_date + timedelta(days=1)
    target_date_str = target_date.strftime("%Y-%m-%d")

    print(f"[INFO] Forecasting demand for tomorrow: {target_date_str} ({target_date.strftime('%A')})...\n")
    pred_df = predictor.predict_next_day(
        df=df_sales,
        target_date_str=target_date_str,
        is_holiday=0,
        college_event=0
    )

    # Step 4: Display Next Day Predictions Table
    print("Next Day Predictions")
    print("--------------------")
    header = f"{'Food Item':<18} | {'Predicted':<10} | {'Recommended Prep':<18} | {'Confidence':<10}"
    print(header)
    print("-" * len(header))

    for _, row in pred_df.iterrows():
        item_str = f"{row['food_item']:<18}"
        pred_str = f"{row['predicted_demand']:<10}"
        rec_str = f"{row['recommended_prep_qty']:<18}"
        conf_str = f"{row['confidence_score']*100:.0f}%"
        print(f"{item_str} | {pred_str} | {rec_str} | {conf_str}")

    # Step 5: Save Predictions to CSV
    os.makedirs(os.path.dirname(predictions_csv_path), exist_ok=True)
    pred_df.to_csv(predictions_csv_path, index=False)
    print(f"\n[SUCCESS] Predictions saved to: {predictions_csv_path}\n")

    return metrics, pred_df


if __name__ == "__main__":
    run_pipeline()
