import { useEffect, useRef } from 'react'
import type { CursorPosition } from '../../../shared/desktop-api'

/** Delay after the last real pointer movement before showing help, in milliseconds. */
const HINT_IDLE_DELAY_MS = 1500

/**
 * Owns the virtual cursor, edge shading, and inactivity hint for one mounted gameplay surface.
 *
 * @remarks
 * Native movement notifications also cover secondary displays. Only the latest position is drawn
 * in an on-demand animation frame; there is no interpolation delay or continuously running loop.
 * CSS owns the static edge shading and hint transition. Unmounting on pause or exit releases the
 * frame, idle timeout, and bridge subscription without keeping simulation in React state.
 */
export default function GameSurface(): React.JSX.Element {
  const cursor = useRef<HTMLDivElement>(null)
  const hint = useRef<HTMLElement>(null)

  useEffect(() => {
    let idleTimeout: ReturnType<typeof setTimeout> | undefined
    let pendingFrame: number | undefined
    let latestPosition: CursorPosition | undefined
    let drawnPosition: CursorPosition | undefined
    let lastMovementAt = performance.now()

    /** Changes presentation and accessibility together, only when visibility actually changes. */
    const showHint = (visible: boolean): void => {
      const element = hint.current
      if (!element || element.dataset.visible === String(visible)) return
      element.dataset.visible = String(visible)
      element.setAttribute('aria-hidden', String(!visible))
    }

    /** Checks the actual deadline, rather than replacing a timeout for every input packet. */
    const scheduleHint = (delayMs = HINT_IDLE_DELAY_MS): void => {
      idleTimeout = setTimeout(() => {
        idleTimeout = undefined
        const remainingMs = HINT_IDLE_DELAY_MS - (performance.now() - lastMovementAt)
        if (remainingMs > 0) scheduleHint(remainingMs)
        else showHint(true)
      }, delayMs)
    }

    /** Writes at most one transform per display frame, skipping clamped positions already drawn. */
    const drawCursor = (): void => {
      pendingFrame = undefined
      const position = latestPosition
      if (
        cursor.current &&
        position &&
        (position.x !== drawnPosition?.x || position.y !== drawnPosition?.y)
      ) {
        cursor.current.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`
        drawnPosition = position
      }
      // A delayed frame must not hide help after the pointer has already become idle again.
      showHint(performance.now() - lastMovementAt >= HINT_IDLE_DELAY_MS)
    }

    const unsubscribe = window.desktop.onCursor((position) => {
      latestPosition = position
      lastMovementAt = performance.now()
      if (idleTimeout === undefined) scheduleHint()
      if (pendingFrame === undefined) pendingFrame = requestAnimationFrame(drawCursor)
    })
    // A player who starts or resumes without moving still receives the same delayed help.
    scheduleHint()

    return () => {
      if (idleTimeout !== undefined) clearTimeout(idleTimeout)
      if (pendingFrame !== undefined) cancelAnimationFrame(pendingFrame)
      unsubscribe()
    }
  }, [])

  return (
    <main className="game-surface" aria-label="Desktop interaction demo">
      <aside
        className="game-hud"
        ref={hint}
        data-visible="false"
        aria-hidden="true"
        aria-label="Game help"
      >
        <kbd className="escape-key">Esc</kbd>
        <div className="hint-copy">
          <strong>Pause the game</strong>
          <p>Resume or exit from the menu.</p>
        </div>
      </aside>
      <div className="virtual-cursor" ref={cursor} aria-hidden="true" />
    </main>
  )
}
