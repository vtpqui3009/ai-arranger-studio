from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel


class GenerationStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    DONE = "done"
    ERROR = "error"


class CreateGenerationJobRequest(BaseModel):
    prompt: str
    style: str
    bpm: Optional[int] = 90


class GenerationJob(BaseModel):
    id: str
    prompt: str
    style: str
    status: GenerationStatus
    result_clip_id: Optional[str] = None
    error_message: Optional[str] = None
    created_at: str
    completed_at: Optional[str] = None


class CreateGenerationJobResponse(BaseModel):
    job: GenerationJob


class GetGenerationJobResponse(BaseModel):
    job: GenerationJob
