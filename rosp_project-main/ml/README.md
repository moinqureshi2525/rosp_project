# SmartCanteen AI - Machine Learning Demand Prediction Module

## Overview
This module handles **food demand forecasting and preparation quantity recommendations** for the college canteen. It is engineered to be accurate, fast, simple to understand, and easily defensible during viva voce evaluations.

---

## Technical Approach

### 1. Synthetic Data Generation (`dataset_generator.py`)
- Generates 90 days of daily sales records for 12 core college canteen food items.
- Features embedded in synthetic dataset:
  - **Day-of-Week Seasonality**: Higher sales for Tea/Coffee on Mondays; higher Biryani sales on Fridays.
  - **Exam & Event Effects**: Spikes in quick snacks (Samosa, Vada Pav) during exam periods.
  - **Price Elasticity**: Realistic sales volumes aligned with price points.

### 2. Feature Engineering
- `day_of_week` (Categorical 0-6 encoding for Monday to Sunday)
- `is_weekend` (Binary indicator for Saturday/Sunday)
- `lag_1_day_sales` (Sales volume on yesterday)
- `lag_7_day_sales` (Sales volume on same day last week)
- `rolling_7_day_avg` (7-day moving average sales volume)

### 3. Model Architecture (`demand_predictor.py`)
- **Model**: `Scikit-learn` Ridge Regression / Random Forest Regressor.
- **Output**:
  1. `Predicted Demand`: Mathematically forecasted number of portions required.
  2. `Recommended Preparation`: `Predicted Demand * 1.10` (10% safety buffer to eliminate out-of-stock risk during peak college break hours while minimizing food wastage).

---

## How to Explain in Viva

> **Q: Why did you choose Ridge / Time-Series Regression over Deep Learning (LSTM/Transformers)?**
> **A:** College canteen demand data exhibits strong weekly seasonality and low feature dimensionality (12 items, daily resolution). Regression models with lag features perform exceptionally well on small-to-medium time series datasets, run instantaneously, do not overfit on sparse data, and require far fewer computational resources.

> **Q: How is the Recommended Preparation Quantity calculated?**
> **A:** We apply a safety buffer factor (e.g. 10%) on top of predicted demand. This balances customer satisfaction (preventing stockouts during rush hour) and waste minimization.
