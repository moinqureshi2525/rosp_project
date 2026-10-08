from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db

# Import API Routers
from app.routers import (
    auth, items, orders, inventory,
    predictions, analytics, feedback, ai, waste
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database & Seed Data
    print("[SERVER STARTUP] Initializing SmartCanteen AI database...")
    init_db()
    yield
    # Shutdown
    print("[SERVER SHUTDOWN] SmartCanteen AI backend shutting down.")


app = FastAPI(
    title="SmartCanteen AI Backend API",
    description="Smart Canteen Management & Food Demand Prediction System REST API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", tags=["Health"])
def health_check():
    """Health check endpoint to verify backend status."""
    return {
        "status": "ok",
        "service": "SmartCanteen AI"
    }


# Include Routers
app.include_router(auth.router)
app.include_router(items.router)
app.include_router(orders.router)
app.include_router(inventory.router)
app.include_router(predictions.router)
app.include_router(analytics.router)
app.include_router(feedback.router)
app.include_router(ai.router)
app.include_router(waste.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
