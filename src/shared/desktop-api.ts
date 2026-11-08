import type { GameState } from './game/game-state'
import type { PreferencesSnapshot, PreferencesUpdate } from './preferences'

/** Allowlisted desktop intents; none grant arbitrary IPC, window, or system access. */
export type DesktopCommand =
  'start' | 'pause' | 'resume' | 'open-settings' | 'close-settings' | 'exit'

/** Stable presentation codes; English diagnostics and translated UI text stay out of game rules. */
export type DemoMessage =
  | 'paused'
  | 'focus-lost'
  | 'minimized'
  | 'reloaded'
  | 'unresponsive'
  | 'display-changed'
  | 'shield-stopped'
  | 'overlay-failed'

/** Reserved display edges outside the Windows work area, in primary-window local DIP. */
export interface WorkAreaInsets {
  readonly top: number
  readonly right: number
  readonly bottom: number
  readonly left: number
}

/**
 * Read-only primary-display diagnostics, separate from saved choices and simulation state.
 * Pixel dimensions describe the current Windows desktop mode, not the panel's maximum resolution.
 * Hz is the nominal OS-reported rate, not measured FPS or instantaneous VRR. Null means unavailable.
 */
export interface DisplayMetrics {
  /** Physical desktop width; unavailable while detection is pending or has failed. */
  readonly widthPx: number | null
  /** Physical desktop height from the same native mode read as widthPx. */
  readonly heightPx: number | null
  readonly refreshRateHz: number | null
  /** Windows pixel scale multiplier: 1 means 100%, 1.75 means 175%. */
  readonly scaleFactor: number | null
  readonly detectingResolution: boolean
}

/**
 * Serializable presentation data; the main process retains the actual caller-owned session.
 * Revisions increase for lifecycle and display updates, allowing consumers to reject stale replies.
 */
export interface DemoSnapshot {
  readonly revision: number
  readonly status: GameState<unknown>['status']
  readonly hits: number
  readonly activating: boolean
  readonly message: DemoMessage | null
  readonly workAreaInsets: WorkAreaInsets
  readonly displayMetrics: DisplayMetrics
}

/** Primary-window local coordinates in device-independent pixels (DIP), not physical pixels. */
export interface CursorPosition {
  readonly x: number
  readonly y: number
}

/** Per-profile story progress, never a theme/language draft or a main-owned game session. */
export interface IntroductionProgress {
  readonly completed: boolean
  readonly issue: 'load-failed' | 'save-failed' | null
}

/** Bounded PNG frame held only in memory; dimensions are image pixels, not Electron DIP. */
export interface IntroductionFrame {
  readonly width: number
  readonly height: number
  readonly bytes: Uint8Array
}

/** One decoded 4K-class background, not an unrestricted capture or a recording API. */
export const INTRODUCTION_FRAME_LIMITS = {
  maximumEdge: 3840,
  maximumPixels: 8294400,
  maximumBytes: 12 * 1024 * 1024
} as const

/** Only UUID-shaped lease identifiers cross capture IPC; they never identify windows or devices. */
export function isCaptureLease(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/u.test(value)
}

/**
 * Narrow bridge shared by the sandboxed menu and the main process.
 * Subscription methods return cleanup functions; no Electron event objects cross this boundary.
 */
export interface DesktopApi {
  /** One introduction frame per foreground activation, or null on failure/cancellation. No audio/file output. */
  captureIntroductionFrame(lease: string): Promise<IntroductionFrame | null>
  /** Cancels only the matching capture; a late old component cannot cancel its replacement. */
  cancelIntroductionCapture(lease: string): Promise<void>
  /** Reads the settled introduction marker; missing/unreadable progress means replay, not skip. */
  getIntroductionProgress(): Promise<IntroductionProgress>
  /** Marks a fully finished introduction during active play; failures retain the unsaved marker. */
  completeIntroduction(): Promise<IntroductionProgress>
  /** Reads saved presentation choices, waiting for any previously accepted writes. */
  getPreferences(): Promise<PreferencesSnapshot>
  /** Persists an explicit Save from settings; storage failures return issue codes without applying changes. */
  updatePreferences(update: PreferencesUpdate): Promise<PreferencesSnapshot>
  /** Reads the current lifecycle and display metadata without granting access to the session. */
  getSnapshot(): Promise<DemoSnapshot>
  /** Sends an allowlisted intent; rejected IPC requests do not change the local renderer state. */
  command(command: DesktopCommand): Promise<DemoSnapshot>
  /** Subscribes to revisioned updates; call the returned cleanup when the owning view unmounts. */
  onSnapshot(listener: (snapshot: DemoSnapshot) => void): () => void
  /**
   * Reports actual pointer movement delivered to the app, with primary-local clamped coordinates.
   * Repeated coordinates can represent movement on another display; stationary clicks emit nothing.
   * @returns A function that removes this subscription.
   */
  onCursor(listener: (position: CursorPosition) => void): () => void
}

/** Fixed IPC channels used exclusively by the desktop demo bridge. */
export const desktopChannels = {
  snapshot: 'demo:snapshot',
  command: 'demo:command',
  changed: 'demo:changed',
  cursor: 'demo:cursor',
  preferences: 'settings:get',
  updatePreferences: 'settings:update',
  introductionProgress: 'introduction:get',
  completeIntroduction: 'introduction:complete',
  captureIntroductionFrame: 'introduction:capture-frame',
  cancelIntroductionCapture: 'introduction:capture-cancel'
} as const

/** Validates renderer intent before any privileged operation is performed. */
export function isDesktopCommand(value: unknown): value is DesktopCommand {
  return (
    value === 'start' ||
    value === 'pause' ||
    value === 'resume' ||
    value === 'open-settings' ||
    value === 'close-settings' ||
    value === 'exit'
  )
}
