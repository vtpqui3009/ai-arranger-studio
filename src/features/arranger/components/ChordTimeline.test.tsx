import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach } from 'vitest'
import { ChordTimeline } from './ChordTimeline'
import { useArrangerStore } from '../store/arrangerStore'
import { createDemoProject } from '../utils/projectFactory'

describe('ChordTimeline', () => {
  beforeEach(() => {
    useArrangerStore.setState({ project: createDemoProject() })
  })

  it('renders one text input per chord', () => {
    render(<ChordTimeline />)
    const inputs = screen.getAllByRole('textbox')
    // demo project has 4 chords
    expect(inputs).toHaveLength(4)
  })

  it('displays the initial chord symbols from the project', () => {
    render(<ChordTimeline />)
    expect(screen.getByDisplayValue('Cmaj7')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Am7')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Fmaj7')).toBeInTheDocument()
    expect(screen.getByDisplayValue('G7')).toBeInTheDocument()
  })

  it('updates the store when a chord symbol is typed', async () => {
    render(<ChordTimeline />)
    const user = userEvent.setup()

    const firstInput = screen.getByDisplayValue('Cmaj7')
    await user.clear(firstInput)
    await user.type(firstInput, 'Dm7')

    const chords = useArrangerStore.getState().project.chords
    const first = chords.find((c) => c.startBeat === 0)
    expect(first?.symbol).toBe('Dm7')
  })
})
