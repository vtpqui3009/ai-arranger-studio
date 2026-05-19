from __future__ import annotations

from enum import StrEnum

from pydantic import BaseModel


class GenerationStatus(StrEnum):
    PENDING = "pending"
    RUNNING = "running"
    DONE = "done"
    ERROR = "error"


class CreateGenerationJobRequest(BaseModel):
    prompt: str
    style: str
    bpm: int | None = 90


class GenerationJob(BaseModel):
    id: str
    prompt: str
    style: str
    status: GenerationStatus
    result_clip_id: str | None = None
    error_message: str | None = None
    created_at: str
    completed_at: str | None = None


class CreateGenerationJobResponse(BaseModel):
    job: GenerationJob


class GetGenerationJobResponse(BaseModel):
    job: GenerationJob
