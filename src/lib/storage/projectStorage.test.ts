import { describe, it, expect, beforeEach } from 'vitest'
import { saveProject, loadProject, clearProject, parseProjectJson } from './projectStorage'
import { createDemoProject, createEmptyProject } from '../../features/arranger/utils/projectFactory'

const STORAGE_KEY = 'ai-arranger-studio.project.v1'

describe('projectStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('saveProject / loadProject', () => {
    it('round-trips a project through localStorage', () => {
      const project = createDemoProject()
      saveProject(project)

      const loaded = loadProject()
      expect(loaded).not.toBeNull()
      expect(loaded?.title).toBe(project.title)
      expect(loaded?.tempo).toBe(project.tempo)
      expect(loaded?.key).toBe(project.key)
      expect(loaded?.scale).toBe(project.scale)
      expect(loaded?.chords).toHaveLength(project.chords.length)
      expect(loaded?.melody).toHaveLength(project.melody.length)
    })

    it('preserves bass and drum tracks', () => {
      const project = createEmptyProject()
      saveProject(project)

      const loaded = loadProject()
      expect(loaded?.bass).toEqual([])
      expect(loaded?.drums).toEqual([])
    })

    it('returns null when nothing has been saved', () => {
      expect(loadProject()).toBeNull()
    })
  })

  describe('clearProject', () => {
    it('removes the saved project so loadProject returns null', () => {
      saveProject(createDemoProject())
      clearProject()
      expect(loadProject()).toBeNull()
    })
  })

  describe('error handling', () => {
    it('throws on corrupted JSON', () => {
      localStorage.setItem(STORAGE_KEY, '{not valid json}')
      expect(() => loadProject()).toThrow('corrupted')
    })

    it('throws when the stored shape is not a valid project', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ unexpected: true }))
      expect(() => loadProject()).toThrow('not compatible')
    })
  })

  describe('parseProjectJson', () => {
    it('parses a valid project JSON string', () => {
      const project = createDemoProject()
      const json = JSON.stringify(project)
      const parsed = parseProjectJson(json)
      expect(parsed.title).toBe(project.title)
      expect(parsed.chords).toHaveLength(project.chords.length)
    })

    it('throws on invalid project JSON', () => {
      expect(() => parseProjectJson(JSON.stringify({ garbage: 1 }))).toThrow()
    })
  })
})
