"""
SmartCanteen AI - Food Demand Prediction Engine
Builds, trains, evaluates, and predicts food demand using Scikit-learn RandomForestRegressor.
Includes lag feature engineering (lag 1 day, lag 7 days, rolling 7-day average) and temporal features.
"""

import numpy as np
import pandas as pd
from typing import Dict, Tuple, List, Any
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error


class CanteenDemandPredictor:
    """
    Demand Predictor using item-specific RandomForestRegressor models.
    Trained on temporal, calendar, and sales history lag features.
    """

    def __init__(self, n_estimators: int = 100, random_state: int = 42):
        self.n_estimators = n_estimators
        self.random_state = random_state
        self.models: Dict[str, RandomForestRegressor] = {}
        self.feature_columns = [
            'day_of_week',
            'is_weekend',
            'is_holiday',
            'college_event',
            'price',
            'lag_1_day_sales',
            'lag_7_day_sales',
            'rolling_7_day_avg'
        ]
        self.item_confidence_scores: Dict[str, float] = {}

    def prepare_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Engineers temporal and lag features for each food item time series.
        
        Features constructed:
          - lag_1_day_sales: Quantity sold on previous day
          - lag_7_day_sales: Quantity sold 7 days ago (same day last week)
          - rolling_7_day_avg: 7-day moving average of sales volume
        """
        df = df.copy()
        df['date'] = pd.to_datetime(df['date'])
        
        # Ensure temporal features exist
        if 'day_of_week' not in df.columns:
            df['day_of_week'] = df['date'].dt.weekday
        if 'is_weekend' not in df.columns:
            df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
        if 'is_holiday' not in df.columns:
            df['is_holiday'] = 0
        if 'college_event' not in df.columns:
            df['college_event'] = 0

        df = df.sort_values(['food_item', 'date']).reset_index(drop=True)

        processed_dfs = []
        for item, group in df.groupby('food_item'):
            group = group.copy()
            # Lag 1 day sales
            group['lag_1_day_sales'] = group['quantity_sold'].shift(1)
            # Lag 7 day sales (weekly seasonality)
            group['lag_7_day_sales'] = group['quantity_sold'].shift(7)
            # 7-day rolling average (excluding current day using shift)
            group['rolling_7_day_avg'] = (
                group['quantity_sold'].shift(1).rolling(window=7, min_periods=1).mean()
            )
            processed_dfs.append(group)

        full_df = pd.concat(processed_dfs, ignore_index=True)
        # Fill initial shift NaNs using backfill per group to avoid dropping early data
        full_df['lag_1_day_sales'] = full_df.groupby('food_item')['lag_1_day_sales'].bfill().ffill()
        full_df['lag_7_day_sales'] = full_df.groupby('food_item')['lag_7_day_sales'].bfill().ffill()
        full_df['rolling_7_day_avg'] = full_df.groupby('food_item')['rolling_7_day_avg'].bfill().ffill()
        
        return full_df

    def train_and_evaluate(self, df: pd.DataFrame, train_ratio: float = 0.8) -> Dict[str, float]:
        """
        Splits data chronologically into train and test sets, trains item models,
        and computes MAE, RMSE, and MAPE metrics.
        """
        featured_df = self.prepare_features(df)
        
        y_true_all = []
        y_pred_all = []

        items = featured_df['food_item'].unique()

        for item in items:
            item_df = featured_df[featured_df['food_item'] == item].sort_values('date')
            split_idx = int(len(item_df) * train_ratio)
            
            train_df = item_df.iloc[:split_idx]
            test_df = item_df.iloc[split_idx:]

            X_train = train_df[self.feature_columns]
            y_train = train_df['quantity_sold']
            X_test = test_df[self.feature_columns]
            y_test = test_df['quantity_sold']

            # Initialize and fit RandomForest model for this food item
            rf = RandomForestRegressor(
                n_estimators=self.n_estimators,
                random_state=self.random_state,
                max_depth=10,
                min_samples_split=4
            )
            rf.fit(X_train, y_train)
            self.models[item] = rf

            # Predict on test set
            preds = rf.predict(X_test)
            preds = np.clip(preds, 0, None)  # Ensure non-negative predictions

            y_true_all.extend(y_test.values)
            y_pred_all.extend(preds)

            # Item level MAE for confidence calculation
            item_mae = mean_absolute_error(y_test, preds)
            item_mean_sales = max(1.0, y_test.mean())
            # Practical confidence score: 1 - (MAE / mean_sales), bounded between 0.70 and 0.98
            conf = max(0.70, min(0.98, 1.0 - (item_mae / item_mean_sales)))
            self.item_confidence_scores[item] = round(conf, 2)

        # Global Evaluation Metrics
        y_true_arr = np.array(y_true_all)
        y_pred_arr = np.array(y_pred_all)

        mae = mean_absolute_error(y_true_arr, y_pred_arr)
        rmse = np.sqrt(mean_squared_error(y_true_arr, y_pred_arr))
        
        # Calculate MAPE (avoid division by zero with small epsilon)
        mape = np.mean(np.abs((y_true_arr - y_pred_arr) / np.maximum(y_true_arr, 1))) * 100

        metrics = {
            "MAE": round(mae, 2),
            "RMSE": round(rmse, 2),
            "MAPE": round(mape, 2)
        }
        return metrics

    def predict_next_day(
        self,
        df: pd.DataFrame,
        target_date_str: str,
        is_holiday: int = 0,
        college_event: int = 0
    ) -> pd.DataFrame:
        """
        Predicts demand for all items for a given future date based on latest historical data.
        Calculates recommended preparation quantity = ceil(predicted_demand * 1.10).
        """
        featured_df = self.prepare_features(df)
        target_date = pd.to_datetime(target_date_str)
        dow = target_date.weekday()
        is_wknd = 1 if dow in (5, 6) else 0

        predictions = []

        items = featured_df['food_item'].unique()

        for item in items:
            item_history = featured_df[featured_df['food_item'] == item].sort_values('date')
            last_record = item_history.iloc[-1]
            price = last_record['price']
            
            # Lag 1 day is the most recent recorded day's actual sales
            lag_1 = last_record['quantity_sold']
            
            # Lag 7 day sales from 7 days ago if available, else lag 1
            if len(item_history) >= 7:
                lag_7 = item_history.iloc[-7]['quantity_sold']
            else:
                lag_7 = lag_1
                
            # 7 day rolling average of recent sales
            recent_7_sales = item_history.iloc[-7:]['quantity_sold']
            rolling_7_avg = recent_7_sales.mean() if len(recent_7_sales) > 0 else lag_1

            # Construct feature vector for target date
            X_future = pd.DataFrame([{
                'day_of_week': dow,
                'is_weekend': is_wknd,
                'is_holiday': is_holiday,
                'college_event': college_event,
                'price': price,
                'lag_1_day_sales': lag_1,
                'lag_7_day_sales': lag_7,
                'rolling_7_day_avg': rolling_7_avg
            }])[self.feature_columns]

            # Predict using trained model
            model = self.models.get(item)
            if model is not None:
                raw_pred = model.predict(X_future)[0]
            else:
                raw_pred = rolling_7_avg

            # Clamp predicted demand to non-negative integer
            predicted_demand = max(0, int(np.round(raw_pred)))
            
            # Recommended prep with 10% safety margin buffer
            recommended_prep = int(np.ceil(predicted_demand * 1.10))

            confidence = self.item_confidence_scores.get(item, 0.85)

            predictions.append({
                "food_item": item,
                "prediction_date": target_date_str,
                "predicted_demand": predicted_demand,
                "recommended_prep_qty": recommended_prep,
                "confidence_score": confidence
            })

        pred_df = pd.DataFrame(predictions)
        return pred_df
