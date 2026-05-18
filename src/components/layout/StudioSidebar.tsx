import { Download, FilePlus2, FolderOpen, Save, Sparkles, Trash2, Upload } from 'lucide-react'
import { type ChangeEvent, useRef } from 'react'
import type { ArrangementStyle, InstrumentType, MusicProject, ScaleType } from '../../features/arranger/types/music'
import { ARRANGEMENT_STYLES, INSTRUMENT_TYPES, SCALE_TYPES } from '../../features/arranger/types/music'
import { useArrangerStore } from '../../features/arranger/store/arrangerStore'
import { KEYS, MAX_TEMPO, MIN_TEMPO } from '../../features/arranger/utils/musicTheory'
import {
  clearProject,
  loadProject as loadProjectFromStorage,
  parseProjectJson,
  saveProject,
} from '../../lib/storage/projectStorage'
import { Button } from '../ui/Button'
import { SelectField } from '../ui/SelectField'
import { TextField } from '../ui/TextField'

const keyOptions = KEYS.map((key) => ({ value: key, label: key }))
const scaleOptions = SCALE_TYPES.map((scale) => ({ value: scale, label: scale }))
const styleOptions = ARRANGEMENT_STYLES.map((style) => ({
  value: style,
  label: style === 'rnb' ? 'R&B' : style.charAt(0).toUpperCase() + style.slice(1),
}))
const instrumentOptions = INSTRUMENT_TYPES.map((instrument) => ({
  value: instrument,
  label: instrument === 'piano' ? 'Piano-like synth' : instrument.charAt(0).toUpperCase() + instrument.slice(1),
}))

type StudioSidebarProps = {
  statusMessage: string
  setStatusMessage: (message: string) => void
}

