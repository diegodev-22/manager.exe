import { useId } from 'react'
import { useTranslation } from 'react-i18next'

/** A full sentence reserves its final width while only the requested glyphs are visibly revealed. */
interface SpeechBubbleProps {
  text: string
  revealedCharacters: number
  onAdvance(): void
}

/**
 * Reusable white pixel-art dialogue balloon, with stepped black border, hard gray shadow and tail.
 * Its width follows the current sentence within the scene's bounds, not a fixed full-screen panel.
 * Screen readers receive each complete sentence once, rather than every typewriter character.
 * A single compact control line sits inside the lower edge, without a separate panel or layout gap.
 * Enter is handled by the scene; Space is suppressed on both key edges to prevent native clicks.
 */
export default function SpeechBubble({
  text,
  revealedCharacters,
  onAdvance
}: SpeechBubbleProps): React.JSX.Element {
  const { t } = useTranslation()
  const description = useId()
  const controls = `${description}-controls`
  const characters = Array.from(text)
  const complete = revealedCharacters >= characters.length
  return (
    <div className="speech-bubble-group">
      <span
        className="visually-hidden"
        id={description}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {text}
      </span>
      <span className="visually-hidden" id={controls}>
        {t(($) => $.dialogue.controls)}
      </span>
      <button
        className="speech-bubble"
        type="button"
        aria-label={complete ? t(($) => $.dialogue.continue) : t(($) => $.dialogue.reveal)}
        aria-describedby={`${description} ${controls}`}
        aria-keyshortcuts="Enter"
        onKeyDown={(event) => {
          if (event.key === ' ' || event.key === 'Enter') event.preventDefault()
        }}
        onKeyUp={(event) => {
          if (event.key === ' ') event.preventDefault()
        }}
        onClick={(event) => {
          event.stopPropagation()
          if (
            event.button === 0 &&
            !event.altKey &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.shiftKey
          )
            onAdvance()
        }}
      >
        <span className="speech-bubble-shadow" aria-hidden="true" />
        <span className="speech-bubble-frame" aria-hidden="true" />
        <svg
          className="speech-bubble-tail"
          viewBox="0 0 24 20"
          aria-hidden="true"
          shapeRendering="crispEdges"
        >
          <path
            fill="#777"
            transform="translate(-2 2)"
            d="M2 0h20v4h-2v4h-2v4h-2v4h-4v-4h-2V8H8V4H2z"
          />
          <path fill="#111" d="M2 0h20v4h-2v4h-2v4h-2v4h-4v-4h-2V8H8V4H2z" />
          <path fill="#fff" d="M6 0h12v4h-2v4h-2v4h-2V8h-2V4H6z" />
        </svg>
        <span className="speech-bubble-copy" aria-hidden="true">
          {/* Reserving the complete line prevents the balloon and its anchor from jittering while typing. */}
          <span className="speech-bubble-measure">{text}</span>
          <span>{characters.slice(0, revealedCharacters).join('')}</span>
        </span>
        <span className="dialogue-prompt" data-ready={complete} aria-hidden="true">
          <span>{t(($) => $.dialogue.click)}</span>
          <span>·</span>
          <kbd>{t(($) => $.dialogue.enter)}</kbd>
          <svg className="dialogue-prompt-arrow" viewBox="0 0 6 6" shapeRendering="crispEdges">
            <path fill="currentColor" d="M0 0h6v2H0zM1 2h4v2H1zM2 4h2v2H2z" />
          </svg>
        </span>
      </button>
    </div>
  )
}
