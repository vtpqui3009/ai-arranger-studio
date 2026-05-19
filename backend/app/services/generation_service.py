from __future__ import annotations

import uuid
from datetime import datetime, timezone

from app.models.generation import GenerationJob, GenerationStatus

_jobs: dict[str, GenerationJob] = {}


def create_job(prompt: str, style: str, bpm: int) -> GenerationJob:
    job_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    job = GenerationJob(
        id=job_id,
        prompt=prompt,
        style=style,
        status=GenerationStatus.DONE,
        result_clip_id=f"mock-{style}-clip-{job_id[:8]}",
        created_at=now,
        completed_at=now,
    )
    _jobs[job_id] = job
    return job


def get_job(job_id: str) -> GenerationJob | None:
    return _jobs.get(job_id)


def list_jobs() -> list[GenerationJob]:
    return list(_jobs.values())
