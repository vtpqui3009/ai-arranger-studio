from __future__ import annotations

from uuid import uuid4

from app.models.music import (
    ArrangementStyle,
    BassSuggestion,
    ChordEvent,
    ChordSuggestion,
    DrumEvent,
    DrumSuggestion,
    MelodySuggestion,
    MusicProject,
    NoteEvent,
    ScaleType,
)

PROJECT_BEATS = 16
BEATS_PER_BAR = 4
CHROMATIC_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
FLAT_ALIASES = {"Db": "C#", "Eb": "D#", "Gb": "F#", "Ab": "G#", "Bb": "A#"}
MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11]
MINOR_SCALE_INTERVALS = [0, 2, 3, 5, 7, 8, 10]

STYLE_CHORD_PATTERNS: dict[ArrangementStyle, dict[ScaleType, list[tuple[int, str]]]] = {
    "lofi": {
        "major": [(1, "maj9"), (6, "m9"), (2, "m7"), (5, "13")],
        "minor": [(1, "m9"), (6, "maj7"), (3, "maj9"), (7, "7")],
    },
    "pop": {
        "major": [(1, "add9"), (5, ""), (6, "m"), (4, "")],
        "minor": [(1, "m"), (7, ""), (6, ""), (7, "")],
    },
    "edm": {
        "major": [(6, "m"), (4, ""), (1, "add9"), (5, "")],
        "minor": [(1, "m"), (6, ""), (3, ""), (7, "")],
    },
    "cinematic": {
        "major": [(1, "add9"), (4, "maj7"), (6, "m7"), (5, "sus4")],
        "minor": [(1, "madd9"), (6, "maj7"), (4, "m7"), (7, "")],
    },
    "rnb": {
        "major": [(2, "m9"), (5, "13"), (1, "maj9"), (6, "m9")],
        "minor": [(4, "m7"), (7, "7"), (3, "maj7"), (6, "maj7")],
    },
}


def suggest_chords(project: MusicProject) -> ChordSuggestion:
    pattern = STYLE_CHORD_PATTERNS[project.style][project.scale]
    chords = [
        create_chord_event(
            build_chord_symbol(project.key, project.scale, degree, suffix), index * BEATS_PER_BAR, BEATS_PER_BAR
        )
        for index, (degree, suffix) in enumerate(pattern)
    ]
    return ChordSuggestion(
        kind="chords",
        title=f"{style_label(project.style)} {project.scale} progression",
        chords=chords,
        explanation=(
            f"A four-bar {style_label(project.style).lower()} progression in {project.key} "
            f"{project.scale} with color tones chosen for stable playback."
        ),
    )


def suggest_melody(project: MusicProject) -> MelodySuggestion:
    scale_pool = get_scale_midi_notes(project.key, project.scale, 4) + get_scale_midi_notes(
        project.key, project.scale, 5
    )
    rhythm = get_melody_rhythm(project.style)
    notes: list[NoteEvent] = []

    for chord_index, chord in enumerate(project.chords):
        chord_tones = list(
            dict.fromkeys(normalize_into_range(note, 60, 84) for note in chord_symbol_to_midi_notes(chord.symbol, 4))
        )
        candidate_pool = chord_tones or scale_pool

        for step_index, step in enumerate(rhythm):
            offset, duration, degree_offset = step
            source_midi = candidate_pool[(chord_index + step_index + degree_offset) % len(candidate_pool)]
            nearest_scale_index = find_nearest_scale_index(scale_pool, source_midi)
            contour_offset = 1 if (chord_index + step_index) % 3 == 0 else 0
            midi = scale_pool[min(len(scale_pool) - 1, nearest_scale_index + contour_offset)]
            notes.append(create_note_event(midi, chord.startBeat + offset, duration, 0.78 + step_index * 0.04))

    return MelodySuggestion(
        kind="melody",
        title=f"{style_label(project.style)} motif variation",
        notes=notes,
        explanation=(
            f"Builds a {project.key} {project.scale} motif from chord tones, passing tones, "
            "and style-specific rhythmic accents."
        ),
    )


def suggest_bass(project: MusicProject) -> BassSuggestion:
    offsets = get_bass_offsets(project.style)
    notes: list[NoteEvent] = []

    for chord in project.chords:
        chord_notes = chord_symbol_to_midi_notes(chord.symbol, 2)
        if not chord_notes:
            continue

        root = chord_notes[0]
        pool = [root, root + 7, root + 12, root + 7]
        for index, offset in enumerate(offsets):
            notes.append(create_note_event(pool[index % len(pool)], chord.startBeat + offset, 0.5, 0.9 - index * 0.05))

    return BassSuggestion(
        kind="bass",
        title="Root-and-fifth bass outline",
        notes=notes,
        explanation=(
            f"Uses roots, fifths, and octave returns with a {style_label(project.style).lower()} rhythmic push."
        ),
    )


def suggest_drums(project: MusicProject) -> DrumSuggestion:
    pattern = create_drum_pattern(project.style)
    return DrumSuggestion(
        kind="drums",
        title=f"{style_label(project.style)} drum groove",
        pattern=pattern,
        explanation=(
            f"A deterministic {style_label(project.style).lower()} groove with kick, snare, and hat placements."
        ),
    )


def create_note_event(midi: int, start_beat: float, duration_beats: float, velocity: float = 0.82) -> NoteEvent:
    return NoteEvent(
        id=create_id("note"),
        pitch=midi_to_pitch(midi),
        midi=midi,
        startBeat=start_beat,
        durationBeats=duration_beats,
        velocity=max(0, min(1, velocity)),
    )


def create_chord_event(symbol: str, start_beat: float, duration_beats: float) -> ChordEvent:
    return ChordEvent(id=create_id("chord"), symbol=symbol, startBeat=start_beat, durationBeats=duration_beats)


