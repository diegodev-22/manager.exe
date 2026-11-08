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
    supervisorPreview:
      'Vista previa del supervisor de pantalla: un pequeño monitor flotante con ojos animados y una sonrisa.',
    help: 'Ayuda del juego',
    pause: 'Pausar el juego',
    pauseHelp: 'Continúa o sal desde el menú.'
  },
  introduction: {
    label: 'Presentación de Manager',
    captureFailed: 'No se pudo obtener la imagen. Continuamos sin ampliar el escritorio.',
    hello: 'Hola…',
    bored: '¿Aburrido? Qué manera tan poco profesional de perder el tiempo.',
    identity: 'Soy Manager. Y tengo un plan mucho mejor para tu tiempo libre.',
    invitation: 'Te propongo probar mis minijuegos. Tú pones los reflejos; yo pongo las sorpresas.',
    agreement: '¿Trato hecho? Excelente. Prometo supervisar… discretamente.'
  },
  dialogue: {
    controls:
      'Haz clic izquierdo o pulsa Enter para mostrar la frase completa; repite para continuar.',
    click: 'Clic',
    enter: 'Enter',
    reveal: 'Mostrar texto',
    continue: 'Continuar'
  },
  errors: {
    connection: 'La conexión con el escritorio no está disponible. Cierra esta ventana con Alt+F4.',
    command: 'No se pudo completar la acción. Inténtalo de nuevo o cierra con Alt+F4.',
    loadPreferences: 'No se pudieron cargar los ajustes.',
    savePreferences: 'No se pudieron guardar los cambios.',
    loadIntroduction: 'No se pudo cargar el progreso de la introducción. Se mostrará de nuevo.',
    saveIntroduction:
      'No se pudo guardar la introducción. Podría repetirse al volver a abrir el juego.'
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
