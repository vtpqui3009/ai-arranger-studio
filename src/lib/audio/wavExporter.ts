import * as Tone from 'tone'
import type { DrumVoice, InstrumentType, MusicProject } from '../../features/arranger/types/music'
import {
  BEATS_PER_BAR,
  PROJECT_BEATS,
  chordSymbolToVoicedMidiNotes,
  midiToPitch,
} from '../../features/arranger/utils/musicTheory'
import { effectiveGain } from '../../features/mixer/types/mixer'
import { getAudioBuffer } from './soundGenerator'

const CHORD_STRUM_SECONDS = 0.018

/**
 * Render the full arrangement (chords, melody, bass, drums, clips) to a WAV file
 * using Tone.Offline. Triggers a browser download. All audio is synthesised; the
 * resulting file inherits the mock/demo nature of the source content.
 */
export async function exportArrangementToWav(project: MusicProject): Promise<void> {
  const endBeat = getProjectEndBeat(project)
  const durationSeconds = beatsToSeconds(endBeat + 1, project.tempo)

  const renderedBuffer = await Tone.Offline(async ({ transport }) => {
    transport.bpm.value = project.tempo

    const chordGain = new Tone.Gain(effectiveGain(project.mixer, 'chords')).toDestination()
    const melodyGain = new Tone.Gain(effectiveGain(project.mixer, 'melody')).toDestination()
    const bassGain = new Tone.Gain(effectiveGain(project.mixer, 'bass')).toDestination()
    const drumGain = new Tone.Gain(effectiveGain(project.mixer, 'drums')).toDestination()
    const clipGain = new Tone.Gain(effectiveGain(project.mixer, 'clips')).toDestination()

    const chordSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.035, decay: 0.22, sustain: 0.5, release: 1.35 },
    }).connect(chordGain)
    chordSynth.volume.value = -14

    const melodySynth = createMelodySynth(project.instrument, melodyGain)
    const bassSynth = new Tone.MonoSynth({
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
    }).connect(bassGain)
    bassSynth.volume.value = -10

    const drumKit = createDrumKit(drumGain)

    for (const chord of project.chords) {
      const midiNotes = chordSymbolToVoicedMidiNotes(chord.symbol)
      if (midiNotes.length === 0) continue
      const notes = midiNotes.map(midiToPitch)
      const dur = beatsToSeconds(chord.durationBeats, project.tempo) * 0.92
      transport.schedule((time) => {
        notes.forEach((n, i) => chordSynth.triggerAttackRelease(n, dur, time + i * CHORD_STRUM_SECONDS, 0.5))
      }, beatToTransportTime(chord.startBeat))
    }

    for (const note of project.melody) {
      const dur = beatsToSeconds(note.durationBeats, project.tempo) * 0.86
      transport.schedule((time) => {
        melodySynth.triggerAttackRelease(note.pitch, dur, time, note.velocity)
      }, beatToTransportTime(note.startBeat))
    }

    for (const note of project.bass) {
      const dur = beatsToSeconds(note.durationBeats, project.tempo) * 0.88
      transport.schedule((time) => {
        bassSynth.triggerAttackRelease(note.pitch, dur, time, note.velocity)
      }, beatToTransportTime(note.startBeat))
    }

    for (const event of project.drums) {
      transport.schedule(
        (time) => triggerDrumVoice(drumKit, event.voice, time, event.velocity),
        beatToTransportTime(event.startBeat),
      )
    }

    // Mix any audio clips into the offline render by decoding their AudioBuffers
    // and scheduling them via a Tone.ToneAudioBuffer + Player.
    for (const event of project.clips) {
      if (event.muted) continue
      try {
        const nativeBuffer = await getAudioBuffer(event.clipId)
        const toneBuffer = new Tone.ToneAudioBuffer(nativeBuffer)
        const player = new Tone.Player({ url: toneBuffer }).connect(clipGain)
        player.volume.value = gainToDb(event.gain)
        transport.schedule((time) => player.start(time), beatToTransportTime(event.startBeat))
      } catch {
        // Skip clips that fail to render; do not abort the whole export.
      }
    }

    transport.start(0)
  }, durationSeconds)

  const audioBuffer = renderedBuffer.get()
  if (!audioBuffer) throw new Error('Offline render produced no buffer.')

  downloadBlob(new Blob([encodeWav(audioBuffer)], { type: 'audio/wav' }), filenameFor(project))
}

