import { useCallback, useEffect, useRef, useState } from 'react'
import type { IntroductionProgress } from '../../../shared/desktop-api'
import { INTRODUCTION_PREVIEW_ENABLED } from '../manager-introduction'

/** The cinematic owns its timeline; this hook only owns settled profile progress and save feedback. */
interface IntroductionPersistence {
  issue: IntroductionProgress['issue']
  completeIntroduction(): Promise<void>
}

/**
 * Saves only after the zoom-out finishes. In-flight submissions are coalesced and late replies after
 * unmount cannot update React. Failed persistence can retry on the next explicit gameplay resume.
 * Temporary preview mode ignores marker issues and never submits a completion write.
 */
export function useIntroductionProgress(initial: IntroductionProgress): IntroductionPersistence {
  const [issue, setIssue] = useState<IntroductionProgress['issue']>(
    INTRODUCTION_PREVIEW_ENABLED ? null : initial.issue
  )
  const completed = useRef(initial.completed)
  const inFlight = useRef(false)
  const active = useRef(true)
  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
    }
  }, [])

  const completeIntroduction = useCallback(async (): Promise<void> => {
    if (INTRODUCTION_PREVIEW_ENABLED || completed.current || inFlight.current) return
    inFlight.current = true
    try {
      const result = await window.desktop.completeIntroduction()
      completed.current = result.completed
      if (active.current) setIssue(result.issue)
    } catch {
      if (active.current) setIssue('save-failed')
    } finally {
      inFlight.current = false
    }
  }, [])
  return { issue, completeIntroduction }
}
