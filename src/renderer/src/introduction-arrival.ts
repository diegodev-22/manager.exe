import { INTRODUCTION_DURATIONS, type ManagerIntroductionState } from './manager-introduction'

/** Paired lateral smoke lobes in local CSS pixels; all artwork is white or neutral gray. */
export const ARRIVAL_CLOUDS = [
  { x: -46, y: -22, dx: -64, dy: -26, size: 1.2, delay: 0, back: true },
  { x: 46, y: -22, dx: 64, dy: -26, size: 1.2, delay: 0, back: true },
  { x: -50, y: 0, dx: -70, dy: -4, size: 1.3, delay: 0.015, back: true },
  { x: 50, y: 0, dx: 70, dy: -4, size: 1.3, delay: 0.015, back: true },
  { x: -44, y: 24, dx: -62, dy: 22, size: 1.1, delay: 0.03, back: true },
  { x: 44, y: 24, dx: 62, dy: 22, size: 1.1, delay: 0.03, back: true },
  { x: -58, y: -12, dx: -46, dy: -18, size: 0.9, delay: 0.04, back: false },
  { x: 58, y: -12, dx: 46, dy: -18, size: 0.9, delay: 0.04, back: false },
  { x: -56, y: 16, dx: -54, dy: 16, size: 1, delay: 0.055, back: false },
  { x: 56, y: 16, dx: 54, dy: 16, size: 1, delay: 0.055, back: false },
  { x: -62, y: 4, dx: -64, dy: -6, size: 0.65, delay: 0.075, back: false },
  { x: 62, y: 4, dx: 64, dy: -6, size: 0.65, delay: 0.075, back: false }
] as const

/** Whole-body pose before camera scale; translations use local CSS pixels and tilt uses degrees. */
export interface IntroductionEntrancePose {
  drift: number
  lift: number
  scaleX: number
  scaleY: number
  tilt: number
  opacity: number
  /** Blends the ordinary idle bob in only after the waking body has straightened. */
  idleBlend: number
}

/** Authored normalized timeline point; face timing is directed separately by the same phase clock. */
interface EntranceKeyframe extends IntroductionEntrancePose {
  at: number
}

/** Keep the pop impact quick despite longer smoke; settle into a centered, gently lowered posture. */
const POP_POSES = [
  { at: 0, drift: 0, lift: 10, scaleX: 0.25, scaleY: 0.25, tilt: 0, opacity: 0, idleBlend: 0 },
  { at: 0.04, drift: 0, lift: -4, scaleX: 1.08, scaleY: 1.1, tilt: 0.6, opacity: 1, idleBlend: 0 },
  {
    at: 0.12,
    drift: 0.5,
    lift: 5,
    scaleX: 1.035,
    scaleY: 0.94,
    tilt: 1.4,
    opacity: 1,
    idleBlend: 0
  },
  {
    at: 0.29,
    drift: 0.5,
    lift: 6,
    scaleX: 1.005,
    scaleY: 0.96,
    tilt: 1.5,
    opacity: 1,
    idleBlend: 0
  },
  { at: 1, drift: 0.5, lift: 6, scaleX: 1.005, scaleY: 0.96, tilt: 1.5, opacity: 1, idleBlend: 0 }
] as const satisfies readonly EntranceKeyframe[]

/** A balanced sleepy stance breathes vertically, then straightens without a sideways counter-swing. */
const WAKE_POSES = [
  { at: 0, drift: 0.5, lift: 6, scaleX: 1.005, scaleY: 0.96, tilt: 1.5, opacity: 1, idleBlend: 0 },
  {
    at: 0.22,
    drift: 0.75,
    lift: 4.5,
    scaleX: 1.012,
    scaleY: 0.98,
    tilt: 1.6,
    opacity: 1,
    idleBlend: 0
  },
  {
    at: 0.44,
    drift: 0.25,
    lift: 6.5,
    scaleX: 1,
    scaleY: 0.96,
    tilt: 1.2,
    opacity: 1,
    idleBlend: 0
  },
  {
    at: 0.58,
    drift: 0.5,
    lift: 6,
    scaleX: 1.005,
    scaleY: 0.965,
    tilt: 1.3,
    opacity: 1,
    idleBlend: 0
  },
  {
    at: 0.84,
    drift: 0,
    lift: -1.5,
    scaleX: 1,
    scaleY: 1.012,
    tilt: 0,
    opacity: 1,
    idleBlend: 0
  },
  { at: 0.96, drift: 0, lift: 0, scaleX: 1, scaleY: 1, tilt: 0, opacity: 1, idleBlend: 0 },
  { at: 1, drift: 0, lift: 0, scaleX: 1, scaleY: 1, tilt: 0, opacity: 1, idleBlend: 1 }
] as const satisfies readonly EntranceKeyframe[]

