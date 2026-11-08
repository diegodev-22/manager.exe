import { BrowserWindow, desktopCapturer, session } from 'electron'
import { release } from 'node:os'
import captureDocument from './introduction-capture.html?asset'
import { INTRODUCTION_FRAME_LIMITS, type IntroductionFrame } from '../shared/desktop-api'

/**
 * Fixed trusted script, executed only in the private, sandboxed acquisition window. A short-lived
 * display-media stream supplies ONE stored frame; no audio, recording, network, or file output.
 * Destroying the window stops the stream even if its JS fails or stalls. Output pixels are bounded
 * before canvas allocation; the canvas and tracks are released before returning encoded bytes.
 */
const frameScript = `
(async () => {
  let stream
  let video
  let canvas
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      audio: false,
      video: { width: { max: ${INTRODUCTION_FRAME_LIMITS.maximumEdge} }, height: { max: ${INTRODUCTION_FRAME_LIMITS.maximumEdge} } }
    })
    video = document.createElement('video')
    video.muted = true
    video.srcObject = stream
    await video.play()
    await new Promise(resolve => video.requestVideoFrameCallback(resolve))
    const width = video.videoWidth
    const height = video.videoHeight
    if (!width || !height || width > 16384 || height > 16384 || width * height > 67108864)
      throw new Error('Unsupported frame dimensions.')
    const ratio = Math.min(1, ${INTRODUCTION_FRAME_LIMITS.maximumEdge} / Math.max(width, height), Math.sqrt(${INTRODUCTION_FRAME_LIMITS.maximumPixels} / (width * height)))
    canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.floor(width * ratio))
    canvas.height = Math.max(1, Math.floor(height * ratio))
    const context = canvas.getContext('2d', { alpha: false })
    if (!context) throw new Error('Canvas unavailable.')
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    stream.getTracks().forEach(track => track.stop())
    return { width: canvas.width, height: canvas.height, dataUrl: canvas.toDataURL('image/png') }
  } finally {
    if (stream) stream.getTracks().forEach(track => track.stop())
    if (video) { video.pause(); video.srcObject = null }
    if (canvas) { canvas.width = 0; canvas.height = 0 }
  }
})()
`

/**
 * Acquires the primary display only, without producing thumbnails for any other display.
 * Requires Windows 10 build 19041+ exclusion support; older systems use the no-capture fallback.
 * A private in-memory Electron session denies every unrelated permission and all navigation.
 * Protection is temporary: restoring its original value and destroying the helper are synchronous
 * and idempotent on timeout/abort. A late old cleanup cannot unprotect a newer capture.
 * @param primary - The existing game window; never hidden, focused, promoted, or resized here.
 * @param displayId - Main-owned primary display identity, not an arbitrary renderer-selected source.
 * @param signal - The activation owner aborts acquisition on interruption or renderer cancellation.
 * @returns A bounded PNG frame, or null when capture is cancelled, unavailable, or fails.
 */
