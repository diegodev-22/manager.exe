import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { getDefaultPreferences, type PreferencesSnapshot } from '../../shared/preferences'
import { initializeLocalization } from './i18n'
import type { IntroductionProgress } from '../../shared/desktop-api'

/** Loads local preferences/progress before mounting; shield pages never request privileged profile data. */
async function bootstrap(): Promise<void> {
  const shield = new URLSearchParams(window.location.search).get('surface') === 'shield'
  let initialPreferences: PreferencesSnapshot = {
    revision: 0,
    preferences: getDefaultPreferences([]),
    issue: null
  }
  let initialIntroduction: IntroductionProgress = { completed: false, issue: null }
  if (!shield) {
    const [preferences, introduction] = await Promise.allSettled([
      window.desktop.getPreferences(),
      window.desktop.getIntroductionProgress()
    ])
    initialPreferences =
      preferences.status === 'fulfilled'
        ? preferences.value
        : { ...initialPreferences, issue: 'load-failed' }
    initialIntroduction =
      introduction.status === 'fulfilled'
        ? introduction.value
        : { completed: false, issue: 'load-failed' }
  }
  document.documentElement.dataset.theme = initialPreferences.preferences.theme
  await initializeLocalization(initialPreferences.preferences.language)
  const root = document.getElementById('root')
  if (!root) throw new Error('The renderer root is missing.')
  // StrictMode requires every subscription to tolerate setup/cleanup/setup without duplicating work.
  createRoot(root).render(
    <StrictMode>
      <App initialPreferences={initialPreferences} initialIntroduction={initialIntroduction} />
    </StrictMode>
  )
}

void bootstrap()
