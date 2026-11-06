import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import type { DemoSnapshot, DesktopCommand } from '../../shared/desktop-api'
import fontLicenseUrl from './assets/fonts/OFL.txt?url&no-inline'
import GameSurface from './components/GameSurface'

/**
 * Presents the authoritative main-process state without owning simulation or privileged APIs.
 * Shield pages intentionally render no controls and receive no preload bridge.
 */
function App(): React.JSX.Element {
  const shield = new URLSearchParams(window.location.search).get('surface') === 'shield'
  return shield ? <div className="input-shield" aria-hidden="true" /> : <DemoMenu />
}

/** Owns bridge subscriptions and the local error UI; StrictMode cleanup prevents duplicate listeners. */
function DemoMenu(): React.JSX.Element {
  const [snapshot, setSnapshot] = useState<DemoSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)
  const menuButton = useRef<HTMLButtonElement>(null)
  const playing = snapshot?.status === 'playing'

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
        if (active)
          setError('The desktop connection is unavailable. Close this window with Alt+F4.')
      })
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!playing) menuButton.current?.focus()
  }, [playing, snapshot?.status])

  /** Sends only allowlisted intents; a failed command never silently resumes or restarts the game. */
  async function request(command: DesktopCommand): Promise<void> {
    setError(null)
    try {
      const next = await window.desktop.command(command)
      setSnapshot((current) => (!current || next.revision >= current.revision ? next : current))
      if (
        (command === 'start' || command === 'resume') &&
        next.status !== 'playing' &&
        next.message
      ) {
        setError(next.message)
      }
    } catch {
      setError('The action could not be completed. Please try again, or close with Alt+F4.')
    }
  }

  /**
   * Cycles focus through enabled menu buttons without intercepting system key combinations.
   * Enter and Space keep the buttons' native activation behavior, avoiding duplicate commands.
   */
  function navigateMenu(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
    const previous = event.key === 'ArrowUp' || event.key === 'ArrowLeft'
    const next = event.key === 'ArrowDown' || event.key === 'ArrowRight'
    if (!previous && !next) return

    const buttons = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')
    )
    if (buttons.length === 0) return
    event.preventDefault()
    const currentIndex = buttons.findIndex((button) => button === document.activeElement)
    const direction = previous ? -1 : 1
    let nextIndex = previous ? buttons.length - 1 : 0
    if (currentIndex >= 0) {
      nextIndex = (currentIndex + direction + buttons.length) % buttons.length
    }
    buttons[nextIndex]?.focus()
  }

  if (playing) return <GameSurface />

  const paused = snapshot?.status === 'paused'
  const busy = !snapshot || snapshot.activating || snapshot.status === 'exiting'
  return (
    <>
      {/* Ship attribution as a separate asset without adding legal or promotional text to the menu. */}
      <link rel="license" href={fontLicenseUrl} title="Press Start 2P font license" />
      <main className="menu-surface">
        <section className="menu-panel" aria-labelledby="menu-title">
          <h1 id="menu-title">Manager.exe</h1>
          <div
            className="menu-actions"
            role="group"
            aria-label="Game menu"
            onKeyDown={navigateMenu}
          >
            <button
              ref={menuButton}
              disabled={busy}
              aria-busy={snapshot?.activating ?? false}
              onClick={() => void request(paused ? 'resume' : 'start')}
            >
              {paused ? 'Resume' : 'Play'}
            </button>
            <button disabled title="Settings are not available yet">
              Settings
            </button>
            <button disabled={snapshot?.status === 'exiting'} onClick={() => void request('exit')}>
              Exit
            </button>
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </section>
      </main>
    </>
  )
}

export default App