export function StudioSidebar({ statusMessage, setStatusMessage }: StudioSidebarProps) {
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const project = useArrangerStore((state) => state.project)
  const updateProjectMetadata = useArrangerStore((state) => state.updateProjectMetadata)
  const loadProject = useArrangerStore((state) => state.loadProject)
  const loadDemoProject = useArrangerStore((state) => state.loadDemoProject)
  const createNewProject = useArrangerStore((state) => state.createNewProject)

  const handleSaveProject = () => {
    try {
      saveProject(project)
      setStatusMessage('Project saved locally.')
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Unable to save project.')
    }
  }

  const handleLoadProject = () => {
    try {
      const savedProject = loadProjectFromStorage()
      if (!savedProject) {
        setStatusMessage('No local project has been saved yet.')
        return
      }

      loadProject(savedProject)
      setStatusMessage('Saved project loaded.')
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Unable to load saved project.')
    }
  }

  const handleLoadDemo = () => {
    loadDemoProject()
    setStatusMessage('Demo arrangement loaded.')
  }

  const handleNewProject = () => {
    createNewProject()
    setStatusMessage('New arrangement created.')
  }

  const handleClearSavedProject = () => {
    try {
      clearProject()
      setStatusMessage('Local save cleared.')
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Unable to clear local save.')
    }
  }

  const handleImportProject = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    try {
      const importedProject = parseProjectJson(await file.text())
      loadProject(importedProject)
      setStatusMessage(`Imported ${importedProject.title}.`)
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Unable to import project JSON.')
    }
  }

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-studio-line bg-studio-panel/95 p-4 lg:h-screen lg:w-80 lg:overflow-y-auto lg:border-b-0 lg:border-r">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-studio-teal">Project</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">AI Arranger Studio</h1>
      </div>

      <div className="mt-6 grid gap-4">
        <TextField
          id="project-title"
          label="Project title"
          value={project.title}
          onChange={(event) => updateProjectMetadata({ title: event.target.value })}
        />

        <div className="grid grid-cols-2 gap-3">
          <SelectField
            id="project-key"
            label="Key"
            value={project.key}
            options={keyOptions}
            onChange={(value) => updateProjectMetadata({ key: value })}
          />
          <SelectField
            id="project-scale"
            label="Scale"
            value={project.scale}
            options={scaleOptions}
            onChange={(value) => updateProjectMetadata({ scale: toScaleType(value) })}
          />
        </div>

        <SelectField
          id="project-style"
          label="Style"
          value={project.style}
          options={styleOptions}
          onChange={(value) => updateProjectMetadata({ style: toArrangementStyle(value) })}
        />

        <SelectField
          id="project-instrument"
          label="Instrument"
          value={project.instrument}
          options={instrumentOptions}
          onChange={(value) => updateProjectMetadata({ instrument: toInstrumentType(value) })}
        />

        <div className="grid gap-2 text-sm text-slate-300">
          <div className="flex items-center justify-between">
            <label className="font-medium" htmlFor="project-tempo">
              Tempo
            </label>
            <span className="rounded-md bg-slate-950/70 px-2 py-1 text-xs text-studio-amber">{project.tempo} BPM</span>
          </div>
          <input
            id="project-tempo"
            type="number"
            min={MIN_TEMPO}
            max={MAX_TEMPO}
            value={project.tempo}
            onChange={(event) => updateProjectMetadata({ tempo: Number(event.target.value) })}
            className="min-h-10 rounded-lg border border-studio-line bg-slate-950/70 px-3 text-slate-50 outline-none transition focus:border-studio-teal focus:ring-2 focus:ring-studio-teal/20"
          />
          <input
            type="range"
            min={MIN_TEMPO}
            max={MAX_TEMPO}
            value={project.tempo}
            onChange={(event) => updateProjectMetadata({ tempo: Number(event.target.value) })}
            aria-label="Tempo slider"
            className="accent-studio-teal"
          />
        </div>
      </div>

      <input
        ref={importInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleImportProject}
        aria-label="Import project JSON file"
      />

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button variant="primary" size="sm" icon={<Save size={16} aria-hidden="true" />} onClick={handleSaveProject}>
          Save
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon={<FolderOpen size={16} aria-hidden="true" />}
          onClick={handleLoadProject}
        >
          Load
        </Button>
        <Button variant="secondary" size="sm" icon={<Sparkles size={16} aria-hidden="true" />} onClick={handleLoadDemo}>
          Demo
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon={<FilePlus2 size={16} aria-hidden="true" />}
          onClick={handleNewProject}
        >
          New
        </Button>
        <Button
          className="col-span-2"
          variant="secondary"
          size="sm"
          icon={<Download size={16} aria-hidden="true" />}
          onClick={() => exportProjectJson(project, setStatusMessage)}
        >
          Export JSON
        </Button>
        <Button
          className="col-span-2"
          variant="secondary"
          size="sm"
          icon={<Upload size={16} aria-hidden="true" />}
          onClick={() => importInputRef.current?.click()}
        >
          Import JSON
        </Button>
        <Button
          className="col-span-2"
          variant="danger"
          size="sm"
          icon={<Trash2 size={16} aria-hidden="true" />}
          onClick={handleClearSavedProject}
        >
          Clear local save
        </Button>
      </div>

      <div
        className="mt-6 rounded-lg border border-studio-line bg-slate-950/50 p-3 text-sm text-slate-300"
        role="status"
      >
        {statusMessage}
      </div>
      <p className="mt-auto pt-6 text-xs leading-5 text-slate-500">
        Updated {new Date(project.updatedAt).toLocaleString()}
      </p>
    </aside>
  )
}

function toScaleType(value: string): ScaleType {
  return value === 'minor' ? 'minor' : 'major'
}

function toArrangementStyle(value: string): ArrangementStyle {
  return ARRANGEMENT_STYLES.find((style) => style === value) ?? 'pop'
}

function toInstrumentType(value: string): InstrumentType {
  return INSTRUMENT_TYPES.find((instrument) => instrument === value) ?? 'synth'
}

function exportProjectJson(project: MusicProject, setStatusMessage: (message: string) => void): void {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const slug =
    project.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'arrangement'

  anchor.href = url
  anchor.download = `${slug}.json`
  anchor.click()
  URL.revokeObjectURL(url)
  setStatusMessage('Project JSON exported.')
}
