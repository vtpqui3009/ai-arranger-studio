import * as Tone from 'tone'
import type { ArrangementStyle, ScaleType } from '../../features/arranger/types/music'
import { BEATS_PER_BAR, getScaleMidiNotes, midiToPitch } from '../../features/arranger/utils/musicTheory'

const SAMPLE_RATE = 44_100

const _cache = new Map<string, Promise<AudioBuffer>>()

const GENERATOR_MAP: Record<string, () => Promise<AudioBuffer>> = {
  'lofi-drum-loop-1': () => generateDrumLoop('lofi', 90, 4),
  'edm-four-on-floor': () => generateDrumLoop('edm', 128, 4),
  'rnb-pocket-groove': () => generateDrumLoop('rnb', 92, 4),
  'cinematic-taiko': () => generateDrumLoop('cinematic', 80, 4),
  'pop-walking-bass': () => generateBassRiff('C', 'pop', 100, 4),
  'lofi-sub-bass': () => generateBassRiff('C', 'lofi', 90, 4),
  'edm-bass-stab': () => generateBassRiff('C', 'edm', 128, 4),
  'cinematic-strings': () => generateAtmospherePad('C', 'major', 80, 4),
  'lofi-crackle-pad': () => generateAtmospherePad('C', 'minor', 90, 4),
  'edm-synth-riser': () => generateAtmospherePad('C', 'major', 128, 4),
  'pop-lead-hook': () => generateMelodyRiff('C', 'major', 'pop', 100, 4),
  'rnb-vocal-chop': () => generateMelodyRiff('C', 'minor', 'rnb', 92, 4),
  'lofi-rhodes-riff': () => generateMelodyRiff('C', 'major', 'lofi', 90, 4),
  'downlifter-sweep': () => generateFxSweep(100, 1),
  'white-noise-hit': () => generateFxSweep(100, 1),
  'transition-riser': () => generateFxSweep(100, 1),
}

export function getAudioBuffer(clipId: string): Promise<AudioBuffer> {
  const cached = _cache.get(clipId)
  if (cached) {
    return cached
  }

  const generator = GENERATOR_MAP[clipId]
  const promise = generator ? generator() : generateSilentBuffer()
  _cache.set(clipId, promise)
  return promise
}

export function prewarmCache(clipIds: string[]): void {
  clipIds.forEach((id) => {
    void getAudioBuffer(id)
  })
}

export function clearAudioCache(): void {
  _cache.clear()
}

export function registerCacheAlias(newId: string, sourceId: string): void {
  const existing = _cache.get(sourceId)
  if (existing) {
    _cache.set(newId, existing)
  }
}

async function generateSilentBuffer(): Promise<AudioBuffer> {
  const offlineCtx = new Tone.OfflineContext(1, 1, SAMPLE_RATE)
  return renderNativeBuffer(offlineCtx)
}

async function generateDrumLoop(style: ArrangementStyle, bpm: number, bars: number): Promise<AudioBuffer> {
  const offlineCtx = createOfflineContext(bpm, bars)
  const kick = new Tone.MembraneSynth({
    context: offlineCtx,
    pitchDecay: 0.055,
    octaves: 6,
    envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 },
  }).toDestination()
  const snare = new Tone.NoiseSynth({
    context: offlineCtx,
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.05 },
  }).toDestination()
  const hat = new Tone.MetalSynth({
    context: offlineCtx,
    envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.01 },
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 4000,
    octaves: 1.5,
  }).toDestination()

  kick.volume.value = -6
  snare.volume.value = -10
  hat.frequency.value = 400
  hat.volume.value = -18

  const kickBeatsByStyle: Record<ArrangementStyle, number[]> = {
    lofi: [0, 3, 6, 8, 11, 14],
    pop: [0, 4, 8, 12],
    edm: [0, 2, 4, 6, 8, 10, 12, 14],
    cinematic: [0, 8, 12],
    rnb: [0, 3, 7, 10, 13],
  }
  const hatStep = style === 'edm' ? 0.5 : 1
  const hatBeats = Array.from({ length: Math.floor((bars * BEATS_PER_BAR) / hatStep) }, (_, index) => index * hatStep)

  scheduleBeats(offlineCtx, kickBeatsByStyle[style], (time) => kick.triggerAttackRelease('C1', '8n', time, 0.85))
  scheduleBeats(offlineCtx, [2, 6, 10, 14], (time) => snare.triggerAttackRelease('8n', time, 0.7))
  scheduleBeats(offlineCtx, hatBeats, (time) => hat.triggerAttackRelease('32n', time, 0.45))

  offlineCtx.transport.start(0)
  const buffer = await renderNativeBuffer(offlineCtx)
  kick.dispose()
  snare.dispose()
  hat.dispose()
  return buffer
}

