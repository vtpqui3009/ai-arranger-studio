from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.generation import (
    CreateGenerationJobRequest,
    CreateGenerationJobResponse,
    GenerationJob,
    GetGenerationJobResponse,
)
from app.services import generation_service

router = APIRouter(prefix="/api/generation", tags=["generation"])


@router.post("/jobs", response_model=CreateGenerationJobResponse)
async def create_generation_job(request: CreateGenerationJobRequest) -> CreateGenerationJobResponse:
    job = generation_service.create_job(
        prompt=request.prompt,
        style=request.style,
        bpm=request.bpm or 90,
    )
    return CreateGenerationJobResponse(job=job)


@router.get("/jobs/{job_id}", response_model=GetGenerationJobResponse)
async def get_generation_job(job_id: str) -> GetGenerationJobResponse:
    job = generation_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return GetGenerationJobResponse(job=job)


@router.get("/jobs", response_model=list[GenerationJob])
async def list_generation_jobs() -> list[GenerationJob]:
    return generation_service.list_jobs()
