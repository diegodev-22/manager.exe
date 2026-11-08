import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import type { CursorPosition, IntroductionProgress } from '../../../shared/desktop-api'
import type { SupervisorPreviewState } from '../screen-supervisor-preview'
import ScreenSupervisor from './ScreenSupervisor'
import ManagerIntroduction from './ManagerIntroduction'
import type { ManagerIntroductionState } from '../manager-introduction'

/** Delay after the last real pointer movement before showing help, in milliseconds. */
const HINT_IDLE_DELAY_MS = 1500

/** The menu owns preview storage so pause/settings unmounts do not reset its position or expression. */
interface GameSurfaceProps {
  supervisorPreview: RefObject<SupervisorPreviewState>
  introduction: RefObject<ManagerIntroductionState>
  introductionIssue: IntroductionProgress['issue']
  onIntroductionComplete(): Promise<void>
  onIntroductionFinished(actorSeconds: number, x: number, y: number): void
}

/**
 * Owns the virtual cursor, edge shading, and inactivity hint for one mounted gameplay surface.
 *
 * @remarks
 * Native movement notifications also cover secondary displays. Only the latest position is drawn
 * in an on-demand animation frame; the cursor has no interpolation or persistent animation loop.
 * The supervisor separately owns its active preview loop below the cursor and help layers.
 * Before profile introduction completion, the cinematic owns presentation instead; cursor/help
 * subscriptions start only after its final zoom-out. CSS centers the cursor until its first movement
 * notification, avoiding an initial frame at the top-left. Escape remains available through main.
 * CSS owns the static edge shading and hint transition. Unmounting on pause or exit releases the
 * frame, idle timeout, and bridge subscription without keeping simulation in React state.
 */
export default function GameSurface({
  supervisorPreview,
  introduction,
  introductionIssue,
  onIntroductionComplete,
  onIntroductionFinished
}: GameSurfaceProps): React.JSX.Element {
  const { t } = useTranslation()
  const cursor = useRef<HTMLDivElement>(null)
  const hint = useRef<HTMLElement>(null)
  const [introduced, setIntroduced] = useState(() => introduction.current.phase === 'complete')
  const finishIntroduction = useCallback(
    (actorSeconds: number, x: number, y: number): void => {
      onIntroductionFinished(actorSeconds, x, y)
      setIntroduced(true)
    },
    [onIntroductionFinished]
  )

  useEffect(() => {
    // This is deliberately after the full zoom-out, not on Play, appearance, or the last sentence.
    // A failed save is retried on explicit resume, never by a background timer.
    if (introduced) void onIntroductionComplete()
  }, [introduced, onIntroductionComplete])

  useEffect(() => {
    if (!introduced) return
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
  }, [introduced])

  return (
    <main
      className="game-surface"
      data-introduction={!introduced}
      aria-label={t(($) => $.game.label)}
    >
      {introduced ? (
        <ScreenSupervisor preview={supervisorPreview} />
      ) : (
        <ManagerIntroduction introduction={introduction} onFinished={finishIntroduction} />
      )}
      {introduced && introductionIssue && (
        <p className="game-status" role="status">
          {introductionIssue === 'load-failed'
            ? t(($) => $.errors.loadIntroduction)
            : t(($) => $.errors.saveIntroduction)}
        </p>
      )}
      <aside
        className="game-hud"
        ref={hint}
        data-visible="false"
        aria-hidden="true"
        aria-label={t(($) => $.game.help)}
      >
        <kbd className="escape-key">Esc</kbd>
        <div className="hint-copy">
          <strong>{t(($) => $.game.pause)}</strong>
          <p>{t(($) => $.game.pauseHelp)}</p>
        </div>
      </aside>
      <div className="virtual-cursor" ref={cursor} aria-hidden="true" />
    </main>
  )
}
