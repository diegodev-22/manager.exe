import type { GameState } from './game/game-state'

/** Allowlisted desktop intents; none grant arbitrary IPC, window, or system access. */
export type DesktopCommand = 'start' | 'pause' | 'resume' | 'exit'

/** Serializable presentation data. The main process retains the actual caller-owned session. */
export interface DemoSnapshot {
  readonly revision: number
  readonly status: GameState<unknown>['status']
  readonly hits: number
  readonly activating: boolean
  readonly message: string | null
}

/** Primary-window local coordinates in device-independent pixels (DIP), not physical pixels. */
export interface CursorPosition {
  readonly x: number
  readonly y: number
}

/**
 * Narrow bridge shared by the sandboxed menu and the main process.
 * Subscription methods return cleanup functions; no Electron event objects cross this boundary.
 */
export interface DesktopApi {
  getSnapshot(): Promise<DemoSnapshot>
  command(command: DesktopCommand): Promise<DemoSnapshot>
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
  cursor: 'demo:cursor'
} as const

/** Validates renderer intent before any privileged operation is performed. */
export function isDesktopCommand(value: unknown): value is DesktopCommand {
  return value === 'start' || value === 'pause' || value === 'resume' || value === 'exit'
}
