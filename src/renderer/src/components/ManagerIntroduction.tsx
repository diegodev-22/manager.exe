import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import {
  advanceIntroductionDialogue,
  advanceManagerIntroduction,
  getIntroductionFacePose,
  isIntroductionEntrance,
  needsIntroductionCapture,
  INTRODUCTION_DURATIONS,
  type IntroductionPhase,
  type ManagerIntroductionState
} from '../manager-introduction'
import SpeechBubble from './SpeechBubble'
import SupervisorSprite from './SupervisorSprite'
import { getSupervisorIdlePose, getSupervisorScale } from '../screen-supervisor-preview'
import { loadIntroductionBackground } from '../introduction-background'
import IntroductionArrival from './IntroductionArrival'
import {
  createIntroductionArrivalEffect,
  getIntroductionEntrancePose
} from '../introduction-arrival'

/** Local CSS-pixel budget for four lines, balloon padding, and the one-line input hint. */
const DIALOGUE_HEIGHT_BUDGET = 144

/** Head offset above the centered 128x96 actor origin: 48px half-height minus a 4px antenna inset. */
const ACTOR_HEAD_TOP = 44

/** Tail shadow reaches 18px, minus its 4px overlap with the balloon; keep CSS/SVG geometry aligned. */
const BALLOON_TAIL_REACH = 14

/** Constant viewport-CSS-pixel clearance between tail tip and actor, independent of text/camera scale. */
const SPEECH_GAP = 4

/** Small viewport-CSS-pixel nudge; the tail counter-offset still points at the actor, not empty space. */
const DIALOGUE_NUDGE = 20

/** The menu retains the timeline across pause/settings; completion is reported only after zoom-out. */
interface ManagerIntroductionProps {
  introduction: RefObject<ManagerIntroductionState>
  onFinished(actorSeconds: number, x: number, y: number): void
}

/** React only receives phase/glyph changes; camera, sprite, smoke, and clocks stay outside renders. */
interface IntroductionView {
  phase: IntroductionPhase
  lineIndex: number
  revealedCharacters: number
}

/** Smooth zero-velocity camera starts/stops, without overshoot or a hard cut back to roaming. */
function easeCamera(progress: number): number {
  const bounded = Math.min(1, Math.max(0, progress))
  return bounded * bounded * (3 - 2 * bounded)
}

/**
 * Directs the temporary desktop camera through the entrance, dialogue, and closing zoom-out; text
 * counter-scales. All time is active foreground time. Esc is still owned by main; unmount freezes
 * the retained timeline, and StrictMode/resize/reduced-motion changes do not duplicate completion.
 */
