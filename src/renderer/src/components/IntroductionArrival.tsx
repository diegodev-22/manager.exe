import { memo, type RefObject } from 'react'
import { ARRIVAL_CLOUDS } from '../introduction-arrival'

/** Decorative side smoke only; the introduction's retained foreground clock owns all animation. */
interface IntroductionArrivalProps {
  effectRef: RefObject<SVGSVGElement | null>
}

/** White and neutral-gray lateral pop puffs, kept behind the character and clear of his face. */
const IntroductionArrival = memo(function IntroductionArrival({
  effectRef
}: IntroductionArrivalProps): React.JSX.Element {
  return (
    <svg
      className="introduction-arrival"
      ref={effectRef}
      viewBox="-180 -140 360 280"
      aria-hidden="true"
      focusable="false"
      shapeRendering="crispEdges"
    >
      {ARRIVAL_CLOUDS.map((seed, index) => (
        <g key={index} data-arrival-cloud="">
          <path
            fill={seed.back ? '#e6e6e6' : '#fff'}
            d="M-8-14H8v4h6v6h4V8h-6v6H-8v-4h-8V-4h4v-6h4z"
          />
          <path
            fill={seed.back ? '#b8b8b8' : '#d4d4d4'}
            d="M-16 2h4v6h8v4H8v2H-8v-4h-8zM8-8h4v4H8z"
          />
        </g>
      ))}
    </svg>
  )
})

export default IntroductionArrival