async function generateBassRiff(key: string, style: ArrangementStyle, bpm: number, bars: number): Promise<AudioBuffer> {
  const offlineCtx = createOfflineContext(bpm, bars)
  const synth = new Tone.MonoSynth({
    context: offlineCtx,
    oscillator: { type: style === 'edm' ? 'square' : 'sawtooth' },
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
  }).toDestination()
  synth.volume.value = -10

  const scaleNotes = getScaleMidiNotes(key, 'major', 2)
  const root = midiToPitch(scaleNotes[0])
  const fifth = midiToPitch(scaleNotes[4] ?? scaleNotes[0] + 7)

  for (let bar = 0; bar < bars; bar += 1) {
    const barBeat = bar * BEATS_PER_BAR
    scheduleBeats(offlineCtx, [barBeat], (time) => synth.triggerAttackRelease(root, beatsToSeconds(1, bpm), time, 0.78))
    scheduleBeats(offlineCtx, [barBeat + 2], (time) =>
      synth.triggerAttackRelease(fifth, beatsToSeconds(1, bpm), time, 0.68),
    )
  }

  offlineCtx.transport.start(0)
  const buffer = await renderNativeBuffer(offlineCtx)
  synth.dispose()
  return buffer
}

async function generateAtmospherePad(key: string, scale: ScaleType, bpm: number, bars: number): Promise<AudioBuffer> {
  const offlineCtx = createOfflineContext(bpm, bars)
  const synth = new Tone.PolySynth({
    context: offlineCtx,
    voice: Tone.Synth,
    options: {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.5, decay: 0.3, sustain: 0.7, release: 3 },
    },
  }).toDestination()
  synth.volume.value = -15

  const notes = getScaleMidiNotes(key, scale, 4).map(midiToPitch)
  for (let beat = 0; beat < bars * BEATS_PER_BAR; beat += BEATS_PER_BAR) {
    scheduleBeats(offlineCtx, [beat], (time) => {
      synth.triggerAttackRelease(notes, beatsToSeconds(BEATS_PER_BAR, bpm) * 0.92, time, 0.4)
    })
  }

  offlineCtx.transport.start(0)
  const buffer = await renderNativeBuffer(offlineCtx)
  synth.dispose()
  return buffer
}

async function generateMelodyRiff(
  key: string,
  scale: ScaleType,
  style: ArrangementStyle,
  bpm: number,
  bars: number,
): Promise<AudioBuffer> {
  const offlineCtx = createOfflineContext(bpm, bars)
  const synth = new Tone.Synth({
    context: offlineCtx,
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.012, decay: 0.12, sustain: 0.35, release: 0.45 },
  }).toDestination()
  synth.volume.value = -8

  const offsetsByStyle: Partial<Record<ArrangementStyle, number[]>> = {
    edm: [0, 0.5, 1.5, 3],
    cinematic: [0, 2, 3],
    rnb: [0, 1, 2.5, 3.5],
  }
  const offsets = offsetsByStyle[style] ?? [0, 1.5, 2, 3.5]
  const scalePool = [...getScaleMidiNotes(key, scale, 4), ...getScaleMidiNotes(key, scale, 5)].map(midiToPitch)

  for (let bar = 0; bar < bars; bar += 1) {
    offsets.forEach((offset, stepIndex) => {
      const note = scalePool[(bar + stepIndex) % scalePool.length]
      scheduleBeats(offlineCtx, [bar * BEATS_PER_BAR + offset], (time) =>
        synth.triggerAttackRelease(note, beatsToSeconds(0.5, bpm), time, 0.72),
      )
    })
  }

  offlineCtx.transport.start(0)
  const buffer = await renderNativeBuffer(offlineCtx)
  synth.dispose()
  return buffer
}

async function generateFxSweep(bpm: number, bars: number): Promise<AudioBuffer> {
  const offlineCtx = createOfflineContext(bpm, bars)
  const duration = bars * BEATS_PER_BAR * (60 / bpm)
  const synth = new Tone.NoiseSynth({
    context: offlineCtx,
    noise: { type: 'pink' },
    envelope: { attack: duration * 0.8, decay: duration * 0.2, sustain: 0, release: 0.01 },
  }).toDestination()
  synth.volume.value = -16

  offlineCtx.transport.schedule((time) => synth.triggerAttackRelease(duration, time), 0)
  offlineCtx.transport.start(0)
  const buffer = await renderNativeBuffer(offlineCtx)
  synth.dispose()
  return buffer
}

function createOfflineContext(bpm: number, bars: number): Tone.OfflineContext {
  const duration = (bars * BEATS_PER_BAR * 60) / bpm
  const offlineCtx = new Tone.OfflineContext(2, duration, SAMPLE_RATE)
  offlineCtx.transport.bpm.value = bpm
  return offlineCtx
}

function scheduleBeats(context: Tone.OfflineContext, beats: number[], callback: (time: number) => void): void {
  beats.forEach((beat) => {
    context.transport.schedule((time) => callback(time), beatToTransportTime(beat))
  })
}

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

async function renderNativeBuffer(context: Tone.OfflineContext): Promise<AudioBuffer> {
  const rendered = await context.render()
  const buffer = rendered.get()
  if (!buffer) {
    throw new Error('Tone offline rendering did not produce an audio buffer.')
  }
  return buffer
}
