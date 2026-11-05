import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

/**
 * Creates the sandboxed desktop window and loads its renderer.
 *
 * @remarks
 * Window-level listeners belong here; application-level listeners are registered once after
 * Electron is ready. Development uses Vite, while packaged builds load local renderer files.
 */
function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    title: 'Manager.exe',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      // Renderer code has no direct Node privileges; future desktop access must use scoped preload APIs.
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Wait for the renderer's first paint instead of exposing an uninitialized window.
  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // Renderer-initiated links must not open extra windows or navigate to arbitrary content.
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  mainWindow.webContents.on('will-navigate', (event) => {
    event.preventDefault()
  })

  // Use the development server for HMR and local files in production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Native window APIs require Electron readiness, so defer window creation until that event.
app.whenReady().then(() => {
  // Keep this identifier aligned with appId in electron-builder.yml for Windows integration.
  electronApp.setAppUserModelId('com.managerexe.app')

  // Enable development shortcuts and disable reload shortcuts in production.
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()
})

// The current Windows lifecycle ends when its last window closes; macOS dock behavior is not implemented.
app.on('window-all-closed', () => {
  app.quit()
})
