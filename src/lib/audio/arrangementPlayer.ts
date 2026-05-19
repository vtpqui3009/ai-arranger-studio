import * as Tone from 'tone'
import type { DrumVoice, InstrumentType, MusicProject } from '../../features/arranger/types/music'
import type { MixerState } from '../../features/mixer/types/mixer'
import { effectiveGain } from '../../features/mixer/types/mixer'
import {
  BEATS_PER_BAR,
  PROJECT_BEATS,
  chordSymbolToVoicedMidiNotes,
  midiToPitch,
} from '../../features/arranger/utils/musicTheory'
import { stopPreview } from './clipPreviewPlayer'
import { getAudioBuffer } from './soundGenerator'

const START_DELAY_SECONDS = 0.06
const DEFAULT_LOOP_BEATS = PROJECT_BEATS
const CHORD_STRUM_SECONDS = 0.018

type DrumKit = {
  kick: Tone.MembraneSynth
  snare: Tone.NoiseSynth
  closedHat: Tone.MetalSynth
  openHat: Tone.MetalSynth
}

export class ArrangementPlayer {
  private chordSynth: Tone.PolySynth<Tone.Synth> | null = null
  private melodySynth: Tone.Synth | Tone.FMSynth | Tone.MonoSynth | null = null
  private bassSynth: Tone.MonoSynth | null = null
  private drumKit: DrumKit | null = null
  private melodyInstrument: InstrumentType | null = null
  private scheduledEventIds: number[] = []
  private clipSources: AudioBufferSourceNode[] = []
  private chordGain: Tone.Gain | null = null
  private melodyGain: Tone.Gain | null = null
  private bassGain: Tone.Gain | null = null
  private drumGain: Tone.Gain | null = null

  async play(project: MusicProject, onEnded: () => void): Promise<void> {
    stopPreview()
    await Tone.start()
    this.stop()
    this.ensureSynths(project.instrument)
    this.applyMixer(project.mixer)

    const transport = Tone.getTransport()
    transport.bpm.value = project.tempo

    this.scheduleChords(project)
    this.scheduleMelody(project)
    this.scheduleBass(project)
    this.scheduleDrums(project)
    this.scheduledEventIds.push(
      transport.scheduleOnce(
        () => {
          this.stop()
          onEnded()
        },
        beatToTransportTime(getProjectEndBeat(project)),
      ),
    )

    await this.scheduleClips(project, START_DELAY_SECONDS)
    transport.start(`+${START_DELAY_SECONDS}`)
  }

  stop(): void {
    this.clipSources.forEach((source) => {
      try {
        source.stop()
      } catch {
        // Source may already have ended.
      }
    })
    this.clipSources = []

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
    this.bassSynth?.dispose()
    this.drumKit?.kick.dispose()
    this.drumKit?.snare.dispose()
    this.drumKit?.closedHat.dispose()
    this.drumKit?.openHat.dispose()
    this.chordGain?.dispose()
    this.melodyGain?.dispose()
    this.bassGain?.dispose()
    this.drumGain?.dispose()
    this.chordSynth = null
    this.melodySynth = null
    this.bassSynth = null
    this.drumKit = null
    this.melodyInstrument = null
    this.chordGain = null
    this.melodyGain = null
    this.bassGain = null
    this.drumGain = null
    this.clipSources = []
  }

  private ensureSynths(instrument: InstrumentType): void {
    if (!this.chordGain) {
      this.chordGain = new Tone.Gain(1).toDestination()
    }
    if (!this.melodyGain) {
      this.melodyGain = new Tone.Gain(1).toDestination()
    }
    if (!this.bassGain) {
      this.bassGain = new Tone.Gain(1).toDestination()
    }
    if (!this.drumGain) {
      this.drumGain = new Tone.Gain(1).toDestination()
    }

    if (!this.chordSynth) {
      this.chordSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.035, decay: 0.22, sustain: 0.5, release: 1.35 },
      }).connect(this.chordGain)
      this.chordSynth.volume.value = -14
    }

    if (!this.melodySynth || this.melodyInstrument !== instrument) {
      this.melodySynth?.dispose()
      this.melodySynth = createMelodySynth(instrument, this.melodyGain)
      this.melodyInstrument = instrument
    }

    if (!this.bassSynth) {
      this.bassSynth = new Tone.MonoSynth({
        oscillator: { type: 'square' },
        filter: { Q: 1.4, type: 'lowpass', rolloff: -24 },
        envelope: { attack: 0.01, decay: 0.18, sustain: 0.58, release: 0.28 },
        filterEnvelope: {
          attack: 0.01,
          decay: 0.12,
          sustain: 0.36,
          release: 0.2,
          baseFrequency: 90,
          octaves: 2.6,
        },
      }).connect(this.bassGain)
      this.bassSynth.volume.value = -10
    }

    if (!this.drumKit) {
      this.drumKit = createDrumKit(this.drumGain)
    }
  }

  private applyMixer(mixer: MixerState): void {
    if (this.chordGain) this.chordGain.gain.value = effectiveGain(mixer, 'chords')
    if (this.melodyGain) this.melodyGain.gain.value = effectiveGain(mixer, 'melody')
    if (this.bassGain) this.bassGain.gain.value = effectiveGain(mixer, 'bass')
    if (this.drumGain) this.drumGain.gain.value = effectiveGain(mixer, 'drums')
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

  private scheduleBass(project: MusicProject): void {
    if (project.bass.length === 0) return
    const transport = Tone.getTransport()
    project.bass.forEach((note) => {
      if (!this.bassSynth) return
      const durationSeconds = beatsToSeconds(note.durationBeats, project.tempo) * 0.88
      const eventId = transport.schedule((time) => {
        this.bassSynth?.triggerAttackRelease(note.pitch, durationSeconds, time, note.velocity)
      }, beatToTransportTime(note.startBeat))
      this.scheduledEventIds.push(eventId)
    })
  }

  private scheduleDrums(project: MusicProject): void {
    if (project.drums.length === 0) return
    const transport = Tone.getTransport()
    project.drums.forEach((event) => {
      if (!this.drumKit) return
      const eventId = transport.schedule((time) => {
        triggerDrumVoice(this.drumKit!, event.voice, time, event.velocity)
      }, beatToTransportTime(event.startBeat))
      this.scheduledEventIds.push(eventId)
    })
  }

  private async scheduleClips(project: MusicProject, startOffset: number): Promise<void> {
    if (project.clips.length === 0) return

    const ctx = Tone.getContext().rawContext as AudioContext
    const masterGain = effectiveGain(project.mixer, 'clips')

    for (const event of project.clips) {
      if (event.muted) continue
      try {
        const buffer = await getAudioBuffer(event.clipId)
        const gainNode = ctx.createGain()
        gainNode.gain.value = event.gain * masterGain
        gainNode.connect(ctx.destination)

        const source = ctx.createBufferSource()
        source.buffer = buffer
        source.connect(gainNode)
        const startTime = ctx.currentTime + startOffset + beatsToSeconds(event.startBeat, project.tempo)
        source.start(startTime)
        this.clipSources.push(source)
      } catch {
        // A bad clip should never block arrangement playback.
      }
    }
  }
}

