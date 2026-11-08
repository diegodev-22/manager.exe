/** Native shell width in source pixels; presentation uses at most a 2x integer CSS scale. */
export const SUPERVISOR_GRID_WIDTH = 64

/** Native shell height, including room for the one-pixel floating animation. */
export const SUPERVISOR_GRID_HEIGHT = 48

/** Fits the same compact 2x/1x grid in roaming and cinematic scenes; tiny views may use a fractional fit. */
export function getSupervisorScale(width: number, height: number): number {
  const available = Math.min(width / SUPERVISOR_GRID_WIDTH, height / SUPERVISOR_GRID_HEIGHT)
  return available < 1 ? Math.max(0, available) : Math.min(2, Math.floor(available))
}

/** Shared discrete blink/bob pose in active seconds; pass zero for a motion-reduced still pose. */
export function getSupervisorIdlePose(activeSeconds: number): {
  blink: 'open' | 'half' | 'closed'
  bob: number
} {
  const blinkTime = (activeSeconds + 1.8) % 4.6
  return {
    blink:
      blinkTime < 0.06 || (blinkTime >= 0.18 && blinkTime < 0.24)
        ? 'half'
        : blinkTime < 0.18
          ? 'closed'
          : 'open',
    bob: Math.round(Math.sin(activeSeconds * 2.5))
  }
}

/** Renderer-owned preview only: coordinates/speeds use CSS pixels, time uses active seconds. */
export interface SupervisorPreviewState {
  x: number | null
  y: number
  directionX: number
  directionY: number
  elapsedSeconds: number
}

/** Creates a fresh visual preview without creating or changing a main-owned game session. */
export function createSupervisorPreviewState(): SupervisorPreviewState {
  return { x: null, y: 0, directionX: 1, directionY: 1, elapsedSeconds: 0 }
}

/**
 * Advances the caller-owned visual state inside the full primary surface, including its edge bands.
 * Bounds include the entire rectangular sprite, not just its center. Resize clamps before motion.
 * @param seconds - Active frame duration, in seconds; the animation owner caps delayed frames.
 * @param spriteWidth - Rendered width in CSS pixels, never physical display resolution.
 * @param spriteHeight - Rendered height in the same CSS pixel space as the surface bounds.
 */
export function advanceSupervisorPreview(
  state: SupervisorPreviewState,
  seconds: number,
  width: number,
  height: number,
  spriteWidth: number,
  spriteHeight: number
): void {
  const limitX = Math.max(0, width - spriteWidth)
  const limitY = Math.max(0, height - spriteHeight)
  if (state.x === null) {
    state.x = limitX / 2
    state.y = limitY / 2
  }
  state.x = Math.min(limitX, Math.max(0, state.x))
  state.y = Math.min(limitY, Math.max(0, state.y))
  state.elapsedSeconds += seconds
  // Unequal axis speeds avoid the short corner-to-corner path of a square diagonal.
  state.x += 143 * state.directionX * seconds
  state.y += 101 * state.directionY * seconds
  const horizontal = reflectAxis(state.x, state.directionX, limitX)
  const vertical = reflectAxis(state.y, state.directionY, limitY)
  state.x = horizontal.position
  state.directionX = horizontal.direction
  state.y = vertical.position
  state.directionY = vertical.direction
}

/** Mirrors overshoot even in a very small viewport, without an unbounded collision loop. */
function reflectAxis(
  position: number,
  direction: number,
  limit: number
): { position: number; direction: number } {
  if (limit <= 0) return { position: 0, direction }
  const cycle = limit * 2
  const wrapped = ((position % cycle) + cycle) % cycle
  if (wrapped === 0) return { position: 0, direction: 1 }
  if (wrapped === limit) return { position: limit, direction: -1 }
  return wrapped < limit
    ? { position: wrapped, direction }
    : { position: cycle - wrapped, direction: -direction }
}
