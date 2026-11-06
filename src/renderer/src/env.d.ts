/// <reference types="vite/client" />

import type { DesktopApi } from '../../shared/desktop-api'

declare global {
  interface Window {
    /** Narrow sandboxed bridge; no Node.js or raw IPC objects are exposed. */
    readonly desktop: DesktopApi
  }
}
