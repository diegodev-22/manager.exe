import { app, BrowserWindow, ipcMain, screen, type IpcMainInvokeEvent } from 'electron'
import { join } from 'path'
import { electronApp, is } from '@electron-toolkit/utils'
import { DemoController } from './demo-controller'
import { clampCursor, isPrimarySender } from './desktop-boundaries'
import { desktopChannels, isDesktopCommand, type DemoSnapshot } from '../shared/desktop-api'

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
function createDesktopDemo(): void {
  const { workArea } = screen.getPrimaryDisplay()
  // Keep the ordinary menu compact; entering play still uses the primary display's full bounds.
  const width = Math.max(1, Math.min(480, workArea.width - 32))
  const height = Math.max(1, Math.min(420, workArea.height - 32))
  const mainWindow = new BrowserWindow({
    width,
    height,
    x: workArea.x + Math.floor((workArea.width - width) / 2),
    y: workArea.y + Math.floor((workArea.height - height) / 2),
    title: 'Manager.exe',
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    resizable: false,
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
  let menuBounds = mainWindow.getBounds()
  let overlayActive = false
  let disposed = false
  let lastPointerPosition = screen.getCursorScreenPoint()

  /** Removes invisible blockers first, then restores a normal, non-topmost menu without focus theft. */
  function releaseOverlay(): void {
    const previousShields = shields
    shields = new Set()
    for (const shield of previousShields) {
      if (!shield.isDestroyed()) shield.destroy()
    }
    if (!mainWindow.isDestroyed()) {
      mainWindow.setAlwaysOnTop(false)
      if (overlayActive) mainWindow.setBounds(menuBounds)
    }
    overlayActive = false
  }

  /** Publishes presentation state only to the primary renderer, not to unprivileged shield pages. */
  function publish(snapshot: DemoSnapshot): void {
    if (!mainWindow.isDestroyed() && !mainWindow.webContents.isDestroyed()) {
      mainWindow.webContents.send(desktopChannels.changed, snapshot)
    }
  }

  const controller = new DemoController({
    prepareOverlay: async () => {
      if (disposed || !mainWindow.isFocused()) throw new Error('The menu must be focused to play.')
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
                  controller.interrupt('A display shield stopped. Resume to rebuild the overlay.')
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
        if (disposed || !mainWindow.isFocused() || shields !== batch) {
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
      menuBounds = mainWindow.getBounds()
      lastPointerPosition = screen.getCursorScreenPoint()
      overlayActive = true
      mainWindow.setBounds(playBounds)
      mainWindow.setAlwaysOnTop(true)
      for (const shield of shields) {
        shield.setAlwaysOnTop(true)
        shield.showInactive()
      }
      // Showing the overlay follows an explicit Play/Resume gesture, not a focus-recovery loop.
      mainWindow.focus()
    },
    releaseOverlay,
    publish,
    quit: () => app.quit()
  })

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
      if (input.type === 'keyDown' && input.key === 'Escape' && !input.isAutoRepeat) {
        event.preventDefault()
        controller.interrupt('Paused. Resume when you are ready.')
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
    if ((command === 'start' || command === 'resume') && !mainWindow.isFocused()) {
      throw new Error('Focus the menu before playing.')
    }
    return controller.command(command)
  })

  mainWindow.on('blur', () => {
    // Shields cannot activate, so any primary blur is a reason to pause immediately, even if brief.
    controller.interrupt('Paused because you switched away. Select Resume to continue.')
  })
  mainWindow.on('minimize', () => controller.interrupt('Paused because the window was minimized.'))
  mainWindow.webContents.on('did-start-loading', () => {
    controller.interrupt('Paused because the interface was reloaded.')
  })
  mainWindow.webContents.on('unresponsive', () => {
    controller.interrupt('The interface stopped responding. You can close the window with Alt+F4.')
  })
  mainWindow.webContents.on('render-process-gone', () => controller.shutdown())
  mainWindow.on('close', () => controller.shutdown())

  const onDisplayChange = (): void => {
    controller.interrupt('The display layout changed. Select Resume to rebuild the overlay.')
  }
  screen.on('display-added', onDisplayChange)
  screen.on('display-removed', onDisplayChange)
  screen.on('display-metrics-changed', onDisplayChange)

  /** Application shutdown owns all external subscriptions; window listeners die with their windows. */
  function dispose(): void {
    if (disposed) return
    disposed = true
    releaseOverlay()
    ipcMain.removeHandler(desktopChannels.snapshot)
    ipcMain.removeHandler(desktopChannels.command)
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

app.whenReady().then(() => {
  // Windows is the only current target; do not create invisible blockers on unsupported platforms.
  if (process.platform !== 'win32') {
    app.quit()
    return
  }
  electronApp.setAppUserModelId('com.managerexe.app')
  createDesktopDemo()
})

app.on('window-all-closed', () => app.quit())
