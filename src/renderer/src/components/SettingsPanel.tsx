import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AppPreferences } from '../../../shared/preferences'
import { navigateMenu } from '../menu-navigation'

/** Settings are presented from ready or paused; neither changing a choice nor Back resumes play. */
interface SettingsPanelProps {
  preferences: AppPreferences
  saving: boolean
  onSave(preferences: AppPreferences): Promise<boolean>
  onBack(): void
}

/**
 * Owns an unapplied theme/language draft, explicit save, and guarded Back/Escape navigation.
 * The native modal dialog supplies focus containment; cancellation restores the original control.
 * Drafts never change global presentation and are discarded when this panel unmounts.
 * Saving applies committed preferences in place; only Back/Escape or confirmed discard navigates.
 */
export default function SettingsPanel({
  preferences,
  saving,
  onSave,
  onBack
}: SettingsPanelProps): React.JSX.Element {
  const { t } = useTranslation()
  const panel = useRef<HTMLDivElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const backButton = useRef<HTMLButtonElement>(null)
  const keepEditingButton = useRef<HTMLButtonElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const [draft, setDraft] = useState(preferences)
  const dirty = draft.theme !== preferences.theme || draft.language !== preferences.language

  useEffect(() => {
    const focusChoice = (): void => {
      if (document.hidden || !document.hasFocus() || dialog.current?.open) return
      if (document.activeElement && panel.current?.contains(document.activeElement)) return
      panel.current?.querySelector<HTMLInputElement>('input:checked')?.focus()
    }
    focusChoice()
    // Keep drafts mounted during minimization; only restore control focus after the user returns.
    window.addEventListener('focus', focusChoice)
    return () => window.removeEventListener('focus', focusChoice)
  }, [])

  /** Opens a localized discard warning only when the draft differs from the applied preferences. */
  const requestBack = useCallback((): void => {
    if (saving) return
    if (!dirty) {
      onBack()
      return
    }
    if (!dialog.current || dialog.current.open) return
    returnFocus.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialog.current.showModal()
    // Continuing to edit is the safe default for Enter; discarding always requires an explicit choice.
    keepEditingButton.current?.focus()
  }, [dirty, onBack, saving])

  useEffect(() => {
    const onEscape = (event: KeyboardEvent): void => {
      if (
        event.key !== 'Escape' ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.defaultPrevented ||
        dialog.current?.open
      )
        return
      event.preventDefault()
      if (!event.repeat) requestBack()
    }
    // Own Escape for this mounted page, including when a mouse click leaves focus on the document.
    // Native modal cancellation is left alone; unmounting removes the listener before gameplay.
    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [requestBack])

  /** Native dialog cancellation (including Escape) never discards the draft. */
  function keepEditing(): void {
    dialog.current?.close()
    if (returnFocus.current?.isConnected) returnFocus.current.focus()
  }

  /** Clears the draft before requesting a return, even if the bridge command later fails. */
  function discardAndBack(): void {
    dialog.current?.close()
    setDraft(preferences)
    onBack()
  }

  /** Applies a successful save without leaving settings; failures keep the editable draft intact. */
  async function saveDraft(): Promise<void> {
    if (saving || !dirty) return
    if (await onSave(draft)) {
      // Save disappears once the draft is committed; keep keyboard focus on the remaining Back button.
      if (!document.hidden && document.hasFocus()) backButton.current?.focus()
    }
  }

  return (
    <>
      <h1 id="menu-title">{t(($) => $.settings.title)}</h1>
      <div
        className="settings-controls"
        ref={panel}
        onKeyDown={navigateMenu}
        role="group"
        aria-labelledby="menu-title"
      >
        <fieldset disabled={saving}>
          <legend>{t(($) => $.settings.theme)}</legend>
          <div className="settings-options">
            {(['dark', 'light'] as const).map((theme) => (
              <label key={theme} className="settings-option">
                <input
                  type="radio"
                  name="theme"
                  value={theme}
                  checked={draft.theme === theme}
                  onChange={() => setDraft((current) => ({ ...current, theme }))}
                />
                <span>{t(($) => $.settings[theme])}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset disabled={saving}>
          <legend>{t(($) => $.settings.language)}</legend>
          <div className="settings-options">
            {(['en', 'es'] as const).map((language) => (
              <label key={language} className="settings-option">
                <input
                  type="radio"
                  name="language"
                  value={language}
                  checked={draft.language === language}
                  onChange={() => setDraft((current) => ({ ...current, language }))}
                />
                <span lang={language}>{language === 'en' ? 'English' : 'Español'}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="settings-actions">
          {dirty && (
            <button
              className="button-primary"
              aria-disabled={saving}
              aria-busy={saving}
              onClick={() => void saveDraft()}
            >
              {saving ? t(($) => $.settings.saving) : t(($) => $.settings.save)}
            </button>
          )}
          <button ref={backButton} aria-disabled={saving} onClick={requestBack}>
            {t(($) => $.settings.back)}
          </button>
        </div>
      </div>
      <dialog
        ref={dialog}
        className="discard-dialog"
        aria-labelledby="discard-title"
        aria-describedby="discard-description"
        onKeyDown={navigateMenu}
        onCancel={(event) => {
          event.preventDefault()
          keepEditing()
        }}
      >
        <h2 id="discard-title">{t(($) => $.settings.discardTitle)}</h2>
        <p id="discard-description">{t(($) => $.settings.discardDescription)}</p>
        <div className="discard-actions">
          <button className="button-primary" ref={keepEditingButton} onClick={keepEditing}>
            {t(($) => $.settings.keepEditing)}
          </button>
          <button onClick={discardAndBack}>{t(($) => $.settings.discardAndBack)}</button>
        </div>
      </dialog>
    </>
  )
}
