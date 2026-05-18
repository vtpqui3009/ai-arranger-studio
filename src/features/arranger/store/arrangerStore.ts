import { create } from 'zustand'
import type {
  ArrangementStyle,
  ChordEvent,
  InstrumentType,
  MusicProject,
  NoteDurationBeats,
  NoteEvent,
  PlaybackStatus,
  ScaleType,
} from '../types/music'
import { PROJECT_BEATS, clampTempo } from '../utils/musicTheory'
import { createDemoProject, createEmptyProject, createNoteEvent } from '../utils/projectFactory'

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
  updateProjectMetadata: (updates: Partial<ProjectMetadata>) => void
  setChordSymbol: (chordId: string, symbol: string) => void
  replaceChords: (chords: ChordEvent[]) => void
  replaceMelody: (notes: NoteEvent[]) => void
  toggleMelodyNote: (midi: number, startBeat: number) => void
  loadProject: (project: MusicProject) => void
  loadDemoProject: () => void
  createNewProject: () => void
  setPlaybackStatus: (status: PlaybackStatus, currentBeat?: number) => void
}

export const useArrangerStore = create<ArrangerStore>((set) => ({
  project: createDemoProject(),
  playback: {
    status: 'stopped',
    currentBeat: 0,
  },
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
      project: touchProject({
        ...project,
        melody: sortNotes(notes),
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

      return {
        project: touchProject({
          ...project,
          melody: sortNotes(melody),
        }),
      }
    }),
  loadProject: (project) =>
    set({
      project: touchProject(project),
      playback: {
        status: 'stopped',
        currentBeat: 0,
      },
    }),
  loadDemoProject: () =>
    set({
      project: createDemoProject(),
      playback: {
        status: 'stopped',
        currentBeat: 0,
      },
    }),
  createNewProject: () =>
    set({
      project: createEmptyProject(),
      playback: {
        status: 'stopped',
        currentBeat: 0,
      },
    }),
  setPlaybackStatus: (status, currentBeat = 0) =>
    set({
      playback: {
        status,
        currentBeat,
      },
    }),
}))

function touchProject(project: MusicProject): MusicProject {
  return {
    ...project,
    updatedAt: new Date().toISOString(),
  }
}

function sortNotes(notes: NoteEvent[]): NoteEvent[] {
  return [...notes].sort((left, right) => left.startBeat - right.startBeat || left.midi - right.midi)
}