export function readIntroductionFrame(
  primary: BrowserWindow,
  displayId: number,
  signal: AbortSignal
): Promise<IntroductionFrame | null> {
  const build = Number(release().split('.')[2])
  if (signal.aborted || !Number.isFinite(build) || build < 19041 || primary.isDestroyed())
    return Promise.resolve(null)

  return new Promise((resolve) => {
    // Reuse one private memory-only session rather than accumulating partition caches on resumes.
    const captureSession = session.fromPartition('introduction-frame')
    let helper: BrowserWindow | undefined
    let consumed = false
    let settled = false
    let settleTimer: ReturnType<typeof setTimeout> | undefined
    const wasProtected = primary.isContentProtected()
    const deadline = setTimeout(() => finish(null), 3500)

    /** Destruction is also the main-process kill switch for an unresponsive acquisition renderer. */
    const finish = (frame: IntroductionFrame | null): void => {
      if (settled) return
      settled = true
      clearTimeout(deadline)
      if (settleTimer !== undefined) clearTimeout(settleTimer)
      signal.removeEventListener('abort', onAbort)
      captureSession.setDisplayMediaRequestHandler(null)
      captureSession.setPermissionCheckHandler(() => false)
      captureSession.setPermissionRequestHandler((_contents, _permission, callback) =>
        callback(false)
      )
      if (helper && !helper.isDestroyed()) helper.destroy()
      try {
        if (!primary.isDestroyed()) primary.setContentProtection(wasProtected)
      } catch {
        // Native teardown can race window destruction; never turn that into an unhandled timer error.
        resolve(null)
        return
      }
      resolve(frame)
    }
    const onAbort = (): void => finish(null)
    signal.addEventListener('abort', onAbort, { once: true })
    captureSession.setPermissionCheckHandler(
      (contents, permission) =>
        !settled &&
        !!helper &&
        !helper.isDestroyed() &&
        contents === helper.webContents &&
        permission === 'display-capture'
    )
    // Chromium reports display-media acquisition as a video "media" permission request. Only the
    // fixed helper's main frame can receive it; the display handler below still selects the screen.
    captureSession.setPermissionRequestHandler((contents, permission, callback, details) => {
      callback(
        !settled &&
          !!helper &&
          !helper.isDestroyed() &&
          contents === helper.webContents &&
          details.isMainFrame &&
          permission === 'media' &&
          'mediaTypes' in details &&
          // Display capture reports an empty mediaTypes list in Electron; audio is never allowed.
          details.mediaTypes?.every((kind) => kind === 'video') === true
      )
    })
    captureSession.setDisplayMediaRequestHandler(
      (request, callback) => {
        if (
          settled ||
          consumed ||
          !helper ||
          helper.isDestroyed() ||
          request.frame !== helper.webContents.mainFrame ||
          !request.videoRequested ||
          request.audioRequested
        ) {
          callback({})
          return
        }
        consumed = true
        // Zero-sized thumbnails enumerate identities without reading every connected screen's pixels.
        void desktopCapturer
          .getSources({
            types: ['screen'],
            thumbnailSize: { width: 0, height: 0 },
            fetchWindowIcons: false
          })
          .then((sources) => {
            const source = sources.find((candidate) => candidate.display_id === String(displayId))
            callback(!settled && source ? { video: source } : {})
          })
          .catch(() => callback({}))
      },
      { useSystemPicker: false }
    )

    try {
      primary.setContentProtection(true)
      helper = new BrowserWindow({
        show: false,
        skipTaskbar: true,
        focusable: false,
        webPreferences: {
          session: captureSession,
          sandbox: true,
          contextIsolation: true,
          nodeIntegration: false,
          // Only this disposable, hidden acquisition page needs one unthrottled video frame.
          backgroundThrottling: false,
          devTools: false
        }
      })
      helper.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
      helper.webContents.on('will-navigate', (event) => event.preventDefault())
      helper.webContents.on('will-attach-webview', (event) => event.preventDefault())
      helper.webContents.once('render-process-gone', () => finish(null))
      helper.webContents.once('unresponsive', () => finish(null))
      helper.once('closed', () => finish(null))
      const page = helper
      // Display-affinity changes take effect at a later DWM composition. Do not capture immediately.
      settleTimer = setTimeout(() => {
        if (settled) return
        void page
          .loadFile(captureDocument)
          .then(() => (settled ? null : page.webContents.executeJavaScript(frameScript, true)))
          .then((result: unknown) => {
            if (settled) return
            if (
              !result ||
              typeof result !== 'object' ||
              !('width' in result) ||
              !('height' in result) ||
              !('dataUrl' in result) ||
              typeof result.width !== 'number' ||
              typeof result.height !== 'number' ||
              !Number.isSafeInteger(result.width) ||
              !Number.isSafeInteger(result.height) ||
              result.width < 1 ||
              result.height < 1 ||
              Math.max(result.width, result.height) > INTRODUCTION_FRAME_LIMITS.maximumEdge ||
              result.width * result.height > INTRODUCTION_FRAME_LIMITS.maximumPixels ||
              typeof result.dataUrl !== 'string' ||
              !result.dataUrl.startsWith('data:image/png;base64,') ||
              result.dataUrl.length > (INTRODUCTION_FRAME_LIMITS.maximumBytes * 4) / 3 + 24
            )
              return finish(null)
            const bytes = Buffer.from(result.dataUrl.slice(22), 'base64')
            if (bytes.length > INTRODUCTION_FRAME_LIMITS.maximumBytes) return finish(null)
            finish({ width: result.width, height: result.height, bytes })
          })
          .catch(() => finish(null))
      }, 150)
    } catch {
      finish(null)
    }
  })
}
