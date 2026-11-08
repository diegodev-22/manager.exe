import { useEffect, useRef, type RefObject } from 'react'
import SupervisorSprite from './SupervisorSprite'
import {
  advanceSupervisorPreview,
  getSupervisorScale,
  getSupervisorIdlePose,
  SUPERVISOR_GRID_WIDTH,
  SUPERVISOR_GRID_HEIGHT,
  type SupervisorPreviewState
} from '../screen-supervisor-preview'

/** Storage survives GameSurface unmounts on pause/settings; it is not persisted across renderer reloads. */
interface ScreenSupervisorProps {
  preview: RefObject<SupervisorPreviewState>
}

/**
 * Presents a floating CRT supervisor with independently replaceable shell, eyes, and mouth.
 * One owned animation loop updates transforms/expressions outside React state only during active,
 * focused play. Hidden documents and reduced motion stop the loop; unmount releases every resource.
 */
export default function ScreenSupervisor({ preview }: ScreenSupervisorProps): React.JSX.Element {
  const layer = useRef<HTMLDivElement>(null)
  const sprite = useRef<SVGSVGElement>(null)
  const shell = useRef<SVGGElement>(null)
  const gaze = useRef<SVGGElement>(null)

  useEffect(() => {
    const surface = layer.current
    const image = sprite.current
    const artwork = shell.current
    const eyes = gaze.current
    if (!surface || !image || !artwork || !eyes) return

    const state = preview.current
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let width = surface.clientWidth
    let height = surface.clientHeight
    let spriteWidth = SUPERVISOR_GRID_WIDTH * 2
    let spriteHeight = SUPERVISOR_GRID_HEIGHT * 2
    let frame: number | undefined
    let lastTimestamp: number | undefined
    let lastPose = ''

    /** No display-mode APIs: layout and collision dimensions share the renderer's CSS pixel space. */
    const resize = (): void => {
      width = surface.clientWidth
      height = surface.clientHeight
      const scale = getSupervisorScale(width, height)
      spriteWidth = SUPERVISOR_GRID_WIDTH * scale
      spriteHeight = SUPERVISOR_GRID_HEIGHT * scale
      image.style.width = `${spriteWidth}px`
      image.style.height = `${spriteHeight}px`
      advanceSupervisorPreview(state, 0, width, height, spriteWidth, spriteHeight)
      draw()
    }

    /** Facial poses change discretely on the source pixel grid, without smooth vector morphing. */
    const draw = (): void => {
      const seconds = reducedMotion.matches ? 0 : state.elapsedSeconds
      image.style.transform = `translate3d(${Math.round(state.x ?? 0)}px, ${Math.round(state.y)}px, 0)`
      const { blink, bob } = getSupervisorIdlePose(seconds)
      const smilePhase = Math.floor(seconds / 2) % 6
      const smile = smilePhase === 0 ? 'neutral' : smilePhase < 3 ? 'small' : 'wide'
      const look = Math.floor(seconds / 1.4) % 6
      const x =
        reducedMotion.matches || look === 1 || look === 2 || look === 4
          ? 0
          : look === 5
            ? -state.directionX
            : state.directionX
      const y = reducedMotion.matches ? 0 : look === 2 ? -1 : look === 4 ? 1 : 0
      const pose = `${bob}:${blink}:${smile}:${x}:${y}`
      if (pose !== lastPose) {
        artwork.setAttribute('transform', `translate(0 ${bob})`)
        image.dataset.blink = blink
        image.dataset.smile = smile
        eyes.setAttribute('transform', `translate(${x} ${y})`)
        lastPose = pose
      }
    }

    const canAnimate = (): boolean =>
      !document.hidden && document.hasFocus() && !reducedMotion.matches

    /** Clamp stalls to 50ms so a delayed frame cannot fling the preview across the desktop. */
    const animate = (timestamp: number): void => {
      frame = undefined
      if (!canAnimate()) {
        lastTimestamp = undefined
        return
      }
      const seconds =
        lastTimestamp === undefined ? 0 : Math.min(0.05, (timestamp - lastTimestamp) / 1000)
      lastTimestamp = timestamp
      advanceSupervisorPreview(state, seconds, width, height, spriteWidth, spriteHeight)
      draw()
      frame = requestAnimationFrame(animate)
    }

    /** Focus return never changes the main lifecycle; a paused surface remains unmounted. */
    const synchronize = (): void => {
      if (frame !== undefined) cancelAnimationFrame(frame)
      frame = undefined
      lastTimestamp = undefined
      draw()
      if (canAnimate()) frame = requestAnimationFrame(animate)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(surface)
    resize()
    synchronize()
    reducedMotion.addEventListener('change', synchronize)
    document.addEventListener('visibilitychange', synchronize)
    window.addEventListener('focus', synchronize)
    window.addEventListener('blur', synchronize)
    return () => {
      if (frame !== undefined) cancelAnimationFrame(frame)
      observer.disconnect()
      reducedMotion.removeEventListener('change', synchronize)
      document.removeEventListener('visibilitychange', synchronize)
      window.removeEventListener('focus', synchronize)
      window.removeEventListener('blur', synchronize)
    }
  }, [preview])

  return (
    <div className="supervisor-layer" ref={layer}>
      <SupervisorSprite spriteRef={sprite} shellRef={shell} gazeRef={gaze} />
    </div>
  )
}
