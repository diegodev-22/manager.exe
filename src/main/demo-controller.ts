import {
  createInitialGameState,
  transitionGameState,
  type GameState
} from '../shared/game/game-state'
import type {
  DemoMessage,
  DemoSnapshot,
  DesktopCommand,
  DisplayMetrics,
  WorkAreaInsets
} from '../shared/desktop-api'

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
  private message: DemoMessage | null = null
  private workAreaInsets: WorkAreaInsets
  private displayMetrics: DisplayMetrics

  /** Takes initial display metadata by value; the caller owns desktop effects and future refreshes. */
  constructor(
    private readonly desktop: DemoDesktop,
    initialWorkAreaInsets: WorkAreaInsets,
    initialDisplayMetrics: DisplayMetrics
  ) {
    this.workAreaInsets = { ...initialWorkAreaInsets }
    this.displayMetrics = { ...initialDisplayMetrics }
  }

  /** Returns presentation data only; the session reference never leaves the owning process. */
  getSnapshot(): DemoSnapshot {
    return {
      revision: this.revision,
      status: this.state.status,
      hits: 'session' in this.state ? this.state.session.hits : 0,
      activating: this.activating,
      message: this.message,
      workAreaInsets: { ...this.workAreaInsets },
      displayMetrics: { ...this.displayMetrics }
    }
  }

  /** Publishes layout/monitor metadata atomically without changing lifecycle or the session reference. */
  updateDisplayMetrics(insets: WorkAreaInsets, metrics: DisplayMetrics): void {
    if (this.state.status === 'exiting') return
    if (
      insets.top === this.workAreaInsets.top &&
      insets.right === this.workAreaInsets.right &&
      insets.bottom === this.workAreaInsets.bottom &&
      insets.left === this.workAreaInsets.left &&
      metrics.widthPx === this.displayMetrics.widthPx &&
      metrics.heightPx === this.displayMetrics.heightPx &&
      metrics.refreshRateHz === this.displayMetrics.refreshRateHz &&
      metrics.scaleFactor === this.displayMetrics.scaleFactor &&
      metrics.detectingResolution === this.displayMetrics.detectingResolution
    )
      return
    this.workAreaInsets = { ...insets }
    this.displayMetrics = { ...metrics }
    // Layout-only updates need a fresh revision so old async command replies cannot undo them.
    this.publish()
  }

  /** Applies a menu intent; duplicate or unsupported actions do not restart a session. */
  async command(command: DesktopCommand): Promise<DemoSnapshot> {
    if (this.state.status === 'exiting') return this.getSnapshot()
    if (command === 'exit') {
      this.shutdown()
    } else if (command === 'pause') {
      this.interrupt('paused')
    } else if (!this.activating && (command === 'open-settings' || command === 'close-settings')) {
      const next = transitionGameState(this.state, { type: command })
      if (next !== this.state) {
        this.state = next
        this.publish()
      }
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
        if (token !== this.activationToken) return this.getSnapshot()
        this.activating = false
        this.publish()
      } catch {
        // A previous activation must never release windows belonging to a newer request.
        if (token === this.activationToken) {
          this.activating = false
          this.state = transitionGameState(this.state, { type: 'pause' })
          this.desktop.releaseOverlay()
          this.message = 'overlay-failed'
          this.publish()
        }
      }
    }
    return this.getSnapshot()
  }

  /** Pauses on focus/display loss without auto-resuming when focus returns. Safe to call repeatedly. */
  interrupt(message: DemoMessage): void {
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
