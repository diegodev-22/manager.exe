import type { IntroductionFrame } from '../shared/desktop-api'

/** Desktop-owned effects; implementations must release capture resources when the signal aborts. */
export interface CaptureRequestEffects {
  canCapture(): boolean
  displayKey(): string
  readFrame(signal: AbortSignal): Promise<IntroductionFrame | null>
}

/**
 * Owns one bounded screenshot attempt per explicit Play/Resume activation, separate from game state.
 * The renderer uses that frame for the whole unfinished introduction: entrance, dialogue, and the
 * closing zoom-out. It is released once the camera is back at 1x; menus and roaming never ask for
 * pixels. Cancellation invalidates late replies even when an underlying API cannot physically be
 * cancelled. No pixels are retained here after delivery, and repeated IPC never duplicates an attempt.
 */
export class CaptureRequest {
  private available = false
  private active: { id: string; abort: AbortController } | undefined

  /** Injects the desktop boundary without importing Electron into ownership/race rules. */
  constructor(private readonly effects: CaptureRequestEffects) {}

  /** The desktop owner calls this only after a successful foreground overlay activation. */
  beginActivation(): void {
    this.cancel()
    this.available = true
  }

  /** Cancels all work on desktop interruption, or only the matching renderer lease on unmount. */
  cancel(id?: string): void {
    if (id !== undefined && this.active?.id !== id) return
    this.available = false
    const previous = this.active
    this.active = undefined
    previous?.abort.abort()
  }

  /** Returns only the current activation's frame; failures and stale completions return null. */
  async request(id: string): Promise<IntroductionFrame | null> {
    if (!this.available || this.active || !this.effects.canCapture()) return null
    this.available = false
    const request = { id, abort: new AbortController() }
    const displayKey = this.effects.displayKey()
    this.active = request
    try {
      const frame = await this.effects.readFrame(request.abort.signal)
      if (
        request.abort.signal.aborted ||
        this.active !== request ||
        !this.effects.canCapture() ||
        this.effects.displayKey() !== displayKey
      )
        return null
      return frame
    } catch {
      return null
    } finally {
      if (this.active === request) this.active = undefined
    }
  }
}
