from __future__ import annotations

from fastapi import APIRouter

from app.models.music import AISuggestionResponse, SuggestionRequest
from app.services.ai_service import AIArrangerService

router = APIRouter(prefix="/api/ai", tags=["ai"])
ai_service = AIArrangerService()


@router.post("/suggest-chords", response_model=AISuggestionResponse)
async def suggest_chords(request: SuggestionRequest) -> AISuggestionResponse:
    return await ai_service.suggest_chords(request.project)


@router.post("/suggest-melody", response_model=AISuggestionResponse)
async def suggest_melody(request: SuggestionRequest) -> AISuggestionResponse:
    return await ai_service.suggest_melody(request.project)


@router.post("/suggest-bass", response_model=AISuggestionResponse)
async def suggest_bass(request: SuggestionRequest) -> AISuggestionResponse:
    return await ai_service.suggest_bass(request.project)


@router.post("/suggest-drums", response_model=AISuggestionResponse)
async def suggest_drums(request: SuggestionRequest) -> AISuggestionResponse:
    return await ai_service.suggest_drums(request.project)
