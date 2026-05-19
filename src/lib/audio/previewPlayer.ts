import type { SoundAsset, SoundPreviewTone } from '../../features/soundLibrary/types/soundAsset'

const previewCache = new Map<string, Promise<AudioBuffer>>()

let audioContext: AudioContext | null = null
let activeSource: AudioBufferSourceNode | null = null
let activeGain: GainNode | null = null

export async function playPreview(asset: SoundAsset): Promise<void> {
  stopPreview()

  const context = getAudioContext()
  if (context.state === 'suspended') {
    await context.resume()
  }
  const buffer = await getPreviewBuffer(asset)
  const source = context.createBufferSource()
  const gain = context.createGain()

  source.buffer = buffer
  gain.gain.value = 0.65
  source.connect(gain).connect(context.destination)
  source.start()
  activeSource = source
  activeGain = gain

  source.onended = () => {
    if (activeSource === source) {
      activeSource = null
      activeGain = null
    }
  }
}

export function stopPreview(): void {
  activeSource?.stop()
  activeSource?.disconnect()
  activeGain?.disconnect()
  activeSource = null
  activeGain = null
}

export function prewarmPreviewCache(assets: SoundAsset[]): void {
  assets.forEach((asset) => {
    void getPreviewBuffer(asset)
  })
}

async function getPreviewBuffer(asset: SoundAsset): Promise<AudioBuffer> {
  const cachedBuffer = previewCache.get(asset.id)
  if (cachedBuffer) {
    return cachedBuffer
  }

  const bufferPromise = Promise.resolve(renderPreviewBuffer(asset))
  previewCache.set(asset.id, bufferPromise)
  return bufferPromise
}

function getAudioContext(): AudioContext {
  audioContext ??= new AudioContext()
  return audioContext
}

function renderPreviewBuffer(asset: SoundAsset): AudioBuffer {
  const sampleRate = 44_100
  const secondsPerBeat = 60 / asset.referenceBpm
  const durationSeconds = Math.max(1, asset.durationBeats * secondsPerBeat)
  const frameCount = Math.ceil(durationSeconds * sampleRate)
  const context = getAudioContext()
  const buffer = context.createBuffer(1, frameCount, sampleRate)
  const channel = buffer.getChannelData(0)
  const baseFrequency = frequencyForAsset(asset)

  for (let frame = 0; frame < frameCount; frame += 1) {
    const time = frame / sampleRate
    const beat = time / secondsPerBeat
    channel[frame] = sampleForTone(asset.preview.tone, time, beat, asset.preview.accentBeats, baseFrequency)
  }

  fadeEdges(channel, sampleRate)
  return buffer
}

function sampleForTone(
  tone: SoundPreviewTone,
  time: number,
  beat: number,
  accentBeats: number[],
  baseFrequency: number,
): number {
  if (tone === 'drums') {
    return accentBeats.reduce((sum, accent) => sum + decayingSine(beat - accent, 0.14, baseFrequency * 0.5), 0)
  }

  if (tone === 'bass') {
    return accentBeats.reduce((sum, accent) => sum + decayingSine(beat - accent, 0.45, baseFrequency), 0)
  }

  if (tone === 'melody') {
    return accentBeats.reduce((sum, accent, index) => {
      const frequency = baseFrequency * (1 + (index % 5) * 0.125)
      return sum + decayingSine(beat - accent, 0.32, frequency)
    }, 0)
  }

  if (tone === 'soft-pad') {
    return (
      Math.sin(time * baseFrequency * Math.PI * 2) * 0.18 + Math.sin(time * baseFrequency * 1.5 * Math.PI * 2) * 0.1
    )
  }

  return accentBeats.reduce((sum, accent) => {
    const distance = beat - accent
    if (distance < 0 || distance > 0.18) return sum
    return sum + (Math.random() * 2 - 1) * (1 - distance / 0.18) * 0.18
  }, 0)
}

function decayingSine(beatDistance: number, beatDecay: number, frequency: number): number {
  if (beatDistance < 0 || beatDistance > beatDecay) return 0

  const envelope = 1 - beatDistance / beatDecay
  return Math.sin(beatDistance * frequency * 0.18) * envelope * 0.35
}

function frequencyForAsset(asset: SoundAsset): number {
  if (asset.category === 'bass') return 82.41
  if (asset.category === 'melody') return 440
  if (asset.category === 'atmosphere') return 174.61
  if (asset.category === 'drums') return 110
  return 320
}

function fadeEdges(channel: Float32Array, sampleRate: number): void {
  const fadeFrames = Math.min(channel.length, Math.floor(sampleRate * 0.02))
  for (let frame = 0; frame < fadeFrames; frame += 1) {
    const gain = frame / fadeFrames
    channel[frame] *= gain
    channel[channel.length - 1 - frame] *= gain
  }
}
