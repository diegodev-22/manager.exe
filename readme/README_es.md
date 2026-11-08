<div align="center">

[English](../README.md) · **Español**

# Manager.exe

Un videojuego arcade de escritorio para Windows, actualmente en desarrollo.

[![Electron](https://img.shields.io/badge/Electron-47848F?style=flat-square&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-149ECA?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![Licencia: MIT](https://img.shields.io/badge/Licencia-MIT-yellow.svg?style=flat-square)](../LICENSE)
[![Plataforma: Windows](https://img.shields.io/badge/Plataforma-Windows-0078D4?style=flat-square)](#requisitos)
[![Estado: Desarrollo inicial](https://img.shields.io/badge/Estado-Desarrollo_inicial-orange?style=flat-square)](#estado-del-proyecto)

[Primeros pasos](#primeros-pasos) · [Cómo contribuir](../CONTRIBUTING.md) · [Historial de cambios](../CHANGELOG.md) · [Reportar un error](https://github.com/diegodev-22/manager.exe/issues)

</div>

## Acerca del proyecto

Manager.exe se está desarrollando como un videojuego arcade de escritorio y de código abierto,
basado en una colección de minijuegos seleccionados al azar y un antagonista original. Tu escritorio
se convierte en el escenario de desafíos arcade con una presentación pixel art.
Está construido con Electron, React y TypeScript.

## Estado del proyecto

> [!IMPORTANT]
> Desarrollo inicial: hay una demo de interacción con el escritorio, pero **no hay minijuegos
> terminados**. La apariencia, la accesibilidad, el cambio de aplicación y varios monitores requieren
> revisión manual en Windows.

- Menús transparentes sobre el escritorio, pausa y un cursor virtual en la pantalla principal.
- Introducción animada de Manager, diálogo interactivo y vista previa del supervisor flotante.
- Temas claro/oscuro y textos en español e inglés sin conexión; los ajustes solo se aplican al **Guardar**.

El modo de vista previa repite la introducción en cada apertura sin modificar el progreso guardado.
Jugar captura automáticamente una imagen de la pantalla principal en memoria durante la introducción,
incluidos el diálogo y el alejamiento. Se libera al volver al zoom normal o al pausar; Continuar
recaptura si la introducción no ha terminado. La imagen nunca se guarda, envía ni registra. El movimiento
reducido o un fallo de captura omiten el zoom del escritorio; no se modifica el zoom ni el cursor de Windows.

Consulta los cambios importantes en el [historial](../CHANGELOG.md) y los detalles de arquitectura
y verificación en la [guía de contribución](../CONTRIBUTING.md).

## Controles

| Acción                                    | Control                   |
| ----------------------------------------- | ------------------------- |
| Revelar el diálogo / continuar            | Clic izquierdo o Enter    |
| Pausar                                    | Esc                       |
| Recorrer los menús                        | Flechas o Tab / Mayús+Tab |
| Seleccionar una opción del menú / ajustes | Enter, Espacio o clic     |
| Cerrar                                    | Salir o Alt+F4            |

Cambiar de aplicación minimiza la demo y pausa la partida; restaurarla no reanuda el juego.
Ajustes está disponible antes de jugar y durante la pausa. Volver/Esc pide confirmar los cambios sin guardar.

## Requisitos

- **Windows** — única plataforma de desarrollo y empaquetado; macOS y Linux no son compatibles.
  El efecto de zoom del escritorio requiere Windows 10 compilación 19041 o posterior.
- **Node.js 24 LTS** como versión de referencia para el desarrollo.
- **pnpm 10.34.9**, fijado en [`package.json`](../package.json).

## Primeros pasos

Clona el repositorio y ejecuta la aplicación desde el código fuente:

```powershell
git clone https://github.com/diegodev-22/manager.exe.git
cd manager.exe
pnpm install --frozen-lockfile
pnpm dev
```

Esto abre el menú de la demo. Durante la partida, la aplicación recibe los clics de la pantalla
principal y bloquea los de las pantallas secundarias. Si no tienes pnpm, sustituye `pnpm` por
`npx --yes pnpm@10.34.9`.

## Comandos disponibles

Ejecuta los comandos desde la raíz del proyecto.

| Comando             | Propósito                                                          |
| ------------------- | ------------------------------------------------------------------ |
| `pnpm dev`          | Iniciar la aplicación en modo de desarrollo.                       |
| `pnpm format:check` | Comprobar el formato sin modificar archivos.                       |
| `pnpm lint`         | Ejecutar ESLint.                                                   |
| `pnpm typecheck`    | Comprobar los tipos de la aplicación.                              |
| `pnpm build`        | Comprobar los tipos y compilar la aplicación.                      |
| `pnpm start`        | Abrir la aplicación compilada después de ejecutar una compilación. |
| `pnpm build:unpack` | Generar una aplicación de Windows sin instalador.                  |
| `pnpm build:win`    | Generar el instalador para Windows.                                |

La verificación del juego es manual; no hay pruebas automatizadas ni CI configurados.

## Creadores

Creado por **Diego Avalos** y **Giovanni Vilela**.

## Cómo contribuir

Los reportes de errores, las ideas bien planteadas, las mejoras de documentación y las contribuciones
de código enfocadas son bienvenidos. No necesitas tener una solución completa para iniciar una
conversación.

Consulta [CONTRIBUTING.md](../CONTRIBUTING.md) para conocer la preparación del entorno, GitFlow,
las convenciones de commits y las pautas de revisión. Las instrucciones para agentes de programación
están en [AGENTS.md](../AGENTS.md).

## Licencia

Manager.exe se distribuye bajo la [licencia MIT](../LICENSE).
Las fuentes incluidas mantienen su propia licencia; consulta los
[avisos de terceros](../THIRD_PARTY_NOTICES.md).
