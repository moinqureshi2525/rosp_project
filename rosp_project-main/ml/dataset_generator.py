"""
SmartCanteen AI - Synthetic Data Generator Module
Generates realistic historical sales data for 12 college canteen food items over 90 days.
Used for training and evaluating food demand forecasting ML models.
"""

import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Core 12 Indian College Canteen Food Items with baseline prices and daily average demand
FOOD_ITEMS_CONFIG = [
    {"name": "Samosa", "price": 20.0, "base_demand": 80, "category": "Snacks"},
    {"name": "Vada Pav", "price": 25.0, "base_demand": 70, "category": "Snacks"},
    {"name": "Masala Dosa", "price": 60.0, "base_demand": 45, "category": "South Indian"},
    {"name": "Idli", "price": 40.0, "base_demand": 40, "category": "South Indian"},
    {"name": "Veg Sandwich", "price": 45.0, "base_demand": 50, "category": "Snacks"},
    {"name": "Veg Biryani", "price": 90.0, "base_demand": 35, "category": "Main Course"},
    {"name": "Chicken Biryani", "price": 130.0, "base_demand": 45, "category": "Main Course"},
    {"name": "Pav Bhaji", "price": 70.0, "base_demand": 35, "category": "Main Course"},
    {"name": "Noodles", "price": 55.0, "base_demand": 50, "category": "Main Course"},
    {"name": "Tea", "price": 12.0, "base_demand": 180, "category": "Beverages"},
    {"name": "Coffee", "price": 18.0, "base_demand": 130, "category": "Beverages"},
    {"name": "Cold Drink", "price": 25.0, "base_demand": 100, "category": "Beverages"}
]


def generate_canteen_sales_data(days: int = 90, seed: int = 42) -> pd.DataFrame:
    """
    Generates realistic synthetic daily sales history for college canteen items.
    
    Parameters:
        days (int): Number of days of historical records (default 90 days)
        seed (int): Random seed for reproducibility
        
    Returns:
        pd.DataFrame: Clean dataset containing date, item details, temporal factors, and quantity_sold
    """
    np.random.seed(seed)
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=days - 1)
    
    date_list = [start_date + timedelta(days=i) for i in range(days)]
    
    rows = []
    
    for current_date in date_list:
        dow = current_date.weekday()  # 0: Monday, 6: Sunday
        is_wknd = 1 if dow in (5, 6) else 0
        
        # 5% chance of college holiday on weekdays
        is_hol = 1 if (is_wknd == 0 and np.random.rand() < 0.05) else 0
        
        # 8% chance of college fest / exam / event on non-holidays
        is_evt = 1 if (is_hol == 0 and np.random.rand() < 0.08) else 0
        
        for item in FOOD_ITEMS_CONFIG:
            name = item["name"]
            price = item["price"]
            base = item["base_demand"]
            
            # 1. Day of Week multiplier
            dow_multiplier = 1.0
            if name in ["Tea", "Coffee"]:
                if dow == 0:  # Monday rush
                    dow_multiplier = 1.30
                elif dow == 1:
                    dow_multiplier = 1.15
                elif is_wknd:
                    dow_multiplier = 0.35
            elif "Biryani" in name:
                if dow == 4:  # Friday special biryani day
                    dow_multiplier = 1.45
                elif dow == 2:  # Wednesday
                    dow_multiplier = 1.20
                elif is_wknd:
                    dow_multiplier = 0.40
            elif name in ["Samosa", "Vada Pav"]:
                if dow in (0, 1, 2, 3):  # Mon-Thu tea break snack peak
                    dow_multiplier = 1.15
                elif is_wknd:
                    dow_multiplier = 0.30
            elif name in ["Masala Dosa", "Idli"]:
                if dow in (1, 3):  # Tue/Thu breakfast peak
                    dow_multiplier = 1.25
                elif is_wknd:
                    dow_multiplier = 0.45
            else:
                if is_wknd:
                    dow_multiplier = 0.35

            # 2. Event & Holiday multipliers
            event_multiplier = 1.65 if is_evt else 1.0
            holiday_multiplier = 0.20 if is_hol else 1.0
            
            # 3. Overall demand expectation
            expected_demand = base * dow_multiplier * event_multiplier * holiday_multiplier
            
            # 4. Add gaussian noise (standard deviation ~ 10% of expected)
            noise = np.random.normal(loc=0.0, scale=0.10 * expected_demand)
            actual_quantity = max(0, int(np.round(expected_demand + noise)))
            
            rows.append({
                "date": current_date.strftime("%Y-%m-%d"),
                "food_item": name,
                "price": price,
                "day_of_week": dow,
                "is_weekend": is_wknd,
                "is_holiday": is_hol,
                "college_event": is_evt,
                "quantity_sold": actual_quantity
            })
            
    df = pd.DataFrame(rows)
    return df


def save_dataset(df: pd.DataFrame, output_path: str = "ml/data/historical_sales.csv") -> str:
    """
    Saves the generated DataFrame to CSV file.
    Creates parent directories if necessary.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"[SUCCESS] Historical sales dataset ({len(df)} rows) saved to: {output_path}")
    return output_path


if __name__ == "__main__":
    sales_df = generate_canteen_sales_data(days=90)
    save_dataset(sales_df)
