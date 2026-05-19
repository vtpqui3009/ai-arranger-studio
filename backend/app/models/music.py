from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, Field, field_validator

ArrangementStyle = Literal["lofi", "pop", "edm", "cinematic", "rnb"]
ScaleType = Literal["major", "minor"]
InstrumentType = Literal["synth", "piano", "bass", "pad"]
NoteDurationBeats = Literal[0.5, 1, 2, 4]
DrumVoice = Literal["kick", "snare", "closedHat", "openHat"]
TrackType = Literal["chords", "melody", "bass", "drums", "clips"]
AISource = Literal["openai", "mock"]


class TrackMixSettings(BaseModel):
    volume: float = Field(ge=0, le=100)
    muted: bool = False
    solo: bool = False


_DEFAULT_MIXER: dict[str, TrackMixSettings] = {
    "chords": TrackMixSettings(volume=75),
    "melody": TrackMixSettings(volume=80),
    "bass": TrackMixSettings(volume=85),
    "drums": TrackMixSettings(volume=80),
    "clips": TrackMixSettings(volume=80),
}


class ClipTrackEvent(BaseModel):
    id: str = Field(min_length=1)
    clipId: str = Field(min_length=1)
    startBeat: float = Field(ge=0, le=64)
    gain: float = Field(ge=0, le=1)
    muted: bool = False


SoundClipSource = Literal["catalog-synth", "ai-generated"]
SoundCategory = Literal["drums", "bass", "atmosphere", "melody", "fx"]


class UserSoundClip(BaseModel):
    id: str = Field(min_length=1)
    name: str = Field(min_length=1, max_length=120)
    category: SoundCategory
    style: ArrangementStyle | None = None
    tags: list[str] = Field(default_factory=list, max_length=16)
    durationBeats: float = Field(gt=0, le=64)
    referenceBpm: int = Field(ge=40, le=240)
    source: SoundClipSource
    aliasSourceId: str | None = None


class NoteEvent(BaseModel):
    id: str = Field(min_length=1)
    pitch: str = Field(min_length=2)
    midi: int = Field(ge=0, le=127)
    startBeat: float = Field(ge=0, le=64)
    durationBeats: float = Field(gt=0, le=16)
    velocity: float = Field(ge=0, le=1)


class ChordEvent(BaseModel):
    id: str = Field(min_length=1)
    symbol: str = Field(min_length=1, max_length=24)
    startBeat: float = Field(ge=0, le=64)
    durationBeats: float = Field(gt=0, le=16)


class DrumEvent(BaseModel):
    id: str = Field(min_length=1)
    voice: DrumVoice
    startBeat: float = Field(ge=0, le=64)
    durationBeats: float = Field(gt=0, le=16)
    velocity: float = Field(ge=0, le=1)


class MusicProject(BaseModel):
    id: str = Field(min_length=1)
    title: str = Field(min_length=1, max_length=120)
    tempo: int = Field(ge=40, le=240)
    key: str = Field(min_length=1, max_length=2)
    scale: ScaleType
    style: ArrangementStyle
    instrument: InstrumentType = "synth"
    selectedNoteDurationBeats: NoteDurationBeats = 1
    chords: list[ChordEvent] = Field(default_factory=list, max_length=32)
    melody: list[NoteEvent] = Field(default_factory=list, max_length=256)
    bass: list[NoteEvent] = Field(default_factory=list, max_length=256)
    drums: list[DrumEvent] = Field(default_factory=list, max_length=256)
    clips: list[ClipTrackEvent] = Field(default_factory=list, max_length=64)
    userClips: list[UserSoundClip] = Field(default_factory=list, max_length=64)
    mixer: dict[TrackType, TrackMixSettings] = Field(default_factory=lambda: dict(_DEFAULT_MIXER))
    schemaVersion: int = 2
    updatedAt: str


class SuggestionRequest(BaseModel):
    project: MusicProject


class ChordSuggestion(BaseModel):
    kind: Literal["chords"]
    title: str = Field(min_length=1, max_length=120)
    chords: list[ChordEvent] = Field(min_length=1, max_length=16)
    explanation: str = Field(min_length=1, max_length=500)

    @field_validator("chords")
    @classmethod
    def validate_chord_timeline(cls, chords: list[ChordEvent]) -> list[ChordEvent]:
        return sorted(chords, key=lambda chord: chord.startBeat)


class MelodySuggestion(BaseModel):
    kind: Literal["melody"]
    title: str = Field(min_length=1, max_length=120)
    notes: list[NoteEvent] = Field(min_length=1, max_length=128)
    explanation: str = Field(min_length=1, max_length=500)

    @field_validator("notes")
    @classmethod
    def validate_notes(cls, notes: list[NoteEvent]) -> list[NoteEvent]:
        return sorted(notes, key=lambda note: (note.startBeat, note.midi))


class BassSuggestion(BaseModel):
    kind: Literal["bass"]
    title: str = Field(min_length=1, max_length=120)
    notes: list[NoteEvent] = Field(min_length=1, max_length=128)
    explanation: str = Field(min_length=1, max_length=500)

    @field_validator("notes")
    @classmethod
    def validate_notes(cls, notes: list[NoteEvent]) -> list[NoteEvent]:
        return sorted(notes, key=lambda note: (note.startBeat, note.midi))


class DrumSuggestion(BaseModel):
    kind: Literal["drums"]
    title: str = Field(min_length=1, max_length=120)
    pattern: list[DrumEvent] = Field(min_length=1, max_length=128)
    explanation: str = Field(min_length=1, max_length=500)

    @field_validator("pattern")
    @classmethod
    def validate_pattern(cls, pattern: list[DrumEvent]) -> list[DrumEvent]:
        return sorted(pattern, key=lambda event: event.startBeat)


ArrangerSuggestion = Annotated[
    ChordSuggestion | MelodySuggestion | BassSuggestion | DrumSuggestion,
    Field(discriminator="kind"),
]


class AISuggestionResponse(BaseModel):
    suggestion: ArrangerSuggestion
    source: AISource
    warning: str | None = None
