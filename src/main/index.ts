import { app, BrowserWindow, ipcMain, screen, type IpcMainInvokeEvent } from 'electron'
import { join } from 'path'
import { electronApp, is } from '@electron-toolkit/utils'
import { DemoController } from './demo-controller'
import { clampCursor, getWorkAreaInsets, isPrimarySender } from './desktop-boundaries'
import { PreferencesStore } from './preferences-store'
import { desktopChannels, isDesktopCommand, type DemoSnapshot } from '../shared/desktop-api'
import { isPreferencesUpdate } from '../shared/preferences'

/** Loads the same local renderer with a presentation-only role, never a privilege-bearing query. */
function loadRenderer(window: BrowserWindow, shield = false): Promise<void> {
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    const url = new URL(process.env['ELECTRON_RENDERER_URL'])
    if (shield) url.searchParams.set('surface', 'shield')
    return window.loadURL(url.toString())
  }
  return window.loadFile(join(__dirname, '../renderer/index.html'), {
    query: shield ? { surface: 'shield' } : {}
  })
}

/** Applies identical sandbox and navigation boundaries to the menu and every input shield. */
function secureWindow(window: BrowserWindow): void {
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  window.webContents.on('will-navigate', (event) => event.preventDefault())
  window.webContents.on('will-attach-webview', (event) => event.preventDefault())
  window.webContents.on('context-menu', (event) => event.preventDefault())
  window.setMenu(null)
}

/**
 * Loads a hidden shield with an owned deadline and immediate cancellation on window destruction.
 * Both the native listener and timer are released on success, failure, pause, or shutdown.
 */
async function loadShield(window: BrowserWindow): Promise<void> {
  let timeout: ReturnType<typeof setTimeout> | undefined
  let onClosed = (): void => {}
  try {
    await new Promise<void>((resolve, reject) => {
      onClosed = () => reject(new Error('The shield was closed before loading completed.'))
      window.once('closed', onClosed)
      timeout = setTimeout(() => reject(new Error('The shield took too long to load.')), 10000)
      void loadRenderer(window, true).then(resolve, reject)
    })
  } finally {
    if (timeout) clearTimeout(timeout)
    window.removeListener('closed', onClosed)
  }
}

/**
 * Owns the primary window, all display shields, native input, and their cleanup as one lifecycle.
 * No global input hooks, cursor clipping, desktop capture, or shortcut interception are used.
 */
