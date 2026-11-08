import { join } from 'node:path'
import type { IntroductionProgress } from '../shared/desktop-api'
import { readProfileJson, writeProfileJson } from './profile-storage'

/**
 * Owns the one-way introduction-completed marker under userData/progress, separate from settings.
 * Missing/corrupt files replay the introduction; failed writes never pretend the marker was saved.
 */
export class IntroductionStore {
  private completed = false
  private issue: IntroductionProgress['issue'] = null
  private queue: Promise<void> = Promise.resolve()
  private readonly file: string

  /** Accepts only Electron's main-owned profile root; callers cannot select arbitrary files. */
  constructor(userData: string) {
    this.file = join(userData, 'progress', 'introduction.json')
  }

  /** Loads once before window creation; the entire versioned marker must fit in 256 bytes. */
  async load(): Promise<void> {
    try {
      const stored = await readProfileJson(this.file, 256)
      if (
        typeof stored !== 'object' ||
        stored === null ||
        Array.isArray(stored) ||
        !('version' in stored) ||
        stored.version !== 1 ||
        !('completed' in stored) ||
        typeof stored.completed !== 'boolean' ||
        Object.keys(stored).length !== 2
      )
        throw new Error('Unsupported introduction progress.')
      this.completed = stored.completed
    } catch (error) {
      if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) {
        this.issue = 'load-failed'
      }
    }
  }

  /** Waits for accepted writes before a reloaded renderer chooses whether to replay. */
  async getProgress(): Promise<IntroductionProgress> {
    await this.queue
    return { completed: this.completed, issue: this.issue }
  }

  /** Queues an idempotent completion; no reset or arbitrary progress update is exposed through IPC. */
  complete(): Promise<IntroductionProgress> {
    const result = this.queue.then(async () => {
      if (!this.completed) {
        try {
          await writeProfileJson(this.file, { version: 1, completed: true })
          this.completed = true
          this.issue = null
        } catch {
          this.issue = 'save-failed'
        }
      }
      return { completed: this.completed, issue: this.issue }
    })
    this.queue = result.then(
      () => {},
      () => {}
    )
    return result
  }
}
