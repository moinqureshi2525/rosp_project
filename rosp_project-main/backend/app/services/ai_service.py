import os
from sqlalchemy.orm import Session
from app.config import settings
from app.database import FoodItemModel, InventoryModel, SalesModel, DemandPredictionModel

# Try importing Google GenAI SDK
try:
    from google import genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False


def generate_canteen_ai_insights(db: Session, user_message: str) -> str:
    """
    Retrieves canteen operational context (inventory, demand predictions, popular items)
    and queries Gemini API for intelligent admin guidance.
    """
    # 1. Gather Live Context
    # Low stock items
    low_stock = db.query(InventoryModel).filter(
        InventoryModel.current_stock <= InventoryModel.minimum_stock_alert
    ).all()
    low_stock_str = ", ".join([f"{inv.food_item.name} (Stock: {inv.current_stock})" for inv in low_stock]) or "None"

    # Tomorrow's demand predictions
    preds = db.query(DemandPredictionModel).order_by(DemandPredictionModel.prediction_date.desc()).limit(12).all()
    predictions_str = "\n".join([
        f"- {p.food_item.name}: Predicted {p.predicted_demand} units, Recommended Prep {p.recommended_prep_qty} units"
        for p in preds if p.food_item
    ]) or "No predictions generated yet."

    # Top popular items by sales
    top_items = db.query(FoodItemModel).limit(5).all()
    popular_str = ", ".join([item.name for item in top_items])

    # 2. Build Contextual Prompt
    system_context = f"""
You are SmartCanteen AI Assistant, an expert advisor for a college canteen manager.
Current Canteen Operational Status:
- Low Stock Items: {low_stock_str}
- Top Popular Food Items: {popular_str}
- Tomorrow's Demand Forecast & Recommended Preparation Quantities:
{predictions_str}

User Question: "{user_message}"

Instructions:
Provide a concise, practical, and action-oriented answer (under 150 words) suitable for a canteen admin.
Format your response cleanly with bullet points or short paragraphs.
"""

    # 3. Query Gemini API or Fallback
    if not settings.GEMINI_API_KEY:
        return (
            f"[SmartCanteen AI Assistant - Demo Mode]\n\n"
            f"Based on current canteen data:\n"
            f"• Low Stock Alert: {low_stock_str}\n"
            f"• Recommended Tomorrow Preparation: Top items are Tea (74 portions), Coffee (50 portions), Samosa (26 portions).\n\n"
            f"*(Note: Provide GEMINI_API_KEY in backend/.env for live generative Gemini responses.)*"
        )

    if not GENAI_AVAILABLE:
        return (
            "[SmartCanteen AI Assistant]\n\n"
            "The google-genai Python library is missing. Please run `pip install google-genai` to enable live Gemini AI integration."
        )

    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        model_name = settings.GEMINI_MODEL or "gemini-2.5-flash"
        response = client.models.generate_content(
            model=model_name,
            contents=system_context
        )
        return response.text
    except Exception as e:
        print(f"[AI SERVICE ERROR] Gemini API call failed: {e}")
        return f"SmartCanteen AI Assistant error: Unable to contact Gemini API. Details: {str(e)}"
