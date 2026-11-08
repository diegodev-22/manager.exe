import { INTRODUCTION_FRAME_LIMITS } from '../../shared/desktop-api'

/** A decoded memory-only PNG URL. Aborting its owner revokes it even after successful loading. */
export interface IntroductionBackground {
  readonly url: string
}

/**
 * Acquires/decodes one background under an abortable lease; never stores it in React or persistence.
 * The caller owns the signal for the whole visible lifetime, not just the async request. Decoding
 * and bridge deadlines are bounded, stale replies cannot allocate a URL, and every URL is revoked.
 * @returns Null on a supported fallback; abort rejects so an interrupted scene cannot resume itself.
 */
export async function loadIntroductionBackground(
  signal: AbortSignal
): Promise<IntroductionBackground | null> {
  const lease = crypto.randomUUID()
  let url: string | undefined
  const image = new Image()
  let deadline: ReturnType<typeof setTimeout> | undefined
  let rejectAbort: (reason: Error) => void = () => {}
  const aborted = new Promise<never>((_resolve, reject) => {
    rejectAbort = reject
  })
  const release = (): void => {
    image.removeAttribute('src')
    if (url) URL.revokeObjectURL(url)
    url = undefined
    if (deadline !== undefined) clearTimeout(deadline)
    void window.desktop.cancelIntroductionCapture(lease).catch(() => {})
  }
  const onAbort = (): void => {
    release()
    rejectAbort(new DOMException('Introduction background cancelled.', 'AbortError'))
  }
  signal.addEventListener('abort', onAbort, { once: true })
  try {
    if (signal.aborted) throw new DOMException('Introduction background cancelled.', 'AbortError')
    deadline = setTimeout(
      () => rejectAbort(new Error('Introduction background deadline exceeded.')),
      5000
    )
    const frame = await Promise.race([window.desktop.captureIntroductionFrame(lease), aborted])
    if (signal.aborted) throw new DOMException('Introduction background cancelled.', 'AbortError')
    if (!frame) {
      release()
      signal.removeEventListener('abort', onAbort)
      return null
    }
    if (
      !Number.isSafeInteger(frame.width) ||
      !Number.isSafeInteger(frame.height) ||
      frame.width < 1 ||
      frame.height < 1 ||
      Math.max(frame.width, frame.height) > INTRODUCTION_FRAME_LIMITS.maximumEdge ||
      frame.width * frame.height > INTRODUCTION_FRAME_LIMITS.maximumPixels ||
      !(frame.bytes instanceof Uint8Array) ||
      frame.bytes.byteLength < 1 ||
      frame.bytes.byteLength > INTRODUCTION_FRAME_LIMITS.maximumBytes
    )
      throw new Error('Unsupported introduction frame.')
    // Copy only once into a bounded Blob, avoiding base64 strings in the public bridge/React tree.
    url = URL.createObjectURL(new Blob([new Uint8Array(frame.bytes)], { type: 'image/png' }))
    image.src = url
    await Promise.race([image.decode(), aborted])
    if (signal.aborted) throw new DOMException('Introduction background cancelled.', 'AbortError')
    if (image.naturalWidth !== frame.width || image.naturalHeight !== frame.height)
      throw new Error('Introduction frame dimensions changed.')
    clearTimeout(deadline)
    deadline = undefined
    image.removeAttribute('src')
    return { url }
  } catch (error) {
    release()
    signal.removeEventListener('abort', onAbort)
    if (signal.aborted) throw error
    return null
  }
}
