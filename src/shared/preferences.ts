/** Supported player-facing languages; regional system tags are normalized before selection. */
export type AppLanguage = 'en' | 'es'

/** Explicit application themes; changing these never changes the Windows system theme. */
export type AppTheme = 'dark' | 'light'

/** Small, serializable preferences owned and persisted by the main process. */
export interface AppPreferences {
  readonly language: AppLanguage
  readonly theme: AppTheme
}

/** Allowlisted partial update; callers cannot choose a file path or change unrelated settings. */
export type PreferencesUpdate =
  | { readonly language: AppLanguage; readonly theme?: AppTheme }
  | { readonly theme: AppTheme; readonly language?: AppLanguage }

/** Revisioned storage result; issue codes are translated in the renderer, never exposed as paths. */
export interface PreferencesSnapshot {
  readonly revision: number
  readonly preferences: AppPreferences
  readonly issue: 'load-failed' | 'save-failed' | null
}

/** Matches a supported base language, trying the system preference list in priority order. */
export function getDefaultPreferences(systemLanguages: readonly string[]): AppPreferences {
  for (const language of systemLanguages) {
    const base = language.toLowerCase().split('-')[0]
    if (base === 'en' || base === 'es') return { language: base, theme: 'dark' }
  }
  return { language: 'en', theme: 'dark' }
}

/** Rejects empty updates, unknown properties, and values outside the supported choices. */
export function isPreferencesUpdate(value: unknown): value is PreferencesUpdate {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const keys = Object.keys(value)
  if (keys.length === 0 || keys.some((key) => key !== 'language' && key !== 'theme')) return false
  return (
    (!('language' in value) || value.language === 'en' || value.language === 'es') &&
    (!('theme' in value) || value.theme === 'dark' || value.theme === 'light')
  )
}

/** Requires both allowlisted choices when loading untrusted JSON from disk. */
export function isAppPreferences(value: unknown): value is AppPreferences {
  return isPreferencesUpdate(value) && 'language' in value && 'theme' in value
}
