import { join } from 'node:path'
import { readProfileJson, writeProfileJson } from './profile-storage'
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
  private readonly file: string

  /**
   * Initializes the profile path and first-launch choices before reading saved preferences.
   * @param userData - Electron's main-owned userData path, never a renderer-supplied directory.
   * @param systemLanguages - OS language preferences, used only until valid saved choices are loaded.
   */
  constructor(userData: string, systemLanguages: readonly string[]) {
    this.file = join(userData, 'settings', 'preferences.json')
    this.preferences = getDefaultPreferences(systemLanguages)
  }

  /** Loads once before window creation. Missing files are normal; other failures are user-visible. */
  async load(): Promise<void> {
    try {
      const stored = await readProfileJson(this.file, MAX_PREFERENCES_BYTES)
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
      try {
        await writeProfileJson(this.file, { version: 1, preferences: next })
        this.preferences = next
        this.issue = null
      } catch {
        // Do not report success or leak filesystem diagnostics through the player-facing bridge.
        this.issue = 'save-failed'
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