export default function ManagerIntroduction({
  introduction,
  onFinished
}: ManagerIntroductionProps): React.JSX.Element {
  const { t } = useTranslation()
  const lines = useMemo(
    () => [
      t(($) => $.introduction.hello),
      t(($) => $.introduction.bored),
      t(($) => $.introduction.identity),
      t(($) => $.introduction.invitation),
      t(($) => $.introduction.agreement)
    ],
    [t]
  )
  const [view, setView] = useState<IntroductionView>(() => ({
    phase: introduction.current.phase,
    lineIndex: introduction.current.lineIndex,
    revealedCharacters: introduction.current.revealedCharacters
  }))
  const root = useRef<HTMLElement>(null)
  const camera = useRef<HTMLDivElement>(null)
  const background = useRef<HTMLImageElement>(null)
  const actor = useRef<HTMLDivElement>(null)
  const sprite = useRef<SVGSVGElement>(null)
  const shell = useRef<SVGGElement>(null)
  const gaze = useRef<SVGGElement>(null)
  const arrival = useRef<SVGSVGElement>(null)
  const activate = useRef<() => void>(() => {})
  const [captureFailed, setCaptureFailed] = useState(false)

  useEffect(() => {
    const surface = root.current
    const lens = camera.current
    const backdrop = background.current
    const character = actor.current
    const image = sprite.current
    const artwork = shell.current
    const eyes = gaze.current
    const arrivalArt = arrival.current
    if (!surface || !lens || !backdrop || !character || !image || !artwork || !eyes || !arrivalArt)
      return
    const state = introduction.current
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const drawArrival = createIntroductionArrivalEffect(arrivalArt)
    let frame: number | undefined
    let lastTimestamp: number | undefined
    let finished = false
    let width = surface.clientWidth
    let height = surface.clientHeight
    let centerY = height / 2
    let maximumZoom = 1
    let balloonScale = 1
    let actorScale = 1
    let lastView = ''
    let lastFace = ''
    let captureOwner: AbortController | undefined
    let captureFrame: number | undefined
    let preparing = false
    let backgroundAvailable = false
    let backgroundSeconds = 0
    let disposed = false

    /** Releases pixels immediately on blur, not only after React receives the paused snapshot. */
    const discardBackground = (): void => {
      backgroundAvailable = false
      preparing = false
      backdrop.style.opacity = '0'
      backdrop.removeAttribute('src')
      captureOwner?.abort()
      captureOwner = undefined
      if (captureFrame !== undefined) cancelAnimationFrame(captureFrame)
      captureFrame = undefined
    }

    const canAnimate = (): boolean => !document.hidden && document.hasFocus()
    const currentText = (): string => lines[state.lineIndex] ?? ''
    const updateView = (): void => {
      const nextView = `${state.phase}:${state.lineIndex}:${state.revealedCharacters}`
      if (nextView === lastView) return
      lastView = nextView
      setView({
        phase: state.phase,
        lineIndex: state.lineIndex,
        revealedCharacters: state.revealedCharacters
      })
    }

    /** Background and actor share one zoom factor; text counter-scales to keep a readable size. */
    const draw = (): void => {
      const reduced = reducedMotion.matches
      let focus =
        state.phase === 'waiting' || state.phase === 'return-live' || state.phase === 'complete'
          ? 0
          : 1
      if (state.phase === 'zoom-in')
        focus = easeCamera(state.phaseSeconds / INTRODUCTION_DURATIONS['zoom-in'])
      if (state.phase === 'zoom-out')
        focus = 1 - easeCamera(state.phaseSeconds / INTRODUCTION_DURATIONS['zoom-out'])
      const zoom = reduced || !state.cameraEnabled ? 1 : 1 + (maximumZoom - 1) * focus
      const entry = getIntroductionEntrancePose(state, reduced)
      const idle = getSupervisorIdlePose(reduced ? 0 : state.actorSeconds)
      const bob = idle.bob * entry.idleBlend
      // Also render an empty surface while acquiring: exclusion is not permission to sample our
      // previous dialogue/actor if Windows takes an extra composition to apply display affinity.
      lens.style.visibility = preparing ? 'hidden' : 'visible'
      lens.style.transform = `translate3d(${Math.round(width / 2)}px, ${Math.round(centerY)}px, 0) scale(${zoom})`
      backdrop.style.transform = `scale(${zoom})`
      // Fade in the one image, then keep it opaque through dialogue and the closing camera motion.
      backdrop.style.opacity = String(
        backgroundAvailable && !reduced ? Math.min(1, backgroundSeconds / 0.18) : 0
      )
      surface.style.setProperty('--intro-dialogue-scale', String(balloonScale / zoom))
      // Anchor the balloon itself, not a footer/group box. Counter-scaled tail reach is converted
      // back into camera coordinates so its tip follows the head, including the source-pixel bob.
      const speechOffset =
        ACTOR_HEAD_TOP * actorScale -
        2 * bob * actorScale +
        (BALLOON_TAIL_REACH * balloonScale + SPEECH_GAP) / zoom
      surface.style.setProperty('--intro-dialogue-offset', `${speechOffset}px`)
      surface.style.setProperty('--intro-focus', String(preparing || reduced ? 0 : focus))
      surface.style.setProperty(
        '--intro-shade',
        String(
          preparing || state.phase === 'waiting'
            ? 0
            : reduced
              ? 1
              : state.phase === 'zoom-in'
                ? focus
                : 1
        )
      )
      surface.dataset.phase = state.phase
      surface.dataset.animate = String(canAnimate() && !preparing && !reduced)

      drawArrival(
        state.phaseSeconds / INTRODUCTION_DURATIONS.summon,
        !reduced && !preparing && state.phase === 'summon'
      )
      const visible =
        state.phase !== 'waiting' &&
        state.phase !== 'zoom-in' &&
        (state.phase !== 'summon' || entry.opacity > 0)
      character.style.visibility = visible ? 'visible' : 'hidden'
      character.style.transform = `translate3d(${entry.drift * actorScale}px, ${entry.lift * actorScale}px, 0) rotate(${entry.tilt}deg) scale(${actorScale * entry.scaleX}, ${actorScale * entry.scaleY})`
      character.style.opacity = String(entry.opacity)
      const face = getIntroductionFacePose(state, currentText(), reduced)
      const expressionBlink =
        face.blink ??
        (idle.blink === 'open' && face.expression === 'skeptical' ? 'half' : idle.blink)
      const mouth = !canAnimate() || preparing ? 'rest' : face.mouth
      const pose = `${expressionBlink}:${face.expression}:${face.smile}:${mouth}:${face.gazeX}:${face.gazeY}`
      if (pose !== lastFace) {
        image.dataset.blink = expressionBlink
        image.dataset.expression = face.expression
        image.dataset.smile = face.smile
        image.dataset.mouth = mouth
        eyes.setAttribute('transform', `translate(${face.gazeX} ${face.gazeY})`)
        lastFace = pose
      }
      artwork.setAttribute('transform', `translate(0 ${bob})`)
      updateView()
    }

    const resize = (): void => {
      width = surface.clientWidth
      height = surface.clientHeight
      actorScale = getSupervisorScale(width, height) / 2
      arrivalArt.style.transform = `scale(${actorScale})`
      const preferredCenter = height < 500 ? Math.min(height - 56, height * 0.72) : height / 2
      // Reserve readable speech before enlarging the actor on short/narrow desktops.
      // The background and actor still use exactly the same perspective factor, up to 2x.
      maximumZoom =
        state.cameraEnabled && !reducedMotion.matches
          ? Math.max(
              1,
              Math.min(
                2,
                (width - 32) / Math.max(1, 128 * actorScale),
                (height - 32 - DIALOGUE_HEIGHT_BUDGET - BALLOON_TAIL_REACH - SPEECH_GAP) /
                  Math.max(1, (ACTOR_HEAD_TOP + 48) * actorScale)
              )
            )
          : 1
      const speechHeight = DIALOGUE_HEIGHT_BUDGET + BALLOON_TAIL_REACH
      const spaceAbove =
        preferredCenter - ACTOR_HEAD_TOP * actorScale * maximumZoom - SPEECH_GAP - 16
      balloonScale = Math.min(2, Math.max(1, spaceAbove / speechHeight))
      const minimumCenter =
        16 + speechHeight * balloonScale + ACTOR_HEAD_TOP * actorScale * maximumZoom + SPEECH_GAP
      const maximumCenter = height - 16 - 48 * actorScale * maximumZoom
      centerY = Math.max(0, Math.min(maximumCenter, Math.max(preferredCenter, minimumCenter)))
      const nudge = Math.min(DIALOGUE_NUDGE, Math.max(0, (width - 192) / 2))
      const balloonWidth = Math.min(320, (width - 32 - 2 * nudge) / balloonScale)
      surface.style.setProperty('--intro-bubble-width', `${Math.max(80, balloonWidth)}px`)
      // Both shift and tail correction use counter-scaled text coordinates, preserving a small
      // screen-space move rather than doubling it with camera zoom or disconnecting the tail.
      surface.style.setProperty('--intro-dialogue-shift', `${nudge / balloonScale}px`)
      draw()
    }

    /** One lease covers entrance, dialogue, and zoom-out; it ends once the camera is back at 1x. */
    const prepareBackground = (): void => {
      discardBackground()
      const owner = new AbortController()
      captureOwner = owner
      preparing = true
      backgroundSeconds = 0
      setCaptureFailed(false)
      // Deferral lets StrictMode cancel its discarded mount before any privileged request is sent.
      captureFrame = requestAnimationFrame(() => {
        captureFrame = undefined
        if (!canAnimate() || owner.signal.aborted || !needsIntroductionCapture(state.phase)) {
          discardBackground()
          synchronize()
          return
        }
        void loadIntroductionBackground(owner.signal)
          .then((loaded) => {
            if (disposed || owner.signal.aborted || captureOwner !== owner) return
            preparing = false
            state.cameraEnabled = loaded !== null
            if (loaded) {
              backdrop.src = loaded.url
              backgroundAvailable = true
            } else setCaptureFailed(true)
            resize()
            synchronize()
          })
          .catch(() => {
            /* The interruption owner, not a stale promise, decides whether to resume. */
          })
      })
    }

    const animate = (timestamp: number): void => {
      frame = undefined
      if (!canAnimate() || preparing) {
        lastTimestamp = undefined
        return
      }
      const seconds =
        lastTimestamp === undefined ? 0 : Math.min(0.05, (timestamp - lastTimestamp) / 1000)
      lastTimestamp = timestamp
      backgroundSeconds += seconds
      advanceManagerIntroduction(
        state,
        seconds,
        currentText(),
        reducedMotion.matches,
        state.cameraEnabled
      )
      // The conversation and the closing pull-back share one stable background image. Release the
      // source and its URL only when the camera is back at 1x, never in the middle of the dialogue.
      if ((state.phase === 'return-live' || state.phase === 'complete') && captureOwner)
        discardBackground()
      draw()
      if (state.phase === 'complete') {
        if (!finished) {
          finished = true
          discardBackground()
          onFinished(
            state.actorSeconds,
            Math.round(width / 2) - 64 * actorScale,
            Math.round(centerY) - 48 * actorScale
          )
        }
        return
      }
      // Reduced motion needs no idle loop while the reader decides when to continue.
      if (
        !reducedMotion.matches ||
        state.phase !== 'dialogue' ||
        state.revealedCharacters < Array.from(currentText()).length
      ) {
        frame = requestAnimationFrame(animate)
      }
    }

    const synchronize = (): void => {
      if (frame !== undefined) cancelAnimationFrame(frame)
      frame = undefined
      lastTimestamp = undefined
      if (!canAnimate() || reducedMotion.matches) discardBackground()
      draw()
      if (canAnimate()) frame = requestAnimationFrame(animate)
    }
    activate.current = (): void => {
      if (!canAnimate() || preparing || state.phase !== 'dialogue') return
      advanceIntroductionDialogue(state, currentText(), lines.length)
      draw()
      if (frame === undefined) synchronize()
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        (event.key !== 'Enter' && event.key !== ' ')
      )
        return
      // Prevent the button's synthetic click from advancing the same sentence a second time.
      event.preventDefault()
      // Space is deliberately unsupported, including native activation of a focused balloon button.
      if (event.key === ' ' || event.repeat) return
      activate.current()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(surface)
    // Retry after a failure only before dialogue; recapturing mid-conversation must not turn on a
    // zoom the player never saw at the start.
    if (
      !reducedMotion.matches &&
      needsIntroductionCapture(state.phase) &&
      (isIntroductionEntrance(state.phase) || state.cameraEnabled)
    )
      prepareBackground()
    resize()
    synchronize()
    const unsubscribe = window.desktop.onSnapshot((snapshot) => {
      if (snapshot.status !== 'playing') discardBackground()
    })
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('focus', synchronize)
    window.addEventListener('blur', synchronize)
    document.addEventListener('visibilitychange', synchronize)
    reducedMotion.addEventListener('change', synchronize)
    return () => {
      disposed = true
      discardBackground()
      unsubscribe()
      if (frame !== undefined) cancelAnimationFrame(frame)
      observer.disconnect()
      activate.current = () => {}
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('focus', synchronize)
      window.removeEventListener('blur', synchronize)
      document.removeEventListener('visibilitychange', synchronize)
      reducedMotion.removeEventListener('change', synchronize)
    }
  }, [introduction, lines, onFinished])

  return (
    <section
      className="manager-introduction"
      ref={root}
      data-phase={view.phase}
      aria-label={t(($) => $.introduction.label)}
      onClick={(event) => {
        if (
          event.button === 0 &&
          !event.altKey &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.shiftKey
        )
          activate.current()
      }}
    >
      <img className="introduction-background" ref={background} alt="" aria-hidden="true" />
      <div className="introduction-focus" aria-hidden="true" />
      {captureFailed && (
        <p className="game-status" role="status">
          {t(($) => $.introduction.captureFailed)}
        </p>
      )}
      <div className="introduction-camera" ref={camera}>
        <IntroductionArrival effectRef={arrival} />
        <div className="introduction-actor" ref={actor}>
          <SupervisorSprite spriteRef={sprite} shellRef={shell} gazeRef={gaze} smile="small" />
        </div>
        {view.phase === 'dialogue' && (
          <div className="introduction-dialogue">
            <SpeechBubble
              text={lines[view.lineIndex] ?? ''}
              revealedCharacters={view.revealedCharacters}
              onAdvance={() => activate.current()}
            />
          </div>
        )}
      </div>
    </section>
  )
}
