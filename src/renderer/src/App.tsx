import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { DemoSnapshot, DesktopCommand } from '../../shared/desktop-api'
import type { PreferencesSnapshot } from '../../shared/preferences'
import fontLicenseUrl from './assets/fonts/OFL.txt?url&no-inline'
import GameSurface from './components/GameSurface'
import SettingsPanel from './components/SettingsPanel'
import { usePreferences } from './hooks/use-preferences'
import { demoMessageKeys } from './i18n'
import { navigateMenu } from './menu-navigation'

/** Saved presentation preferences are loaded before the first menu render. */
interface AppProps {
  initialPreferences: PreferencesSnapshot
}

/** Presents main-process state. Shield pages intentionally receive no controls or preload bridge. */
function App({ initialPreferences }: AppProps): React.JSX.Element {
  const shield = new URLSearchParams(window.location.search).get('surface') === 'shield'
  return shield ? (
    <div className="input-shield" aria-hidden="true" />
  ) : (
    <DemoMenu initialPreferences={initialPreferences} />
  )
}

/** Owns bridge subscriptions and errors; StrictMode cleanup prevents duplicate listeners. */
function DemoMenu({ initialPreferences }: AppProps): React.JSX.Element {
  const { t } = useTranslation()
  const { preferences, issue, saving, savePreferences, clearSaveIssue } =
    usePreferences(initialPreferences)
  const [snapshot, setSnapshot] = useState<DemoSnapshot | null>(null)
  const [error, setError] = useState<'connection' | 'command' | null>(null)
  const [keyboardNavigation, setKeyboardNavigation] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const settingsButton = useRef<HTMLButtonElement>(null)
  const previousStatus = useRef<DemoSnapshot['status'] | undefined>(undefined)
  const playing = snapshot?.status === 'playing'
  const status = snapshot?.status

  useEffect(() => {
    let active = true
    const accept = (next: DemoSnapshot): void => {
      if (active)
        setSnapshot((current) => (!current || next.revision >= current.revision ? next : current))
    }
    // Subscribe before requesting initial data; revisions reject an older async reply.
    const unsubscribe = window.desktop.onSnapshot(accept)
    void window.desktop
      .getSnapshot()
      .then(accept)
      .catch(() => {
        if (active) setError('connection')
      })
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    const returningFromSettings = previousStatus.current === 'settings'
    const focusMenu = (): void => {
      if (document.hidden || !document.hasFocus() || (status !== 'ready' && status !== 'paused'))
        return
      // Restore logical focus only in the foreground; a background pause must not reactivate Electron.
      if (returningFromSettings) settingsButton.current?.focus()
      else menuButton.current?.focus()
    }
    focusMenu()
    previousStatus.current = status
    // User-driven native restoration may happen after the paused DOM has already mounted while hidden.
    window.addEventListener('focus', focusMenu)
    return () => window.removeEventListener('focus', focusMenu)
  }, [status])

  /** Sends allowlisted intents; stored error codes are translated using the currently selected language. */
  async function request(command: DesktopCommand): Promise<void> {
    setError(null)
    try {
      const next = await window.desktop.command(command)
      if (command === 'close-settings' && next.status !== 'settings') clearSaveIssue()
      setSnapshot((current) => (!current || next.revision >= current.revision ? next : current))
    } catch {
      setError('command')
    }
  }

  /** Reveals focus only after navigation input, not after startup or pointer-driven focus restoration. */
  function revealKeyboardFocus(event: KeyboardEvent<HTMLElement>): void {
    if (event.altKey || event.ctrlKey || event.metaKey) return
    if (event.key === 'Tab' || (!event.shiftKey && event.key.startsWith('Arrow'))) {
      setKeyboardNavigation(true)
    }
  }

  if (playing) return <GameSurface />

  const paused = status === 'paused'
  const busy = !snapshot || snapshot.activating || status === 'exiting'
  const notice = snapshot?.message ? demoMessageKeys[snapshot.message] : null
  const insets = snapshot?.workAreaInsets
  return (
    <>
      {/* Keep the complete font attribution bundled without visible legal text in the menu. */}
      <link rel="license" href={fontLicenseUrl} title="Press Start 2P" />
      <main
        className="menu-surface"
        data-keyboard-navigation={keyboardNavigation}
        onKeyDownCapture={revealKeyboardFocus}
        onPointerDownCapture={() => setKeyboardNavigation(false)}
      >
        <div
          className="menu-layout"
          data-position={paused ? 'paused' : 'centered'}
          style={{
            top: insets?.top ?? 0,
            right: insets?.right ?? 0,
            bottom: insets?.bottom ?? 0,
            left: insets?.left ?? 0
          }}
        >
          <section
            className={status === 'settings' ? 'menu-panel settings-panel' : 'menu-panel'}
            aria-labelledby="menu-title"
          >
            {snapshot?.status === 'settings' ? (
              <SettingsPanel
                preferences={preferences}
                displayMetrics={snapshot.displayMetrics}
                saving={saving}
                onSave={savePreferences}
                onBack={() => void request('close-settings')}
              />
            ) : (
              <>
                <h1 id="menu-title">Manager.exe</h1>
                <div
                  className="menu-actions"
                  role="group"
                  aria-label={t(($) => $.menu.label)}
                  onKeyDown={navigateMenu}
                >
                  <button
                    className="button-primary"
                    ref={menuButton}
                    disabled={busy}
                    aria-busy={snapshot?.activating ?? false}
                    onClick={() => void request(paused ? 'resume' : 'start')}
                  >
                    {paused ? t(($) => $.menu.resume) : t(($) => $.menu.play)}
                  </button>
                  <button
                    ref={settingsButton}
                    disabled={busy}
                    onClick={() => void request('open-settings')}
                  >
                    {t(($) => $.menu.settings)}
                  </button>
                  <button disabled={status === 'exiting'} onClick={() => void request('exit')}>
                    {t(($) => $.menu.exit)}
                  </button>
                </div>
                {notice && (
                  <p
                    className={snapshot?.message === 'overlay-failed' ? 'error' : 'menu-notice'}
                    role="status"
                  >
                    {t(($) => $.notices[notice])}
                  </p>
                )}
              </>
            )}
            {issue && (
              <p className="error" role="alert">
                {issue === 'load-failed'
                  ? t(($) => $.errors.loadPreferences)
                  : t(($) => $.errors.savePreferences)}
              </p>
            )}
            {error && (
              <p className="error" role="alert">
                {t(($) => $.errors[error])}
              </p>
            )}
          </section>
        </div>
      </main>
    </>
  )
}

export default App
