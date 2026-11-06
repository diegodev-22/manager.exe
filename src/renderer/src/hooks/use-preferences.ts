import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { AppPreferences, PreferencesSnapshot } from '../../../shared/preferences'
import { i18n } from '../i18n'

/** Applied preferences change only after an explicit save succeeds in the main process. */
interface PreferencesState {
  preferences: AppPreferences
  issue: PreferencesSnapshot['issue']
  saving: boolean
  savePreferences(preferences: AppPreferences): Promise<boolean>
  clearSaveIssue(): void
}

/**
 * Owns committed presentation preferences; the settings panel owns its separate editable draft.
 * A save failure leaves the applied theme/language unchanged and reports a localized issue code.
 * Duplicate submissions and late responses after unmount cannot apply another preference change.
 * @param initial - Settled preferences loaded before this renderer mounts, or its explicit fallback.
 * @returns Saved choices and save feedback; this hook never navigates away from settings.
 */
export function usePreferences(initial: PreferencesSnapshot): PreferencesState {
  const [preferences, setPreferences] = useState(initial.preferences)
  const [issue, setIssue] = useState(initial.issue)
  const [saving, setSaving] = useState(false)
  const active = useRef(true)
  const inFlight = useRef(false)

  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
    }
  }, [])

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = preferences.theme
  }, [preferences.theme])

  useLayoutEffect(() => {
    document.documentElement.lang = preferences.language
    // Both catalogs are already bundled and initialized; changes need no restart or network access.
    void i18n.changeLanguage(preferences.language)
  }, [preferences.language])

  /** Saves one complete draft; returns false without discarding it when persistence fails. */
  async function savePreferences(nextPreferences: AppPreferences): Promise<boolean> {
    if (inFlight.current) return false
    inFlight.current = true
    setIssue(null)
    setSaving(true)
    try {
      const next = await window.desktop.updatePreferences(nextPreferences)
      if (!active.current) return false
      if (next.issue) {
        setIssue(next.issue)
        return false
      }
      setPreferences(next.preferences)
      return true
    } catch {
      if (active.current) setIssue('save-failed')
      return false
    } finally {
      inFlight.current = false
      if (active.current) setSaving(false)
    }
  }

  /** Save feedback belongs to the current editor; loading warnings remain until a successful save. */
  function clearSaveIssue(): void {
    setIssue((current) => (current === 'save-failed' ? null : current))
  }

  return { preferences, issue, saving, savePreferences, clearSaveIssue }
}
