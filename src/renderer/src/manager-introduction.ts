/** Presentation stages, not new game-core states: Esc can pause any of these. */
export type IntroductionPhase =
  | 'waiting'
  | 'zoom-in'
  | 'summon'
  | 'greeting'
  | 'dialogue'
  | 'zoom-out'
  | 'return-live'
  | 'complete'

/**
 * Temporary visual-iteration mode: replay on each renderer startup without consulting or changing
 * saved completion. Disable to restore the once-per-profile behavior.
 * Pause/settings retain the same timeline and must never recreate the introduction.
 */
export const INTRODUCTION_PREVIEW_ENABLED = true

/** Renderer-owned timeline retained through pause/settings; disk only records full completion. */
export interface ManagerIntroductionState {
  phase: IntroductionPhase
  phaseSeconds: number
  actorSeconds: number
  lineIndex: number
  revealedCharacters: number
  characterSeconds: number
  /** Keeps the close-up perspective through dialogue, pause, and zoom-out; the image lease is separate. */
  cameraEnabled: boolean
}

/** Phases before dialogue, where a failed first capture may still be retried on resume. */
export function isIntroductionEntrance(phase: IntroductionPhase): boolean {
  return phase === 'waiting' || phase === 'zoom-in' || phase === 'summon' || phase === 'greeting'
}

/**
 * The temporary desktop image is displayed from the entrance through the closing zoom-out, so the
 * conversation and the pull-back share one stable background. It is released once the camera reaches
 * its normal 1x size (`return-live`/`complete`), before control returns to the live supervisor.
 */
export function needsIntroductionCapture(phase: IntroductionPhase): boolean {
  return isIntroductionEntrance(phase) || phase === 'dialogue' || phase === 'zoom-out'
}

/** Discrete LED-face poses; positions are integer source pixels on the supervisor's 64x48 grid. */
export interface IntroductionFacePose {
  expression: 'sleepy' | 'friendly' | 'skeptical' | 'confident' | 'playful' | 'pleased'
  smile: 'neutral' | 'small' | 'wide'
  mouth: 'rest' | 'closed' | 'half' | 'open'
  gazeX: number
  gazeY: number
  /** Wake-up acting overrides ambient blinks until the character has established eye contact. */
  blink?: 'open' | 'half' | 'closed'
}

/** Sentence-specific acting follows the localized story's meaning, never its translated wording. */
const DIALOGUE_FACES = [
  { expression: 'friendly', smile: 'small', gazeX: 0, gazeY: 0 },
  { expression: 'skeptical', smile: 'neutral', gazeX: -1, gazeY: 1 },
  { expression: 'confident', smile: 'wide', gazeX: 0, gazeY: 0 },
  { expression: 'playful', smile: 'wide', gazeX: 1, gazeY: 0 },
  { expression: 'pleased', smile: 'small', gazeX: 0, gazeY: 0 }
] as const

/**
 * Directs authored eyebrows/gaze/smiles and a restrained 9 Hz, four-step talking cycle.
 * Punctuation, spaces, completed/skipped typing, and reduced motion settle back to the line's smile.
 * This is silent typewriter-linked acting, not audio lip sync; it owns no extra animation loop.
 * The pre-dialogue wake-up explicitly holds closed/downcast eyes, heavy lids, then eye contact.
 * @param reducedMotion - Bypasses waking/talking motion; callers freeze clocks separately on pause.
 */
export function getIntroductionFacePose(
  state: ManagerIntroductionState,
  text: string,
  reducedMotion: boolean
): IntroductionFacePose {
  if (!reducedMotion && state.phase === 'summon') {
    return {
      expression: 'sleepy',
      smile: 'neutral',
      mouth: 'rest',
      gazeX: 0,
      gazeY: 2,
      blink: 'closed'
    }
  }
  if (!reducedMotion && state.phase === 'greeting') {
    const t = Math.min(1, Math.max(0, state.phaseSeconds / INTRODUCTION_DURATIONS.greeting))
    const lookUp = Math.min(1, Math.max(0, (t - 0.66) / 0.2))
    // A brief second heavy blink reads as waking from deep sleep, not an electronic boot flicker.
    const blink = t < 0.2 || (t >= 0.38 && t < 0.42) ? 'closed' : t < 0.52 ? 'half' : 'open'
    return {
      expression: t < 0.88 ? 'sleepy' : 'friendly',
      smile: t < 0.94 ? 'neutral' : 'small',
      mouth: t >= 0.28 && t < 0.5 ? 'half' : 'rest',
      gazeX: 0,
      gazeY: Math.round(2 * (1 - lookUp)),
      blink
    }
  }
  const hasDialogue =
    state.phase === 'dialogue' ||
    state.phase === 'zoom-out' ||
    state.phase === 'return-live' ||
    state.phase === 'complete'
  const face = DIALOGUE_FACES[hasDialogue ? state.lineIndex : 0] ?? DIALOGUE_FACES[0]
  const characters = Array.from(text)
  const previous = characters[state.revealedCharacters - 1] ?? ''
  const speaking =
    !reducedMotion &&
    state.phase === 'dialogue' &&
    state.revealedCharacters > 0 &&
    state.revealedCharacters < characters.length &&
    /[\p{L}\p{N}]/u.test(previous)
  const cycle = ['closed', 'half', 'open', 'half'] as const
  return {
    ...face,
    mouth: speaking
      ? (cycle[Math.floor(state.actorSeconds * 9) % cycle.length] ?? 'closed')
      : 'rest'
  }
}

