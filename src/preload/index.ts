import { contextBridge, ipcRenderer } from 'electron'
import {
  desktopChannels,
  isDesktopCommand,
  type CursorPosition,
  type DemoSnapshot,
  type DesktopApi
} from '../shared/desktop-api'
import { isPreferencesUpdate } from '../shared/preferences'

/** Exposes only demo intents and subscriptions, never raw IPC or native window operations. */
const desktop: DesktopApi = {
  getPreferences: () => ipcRenderer.invoke(desktopChannels.preferences),
  updatePreferences: (update) => {
    if (!isPreferencesUpdate(update))
      return Promise.reject(new Error('Unsupported preferences update.'))
    return ipcRenderer.invoke(desktopChannels.updatePreferences, update)
  },
  getSnapshot: () => ipcRenderer.invoke(desktopChannels.snapshot),
  command: (command) => {
    if (!isDesktopCommand(command)) return Promise.reject(new Error('Unsupported desktop command.'))
    return ipcRenderer.invoke(desktopChannels.command, command)
  },
  onSnapshot: (listener) => {
    const handler = (_event: Electron.IpcRendererEvent, snapshot: DemoSnapshot): void => {
      listener(snapshot)
    }
    ipcRenderer.on(desktopChannels.changed, handler)
    return () => ipcRenderer.removeListener(desktopChannels.changed, handler)
  },
  onCursor: (listener) => {
    const handler = (_event: Electron.IpcRendererEvent, position: CursorPosition): void => {
      listener(position)
    }
    ipcRenderer.on(desktopChannels.cursor, handler)
    return () => ipcRenderer.removeListener(desktopChannels.cursor, handler)
  }
}

contextBridge.exposeInMainWorld('desktop', desktop)
