import { Headphones, Volume2, VolumeX } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Panel } from '../../../components/ui/Panel'
import { cn } from '../../../components/ui/cn'
import { useArrangerStore } from '../../arranger/store/arrangerStore'
import { TRACK_TYPES, isTrackAudible, type TrackType } from '../types/mixer'

const TRACK_DISPLAY_NAMES: Record<TrackType, string> = {
  chords: 'Chords',
  melody: 'Melody',
  bass: 'Bass',
  drums: 'Drums',
  clips: 'Clips',
}

export function MixerPanel() {
  const mixer = useArrangerStore((state) => state.project.mixer)
  const updateMixer = useArrangerStore((state) => state.updateMixer)

  return (
    <Panel title="Mixer" eyebrow="Track Levels">
      <div className="grid grid-cols-5 gap-2 p-4">
        {TRACK_TYPES.map((track) => {
          const settings = mixer[track]
          const displayName = TRACK_DISPLAY_NAMES[track]
          const audible = isTrackAudible(mixer, track)

          return (
            <div key={track} className={cn('flex flex-col items-center gap-2', audible ? '' : 'opacity-40')}>
              <span className="text-xs font-medium text-slate-400">{displayName}</span>
              <input
                type="range"
                min={0}
                max={100}
                value={settings.volume}
                onChange={(event) => updateMixer(track, { volume: Number(event.target.value) })}
                className="h-24 w-2 cursor-pointer appearance-none accent-studio-teal [writing-mode:vertical-lr] [direction:rtl]"
                aria-label={`${displayName} volume`}
              />
              <span className="text-xs tabular-nums text-studio-amber">{settings.volume}</span>
              <div className="flex gap-1">
                <Button
                  variant={settings.muted ? 'danger' : 'ghost'}
                  size="icon"
                  aria-label={`${settings.muted ? 'Unmute' : 'Mute'} ${displayName}`}
                  aria-pressed={settings.muted}
                  onClick={() => updateMixer(track, { muted: !settings.muted })}
                >
                  {settings.muted ? <VolumeX size={14} aria-hidden="true" /> : <Volume2 size={14} aria-hidden="true" />}
                </Button>
                <Button
                  variant={settings.solo ? 'primary' : 'ghost'}
                  size="icon"
                  aria-label={`${settings.solo ? 'Unsolo' : 'Solo'} ${displayName}`}
                  aria-pressed={settings.solo}
                  onClick={() => updateMixer(track, { solo: !settings.solo })}
                >
                  <Headphones size={14} aria-hidden="true" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