/** Active-play durations in seconds; reduced motion removes zoom/smoke and shortens the empty wait. */
export const INTRODUCTION_DURATIONS = {
  waiting: 0.5,
  'zoom-in': 2.8,
  summon: 1.4,
  greeting: 4.5,
  'zoom-out': 2.6,
  'return-live': 0.25
} as const

/** Starts empty in preview mode; otherwise honors this profile's persisted completion marker. */
export function createManagerIntroduction(completed: boolean): ManagerIntroductionState {
  return {
    phase: completed && !INTRODUCTION_PREVIEW_ENABLED ? 'complete' : 'waiting',
    phaseSeconds: 0,
    actorSeconds: 0,
    lineIndex: 0,
    revealedCharacters: 0,
    characterSeconds: 0,
    cameraEnabled: false
  }
}

/** Changes phase without discarding the actor's continuous blink/idle clock. */
function enterPhase(state: ManagerIntroductionState, phase: IntroductionPhase): void {
  state.phase = phase
  state.phaseSeconds = 0
}

/**
 * Advances presentation only in active foreground time. Dialogue never advances without input.
 * @param text - Full current localized sentence; punctuation adds short typewriter pauses.
 * @param reducedMotion - Uses static poses and complete sentences instead of continuous effects.
 * @param zoomAvailable - No-capture fallback skips camera-only waits but retains smoke and dialogue.
 */
export function advanceManagerIntroduction(
  state: ManagerIntroductionState,
  seconds: number,
  text: string,
  reducedMotion: boolean,
  zoomAvailable = true
): void {
  state.phaseSeconds += seconds
  if (state.phase !== 'waiting' && state.phase !== 'zoom-in') state.actorSeconds += seconds
  switch (state.phase) {
    case 'waiting':
      if (state.phaseSeconds >= (reducedMotion ? 0.35 : INTRODUCTION_DURATIONS.waiting)) {
        enterPhase(state, reducedMotion ? 'greeting' : zoomAvailable ? 'zoom-in' : 'summon')
      }
      break
    case 'zoom-in':
      if (
        reducedMotion ||
        !zoomAvailable ||
        state.phaseSeconds >= INTRODUCTION_DURATIONS['zoom-in']
      )
        enterPhase(state, reducedMotion ? 'greeting' : 'summon')
      break
    case 'summon':
      if (reducedMotion || state.phaseSeconds >= INTRODUCTION_DURATIONS.summon)
        enterPhase(state, 'greeting')
      break
    case 'greeting':
      if (state.phaseSeconds >= (reducedMotion ? 0.35 : INTRODUCTION_DURATIONS.greeting))
        enterPhase(state, 'dialogue')
      break
    case 'dialogue': {
      const characters = Array.from(text)
      state.revealedCharacters = Math.min(state.revealedCharacters, characters.length)
      if (reducedMotion) {
        state.revealedCharacters = characters.length
        break
      }
      state.characterSeconds += seconds
      while (state.revealedCharacters < characters.length) {
        const previous = characters[state.revealedCharacters - 1] ?? ''
        const delay = /[.,!?…]/u.test(previous) ? 0.16 : 0.035
        if (state.characterSeconds < delay) break
        state.characterSeconds -= delay
        state.revealedCharacters += 1
      }
      // Waiting for the reader must not accumulate a burst of typing for the next sentence.
      if (state.revealedCharacters === characters.length) state.characterSeconds = 0
      break
    }
    case 'zoom-out':
      if (
        reducedMotion ||
        !zoomAvailable ||
        state.phaseSeconds >= INTRODUCTION_DURATIONS['zoom-out']
      )
        enterPhase(state, reducedMotion || !zoomAvailable ? 'complete' : 'return-live')
      break
    case 'return-live':
      if (
        reducedMotion ||
        !zoomAvailable ||
        state.phaseSeconds >= INTRODUCTION_DURATIONS['return-live']
      )
        enterPhase(state, 'complete')
      break
  }
}

/** A deliberate activation first completes the text; another advances, or starts the final zoom-out. */
export function advanceIntroductionDialogue(
  state: ManagerIntroductionState,
  text: string,
  lineCount: number
): void {
  if (state.phase !== 'dialogue') return
  const length = Array.from(text).length
  if (state.revealedCharacters < length) state.revealedCharacters = length
  else if (state.lineIndex < lineCount - 1) {
    state.lineIndex += 1
    state.revealedCharacters = 0
    state.characterSeconds = 0
  } else enterPhase(state, 'zoom-out')
}
