import { describe, expect, it } from 'vitest'
import {
  createInitialGameState,
  transitionGameState,
  type GameAction,
  type GameState
} from '../../../src/renderer/src/game/core/game-state'

/** Sample session fields prove that the lifecycle preserves data without defining game rules. */
interface TestSession {
  readonly id: string
  readonly elapsedMs: number
  readonly progress: { readonly step: number }
}

// Freeze both levels so accidental writes fail instead of silently changing a shared fixture.
const session: TestSession = Object.freeze({
  id: 'session-1',
  elapsedMs: 1250,
  progress: Object.freeze({ step: 2 })
})
const otherSession: TestSession = Object.freeze({ ...session, id: 'session-2' })

// Seed active states directly so setup transitions cannot hide a defect in the rule under test.
const ready = Object.freeze(createInitialGameState<TestSession>())
const playing: GameState<TestSession> = Object.freeze({ status: 'playing', session })
const paused: GameState<TestSession> = Object.freeze({ status: 'paused', session })
const settings: GameState<TestSession> = Object.freeze({ status: 'settings', session })

describe('initial game state', () => {
  it('starts ready without a session', () => {
    expect(createInitialGameState<TestSession>()).toEqual({ status: 'ready' })
  })

  it('creates independent state objects', () => {
    expect(createInitialGameState<TestSession>()).not.toBe(createInitialGameState<TestSession>())
  })
})

describe('allowed transitions', () => {
  it('starts a session from ready', () => {
    expect(transitionGameState(ready, { type: 'start', session })).toEqual({
      status: 'playing',
      session
    })
  })

  it('pauses a playing session', () => {
    expect(transitionGameState(playing, { type: 'pause' })).toEqual({ status: 'paused', session })
  })

  it('resumes a paused session', () => {
    expect(transitionGameState(paused, { type: 'resume' })).toEqual({ status: 'playing', session })
  })

  it('opens settings from pause', () => {
    expect(transitionGameState(paused, { type: 'open-settings' })).toEqual({
      status: 'settings',
      session
    })
  })

  it('closes settings back to pause without resuming', () => {
    expect(transitionGameState(settings, { type: 'close-settings' })).toEqual({
      status: 'paused',
      session
    })
  })
})

const ignoredActions: {
  state: GameState<TestSession>
  actions: GameAction<TestSession>[]
}[] = [
  {
    state: ready,
    actions: [
      { type: 'pause' },
      { type: 'resume' },
      { type: 'open-settings' },
      { type: 'close-settings' }
    ]
  },
  {
    state: playing,
    actions: [
      { type: 'start', session },
      { type: 'resume' },
      { type: 'open-settings' },
      { type: 'close-settings' }
    ]
  },
  {
    state: paused,
    actions: [{ type: 'start', session }, { type: 'pause' }, { type: 'close-settings' }]
  },
  {
    state: settings,
    actions: [
      { type: 'start', session },
      { type: 'pause' },
      { type: 'resume' },
      { type: 'open-settings' }
    ]
  }
]

describe.each(ignoredActions)('unsupported actions in $state.status', ({ state, actions }) => {
  it.each(actions)('ignores $type without replacing or mutating the state', (action) => {
    expect(transitionGameState(state, action)).toBe(state)
  })
})

describe('session preservation', () => {
  it('retains the exact session and its data through repeated pause and settings cycles', () => {
    let state = transitionGameState(ready, { type: 'start', session })
    const actions: GameAction<TestSession>[] = [
      { type: 'pause' },
      { type: 'open-settings' },
      { type: 'close-settings' },
      { type: 'resume' }
    ]

    // Repeated visits catch resets that would be missed by checking only the first pause.
    for (let cycle = 0; cycle < 3; cycle++) {
      for (const action of actions) {
        state = transitionGameState(state, action)

        if (!('session' in state)) throw new Error('The active session was lost.')
        expect(state.session).toBe(session)
      }
    }

    expect(state).toEqual({ status: 'playing', session })
    expect(session).toEqual({ id: 'session-1', elapsedMs: 1250, progress: { step: 2 } })
    expect(ready).toEqual({ status: 'ready' })
  })

  it('does not replace an active session when another start action arrives', () => {
    expect(transitionGameState(playing, { type: 'start', session: otherSession })).toBe(playing)
  })

  it('keeps independently started sessions isolated', () => {
    const first = transitionGameState(createInitialGameState<TestSession>(), {
      type: 'start',
      session
    })
    const second = transitionGameState(createInitialGameState<TestSession>(), {
      type: 'start',
      session: otherSession
    })

    expect(transitionGameState(first, { type: 'pause' })).toEqual({ status: 'paused', session })
    expect(second).toEqual({ status: 'playing', session: otherSession })
  })
})

describe('exit requests', () => {
  it.each([ready, playing, paused, settings])('requests exit from $status', (state) => {
    expect(transitionGameState(state, { type: 'exit' })).toEqual({ status: 'exiting' })
  })

  const exiting: GameState<TestSession> = Object.freeze({ status: 'exiting' })
  const actions: GameAction<TestSession>[] = [
    { type: 'start', session },
    { type: 'pause' },
    { type: 'resume' },
    { type: 'open-settings' },
    { type: 'close-settings' },
    { type: 'exit' }
  ]

  it.each(actions)('ignores $type once exit has been requested', (action) => {
    expect(transitionGameState(exiting, action)).toBe(exiting)
  })
})
