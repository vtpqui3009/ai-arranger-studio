import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach } from 'vitest'
import { PianoRoll } from './PianoRoll'
import { useArrangerStore } from '../store/arrangerStore'
import { createEmptyProject } from '../utils/projectFactory'
import { PIANO_ROLL_NOTES, PIANO_ROLL_STEPS } from '../utils/musicTheory'

describe('PianoRoll', () => {
  beforeEach(() => {
    useArrangerStore.setState({ project: createEmptyProject() })
  })

  it('renders a step cell for every note row and every step column', () => {
    render(<PianoRoll />)
    // Each of the 25 note rows has 32 step cells; query by a full row's first cell per pitch.
    const totalCells = PIANO_ROLL_NOTES.length * PIANO_ROLL_STEPS
    // getAllByRole('button') includes duration selector buttons too (4 of them).
    const allButtons = screen.getAllByRole('button')
    expect(allButtons.length).toBe(totalCells + 4)
  })

  it('adds a note to the store when an empty cell is clicked', async () => {
    render(<PianoRoll />)
    const user = userEvent.setup()

    expect(useArrangerStore.getState().project.melody).toHaveLength(0)

    // C6 (midi 84) is the top row; beat 0 = "M1 B1"
    const cell = screen.getByRole('button', { name: 'Add 1 beat C6 at M1 B1' })
    await user.click(cell)

    const melody = useArrangerStore.getState().project.melody
    expect(melody).toHaveLength(1)
    expect(melody[0].midi).toBe(84)
    expect(melody[0].startBeat).toBe(0)
    expect(melody[0].durationBeats).toBe(1)
  })

  it('removes a note when an active cell is clicked again', async () => {
    render(<PianoRoll />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Add 1 beat C6 at M1 B1' }))
    expect(useArrangerStore.getState().project.melody).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Remove 1 beat C6 at M1 B1' }))
    expect(useArrangerStore.getState().project.melody).toHaveLength(0)
  })

  it('respects the selected note duration when adding notes', async () => {
    useArrangerStore.setState({
      project: { ...createEmptyProject(), selectedNoteDurationBeats: 2 },
    })
    render(<PianoRoll />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Add 2 beats C6 at M1 B1' }))

    const melody = useArrangerStore.getState().project.melody
    expect(melody[0].durationBeats).toBe(2)
  })
})
