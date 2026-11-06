import type { TranslationCatalog } from './en'

/** Spanish UI catalog; language names remain autonyms in the settings controls. */
const es = {
  menu: {
    label: 'Menú del juego',
    play: 'Jugar',
    resume: 'Continuar',
    settings: 'Ajustes',
    exit: 'Salir'
  },
  settings: {
    title: 'Ajustes',
    theme: 'Tema',
    dark: 'Oscuro',
    light: 'Claro',
    language: 'Idioma',
    back: 'Volver',
    save: 'Guardar',
    saving: 'Guardando…',
    discardTitle: '¿Descartar cambios?',
    discardDescription: 'Cambios sin guardar.',
    keepEditing: 'Seguir editando',
    discardAndBack: 'Volver sin guardar'
  },
  display: {
    refreshRate: 'FPS',
    resolution: 'Resolución de pantalla',
    scale: 'Escalado',
    hertz: '{{value}} Hz',
    pixels: '{{width}} × {{height}}',
    unavailable: '—',
    unavailableLabel: 'No disponible',
    detecting: '…',
    detectingLabel: 'Detectando…'
  },
  game: {
    label: 'Demo de interacción con el escritorio',
    help: 'Ayuda del juego',
    pause: 'Pausar el juego',
    pauseHelp: 'Continúa o sal desde el menú.'
  },
  errors: {
    connection: 'La conexión con el escritorio no está disponible. Cierra esta ventana con Alt+F4.',
    command: 'No se pudo completar la acción. Inténtalo de nuevo o cierra con Alt+F4.',
    loadPreferences: 'No se pudieron cargar los ajustes.',
    savePreferences: 'No se pudieron guardar los cambios.'
  },
  notices: {
    paused: 'En pausa. Continúa cuando quieras.',
    focusLost: 'En pausa porque cambiaste de aplicación. Selecciona Continuar para volver.',
    minimized: 'En pausa porque se minimizó la ventana.',
    reloaded: 'En pausa porque se recargó la interfaz.',
    unresponsive: 'La interfaz dejó de responder. Puedes cerrar la ventana con Alt+F4.',
    displayChanged:
      'Cambió la disposición de pantallas. Selecciona Continuar para reconstruir la capa.',
    shieldStopped: 'Se detuvo una capa de pantalla. Continúa para reconstruirla.',
    overlayFailed: 'No se pudo activar la capa de escritorio de forma segura. Inténtalo de nuevo.'
  }
} as const satisfies TranslationCatalog

export default es
