import { randomUUID } from 'node:crypto'
import { mkdir, open, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

/**
 * Reads bounded, untrusted profile JSON. Callers own schema validation and user-facing issue codes.
 * @param file - Main-owned path under userData, never a renderer-supplied path.
 * @param maximumBytes - Allocation/read limit in bytes, excluding the overflow-detection byte.
 */
export async function readProfileJson(file: string, maximumBytes: number): Promise<unknown> {
  const handle = await open(file, 'r')
  try {
    const buffer = Buffer.alloc(maximumBytes + 1)
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0)
    if (bytesRead > maximumBytes) throw new Error('Profile file is too large.')
    return JSON.parse(buffer.subarray(0, bytesRead).toString('utf8'))
  } finally {
    await handle.close()
  }
}

/**
 * Replaces local profile JSON through a unique same-directory temporary file, with cleanup on failure.
 * Callers serialize writes and commit memory only after success. This is not a cross-process lock or
 * a power-loss durability guarantee. No filesystem diagnostics cross the preload boundary.
 */
export async function writeProfileJson(file: string, value: unknown): Promise<void> {
  const directory = dirname(file)
  const temporary = join(directory, `profile.${randomUUID()}.tmp`)
  try {
    await mkdir(directory, { recursive: true })
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
    await rename(temporary, file)
  } finally {
    await rm(temporary, { force: true }).catch(() => {})
  }
}
