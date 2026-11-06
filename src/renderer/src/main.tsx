import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { getDefaultPreferences, type PreferencesSnapshot } from '../../shared/preferences'
import { initializeLocalization } from './i18n'

/** Initializes offline presentation before mounting; shield pages never request privileged settings. */
async function bootstrap(): Promise<void> {
  const shield = new URLSearchParams(window.location.search).get('surface') === 'shield'
  let initialPreferences: PreferencesSnapshot = {
    revision: 0,
    preferences: getDefaultPreferences([]),
    issue: null
  }
  if (!shield) {
    try {
      initialPreferences = await window.desktop.getPreferences()
    } catch {
      initialPreferences = { ...initialPreferences, issue: 'load-failed' }
    }
  }
  document.documentElement.dataset.theme = initialPreferences.preferences.theme
  await initializeLocalization(initialPreferences.preferences.language)
  const root = document.getElementById('root')
  if (!root) throw new Error('The renderer root is missing.')
  // StrictMode requires every subscription to tolerate setup/cleanup/setup without duplicating work.
  createRoot(root).render(
    <StrictMode>
      <App initialPreferences={initialPreferences} />
    </StrictMode>
  )
}

void bootstrap()
