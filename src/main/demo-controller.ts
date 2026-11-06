import {
  createInitialGameState,
  transitionGameState,
  type GameState
} from '../shared/game/game-state'
import type { DemoSnapshot, DesktopCommand } from '../shared/desktop-api'

/** Opaque demo session owned by this controller; clicks have no minigame scoring rules yet. */
export interface DemoSession {
  hits: number
}

/**
 * Concrete desktop effects owned by the application window layer.
 * Preparing must not show shields; releasing must also cancel/destroy any hidden pending windows.
 */
export interface DemoDesktop {
  prepareOverlay(): Promise<void>
  enterOverlay(): void
  releaseOverlay(): void
  publish(snapshot: DemoSnapshot): void
  quit(): void
}

/**
 * Coordinates the pure lifecycle with cancellable desktop activation.
 *
 * @remarks
 * The main process owns one instance. Async window loading may finish after focus loss, so an
 * activation token prevents stale completions from resuming a cancelled session. This class has
 * no Electron, DOM, timer, or React dependencies and can be tested in Node.
 */
export class DemoController {
  private state: GameState<DemoSession> = createInitialGameState<DemoSession>()
  private revision = 0
  private activationToken = 0
  private activating = false
  private message: string | null = null

  constructor(private readonly desktop: DemoDesktop) {}

  /** Returns presentation data only; the session reference never leaves the owning process. */
  getSnapshot(): DemoSnapshot {
    return {
      revision: this.revision,
      status: this.state.status,
      hits: 'session' in this.state ? this.state.session.hits : 0,
      activating: this.activating,
      message: this.message
    }
  }

  /** Applies a menu intent; duplicate or unsupported actions do not restart a session. */
  async command(command: DesktopCommand): Promise<DemoSnapshot> {
    if (this.state.status === 'exiting') return this.getSnapshot()
    if (command === 'exit') {
      this.shutdown()
    } else if (command === 'pause') {
      this.interrupt('Paused. Resume when you are ready.')
    } else if (
      !this.activating &&
      ((command === 'start' && this.state.status === 'ready') ||
        (command === 'resume' && this.state.status === 'paused'))
    ) {
      const token = ++this.activationToken
      this.activating = true
      this.message = null
      this.publish()
      try {
        await this.desktop.prepareOverlay()
        if (token !== this.activationToken) return this.getSnapshot()
        this.state = transitionGameState(
          this.state,
          command === 'start' ? { type: 'start', session: { hits: 0 } } : { type: 'resume' }
        )
        this.desktop.enterOverlay()
        this.activating = false
        this.publish()
      } catch {
        // A previous activation must never release windows belonging to a newer request.
        if (token === this.activationToken) {
          this.activating = false
          this.state = transitionGameState(this.state, { type: 'pause' })
          this.desktop.releaseOverlay()
          this.message = 'The desktop overlay could not start safely. Please try again.'
          this.publish()
        }
      }
    }
    return this.getSnapshot()
  }

  /** Pauses on focus/display loss without auto-resuming when focus returns. Safe to call repeatedly. */
  interrupt(message: string): void {
    if (this.state.status === 'exiting') return
    if (this.state.status !== 'playing' && !this.activating) return
    ++this.activationToken
    this.activating = false
    this.state = transitionGameState(this.state, { type: 'pause' })
    this.message = message
    this.desktop.releaseOverlay()
    this.publish()
  }

  /** Counts a native primary-surface click only during active play, never while paused. */
  recordHit(): void {
    if (this.state.status !== 'playing') return
    this.state.session.hits += 1
    this.publish()
  }

  /** Terminal, idempotent cleanup used by Exit, native close, and renderer failure. */
  shutdown(): void {
    if (this.state.status === 'exiting') return
    ++this.activationToken
    this.activating = false
    this.state = transitionGameState(this.state, { type: 'exit' })
    this.desktop.releaseOverlay()
    this.publish()
    this.desktop.quit()
  }

  private publish(): void {
    this.revision += 1
    this.desktop.publish(this.getSnapshot())
  }
}
