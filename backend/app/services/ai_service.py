from __future__ import annotations

import asyncio
import os
from collections.abc import Callable
from typing import TypeVar

from dotenv import load_dotenv
from pydantic import BaseModel, ValidationError

from app.models.music import (
    AISuggestionResponse,
    BassSuggestion,
    ChordSuggestion,
    DrumSuggestion,
    MelodySuggestion,
    MusicProject,
)
from app.services import mock_arranger
from app.services.monitoring import capture_exception

load_dotenv()

SuggestionModel = TypeVar("SuggestionModel", bound=BaseModel)

SYSTEM_PROMPT = """You are AI Arranger Studio's backend arranger.
Return exactly one compact, structured music suggestion matching the requested schema.
Keep all events within a 16-beat loop unless the project itself is longer.
Use only generated MIDI-style data, never copyrighted samples.
Prefer beginner-friendly musical ideas that fit the project's key, scale, style, tempo, chords, melody, bass, and drums.
"""


class AIArrangerService:
    def __init__(self) -> None:
        self.api_key = os.getenv("OPENAI_API_KEY", "").strip()
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip() or "gpt-4o-mini"

    def is_configured(self) -> bool:
        return bool(self.api_key)

    async def suggest_chords(self, project: MusicProject) -> AISuggestionResponse:
        return await self._suggest(
            project=project,
            task="Suggest a four-chord progression with tasteful color tones.",
            response_model=ChordSuggestion,
            fallback=lambda: mock_arranger.suggest_chords(project),
        )

    async def suggest_melody(self, project: MusicProject) -> AISuggestionResponse:
        return await self._suggest(
            project=project,
            task="Suggest a playable melody variation as NoteEvent objects.",
            response_model=MelodySuggestion,
            fallback=lambda: mock_arranger.suggest_melody(project),
        )

    async def suggest_bass(self, project: MusicProject) -> AISuggestionResponse:
        return await self._suggest(
            project=project,
            task="Suggest a simple bass line as NoteEvent objects.",
            response_model=BassSuggestion,
            fallback=lambda: mock_arranger.suggest_bass(project),
        )

    async def suggest_drums(self, project: MusicProject) -> AISuggestionResponse:
        return await self._suggest(
            project=project,
            task="Suggest a drum groove as DrumEvent objects.",
            response_model=DrumSuggestion,
            fallback=lambda: mock_arranger.suggest_drums(project),
        )

    async def _suggest(
        self,
        project: MusicProject,
        task: str,
        response_model: type[SuggestionModel],
        fallback: Callable[[], SuggestionModel],
    ) -> AISuggestionResponse:
        if not self.is_configured():
            return AISuggestionResponse(
                suggestion=fallback(), source="mock", warning="OPENAI_API_KEY is not configured."
            )

        try:
            suggestion = await asyncio.to_thread(self._call_openai, project, task, response_model)
            return AISuggestionResponse(suggestion=suggestion, source="openai")
        except (ImportError, ValidationError, ValueError) as error:
            capture_exception(error, {"service": "ai-arranger", "task": task, "fallback": "validation"})
            return AISuggestionResponse(suggestion=fallback(), source="mock", warning=f"AI response fallback: {error}")
        except Exception as error:
            capture_exception(error, {"service": "ai-arranger", "task": task, "fallback": "provider"})
            return AISuggestionResponse(
                suggestion=fallback(), source="mock", warning=f"AI provider unavailable: {error}"
            )

    def _call_openai(
        self,
        project: MusicProject,
        task: str,
        response_model: type[SuggestionModel],
    ) -> SuggestionModel:
        from openai import OpenAI

        client = OpenAI(api_key=self.api_key)
        response = client.responses.parse(
            model=self.model,
            input=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": (
                        f"{task}\n\nReturn JSON matching the provided schema. Project:\n{project.model_dump_json()}"
                    ),
                },
            ],
            text_format=response_model,
        )

        parsed = response.output_parsed
        if parsed is None:
            raise ValueError("No parsed structured output returned.")

        return response_model.model_validate(parsed)
