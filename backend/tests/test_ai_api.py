from __future__ import annotations

import asyncio

import pytest
from app.main import create_app
from app.models.music import ChordSuggestion
from app.routers.ai import ai_service
from app.services.ai_service import AIArrangerService
from fastapi.testclient import TestClient

PROJECT_PAYLOAD = {
    "id": "project-test",
    "title": "Test Sketch",
    "tempo": 96,
    "key": "C",
    "scale": "major",
    "style": "lofi",
    "instrument": "piano",
    "selectedNoteDurationBeats": 1,
    "chords": [
        {"id": "chord-1", "symbol": "Cmaj7", "startBeat": 0, "durationBeats": 4},
        {"id": "chord-2", "symbol": "Am7", "startBeat": 4, "durationBeats": 4},
        {"id": "chord-3", "symbol": "Fmaj7", "startBeat": 8, "durationBeats": 4},
        {"id": "chord-4", "symbol": "G7", "startBeat": 12, "durationBeats": 4},
    ],
    "melody": [{"id": "note-1", "pitch": "E4", "midi": 64, "startBeat": 0, "durationBeats": 1, "velocity": 0.82}],
    "bass": [{"id": "bass-1", "pitch": "C2", "midi": 36, "startBeat": 0, "durationBeats": 1, "velocity": 0.84}],
    "drums": [{"id": "drum-1", "voice": "kick", "startBeat": 0, "durationBeats": 0.5, "velocity": 0.85}],
    "updatedAt": "2026-05-18T00:00:00.000Z",
}


def test_health_reports_mock_ai_when_key_is_not_configured() -> None:
    ai_service.api_key = ""
    client = TestClient(create_app())

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["aiProviderConfigured"] is False


def test_ai_endpoints_return_structured_mock_fallbacks() -> None:
    ai_service.api_key = ""
    client = TestClient(create_app())

    endpoints = {
        "/api/ai/suggest-chords": "chords",
        "/api/ai/suggest-melody": "melody",
        "/api/ai/suggest-bass": "bass",
        "/api/ai/suggest-drums": "drums",
    }

    for endpoint, expected_kind in endpoints.items():
        response = client.post(endpoint, json={"project": PROJECT_PAYLOAD})
        payload = response.json()

        assert response.status_code == 200
        assert payload["source"] == "mock"
        assert payload["suggestion"]["kind"] == expected_kind
        assert payload["suggestion"]["explanation"]


def test_configured_provider_returns_validated_openai_suggestion(monkeypatch: pytest.MonkeyPatch) -> None:
    service = AIArrangerService()
    service.api_key = "test-key"

    def fake_call_openai(*_args: object) -> ChordSuggestion:
        return ChordSuggestion(
            kind="chords",
            title="Provider progression",
            chords=[
                {"id": "chord-ai-1", "symbol": "Cmaj7", "startBeat": 0, "durationBeats": 4},
                {"id": "chord-ai-2", "symbol": "Am7", "startBeat": 4, "durationBeats": 4},
            ],
            explanation="Validated provider response.",
        )

    monkeypatch.setattr(service, "_call_openai", fake_call_openai)

    response = asyncio.run(service.suggest_chords(service_project()))

    assert response.source == "openai"
    assert response.suggestion.kind == "chords"
    assert response.suggestion.title == "Provider progression"


def test_malformed_provider_response_returns_mock_fallback(monkeypatch: pytest.MonkeyPatch) -> None:
    service = AIArrangerService()
    service.api_key = "test-key"

    def fake_call_openai(*_args: object) -> ChordSuggestion:
        raise ValueError("No parsed structured output returned.")

    monkeypatch.setattr(service, "_call_openai", fake_call_openai)

    response = asyncio.run(service.suggest_chords(service_project()))

    assert response.source == "mock"
    assert response.suggestion.kind == "chords"
    assert response.warning is not None


def service_project():
    from app.models.music import MusicProject

    return MusicProject.model_validate(PROJECT_PAYLOAD)
