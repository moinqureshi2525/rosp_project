from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.pydantic_models import AIChatRequest, AIChatResponse
from app.services.ai_service import generate_canteen_ai_insights

router = APIRouter(prefix="/api/ai", tags=["AI Canteen Insights"])


@router.post("/chat", response_model=AIChatResponse)
def ai_canteen_assistant(request: AIChatRequest, db: Session = Depends(get_db)):
    """
    Admin AI assistant powered by Google Gemini API.
    Provides context-aware canteen insights for demand, stock, and wastage questions.
    """
    reply = generate_canteen_ai_insights(db, request.message)
    
    suggested = [
        "What should we prepare tomorrow?",
        "Which food items are most popular?",
        "Which items have low stock?",
        "Why might food wastage be high?"
    ]
    
    return AIChatResponse(
        response=reply,
        suggested_actions=suggested
    )
