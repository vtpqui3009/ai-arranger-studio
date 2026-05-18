from __future__ import annotations

from app.main import create_app
from app.routers.ai import ai_service
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
