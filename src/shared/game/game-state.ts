/**
 * Represents the shared game lifecycle without depending on a renderer or desktop runtime.
 *
 * @remarks
 * Playing, paused, and settings opened from pause carry a session. The lifecycle preserves that
 * caller-owned reference; readonly state properties do not deeply freeze its contents.
 * The terminal exiting state represents a shutdown request, not a completed process exit.
 *
 * @typeParam Session - Caller-owned data for one game session, treated as an opaque payload.
 */
export type GameState<Session> =
  | { readonly status: 'ready' }
  | { readonly status: 'playing'; readonly session: Session }
  | { readonly status: 'paused'; readonly session: Session }
  | { readonly status: 'settings'; readonly returnTo: 'ready' }
  | { readonly status: 'settings'; readonly returnTo: 'paused'; readonly session: Session }
  | { readonly status: 'exiting' }

/**
 * Describes an intent that the game lifecycle can accept or ignore.
 *
 * @remarks
 * Starting supplies the session payload. Other actions change lifecycle state without editing
 * that payload. Mapping UI or keyboard input to these actions belongs to the application shell.
 *
 * @typeParam Session - The session data supplied when starting a game.
 */
export type GameAction<Session> =
  | { readonly type: 'start'; readonly session: Session }
  | { readonly type: 'pause' }
  | { readonly type: 'resume' }
  | { readonly type: 'open-settings' }
  | { readonly type: 'close-settings' }
  | { readonly type: 'exit' }

/**
 * Creates an independent lifecycle state before a game session has started.
 *
 * @typeParam Session - The session payload that subsequent start actions will supply.
 * @returns A new ready state with no attached session.
 */
export function createInitialGameState<Session>(): GameState<Session> {
  return { status: 'ready' }
}

/**
 * Applies a supported lifecycle action without mutating the state or session data.
 *
 * @remarks
 * Pause, resume, and settings transitions retain the exact session reference. Unsupported
 * actions return the existing state, preserving an active session and allowing callers to
 * recognize no-op transitions by reference.
 *
 * Exit is allowed from every nonterminal state. The shell must observe the exiting state and
 * perform cleanup and process shutdown; this function owns no input, timers, or Electron APIs.
 *
 * @typeParam Session - The caller-owned session payload, shared across allowed transitions.
 * @param state - The current lifecycle state.
 * @param action - The intent to apply if the current state permits it.
 * @returns A new state for an allowed action, or the same object when the action is ignored.
 *
 * @example Preserve a session while pausing
 * ```ts
 * const ready = createInitialGameState<{ elapsedMs: number }>()
 * const playing = transitionGameState(ready, {
 *   type: 'start',
 *   session: { elapsedMs: 0 }
 * })
 * const paused = transitionGameState(playing, { type: 'pause' })
 * const resumed = transitionGameState(paused, { type: 'resume' })
 * ```
 */
export function transitionGameState<Session>(
  state: GameState<Session>,
  action: GameAction<Session>
): GameState<Session> {
  // Once exit is requested, later commands must not restart or replace the lifecycle.
  if (state.status === 'exiting') return state

  switch (action.type) {
    case 'start':
      return state.status === 'ready' ? { status: 'playing', session: action.session } : state
    case 'pause':
      return state.status === 'playing' ? { status: 'paused', session: state.session } : state
    case 'resume':
      return state.status === 'paused' ? { status: 'playing', session: state.session } : state
    case 'open-settings':
      if (state.status === 'ready') return { status: 'settings', returnTo: 'ready' }
      return state.status === 'paused'
        ? { status: 'settings', returnTo: 'paused', session: state.session }
        : state
    case 'close-settings':
      // Closing settings must not restart gameplay before the player explicitly resumes.
      if (state.status !== 'settings') return state
      return state.returnTo === 'ready'
        ? { status: 'ready' }
        : { status: 'paused', session: state.session }
    case 'exit':
      return { status: 'exiting' }
  }
}
