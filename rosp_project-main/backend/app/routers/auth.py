from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db, ProfileModel
from app.schemas.pydantic_models import LoginRequest, ProfileCreate, ProfileResponse, AuthResponse

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=AuthResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(ProfileModel).filter(ProfileModel.email == request.email).first()
    if not user:
        # Create student profile on the fly for seamless demo login if not existing
        role = "admin" if "admin" in request.email.lower() else "student"
        full_name = "Canteen Admin" if role == "admin" else "Student User"
        user = ProfileModel(
            email=request.email,
            full_name=full_name,
            role=role
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return AuthResponse(
        user=ProfileResponse.model_validate(user),
        access_token=f"demo-token-{user.role}-{user.id[:8]}",
        token_type="bearer"
    )


@router.post("/register", response_model=ProfileResponse)
def register(request: ProfileCreate, db: Session = Depends(get_db)):
    existing = db.query(ProfileModel).filter(ProfileModel.email == request.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email is already registered.")

    new_profile = ProfileModel(
        full_name=request.full_name,
        email=request.email,
        role=request.role
    )
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    return ProfileResponse.model_validate(new_profile)


@router.get("/me", response_model=ProfileResponse)
def get_current_user(email: str = "student@canteen.edu", db: Session = Depends(get_db)):
    user = db.query(ProfileModel).filter(ProfileModel.email == email).first()
    if not user:
        user = db.query(ProfileModel).first()
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found.")
    return ProfileResponse.model_validate(user)