function createMelodySynth(instrument: InstrumentType, output: Tone.Gain): Tone.Synth | Tone.FMSynth | Tone.MonoSynth {
  if (instrument === 'piano') {
    const s = new Tone.FMSynth({
      harmonicity: 1.35,
      modulationIndex: 8,
      envelope: { attack: 0.004, decay: 0.42, sustain: 0.06, release: 0.45 },
      modulationEnvelope: { attack: 0.005, decay: 0.18, sustain: 0.02, release: 0.25 },
    }).connect(output)
    s.volume.value = -9
    return s
  }
  if (instrument === 'bass') {
    const s = new Tone.MonoSynth({
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
    }).connect(output)
    s.volume.value = -10
    return s
  }
  if (instrument === 'pad') {
    const s = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.28, decay: 0.35, sustain: 0.75, release: 1.2 },
    }).connect(output)
    s.volume.value = -12
    return s
  }
  const s = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.012, decay: 0.12, sustain: 0.35, release: 0.45 },
  }).connect(output)
  s.volume.value = -8
  return s
}

type DrumKit = {
  kick: Tone.MembraneSynth
  snare: Tone.NoiseSynth
  closedHat: Tone.MetalSynth
  openHat: Tone.MetalSynth
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
  if (voice === 'kick') kit.kick.triggerAttackRelease('C1', '8n', time, velocity)
  else if (voice === 'snare') kit.snare.triggerAttackRelease('8n', time, velocity)
  else if (voice === 'closedHat') kit.closedHat.triggerAttackRelease('32n', time, velocity)
  else if (voice === 'openHat') kit.openHat.triggerAttackRelease('8n', time, velocity)
}

function beatToTransportTime(beat: number): string {
  const PPQ = 192
  const totalTicks = Math.round(beat * PPQ)
  const ticksPerSixteenth = PPQ / 4
  const ticksPerBeat = PPQ
  const ticksPerBar = PPQ * BEATS_PER_BAR
  const bars = Math.floor(totalTicks / ticksPerBar)
  const remain = totalTicks % ticksPerBar
  const beats = Math.floor(remain / ticksPerBeat)
  const sixteenths = Math.floor((remain % ticksPerBeat) / ticksPerSixteenth)
  return `${bars}:${beats}:${sixteenths}`
}

function beatsToSeconds(beats: number, tempo: number): number {
  return (60 / tempo) * beats
}

function gainToDb(gain: number): number {
  if (gain <= 0) return -Infinity
  return 20 * Math.log10(gain)
}

function getProjectEndBeat(project: MusicProject): number {
  const endOf = (events: ReadonlyArray<{ startBeat: number; durationBeats: number }>) =>
    events.reduce((max, e) => Math.max(max, e.startBeat + e.durationBeats), PROJECT_BEATS)
  return Math.max(
    endOf(project.chords),
    endOf(project.melody),
    endOf(project.bass),
    endOf(project.drums),
    PROJECT_BEATS,
  )
}

function encodeWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const numFrames = buffer.length
  const bytesPerSample = 2
  const blockAlign = numChannels * bytesPerSample
  const dataSize = numFrames * blockAlign
  const buffSize = 44 + dataSize

  const arrayBuffer = new ArrayBuffer(buffSize)
  const out = new Uint8Array(arrayBuffer)
  const view = new DataView(arrayBuffer)

  let p = 0
  const writeStr = (s: string) => {
    for (const c of s) out[p++] = c.charCodeAt(0)
  }
  const writeU32 = (v: number) => {
    view.setUint32(p, v, true)
    p += 4
  }
  const writeU16 = (v: number) => {
    view.setUint16(p, v, true)
    p += 2
  }

  writeStr('RIFF')
  writeU32(buffSize - 8)
  writeStr('WAVE')
  writeStr('fmt ')
  writeU32(16) // PCM chunk size
  writeU16(1) // PCM format
  writeU16(numChannels)
  writeU32(sampleRate)
  writeU32(sampleRate * blockAlign)
  writeU16(blockAlign)
  writeU16(bytesPerSample * 8)
  writeStr('data')
  writeU32(dataSize)

  const channels: Float32Array[] = []
  for (let c = 0; c < numChannels; c += 1) channels.push(buffer.getChannelData(c))

  for (let i = 0; i < numFrames; i += 1) {
    for (let c = 0; c < numChannels; c += 1) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]))
      view.setInt16(p, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
      p += 2
    }
  }

  return arrayBuffer
}

function filenameFor(project: MusicProject): string {
  const slug =
    project.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'arrangement'
  return `${slug}-demo.wav`
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
