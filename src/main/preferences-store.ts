import { mkdir, open, rename, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import {
  getDefaultPreferences,
  isAppPreferences,
  type AppPreferences,
  type PreferencesSnapshot,
  type PreferencesUpdate
} from '../shared/preferences'

/** Maximum settings-file size in bytes; this two-choice schema never needs a large allocation. */
const MAX_PREFERENCES_BYTES = 4096

/**
 * Owns versioned preferences under userData/settings, not renderer storage or the install directory.
 * Writes are serialized and replace the target via a same-directory temporary file. Failed writes
 * keep the last saved in-memory preferences; invalid files are not overwritten until a user change.
 * Serialization is local to this instance, not a cross-process lock or power-loss durability promise.
 */
export class PreferencesStore {
  private revision = 0
  private issue: PreferencesSnapshot['issue'] = null
  private queue: Promise<void> = Promise.resolve()
  private preferences: AppPreferences
  private readonly directory: string
  private readonly file: string

  /**
   * @param userData - Electron's main-owned userData path, never a renderer-supplied directory.
   * @param systemLanguages - OS language preferences, used only until valid saved choices are loaded.
   */
  constructor(userData: string, systemLanguages: readonly string[]) {
    this.directory = join(userData, 'settings')
    this.file = join(this.directory, 'preferences.json')
    this.preferences = getDefaultPreferences(systemLanguages)
  }

  /** Loads once before window creation. Missing files are normal; other failures are user-visible. */
  async load(): Promise<void> {
    try {
      const file = await open(this.file, 'r')
      let contents: string
      try {
        const buffer = Buffer.alloc(MAX_PREFERENCES_BYTES + 1)
        const { bytesRead } = await file.read(buffer, 0, buffer.length, 0)
        if (bytesRead > MAX_PREFERENCES_BYTES) throw new Error('Preferences file is too large.')
        contents = buffer.subarray(0, bytesRead).toString('utf8')
      } finally {
        await file.close()
      }
      const stored: unknown = JSON.parse(contents)
      if (
        typeof stored !== 'object' ||
        stored === null ||
        !('version' in stored) ||
        stored.version !== 1 ||
        !('preferences' in stored) ||
        !isAppPreferences(stored.preferences)
      ) {
        throw new Error('Unsupported preferences file.')
      }
      this.preferences = { ...stored.preferences }
    } catch (error) {
      if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) {
        this.issue = 'load-failed'
      }
    }
  }

  /** Returns a copy so consumers cannot mutate the store's saved values. */
  getSnapshot(): PreferencesSnapshot {
    return { revision: this.revision, preferences: { ...this.preferences }, issue: this.issue }
  }

  /** Waits for accepted writes before serving a reloaded renderer, avoiding stale startup values. */
  async getSettledSnapshot(): Promise<PreferencesSnapshot> {
    await this.queue
    return this.getSnapshot()
  }

  /**
   * Queues an update already validated by the owning IPC boundary, merging it when its turn begins.
   * @returns The saved preferences or an issue code with the last successfully saved values.
   */
  update(update: PreferencesUpdate): Promise<PreferencesSnapshot> {
    const result = this.queue.then(async () => {
      const next = { ...this.preferences, ...update }
      // Unique names avoid collisions if two application instances save at the same time.
      const temporary = join(this.directory, `preferences.${randomUUID()}.tmp`)
      try {
        await mkdir(this.directory, { recursive: true })
        await writeFile(
          temporary,
          `${JSON.stringify({ version: 1, preferences: next }, null, 2)}\n`,
          { flag: 'wx' }
        )
        await rename(temporary, this.file)
        this.preferences = next
        this.issue = null
      } catch {
        // Do not report success or leak filesystem diagnostics through the player-facing bridge.
        this.issue = 'save-failed'
      } finally {
        await rm(temporary, { force: true }).catch(() => {})
      }
      this.revision += 1
      return this.getSnapshot()
    })
    // A failed request must not poison the serialization chain for later attempts.
    this.queue = result.then(
      () => {},
      () => {}
    )
    return result
  }
}
