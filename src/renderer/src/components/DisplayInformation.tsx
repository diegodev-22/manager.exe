import { useTranslation } from 'react-i18next'
import type { DisplayMetrics } from '../../../shared/desktop-api'

/** Read-only monitor metadata, independent of the editable settings draft. */
interface DisplayInformationProps {
  metrics: DisplayMetrics
}

/**
 * Presents three minimal label/value rows without controls, explanations, or animation sampling.
 *
 * @remarks
 * The requested FPS row displays nominal monitor Hz, not measured or guaranteed gameplay FPS.
 * Native detection stays in main; semantic descriptions distinguish missing data from loading.
 */
export default function DisplayInformation({
  metrics
}: DisplayInformationProps): React.JSX.Element {
  const { t, i18n } = useTranslation()
  const { widthPx, heightPx, refreshRateHz, scaleFactor, detectingResolution } = metrics

  const numberFormat = new Intl.NumberFormat(i18n.resolvedLanguage, { maximumFractionDigits: 1 })
  const unavailable = t(($) => $.display.unavailable)
  return (
    <dl className="display-metrics">
      <div>
        <dt>{t(($) => $.display.refreshRate)}</dt>
        <dd aria-label={refreshRateHz === null ? t(($) => $.display.unavailableLabel) : undefined}>
          {refreshRateHz === null
            ? unavailable
            : t(($) => $.display.hertz, { value: numberFormat.format(refreshRateHz) })}
        </dd>
      </div>
      <div>
        <dt>{t(($) => $.display.resolution)}</dt>
        <dd
          aria-label={
            detectingResolution
              ? t(($) => $.display.detectingLabel)
              : widthPx === null || heightPx === null
                ? t(($) => $.display.unavailableLabel)
                : undefined
          }
        >
          {detectingResolution
            ? t(($) => $.display.detecting)
            : widthPx === null || heightPx === null
              ? unavailable
              : t(($) => $.display.pixels, { width: widthPx, height: heightPx })}
        </dd>
      </div>
      <div>
        <dt>{t(($) => $.display.scale)}</dt>
        <dd aria-label={scaleFactor === null ? t(($) => $.display.unavailableLabel) : undefined}>
          {scaleFactor === null
            ? unavailable
            : new Intl.NumberFormat(i18n.resolvedLanguage, {
                style: 'percent',
                maximumFractionDigits: 1
              }).format(scaleFactor)}
        </dd>
      </div>
    </dl>
  )
}
