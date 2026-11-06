import { createInstance } from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { DemoMessage } from '../../../shared/desktop-api'
import type { AppLanguage } from '../../../shared/preferences'
import en from './locales/en'
import es from './locales/es'

/** One renderer-owned instance; no backend, network detector, or translation service is installed. */
export const i18n = createInstance()

/** Loads both small catalogs before React mounts; English is the explicit missing-key fallback. */
export async function initializeLocalization(language: AppLanguage): Promise<void> {
  await i18n.use(initReactI18next).init({
    resources: { en: { translation: en }, es: { translation: es } },
    lng: language,
    supportedLngs: ['en', 'es'],
    fallbackLng: 'en',
    load: 'languageOnly',
    enableSelector: true,
    returnEmptyString: false,
    interpolation: { escapeValue: false }
  })
  // Text is rendered through React, never inserted as raw translated HTML.
  document.documentElement.lang = language
}

/** Exhaustive bridge-code mapping keeps filesystem/native diagnostics out of localized UI text. */
export const demoMessageKeys = {
  paused: 'paused',
  'focus-lost': 'focusLost',
  minimized: 'minimized',
  reloaded: 'reloaded',
  unresponsive: 'unresponsive',
  'display-changed': 'displayChanged',
  'shield-stopped': 'shieldStopped',
  'overlay-failed': 'overlayFailed'
} as const satisfies Record<DemoMessage, keyof typeof en.notices>
