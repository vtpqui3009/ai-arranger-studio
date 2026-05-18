from __future__ import annotations

import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.ai import ai_service
from app.routers.ai import router as ai_router
from app.services.monitoring import initialize_error_monitoring

load_dotenv()


def create_app() -> FastAPI:
    initialize_error_monitoring()
    app = FastAPI(title="AI Arranger Studio API", version="0.4.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=get_allowed_origins(),
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )

    @app.get("/health")
    async def health() -> dict[str, object]:
        return {
            "status": "ok",
            "aiProviderConfigured": ai_service.is_configured(),
            "model": ai_service.model,
        }

    app.include_router(ai_router)
    return app


def get_allowed_origins() -> list[str]:
    origins = os.getenv("AI_ALLOWED_ORIGINS", "http://127.0.0.1:5173,http://localhost:5173")
    return [origin.strip() for origin in origins.split(",") if origin.strip()]


app = create_app()
