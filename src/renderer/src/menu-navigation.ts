import type { KeyboardEvent } from 'react'

/**
 * Moves focus without selecting radio options; Enter/Space or a click explicitly selects them.
 * Left/right traverses the focused radio group, while up/down moves between groups and actions.
 * Each group's checked radio and the visible action buttons act as row-navigation stops.
 * Enter/Space activation remains native, except Enter explicitly selects a focused radio.
 * @param event - A key event from the owning menu/group; system modifiers and Tab remain untouched.
 */
export function navigateMenu(event: KeyboardEvent<HTMLElement>): void {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
  const target = event.target
  if (target instanceof HTMLInputElement && target.type === 'radio') {
    if (event.key === 'Enter') {
      event.preventDefault()
      target.click()
      return
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      // Native radio arrow behavior selects immediately. Prevent it and move focus only instead.
      event.preventDefault()
      const options = Array.from(
        event.currentTarget.querySelectorAll<HTMLInputElement>('input[type="radio"]:not(:disabled)')
      ).filter((option) => option.name === target.name)
      const index = options.indexOf(target)
      if (index < 0) return
      const direction = event.key === 'ArrowLeft' ? -1 : 1
      options[(index + direction + options.length) % options.length]?.focus()
      return
    }
  }
  const previous = event.key === 'ArrowUp' || event.key === 'ArrowLeft'
  const next = event.key === 'ArrowDown' || event.key === 'ArrowRight'
  if (!previous && !next) return
  const controls = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input[type="radio"]:checked:not(:disabled)'
    )
  )
  if (controls.length === 0) return
  event.preventDefault()
  const index = controls.findIndex(
    (control) =>
      control === document.activeElement ||
      (target instanceof HTMLInputElement &&
        control instanceof HTMLInputElement &&
        control.name === target.name)
  )
  let nextIndex = previous ? controls.length - 1 : 0
  if (index >= 0) nextIndex = (index + (previous ? -1 : 1) + controls.length) % controls.length
  controls[nextIndex]?.focus()
}
