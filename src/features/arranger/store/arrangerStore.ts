import { create } from 'zustand'
import type {
  ArrangementStyle,
  ArrangerSuggestion,
  ChordEvent,
  DrumEvent,
  InstrumentType,
  MusicProject,
  NoteDurationBeats,
  NoteEvent,
  PlaybackStatus,
  ScaleType,
  SuggestionHistoryItem,
} from '../types/music'
import { PROJECT_BEATS, clampTempo, createId } from '../utils/musicTheory'
import { createDemoProject, createEmptyProject, createNoteEvent } from '../utils/projectFactory'
import type { AISuggestionResult } from '../../../lib/ai/arrangerClient'
import type { TrackMixSettings, TrackType } from '../../mixer/types/mixer'
import type { ClipTrackEvent, SoundClip } from '../../soundLibrary/types/soundClip'
import { registerCacheAlias } from '../../../lib/audio/soundGenerator'

const MAX_HISTORY_ITEMS = 8

type ProjectMetadata = {
  title: string
  tempo: number
  key: string
  scale: ScaleType
  style: ArrangementStyle
  instrument: InstrumentType
  selectedNoteDurationBeats: NoteDurationBeats
}

type ArrangerStore = {
  project: MusicProject
  playback: {
    status: PlaybackStatus
    currentBeat: number
  }
  suggestionHistory: SuggestionHistoryItem[]
  selectedSuggestionId: string | null
  updateProjectMetadata: (updates: Partial<ProjectMetadata>) => void
  setChordSymbol: (chordId: string, symbol: string) => void
  replaceChords: (chords: ChordEvent[]) => void
  replaceMelody: (notes: NoteEvent[]) => void
  replaceBass: (notes: NoteEvent[]) => void
  replaceDrums: (pattern: DrumEvent[]) => void
  toggleMelodyNote: (midi: number, startBeat: number) => void
  addClipToProject: (clipId: string, startBeat?: number) => void
  removeClipFromProject: (eventId: string) => void
  updateClipEvent: (eventId: string, updates: Partial<Pick<ClipTrackEvent, 'gain' | 'muted'>>) => void
  addUserClip: (clip: SoundClip) => void
  updateMixer: (track: TrackType, settings: Partial<TrackMixSettings>) => void
  loadProject: (project: MusicProject) => void
  loadDemoProject: () => void
  createNewProject: () => void
  setPlaybackStatus: (status: PlaybackStatus, currentBeat?: number) => void
  addSuggestion: (result: AISuggestionResult) => SuggestionHistoryItem
  selectSuggestion: (id: string) => void
  applySuggestion: (id: string) => void
  clearSuggestionHistory: () => void
}

