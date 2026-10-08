from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db, FeedbackModel, ProfileModel, FoodItemModel
from app.schemas.pydantic_models import FeedbackCreate, FeedbackResponse

router = APIRouter(prefix="/api/feedback", tags=["Student Feedback"])


def _format_feedback_response(fb: FeedbackModel) -> FeedbackResponse:
    user_name = fb.user.full_name if fb.user else "Anonymous Student"
    item_name = fb.food_item.name if fb.food_item else "General Feedback"
    return FeedbackResponse(
        id=fb.id,
        order_id=fb.order_id,
        user_id=fb.user_id,
        user_name=user_name,
        food_item_id=fb.food_item_id,
        food_item_name=item_name,
        rating=fb.rating,
        comment=fb.comment,
        created_at=fb.created_at
    )


@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_feedback(request: FeedbackCreate, db: Session = Depends(get_db)):
    user = db.query(ProfileModel).filter(ProfileModel.id == request.user_id).first()
    if not user:
        user = db.query(ProfileModel).filter(ProfileModel.role == "student").first()
        if not user:
            raise HTTPException(status_code=404, detail="Student profile not found.")

    food_item = db.query(FoodItemModel).filter(FoodItemModel.id == request.food_item_id).first()
    if not food_item:
        raise HTTPException(status_code=404, detail="Food item not found.")

    new_fb = FeedbackModel(
        order_id=request.order_id,
        user_id=user.id,
        food_item_id=food_item.id,
        rating=request.rating,
        comment=request.comment
    )
    db.add(new_fb)
    db.commit()
    db.refresh(new_fb)

    return _format_feedback_response(new_fb)


@router.get("", response_model=List[FeedbackResponse])
def get_all_feedback(db: Session = Depends(get_db)):
    feedbacks = db.query(FeedbackModel).order_by(FeedbackModel.created_at.desc()).all()
    return [_format_feedback_response(fb) for fb in feedbacks]