/** Bounded smoothstep gives continuous body motion with zero velocity at authored holds. */
function ease(value: number): number {
  const t = Math.min(1, Math.max(0, value))
  return t * t * (3 - 2 * t)
}

/** Samples continuous transforms, without quantizing the body or starting an independent clock. */
function samplePose(
  frames: readonly EntranceKeyframe[],
  progress: number
): IntroductionEntrancePose {
  const p = Math.min(1, Math.max(0, progress))
  for (let index = 1; index < frames.length; index += 1) {
    const from = frames[index - 1]
    const to = frames[index]
    if (!from || !to || p > to.at) continue
    const t = ease((p - from.at) / (to.at - from.at))
    return {
      drift: from.drift + (to.drift - from.drift) * t,
      lift: from.lift + (to.lift - from.lift) * t,
      scaleX: from.scaleX + (to.scaleX - from.scaleX) * t,
      scaleY: from.scaleY + (to.scaleY - from.scaleY) * t,
      tilt: from.tilt + (to.tilt - from.tilt) * t,
      opacity: from.opacity + (to.opacity - from.opacity) * t,
      idleBlend: from.idleBlend + (to.idleBlend - from.idleBlend) * t
    }
  }
  return { drift: 0, lift: 0, scaleX: 1, scaleY: 1, tilt: 0, opacity: 1, idleBlend: 1 }
}

/**
 * Resumable whole-body acting: pop asleep, breathe/slump, then straighten and look at the player.
 * The greeting phase is the wake-up beat; dialogue cannot start until it finishes. Reduced motion
 * bypasses both entrance poses and all smoke while keeping the ordinary final sprite size.
 */
export function getIntroductionEntrancePose(
  state: ManagerIntroductionState,
  reducedMotion: boolean
): IntroductionEntrancePose {
  if (!reducedMotion && state.phase === 'summon')
    return samplePose(POP_POSES, state.phaseSeconds / INTRODUCTION_DURATIONS.summon)
  if (!reducedMotion && state.phase === 'greeting')
    return samplePose(WAKE_POSES, state.phaseSeconds / INTRODUCTION_DURATIONS.greeting)
  return { drift: 0, lift: 0, scaleX: 1, scaleY: 1, tilt: 0, opacity: 1, idleBlend: 1 }
}

/**
 * Binds twelve fixed lateral white/gray puffs once. The introduction owns progress and every frame;
 * there are no timers, emitters, runtime randomness, colored particles, rings, or screen overlays.
 * Smoke sits behind the actor and dissipates before the waking gaze needs to be read.
 * @returns A painter which hides all smoke outside the pop or when reduced motion is enabled.
 */
export function createIntroductionArrivalEffect(
  root: SVGSVGElement
): (progress: number, active: boolean) => void {
  const clouds = root.querySelectorAll<SVGGElement>('[data-arrival-cloud]')
  return (progress, active) => {
    root.style.visibility = active ? 'visible' : 'hidden'
    if (!active) return
    const p = Math.min(1, Math.max(0, progress))
    clouds.forEach((cloud, index) => {
      const seed = ARRIVAL_CLOUDS[index]
      if (!seed) return
      const t = Math.min(1, Math.max(0, (p - seed.delay) / (1 - seed.delay)))
      const travel = 1 - (1 - t) ** 2
      const x = Math.round((seed.x + seed.dx * travel) / 2) * 2
      const y = Math.round((seed.y + seed.dy * travel - 10 * t * t) / 2) * 2
      const scale = seed.size * (0.45 + 0.7 * Math.sin(Math.PI * t))
      cloud.setAttribute('transform', `translate(${x} ${y}) scale(${scale})`)
      // A fast initial puff, longer full-bodied hold, and slow final dissolve use retained pop
      // progress. No timer can outlive the scene or restart the smoke after pause/resume.
      cloud.style.opacity = String(
        ease(t / 0.04) * (1 - ease((t - 0.42) / 0.58)) * (seed.back ? 0.75 : 1)
      )
    })
  }
}
