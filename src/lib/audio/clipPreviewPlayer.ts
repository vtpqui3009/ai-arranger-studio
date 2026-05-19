import * as Tone from 'tone'
import { getAudioBuffer } from './soundGenerator'

let _source: AudioBufferSourceNode | null = null

export async function previewClip(clipId: string, onEnded: () => void): Promise<void> {
  stopPreview()

  const buffer = await getAudioBuffer(clipId)
  const ctx = Tone.getContext().rawContext as AudioContext
  await ctx.resume()

  _source = ctx.createBufferSource()
  _source.buffer = buffer
  _source.connect(ctx.destination)
  _source.onended = () => {
    _source = null
    onEnded()
  }
  _source.start(ctx.currentTime + 0.01)
}

export function stopPreview(): void {
  try {
    _source?.stop()
  } catch {
    // Source may already have ended.
  }
  _source = null
}
