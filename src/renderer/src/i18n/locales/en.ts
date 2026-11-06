/** Canonical English UI catalog; semantic keys remain stable when wording changes. */
const en = {
  menu: {
    label: 'Game menu',
    play: 'Play',
    resume: 'Resume',
    settings: 'Settings',
    exit: 'Exit'
  },
  settings: {
    title: 'Settings',
    theme: 'Theme',
    dark: 'Dark',
    light: 'Light',
    language: 'Language',
    back: 'Back',
    save: 'Save',
    saving: 'Saving…',
    discardTitle: 'Discard changes?',
    discardDescription: 'Unsaved changes.',
    keepEditing: 'Keep editing',
    discardAndBack: 'Discard and return'
  },
  game: {
    label: 'Desktop interaction demo',
    help: 'Game help',
    pause: 'Pause the game',
    pauseHelp: 'Resume or exit from the menu.'
  },
  errors: {
    connection: 'The desktop connection is unavailable. Close this window with Alt+F4.',
    command: 'The action could not be completed. Please try again, or close with Alt+F4.',
    loadPreferences: 'Could not load settings.',
    savePreferences: 'Could not save changes.'
  },
  notices: {
    paused: 'Paused. Resume when you are ready.',
    focusLost: 'Paused because you switched away. Select Resume to continue.',
    minimized: 'Paused because the window was minimized.',
    reloaded: 'Paused because the interface was reloaded.',
    unresponsive: 'The interface stopped responding. You can close the window with Alt+F4.',
    displayChanged: 'The display layout changed. Select Resume to rebuild the overlay.',
    shieldStopped: 'A display shield stopped. Resume to rebuild the overlay.',
    overlayFailed: 'The desktop overlay could not start safely. Please try again.'
  }
} as const

/** Requires every locale to supply exactly the same two-level catalog structure. */
export type TranslationCatalog = {
  [Section in keyof typeof en]: { [Key in keyof (typeof en)[Section]]: string }
}

export default en
