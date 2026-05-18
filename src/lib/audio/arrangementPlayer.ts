import * as Tone from 'tone'
import type { InstrumentType, MusicProject } from '../../features/arranger/types/music'
import {
  BEATS_PER_BAR,
  PROJECT_BEATS,
  chordSymbolToVoicedMidiNotes,
  midiToPitch,
} from '../../features/arranger/utils/musicTheory'

const START_DELAY_SECONDS = 0.06
const DEFAULT_LOOP_BEATS = PROJECT_BEATS
const CHORD_STRUM_SECONDS = 0.018

export class ArrangementPlayer {
  private chordSynth: Tone.PolySynth<Tone.Synth> | null = null
  private melodySynth: Tone.Synth | Tone.FMSynth | Tone.MonoSynth | null = null
  private melodyInstrument: InstrumentType | null = null
  private scheduledEventIds: number[] = []

  async play(project: MusicProject, onEnded: () => void): Promise<void> {
    await Tone.start()
    this.stop()
    this.ensureSynths(project.instrument)

    const transport = Tone.getTransport()
    transport.bpm.value = project.tempo

    this.scheduleChords(project)
    this.scheduleMelody(project)
    this.scheduledEventIds.push(
      transport.scheduleOnce(
        () => {
          this.stop()
          onEnded()
        },
        beatToTransportTime(getProjectEndBeat(project)),
      ),
    )

    transport.start(`+${START_DELAY_SECONDS}`)
  }

  stop(): void {
    const transport = Tone.getTransport()
    transport.stop()
    transport.position = 0
    this.scheduledEventIds.forEach((eventId) => transport.clear(eventId))
    this.scheduledEventIds = []
  }

  dispose(): void {
    this.stop()
    this.chordSynth?.dispose()
    this.melodySynth?.dispose()
    this.chordSynth = null
    this.melodySynth = null
    this.melodyInstrument = null
  }

  private ensureSynths(instrument: InstrumentType): void {
    if (!this.chordSynth) {
      this.chordSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: 'triangle',
        },
        envelope: {
          attack: 0.035,
          decay: 0.22,
          sustain: 0.5,
          release: 1.35,
        },
      }).toDestination()
      this.chordSynth.volume.value = -14
    }

    if (!this.melodySynth || this.melodyInstrument !== instrument) {
      this.melodySynth?.dispose()
      this.melodySynth = createMelodySynth(instrument)
      this.melodyInstrument = instrument
    }
  }

  private scheduleChords(project: MusicProject): void {
    const transport = Tone.getTransport()
    project.chords.forEach((chord) => {
      const midiNotes = chordSymbolToVoicedMidiNotes(chord.symbol)
      if (midiNotes.length === 0 || !this.chordSynth) {
        return
      }

      const notes = midiNotes.map(midiToPitch)
      const durationSeconds = beatsToSeconds(chord.durationBeats, project.tempo) * 0.92
      const eventId = transport.schedule((time) => {
        notes.forEach((note, index) => {
          this.chordSynth?.triggerAttackRelease(note, durationSeconds, time + index * CHORD_STRUM_SECONDS, 0.5)
        })
      }, beatToTransportTime(chord.startBeat))

      this.scheduledEventIds.push(eventId)
    })
  }

  private scheduleMelody(project: MusicProject): void {
    const transport = Tone.getTransport()
    project.melody.forEach((note) => {
      if (!this.melodySynth) {
        return
      }

      const durationSeconds = beatsToSeconds(note.durationBeats, project.tempo) * 0.86
      const eventId = transport.schedule((time) => {
        this.melodySynth?.triggerAttackRelease(note.pitch, durationSeconds, time, note.velocity)
      }, beatToTransportTime(note.startBeat))

      this.scheduledEventIds.push(eventId)
    })
  }
}

function createMelodySynth(instrument: InstrumentType): Tone.Synth | Tone.FMSynth | Tone.MonoSynth {
  if (instrument === 'piano') {
    const synth = new Tone.FMSynth({
      harmonicity: 1.35,
      modulationIndex: 8,
      envelope: {
        attack: 0.004,
        decay: 0.42,
        sustain: 0.06,
        release: 0.45,
      },
      modulationEnvelope: {
        attack: 0.005,
        decay: 0.18,
        sustain: 0.02,
        release: 0.25,
      },
    }).toDestination()
    synth.volume.value = -9
    return synth
  }

  if (instrument === 'bass') {
    const synth = new Tone.MonoSynth({
      oscillator: {
        type: 'square',
      },
      filter: {
        Q: 1.4,
        type: 'lowpass',
        rolloff: -24,
      },
      envelope: {
        attack: 0.01,
        decay: 0.18,
        sustain: 0.58,
        release: 0.28,
      },
      filterEnvelope: {
        attack: 0.01,
        decay: 0.12,
        sustain: 0.36,
        release: 0.2,
        baseFrequency: 90,
        octaves: 2.6,
      },
    }).toDestination()
    synth.volume.value = -10
    return synth
  }

  if (instrument === 'pad') {
    const synth = new Tone.Synth({
      oscillator: {
        type: 'sine',
      },
      envelope: {
        attack: 0.28,
        decay: 0.35,
        sustain: 0.75,
        release: 1.2,
      },
    }).toDestination()
    synth.volume.value = -12
    return synth
  }

  const synth = new Tone.Synth({
    oscillator: {
      type: 'triangle',
    },
    envelope: {
      attack: 0.012,
      decay: 0.12,
      sustain: 0.35,
      release: 0.45,
    },
  }).toDestination()
  synth.volume.value = -8
  return synth
}

function getProjectEndBeat(project: MusicProject): number {
  const chordEnd = project.chords.reduce(
    (maxBeat, chord) => Math.max(maxBeat, chord.startBeat + chord.durationBeats),
    DEFAULT_LOOP_BEATS,
  )
  const melodyEnd = project.melody.reduce(
    (maxBeat, note) => Math.max(maxBeat, note.startBeat + note.durationBeats),
    DEFAULT_LOOP_BEATS,
  )

  return Math.max(chordEnd, melodyEnd)
}

function beatToTransportTime(beat: number): string {
  const bars = Math.floor(beat / BEATS_PER_BAR)
  const beatWithinBar = Math.floor(beat % BEATS_PER_BAR)
  const sixteenths = Math.round((beat - Math.floor(beat)) * 4)

  return `${bars}:${beatWithinBar}:${sixteenths}`
}

function beatsToSeconds(beats: number, tempo: number): number {
  return (60 / tempo) * beats
}
