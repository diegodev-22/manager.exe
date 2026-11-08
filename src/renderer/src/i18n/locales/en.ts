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
  display: {
    refreshRate: 'FPS',
    resolution: 'Screen resolution',
    scale: 'Scaling',
    hertz: '{{value}} Hz',
    pixels: '{{width}} × {{height}}',
    unavailable: '—',
    unavailableLabel: 'Unavailable',
    detecting: '…',
    detectingLabel: 'Detecting…'
  },
  game: {
    label: 'Desktop interaction demo',
    supervisorPreview:
      'Screen supervisor design preview: a small floating monitor with animated eyes and a smile.',
    help: 'Game help',
    pause: 'Pause the game',
    pauseHelp: 'Resume or exit from the menu.'
  },
  introduction: {
    label: 'Manager introduction',
    captureFailed: 'Screen image unavailable. Continuing without desktop zoom.',
    hello: 'Hello…',
    bored: 'Bored, are we? What a spectacular waste of potential.',
    identity: "I'm Manager. And I have a much better use for your free time.",
    invitation: "Let's try my minigames. You bring the reflexes. I'll bring the surprises.",
    agreement: "A deal? Excellent. I'll be supervising… discreetly."
  },
  dialogue: {
    controls: 'Left click or press Enter to show the full sentence, then again to continue.',
    click: 'Click',
    enter: 'Enter',
    reveal: 'Show text',
    continue: 'Continue'
  },
  errors: {
    connection: 'The desktop connection is unavailable. Close this window with Alt+F4.',
    command: 'The action could not be completed. Please try again, or close with Alt+F4.',
    loadPreferences: 'Could not load settings.',
    savePreferences: 'Could not save changes.',
    loadIntroduction: 'Could not load introduction progress. It will play again.',
    saveIntroduction: 'Could not save introduction progress. It may play again next time.'
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