export const useArrangerStore = create<ArrangerStore>((set, get) => ({
  project: createDemoProject(),
  playback: {
    status: 'stopped',
    currentBeat: 0,
  },
  suggestionHistory: [],
  selectedSuggestionId: null,

  updateProjectMetadata: (updates) =>
    set(({ project }) => ({
      project: touchProject({
        ...project,
        ...updates,
        tempo: updates.tempo === undefined ? project.tempo : clampTempo(updates.tempo),
      }),
    })),

  setChordSymbol: (chordId, symbol) =>
    set(({ project }) => ({
      project: touchProject({
        ...project,
        chords: project.chords.map((chord) => (chord.id === chordId ? { ...chord, symbol } : chord)),
      }),
    })),

  replaceChords: (chords) =>
    set(({ project }) => ({
      project: touchProject({
        ...project,
        chords: [...chords].sort((left, right) => left.startBeat - right.startBeat),
      }),
    })),

  replaceMelody: (notes) =>
    set(({ project }) => ({
      project: touchProject({ ...project, melody: sortNotes(notes) }),
    })),

  replaceBass: (notes) =>
    set(({ project }) => ({
      project: touchProject({ ...project, bass: sortNotes(notes) }),
    })),

  replaceDrums: (pattern) =>
    set(({ project }) => ({
      project: touchProject({
        ...project,
        drums: [...pattern].sort((a, b) => a.startBeat - b.startBeat),
      }),
    })),

  toggleMelodyNote: (midi, startBeat) =>
    set(({ project }) => {
      const existingNote = project.melody.find(
        (note) => note.midi === midi && startBeat >= note.startBeat && startBeat < note.startBeat + note.durationBeats,
      )
      const melody = existingNote
        ? project.melody.filter((note) => note.id !== existingNote.id)
        : [
            ...project.melody,
            createNoteEvent(midi, startBeat, Math.min(project.selectedNoteDurationBeats, PROJECT_BEATS - startBeat)),
          ]

      return { project: touchProject({ ...project, melody: sortNotes(melody) }) }
    }),

  addClipToProject: (clipId, startBeat = 0) =>
    set(({ project }) => ({
      project: touchProject({
        ...project,
        clips: [
          ...project.clips,
          {
            id: createId('clip'),
            clipId,
            startBeat,
            gain: 1,
            muted: false,
          },
        ],
      }),
    })),

  removeClipFromProject: (eventId) =>
    set(({ project }) => ({
      project: touchProject({
        ...project,
        clips: project.clips.filter((clip) => clip.id !== eventId),
      }),
    })),

  updateClipEvent: (eventId, updates) =>
    set(({ project }) => ({
      project: touchProject({
        ...project,
        clips: project.clips.map((clip) => (clip.id === eventId ? { ...clip, ...updates } : clip)),
      }),
    })),

  addUserClip: (clip) =>
    set(({ project }) => ({
      project: touchProject({
        ...project,
        userClips: [...project.userClips, clip],
      }),
    })),

  updateMixer: (track, settings) =>
    set(({ project }) => ({
      project: touchProject({
        ...project,
        mixer: {
          ...project.mixer,
          [track]: { ...project.mixer[track], ...settings },
        },
      }),
    })),

  loadProject: (project) => {
    restoreUserClipAliases(project.userClips)
    set({
      project: touchProject(project),
      playback: { status: 'stopped', currentBeat: 0 },
      suggestionHistory: [],
      selectedSuggestionId: null,
    })
  },

  loadDemoProject: () =>
    set({
      project: createDemoProject(),
      playback: { status: 'stopped', currentBeat: 0 },
      suggestionHistory: [],
      selectedSuggestionId: null,
    }),

  createNewProject: () =>
    set({
      project: createEmptyProject(),
      playback: { status: 'stopped', currentBeat: 0 },
      suggestionHistory: [],
      selectedSuggestionId: null,
    }),

  setPlaybackStatus: (status, currentBeat = 0) => set({ playback: { status, currentBeat } }),

  addSuggestion: (result) => {
    const item: SuggestionHistoryItem = {
      id: createId('suggestion'),
      suggestion: result.suggestion,
      createdAt: new Date().toISOString(),
      applied: false,
    }
    set(({ suggestionHistory }) => ({
      suggestionHistory: [item, ...suggestionHistory].slice(0, MAX_HISTORY_ITEMS),
      selectedSuggestionId: item.id,
    }))
    return item
  },

  selectSuggestion: (id) => set({ selectedSuggestionId: id }),

  applySuggestion: (id) => {
    const { suggestionHistory, replaceChords, replaceMelody, replaceBass, replaceDrums } = get()
    const item = suggestionHistory.find((h) => h.id === id)
    if (!item) return

    applySuggestionData(item.suggestion, { replaceChords, replaceMelody, replaceBass, replaceDrums })

    set(({ suggestionHistory: history }) => ({
      suggestionHistory: history.map((h) => (h.id === id ? { ...h, applied: true } : h)),
    }))
  },

  clearSuggestionHistory: () => set({ suggestionHistory: [], selectedSuggestionId: null }),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function applySuggestionData(
  suggestion: ArrangerSuggestion,
  actions: {
    replaceChords: (c: ChordEvent[]) => void
    replaceMelody: (n: NoteEvent[]) => void
    replaceBass: (n: NoteEvent[]) => void
    replaceDrums: (p: DrumEvent[]) => void
  },
): void {
  if (suggestion.kind === 'chords') {
    actions.replaceChords(suggestion.chords)
  } else if (suggestion.kind === 'melody') {
    actions.replaceMelody(suggestion.notes)
  } else if (suggestion.kind === 'bass') {
    actions.replaceBass(suggestion.notes)
  } else if (suggestion.kind === 'drums') {
    actions.replaceDrums(suggestion.pattern)
  }
}

function touchProject(project: MusicProject): MusicProject {
  return { ...project, updatedAt: new Date().toISOString() }
}

function restoreUserClipAliases(userClips: SoundClip[]): void {
  for (const clip of userClips) {
    if (clip.aliasSourceId) {
      registerCacheAlias(clip.id, clip.aliasSourceId)
    }
  }
}

function sortNotes(notes: NoteEvent[]): NoteEvent[] {
  return [...notes].sort((left, right) => left.startBeat - right.startBeat || left.midi - right.midi)
}