function createMelodySynth(instrument: InstrumentType, output: Tone.Gain): Tone.Synth | Tone.FMSynth | Tone.MonoSynth {
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
    }).connect(output)
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
    }).connect(output)
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
    }).connect(output)
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
  }).connect(output)
  synth.volume.value = -8
  return synth
}

function createDrumKit(output: Tone.Gain): DrumKit {
  const kick = new Tone.MembraneSynth({
    pitchDecay: 0.055,
    octaves: 6,
    envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 },
  }).connect(output)
  kick.volume.value = -6

  const snare = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.05 },
  }).connect(output)
  snare.volume.value = -10

  const closedHat = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.01 },
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 4000,
    octaves: 1.5,
  }).connect(output)
  closedHat.frequency.value = 400
  closedHat.volume.value = -18

  const openHat = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 0.22, sustain: 0, release: 0.08 },
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 4000,
    octaves: 1.5,
  }).connect(output)
  openHat.frequency.value = 400
  openHat.volume.value = -20

  return { kick, snare, closedHat, openHat }
}

function triggerDrumVoice(kit: DrumKit, voice: DrumVoice, time: number, velocity: number): void {
  if (voice === 'kick') {
    kit.kick.triggerAttackRelease('C1', '8n', time, velocity)
  } else if (voice === 'snare') {
    kit.snare.triggerAttackRelease('8n', time, velocity)
  } else if (voice === 'closedHat') {
    kit.closedHat.triggerAttackRelease('32n', time, velocity)
  } else if (voice === 'openHat') {
    kit.openHat.triggerAttackRelease('8n', time, velocity)
  }
}

function getProjectEndBeat(project: MusicProject): number {
  const endOf = (events: ReadonlyArray<{ startBeat: number; durationBeats: number }>) =>
    events.reduce((max, e) => Math.max(max, e.startBeat + e.durationBeats), DEFAULT_LOOP_BEATS)

  return Math.max(endOf(project.chords), endOf(project.melody), endOf(project.bass), endOf(project.drums))
}

/**
 * Converts a beat position (quarter-note units) to Tone.js transport time string
 * in "bars:beats:sixteenths" format (all zero-indexed).
 *
 * Uses 192 PPQ (subdivisions per quarter note) as the intermediate unit so that
 * common sub-beat values — eighth notes (0.5), sixteenth notes (0.25), triplets
 * (0.333…), and thirty-second notes (0.125) — are all represented exactly before
 * converting back to bars:beats:sixteenths ticks.
 */
function beatToTransportTime(beat: number): string {
  const PPQ = 192
  const totalTicks = Math.round(beat * PPQ)

  const ticksPerSixteenth = PPQ / 4
  const ticksPerBeat = PPQ
  const ticksPerBar = PPQ * BEATS_PER_BAR

  const bars = Math.floor(totalTicks / ticksPerBar)
  const remainAfterBars = totalTicks % ticksPerBar
  const beats = Math.floor(remainAfterBars / ticksPerBeat)
  const sixteenths = Math.floor((remainAfterBars % ticksPerBeat) / ticksPerSixteenth)

  return `${bars}:${beats}:${sixteenths}`
}

function beatsToSeconds(beats: number, tempo: number): number {
  return (60 / tempo) * beats
}

// ---------------------------------------------------------------------------
// Module-level singleton — components should use these functions instead of
// instantiating ArrangementPlayer directly.
// ---------------------------------------------------------------------------

const _player = new ArrangementPlayer()

export type PlaybackCallbacks = {
  onEnded: () => void
}

export async function playProject(project: MusicProject, callbacks: PlaybackCallbacks): Promise<void> {
  return _player.play(project, callbacks.onEnded)
}

export function stopPlayback(): void {
  _player.stop()
}

export function disposePlayback(): void {
  _player.dispose()
}
