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
se convierte en el escenario de una serie de desafíos, no de un único duelo entre el cursor y un reloj.

El proyecto toma como inspiración el minijuego creado originalmente para Zoom Manager. Su mecánica
de atrapadas se adaptará como uno de los minijuegos de Manager.exe, en el que el jugador intentará
atrapar al enemigo con el cursor. El resto de los minijuegos todavía está por definir.

Manager.exe tendrá su propio villano: no será Horacio ni un reloj. El nuevo nombre y el avatar del
antagonista aún no se han decidido. El juego está construyendo su propia identidad, no reproduciendo
el minijuego original sin cambios.

## Estado del proyecto

> [!IMPORTANT]
> Manager.exe se encuentra en una etapa inicial de desarrollo. La aplicación actual abre una ventana
> vacía; todavía no hay un videojuego jugable.

La base ya está preparada: Electron, una interfaz con React, TypeScript en modo estricto, CSS,
herramientas de análisis y formato de código, y configuración de empaquetado para Windows.

También se incluye un núcleo de estados del juego en TypeScript puro y pruebas unitarias con
Vitest. El núcleo gestiona las acciones de iniciar, pausar, reanudar, abrir y cerrar ajustes, y
solicitar la salida, pero todavía no está conectado a la ventana de la aplicación. Solicitar la
salida en el núcleo no cierra Electron. Consulta el
[ciclo de vida del juego](../CONTRIBUTING.md#game-lifecycle) para conocer las reglas de transición.

La experiencia prevista incluye:

- Una colección de minijuegos seleccionados al azar, cuyas reglas individuales aún están por definir.
- Un minijuego de atrapadas adaptado del original de Zoom Manager al nuevo antagonista.
- Un villano original con un nuevo nombre y avatar, ambos todavía por diseñar.
- Efectos pixel art, diálogos expresivos y una introducción de estilo arcade.
- Una capa sobre el escritorio que reciba los clics del juego sin transmitirlos a las aplicaciones
  que estén debajo.
- Un menú de pausa con `Esc`, opciones para reanudar y acceder a los ajustes, y formas seguras de
  salir del juego.

Estos son objetivos de desarrollo, no funciones disponibles en la estructura actual. La selección
de minijuegos, el diseño del personaje y otros detalles podrán evolucionar a medida que avance el
desarrollo.

## Plataformas

**Por ahora, Windows es la única plataforma de desarrollo y empaquetado.** Se están considerando
adaptaciones para macOS y Linux en futuras versiones; ninguna de estas dos plataformas es compatible
ni está verificada actualmente.

## Idiomas

Está previsto que el videojuego esté disponible en **español e inglés**. La localización dentro del
juego todavía no se ha implementado. Este README ya está disponible en ambos idiomas mediante el
selector de la parte superior.

## Requisitos

- **Windows** como plataforma inicial.
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

Esto inicia Electron y el servidor de desarrollo de Vite. En esta etapa, es normal que se abra una
ventana vacía. Si quieres contribuir, sigue el flujo de ramas descrito en
[CONTRIBUTING.md](../CONTRIBUTING.md#gitflow).

<details>
<summary>¿No tienes pnpm instalado?</summary>

Usa la versión fijada sin instalarla globalmente. Desde la raíz del proyecto:

```powershell
npx --yes pnpm@10.34.9 install --frozen-lockfile
npx --yes pnpm@10.34.9 dev
```

Para los demás comandos, sustituye `pnpm` por `npx --yes pnpm@10.34.9`.

</details>

## Comandos disponibles

Ejecuta los comandos desde la raíz del proyecto.

| Comando             | Propósito                                                             |
| ------------------- | --------------------------------------------------------------------- |
| `pnpm dev`          | Iniciar la aplicación en modo de desarrollo.                          |
| `pnpm format:check` | Comprobar el formato sin modificar archivos.                          |
| `pnpm lint`         | Ejecutar ESLint.                                                      |
| `pnpm test`         | Ejecutar las pruebas unitarias una vez.                               |
| `pnpm test:watch`   | Ejecutar las pruebas unitarias en modo de observación.                |
| `pnpm typecheck`    | Comprobar los tipos de la aplicación, las pruebas y su configuración. |
| `pnpm build`        | Comprobar los tipos y compilar la aplicación.                         |
| `pnpm start`        | Abrir la aplicación compilada después de ejecutar una compilación.    |
| `pnpm build:unpack` | Generar una aplicación de Windows sin instalador.                     |
| `pnpm build:win`    | Generar el instalador para Windows.                                   |

## Estructura del proyecto

```text
build/                  Recursos de empaquetado para Windows
src/
  main/                 Ventana de Electron y ciclo de vida de la aplicación
  preload/              Punto de entrada para futuras APIs de escritorio con alcance limitado
  renderer/
    index.html          Punto de entrada HTML de la interfaz
    src/
      assets/           CSS global y recursos visuales
      components/       Componentes de React
      game/core/        Transiciones de estado en TypeScript puro
      App.tsx           Componente raíz, actualmente vacío
      main.tsx          Punto de entrada de React
tests/unit/game/        Pruebas unitarias del núcleo del juego
vitest.config.mts       Configuración de las pruebas unitarias
```

La estructura sigue la plantilla de React y TypeScript de electron-vite. Las responsabilidades de
escritorio se mantienen separadas de la interfaz de React. El núcleo de estados del juego es
independiente de ambos; los sistemas de juego se incorporarán a medida que avance el desarrollo.

## Cómo contribuir

Los reportes de errores, las ideas bien planteadas, las mejoras de documentación y las contribuciones
de código enfocadas son bienvenidos. No necesitas tener una solución completa para iniciar una
conversación.

Consulta [CONTRIBUTING.md](../CONTRIBUTING.md) para conocer la preparación del entorno, GitFlow,
las convenciones de commits y las pautas de revisión. Las instrucciones para agentes de programación
están en [AGENTS.md](../AGENTS.md).

## Licencia

Manager.exe se distribuye bajo la [licencia MIT](../LICENSE).