function createDesktopDemo(preferences: PreferencesStore): void {
  // Keep one display-sized transparent surface from startup so edge shading stays at screen edges.
  // The renderer owns the compact menu card; this is not exclusive fullscreen or kiosk mode.
  const primaryDisplay = screen.getPrimaryDisplay()
  const { bounds, workArea } = primaryDisplay
  const mainWindow = new BrowserWindow({
    ...bounds,
    title: 'Manager.exe',
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    resizable: false,
    movable: false,
    maximizable: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  secureWindow(mainWindow)

  let shields = new Set<BrowserWindow>()
  let playBounds = screen.getPrimaryDisplay().bounds
  let overlayActive = false
  let disposed = false
  let yieldingDesktop = false
  let focusLossCheck: ReturnType<typeof setImmediate> | undefined
  let lastPointerPosition = screen.getCursorScreenPoint()
  /** Native activation is allowed only while the user is actually in this visible application. */
  function isForegroundWindow(): boolean {
    return (
      !disposed &&
      !mainWindow.isDestroyed() &&
      mainWindow.isVisible() &&
      !mainWindow.isMinimized() &&
      mainWindow.isFocused()
    )
  }

  /** Never resize a minimized/background window: Windows may otherwise bring it back to the front. */
  function alignForegroundWindow(): void {
    if (!isForegroundWindow()) return
    const current = mainWindow.getBounds()
    if (
      current.x !== playBounds.x ||
      current.y !== playBounds.y ||
      current.width !== playBounds.width ||
      current.height !== playBounds.height
    ) {
      mainWindow.setBounds(playBounds)
    }
  }

  /** Removes invisible blockers first, then restores a normal, non-topmost menu without focus theft. */
  function releaseOverlay(): void {
    const previousShields = shields
    shields = new Set()
    for (const shield of previousShields) {
      if (!shield.isDestroyed()) shield.destroy()
    }
    if (!mainWindow.isDestroyed() && mainWindow.isAlwaysOnTop()) {
      mainWindow.setAlwaysOnTop(false)
    }
    overlayActive = false
  }

  /** Publishes presentation state only to the primary renderer, not to unprivileged shield pages. */
  function publish(snapshot: DemoSnapshot): void {
    if (!mainWindow.isDestroyed() && !mainWindow.webContents.isDestroyed()) {
      mainWindow.webContents.send(desktopChannels.changed, snapshot)
    }
  }

  const controller = new DemoController(
    {
      prepareOverlay: async () => {
        if (!isForegroundWindow()) throw new Error('The menu must be focused to play.')
        playBounds = screen.getPrimaryDisplay().bounds
        const primaryId = screen.getPrimaryDisplay().id
        const batch = new Set<BrowserWindow>()
        shields = batch
        try {
          await Promise.all(
            screen
              .getAllDisplays()
              .filter((display) => display.id !== primaryId)
              .map(async (display) => {
                const shield = new BrowserWindow({
                  ...display.bounds,
                  show: false,
                  frame: false,
                  transparent: true,
                  backgroundColor: '#00000000',
                  hasShadow: false,
                  resizable: false,
                  // Secondary clicks must not activate another window and steal Escape from the game.
                  focusable: false,
                  skipTaskbar: true,
                  webPreferences: {
                    sandbox: true,
                    contextIsolation: true,
                    nodeIntegration: false
                  }
                })
                batch.add(shield)
                secureWindow(shield)
                bindGameInput(shield, false)
                const onShieldFailure = (): void => {
                  // Events from an old, cancelled batch must not pause a newer active session.
                  if (shields === batch) {
                    controller.interrupt('shield-stopped')
                  }
                }
                shield.on('closed', onShieldFailure)
                shield.webContents.on('render-process-gone', onShieldFailure)
                shield.webContents.on('unresponsive', onShieldFailure)
                shield.webContents.on('did-start-loading', () => {
                  if (overlayActive) onShieldFailure()
                })
                await loadShield(shield)
                if (shields !== batch || shield.isDestroyed())
                  throw new Error('Overlay activation cancelled.')
              })
          )
          if (!isForegroundWindow() || shields !== batch) {
            throw new Error('Overlay activation cancelled.')
          }
        } catch (error) {
          // Destroy only this request's windows; a cancelled request must not affect a newer batch.
          for (const shield of batch) {
            if (!shield.isDestroyed()) shield.destroy()
          }
          throw error
        }
      },
      enterOverlay: () => {
        const batch = shields
        /** Native window changes can synchronously blur/minimize and cancel this activation. */
        const requireActiveOverlay = (): void => {
          if (
            disposed ||
            mainWindow.isDestroyed() ||
            mainWindow.isMinimized() ||
            shields !== batch ||
            controller.getSnapshot().status !== 'playing'
          ) {
            throw new Error('Overlay activation cancelled.')
          }
        }
        if (!isForegroundWindow()) throw new Error('The menu must be focused to play.')
        requireActiveOverlay()
        alignForegroundWindow()
        requireActiveOverlay()
        lastPointerPosition = screen.getCursorScreenPoint()
        overlayActive = true
        // The focused primary window already owns gameplay input. Promoting this transparent
        // window to topmost can disturb Windows z-order/focus; only secondary shields need it.
        for (const shield of batch) {
          requireActiveOverlay()
          shield.setAlwaysOnTop(true)
          shield.showInactive()
        }
        requireActiveOverlay()
        // The menu was already focused. Never call focus/show/restore here to recover activation:
        // an Alt+Tab or Win+Tab during startup belongs to the user, not to a pending Play request.
        // Focus notifications caused by native style changes settle through the owned blur check.
      },
      releaseOverlay,
      publish,
      quit: () => app.quit()
    },
    getWorkAreaInsets(bounds, workArea)
  )

  /**
   * Reads pointer positions only from native events delivered to our own windows.
   * Electron supplies screen positions in DIP; no polling or system cursor mutation is needed.
   */
  function bindGameInput(window: BrowserWindow, primary: boolean): void {
    window.webContents.on('before-mouse-event', (_event, input) => {
      if (controller.getSnapshot().status !== 'playing') return
      const position = screen.getCursorScreenPoint()
      // Compare screen-space positions before clamping: motion on a secondary display must still
      // hide idle help, even when the virtual cursor remains pinned to the primary display's edge.
      if (position.x !== lastPointerPosition.x || position.y !== lastPointerPosition.y) {
        lastPointerPosition = position
        if (!mainWindow.isDestroyed()) {
          mainWindow.webContents.send(desktopChannels.cursor, clampCursor(position, playBounds))
        }
      }
      if (primary && input.type === 'mouseDown' && input.button === 'left') controller.recordHit()
    })
    window.webContents.on('before-input-event', (event, input) => {
      if (
        input.type === 'keyDown' &&
        input.key === 'Escape' &&
        !input.isAutoRepeat &&
        !input.alt &&
        !input.control &&
        !input.meta &&
        !input.shift
      ) {
        // Settings owns the editable draft and its discard dialog. Let Escape reach that renderer
        // instead of bypassing confirmation through a main-process close-settings command.
        if (controller.getSnapshot().status !== 'settings') {
          event.preventDefault()
          controller.interrupt('paused')
        }
      }
    })
  }
  bindGameInput(mainWindow, true)

  /**
   * Sender identity and main-frame identity come from Electron, never renderer-supplied fields.
   * Shield windows and child frames cannot request privileged actions or snapshots.
   */
  function requirePrimary(event: IpcMainInvokeEvent): void {
    if (
      !isPrimarySender(
        event.sender.id,
        mainWindow.isDestroyed() ? -1 : mainWindow.webContents.id,
        event.senderFrame !== null && event.senderFrame === event.sender.mainFrame,
        mainWindow.isDestroyed() || event.sender.isDestroyed()
      )
    ) {
      throw new Error('Unauthorized desktop request.')
    }
  }
  ipcMain.handle(desktopChannels.snapshot, (event, ...args: unknown[]) => {
    requirePrimary(event)
    if (args.length !== 0) throw new Error('Unexpected snapshot arguments.')
    return controller.getSnapshot()
  })
  ipcMain.handle(desktopChannels.command, (event, ...args: unknown[]) => {
    requirePrimary(event)
    const command = args[0]
    if (args.length !== 1 || !isDesktopCommand(command))
      throw new Error('Unsupported desktop command.')
    if ((command === 'start' || command === 'resume') && !isForegroundWindow()) {
      throw new Error('Focus the menu before playing.')
    }
    return controller.command(command)
  })
  ipcMain.handle(desktopChannels.preferences, (event, ...args: unknown[]) => {
    requirePrimary(event)
    if (args.length !== 0) throw new Error('Unexpected preferences arguments.')
    return preferences.getSettledSnapshot()
  })
  ipcMain.handle(desktopChannels.updatePreferences, (event, ...args: unknown[]) => {
    requirePrimary(event)
    if (args.length !== 1 || !isPreferencesUpdate(args[0])) {
      throw new Error('Unsupported preferences update.')
    }
    if (controller.getSnapshot().status !== 'settings') {
      throw new Error('Preferences can only be changed from settings.')
    }
    return preferences.update(args[0])
  })

  /** Releases input and minimizes every view on task switching, without changing ready/settings state. */
  function yieldDesktop(): void {
    if (
      yieldingDesktop ||
      disposed ||
      mainWindow.isDestroyed() ||
      mainWindow.isFocused() ||
      controller.getSnapshot().status === 'exiting'
    )
      return
    // Minimizing/dropping topmost can emit more blur/minimize events; do not re-enter cleanup.
    yieldingDesktop = true
    try {
      controller.interrupt('focus-lost')
      // interrupt is intentionally a no-op in menus/settings, but no native overlay may remain.
      releaseOverlay()
      if (
        !disposed &&
        !mainWindow.isDestroyed() &&
        !mainWindow.isMinimized() &&
        controller.getSnapshot().status !== 'exiting'
      )
        mainWindow.minimize()
    } finally {
      yieldingDesktop = false
    }
  }
  /** Cancels the one pending check when Windows completes focus restoration or shutdown starts. */
  function cancelFocusLossCheck(): void {
    if (focusLossCheck === undefined) return
    clearImmediate(focusLossCheck)
    focusLossCheck = undefined
  }

  /**
   * Windows can emit blur while isFocused() is already true during restoration/topmost changes.
   * Decide on the next main-loop turn, not on that notification alone; never try to reclaim focus.
   */
  function checkFocusLoss(): void {
    if (
      disposed ||
      yieldingDesktop ||
      mainWindow.isDestroyed() ||
      mainWindow.isMinimized() ||
      mainWindow.isFocused() ||
      focusLossCheck !== undefined
    )
      return
    focusLossCheck = setImmediate(() => {
      focusLossCheck = undefined
      yieldDesktop()
    })
  }
  mainWindow.on('blur', checkFocusLoss)
  mainWindow.on('minimize', () => controller.interrupt('minimized'))
  mainWindow.webContents.on('did-start-loading', () => {
    controller.interrupt('reloaded')
  })
  mainWindow.webContents.on('unresponsive', () => {
    controller.interrupt('unresponsive')
  })
  mainWindow.webContents.on('render-process-gone', () => controller.shutdown())
  mainWindow.on('close', () => controller.shutdown())

  /** Updates metadata in the background; native geometry is applied only after user-driven focus. */
  function refreshDisplayLayout(): void {
    const display = screen.getPrimaryDisplay()
    playBounds = display.bounds
    alignForegroundWindow()
    controller.updateWorkAreaInsets(getWorkAreaInsets(display.bounds, display.workArea))
  }

  // Windows/taskbar/Alt+Tab restores the window. This listener only aligns it, never resumes or focuses it.
  mainWindow.on('focus', () => {
    cancelFocusLossCheck()
    refreshDisplayLayout()
  })
  const onDisplayChange = (): void => {
    controller.interrupt('display-changed')
    refreshDisplayLayout()
  }
  screen.on('display-added', onDisplayChange)
  screen.on('display-removed', onDisplayChange)
  screen.on('display-metrics-changed', onDisplayChange)

  /** Application shutdown owns all external subscriptions; window listeners die with their windows. */
  function dispose(): void {
    if (disposed) return
    disposed = true
    cancelFocusLossCheck()
    releaseOverlay()
    ipcMain.removeHandler(desktopChannels.snapshot)
    ipcMain.removeHandler(desktopChannels.command)
    ipcMain.removeHandler(desktopChannels.preferences)
    ipcMain.removeHandler(desktopChannels.updatePreferences)
    screen.removeListener('display-added', onDisplayChange)
    screen.removeListener('display-removed', onDisplayChange)
    screen.removeListener('display-metrics-changed', onDisplayChange)
    app.removeListener('before-quit', dispose)
  }
  app.on('before-quit', dispose)
  mainWindow.on('closed', dispose)
  mainWindow.once('ready-to-show', () => mainWindow.show())
  void loadRenderer(mainWindow).catch(() => controller.shutdown())
}

app
  .whenReady()
  .then(async () => {
    // Windows is the only current target; do not create invisible blockers on unsupported platforms.
    if (process.platform !== 'win32') {
      app.quit()
      return
    }
    electronApp.setAppUserModelId('com.managerexe.app')
    const preferences = new PreferencesStore(
      app.getPath('userData'),
      app.getPreferredSystemLanguages()
    )
    await preferences.load()
    createDesktopDemo(preferences)
  })
  .catch(() => app.quit())

app.on('window-all-closed', () => app.quit())
