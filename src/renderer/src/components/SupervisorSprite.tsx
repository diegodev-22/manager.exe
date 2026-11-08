import { useTranslation } from 'react-i18next'
import type { RefObject } from 'react'
import shellUrl from '../assets/screen-supervisor-shell.svg'
import { SUPERVISOR_GRID_HEIGHT, SUPERVISOR_GRID_WIDTH } from '../screen-supervisor-preview'

/** Optional DOM handles allow the owning scene to animate without per-frame React renders. */
interface SupervisorSpriteProps {
  spriteRef?: RefObject<SVGSVGElement | null>
  shellRef?: RefObject<SVGGElement | null>
  gazeRef?: RefObject<SVGGElement | null>
  className?: string
  smile?: 'neutral' | 'small' | 'wide'
}

/** Shared authored sprite and separated facial regions for both roaming and cinematic presentation. */
export default function SupervisorSprite({
  spriteRef,
  shellRef,
  gazeRef,
  className = '',
  smile = 'neutral'
}: SupervisorSpriteProps): React.JSX.Element {
  const { t } = useTranslation()
  return (
    <svg
      ref={spriteRef}
      className={`screen-supervisor ${className}`}
      viewBox={`0 0 ${SUPERVISOR_GRID_WIDTH} ${SUPERVISOR_GRID_HEIGHT}`}
      role="img"
      aria-label={t(($) => $.game.supervisorPreview)}
      shapeRendering="crispEdges"
      data-blink="open"
      data-smile={smile}
      data-mouth="rest"
      data-expression="neutral"
    >
      <g ref={shellRef}>
        <image href={shellUrl} width={SUPERVISOR_GRID_WIDTH} height={SUPERVISOR_GRID_HEIGHT} />
        <g fill="#f2ebd9">
          <g ref={gazeRef}>
            <path className="supervisor-eyes-open" d="M20 18h5v7h-5zM39 18h5v7h-5z" />
            <path className="supervisor-eyes-half" d="M20 21h5v4h-5zM39 21h5v4h-5z" />
            <path className="supervisor-eyes-drowsy" d="M20 22h2v-1h3v4h-5zM39 21h3v1h2v3h-5z" />
            <path className="supervisor-eyes-closed" d="M20 24h5v1h-5zM39 24h5v1h-5z" />
          </g>
          {/* Authored stepped brows, not rotated/scaled vectors; roaming keeps the neutral face. */}
          <g className="supervisor-brows">
            <path
              className="supervisor-brows-sleepy"
              d="M19 18h3v1h4v1h-4v-1h-3zM38 19h4v-1h3v1h-3v1h-4z"
            />
            <path className="supervisor-brows-friendly" d="M20 16h5v1h-5zM39 16h5v1h-5z" />
            <path className="supervisor-brows-skeptical" d="M19 17h8v1h-8zM38 15h3v1h4v1h-7z" />
            <path
              className="supervisor-brows-confident"
              d="M19 16h4v1h3v1h-4v-1h-3zM38 17h3v-1h4v1h-3v1h-4z"
            />
            <path className="supervisor-brows-playful" d="M19 16h3v-1h4v1h-3v1h-4zM38 17h7v1h-7z" />
            <path
              className="supervisor-brows-pleased"
              d="M19 17h2v-1h3v1h2v1h-2v-1h-3v1h-2zM38 17h2v-1h3v1h2v1h-2v-1h-3v1h-2z"
            />
          </g>
          {/* Two clear source-pixel rows remain below the lowest gaze, even for the widest smile. */}
          <g transform="translate(0 2)">
            <path className="supervisor-mouth-neutral" d="M28 28h8v1h-8z" />
            <path className="supervisor-mouth-small" d="M26 27h2v2h8v-2h2v3H26z" />
            <path className="supervisor-mouth-wide" d="M24 26h2v2h12v-2h2v3h-2v2H26v-2h-2z" />
            <path className="supervisor-mouth-closed" d="M27 28h10v1H27z" />
            <g className="supervisor-mouth-half">
              <path d="M26 27h12v3H26z" />
              <path fill="#171923" d="M28 28h8v1h-8z" />
            </g>
            <g className="supervisor-mouth-open">
              <path d="M28 26h8v1h2v3h-2v1h-8v-1h-2v-3h2z" />
              <path fill="#171923" d="M28 28h8v2h-8z" />
              <path fill="#ffbd54" d="M30 30h4v1h-4z" />
            </g>
          </g>
        </g>
      </g>
    </svg>
  )
}
