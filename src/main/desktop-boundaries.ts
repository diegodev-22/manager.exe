import type { CursorPosition, WorkAreaInsets } from '../shared/desktop-api'

/** Display rectangle in DIP; screen coordinates can be negative in multi-monitor layouts. */
export interface DisplayBounds {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

/**
 * Converts Windows' work area to local insets without assuming taskbar size, side, or monitor origin.
 * Both rectangles use Electron DIP. Insets are bounded by the display's dimensions.
 * @returns Local edge reservations; physical-pixel resolution must not be used as input.
 */
export function getWorkAreaInsets(bounds: DisplayBounds, workArea: DisplayBounds): WorkAreaInsets {
  return {
    top: Math.max(0, Math.min(bounds.height, workArea.y - bounds.y)),
    right: Math.max(
      0,
      Math.min(bounds.width, bounds.x + bounds.width - workArea.x - workArea.width)
    ),
    bottom: Math.max(
      0,
      Math.min(bounds.height, bounds.y + bounds.height - workArea.y - workArea.height)
    ),
    left: Math.max(0, Math.min(bounds.width, workArea.x - bounds.x))
  }
}

/**
 * Converts a screen-space point to primary-window local DIP and clamps it inside the play area.
 * Both arguments must use Electron's DIP coordinate space, never mixed physical pixel values.
 * @returns A primary-local position clamped to the display, not to its taskbar-excluding work area.
 */
export function clampCursor(point: CursorPosition, bounds: DisplayBounds): CursorPosition {
  return {
    x: Math.max(0, Math.min(bounds.width - 1, point.x - bounds.x)),
    y: Math.max(0, Math.min(bounds.height - 1, point.y - bounds.y))
  }
}

/**
 * Restricts privileged menu requests to the live primary window's main frame.
 * Numeric identities are derived from Electron objects by the IPC handler, not from renderer data.
 */
export function isPrimarySender(
  senderId: number,
  primaryId: number,
  isMainFrame: boolean,
  isDestroyed: boolean
): boolean {
  return !isDestroyed && isMainFrame && senderId === primaryId
}