def create_drum_event(voice: str, start_beat: float, duration_beats: float, velocity: float) -> DrumEvent:
    return DrumEvent(
        id=create_id("drum"),
        voice=voice,
        startBeat=start_beat,
        durationBeats=duration_beats,
        velocity=velocity,
    )


def create_drum_pattern(style: ArrangementStyle) -> list[DrumEvent]:
    kick_beats_by_style: dict[ArrangementStyle, list[float]] = {
        "lofi": [0, 3, 6, 8, 11, 14],
        "pop": [0, 4, 8, 12],
        "edm": [0, 2, 4, 6, 8, 10, 12, 14],
        "cinematic": [0, 8, 12],
        "rnb": [0, 3, 7, 10, 13],
    }

    events: list[DrumEvent] = [create_drum_event("kick", beat, 0.5, 0.95) for beat in kick_beats_by_style[style]]
    events.extend(create_drum_event("snare", beat, 0.5, 0.68 if style == "lofi" else 0.82) for beat in [2, 6, 10, 14])

    hat_step = 0.5 if style == "edm" else 1
    beat = 0.0
    while beat < PROJECT_BEATS:
        events.append(create_drum_event("closedHat", beat, 0.25, 0.58 if int(beat) % 2 == 0 else 0.42))
        beat += hat_step

    if style in {"rnb", "lofi"}:
        events.extend(create_drum_event("openHat", beat, 0.5, 0.5) for beat in [5.5, 13.5])

    return sorted(events, key=lambda event: event.startBeat)


def get_melody_rhythm(style: ArrangementStyle) -> list[tuple[float, float, int]]:
    if style == "edm":
        return [(0, 0.5, 0), (0.5, 0.5, 2), (1.5, 0.5, 1), (3, 1, 3)]
    if style == "cinematic":
        return [(0, 2, 0), (2.5, 0.5, 1), (3, 1, 2)]
    if style == "rnb":
        return [(0, 0.5, 1), (1, 1, 2), (2.5, 0.5, 0), (3.5, 0.5, 3)]
    return [(0, 1, 0), (1.5, 0.5, 1), (2, 1, 2), (3.5, 0.5, 1)]


def get_bass_offsets(style: ArrangementStyle) -> list[float]:
    if style == "edm":
        return [0, 1, 2, 3]
    if style in {"rnb", "lofi"}:
        return [0, 1.5, 2.5, 3.5]
    if style == "cinematic":
        return [0, 2, 3]
    return [0, 1, 2.5, 3]


def build_chord_symbol(key: str, scale: ScaleType, degree: int, suffix: str) -> str:
    intervals = MAJOR_SCALE_INTERVALS if scale == "major" else MINOR_SCALE_INTERVALS
    return f"{transpose_note_name(key, intervals[degree - 1])}{suffix}"


def get_scale_midi_notes(key: str, scale: ScaleType, octave: int = 4) -> list[int]:
    intervals = MAJOR_SCALE_INTERVALS if scale == "major" else MINOR_SCALE_INTERVALS
    root_midi = note_name_to_midi(key, octave)
    return [root_midi + interval for interval in intervals]


def chord_symbol_to_midi_notes(symbol: str, octave: int = 3) -> list[int]:
    symbol = symbol.strip()
    if not symbol:
        return []
    root = symbol[:2] if len(symbol) > 1 and symbol[1] in {"#", "b"} else symbol[:1]
    quality = symbol[len(root) :].lower().split("/", maxsplit=1)[0]
    root_midi = note_name_to_midi(root, octave)
    return [root_midi + interval for interval in get_triad_intervals(quality) + get_extension_intervals(quality)]


def get_triad_intervals(quality: str) -> list[int]:
    if "dim" in quality:
        return [0, 3, 6]
    if "aug" in quality:
        return [0, 4, 8]
    if "sus2" in quality:
        return [0, 2, 7]
    if "sus" in quality:
        return [0, 5, 7]
    if quality.startswith("m") and not quality.startswith("maj"):
        return [0, 3, 7]
    return [0, 4, 7]


def get_extension_intervals(quality: str) -> list[int]:
    if "13" in quality:
        return [10, 14, 21]
    if "add9" in quality or "madd9" in quality:
        return [14]
    if "maj9" in quality:
        return [11, 14]
    if "maj7" in quality:
        return [11]
    if "9" in quality:
        return [10, 14]
    if "7" in quality:
        return [10]
    if "6" in quality:
        return [9]
    return []


def midi_to_pitch(midi: int) -> str:
    return f"{CHROMATIC_SHARP[midi % 12]}{midi // 12 - 1}"


def note_name_to_midi(note_name: str, octave: int) -> int:
    return (octave + 1) * 12 + semitone_for_note(note_name)


def transpose_note_name(note_name: str, semitones: int) -> str:
    return CHROMATIC_SHARP[(semitone_for_note(note_name) + semitones) % 12]


def semitone_for_note(note_name: str) -> int:
    normalized = FLAT_ALIASES.get(note_name, note_name)
    if normalized not in CHROMATIC_SHARP:
        return 0
    return CHROMATIC_SHARP.index(normalized)


def find_nearest_scale_index(scale_pool: list[int], midi: int) -> int:
    return min(range(len(scale_pool)), key=lambda index: abs(scale_pool[index] - midi))


def normalize_into_range(midi: int, lowest: int, highest: int) -> int:
    while midi < lowest:
        midi += 12
    while midi > highest:
        midi -= 12
    return midi


def style_label(style: ArrangementStyle) -> str:
    return "R&B" if style == "rnb" else style.capitalize()


def create_id(prefix: str) -> str:
    return f"{prefix}-{uuid4()}"
