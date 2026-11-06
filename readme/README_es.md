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
se convierte en el escenario de una serie de desafíos arcade con una presentación pixel art.

La selección de minijuegos, sus reglas y el nombre y la apariencia del antagonista todavía están
en fase de diseño.

## Estado del proyecto

> [!IMPORTANT]
> Manager.exe se encuentra en una etapa inicial de desarrollo. Se implementó una demo de interacción
> con el escritorio; todavía no hay minijuegos terminados. La interacción con varios monitores y los
> atajos de cambio de aplicación de Windows requieren verificación manual antes de dar por lista la capa.

La base ya está preparada: Electron, una interfaz con React, TypeScript en modo estricto, CSS,
herramientas de análisis y formato de código, y configuración de empaquetado para Windows.

El núcleo de estados en TypeScript puro está conectado a un menú mínimo: Manager.exe y, debajo,
Play (Resume al pausar), Settings deshabilitado como marcador y Exit. Play activa una superficie
transparente en el monitor principal y capas que interceptan clics en las pantallas secundarias.
La demo dibuja un cursor
virtual y se pausa al perder el foco. Al volver, el menú de pausa permanece abierto; solo Resume
reactiva la capa.
El menú compacto permite recorrer los botones disponibles con las flechas, activarlos con Enter
y seguir usando Tab o Mayús+Tab.

El cursor de Windows no se confina ni se mueve por código. Puede cruzar pantallas, pero el cursor
virtual visible permanece en el área principal y el juego ignora los clics de otras pantallas.
El menú usa una paleta gris oscuro lisa, una fuente arcade local y un cursor pixel art monocromo
basado en la referencia proporcionada. El cursor del juego mide 12 por 21 píxeles, como el del menú.
Los bordes del área principal de juego se oscurecen suavemente hacia fuera, con el centro transparente
y las notificaciones y el cursor por encima. El cursor se dibuja con la posición más reciente en
fotogramas bajo demanda, sin interpolación ni un bucle permanente de animación. El rendimiento en
equipos de bajos recursos todavía no se ha medido.
La ayuda breve de Esc aparece tras 1,5 segundos sin mover el cursor y sale de la pantalla al moverlo;
la preferencia de movimiento reducido desactiva la animación. Esc abre la pausa, no cierra el programa
directamente. Exit cierra Electron mediante una
API de preload de alcance limitado. Los ajustes siguen siendo
solo un estado del núcleo, sin interfaz todavía. Consulta el
[ciclo de vida del juego](../CONTRIBUTING.md#game-lifecycle).

Las pruebas y sus herramientas se han retirado por ahora. El mantenedor prueba el juego manualmente;
solo se añadirán o ejecutarán pruebas cuando se solicite explícitamente. Las comprobaciones estáticas
siguen disponibles en los comandos de abajo.

La experiencia prevista incluye:

- Una colección de minijuegos seleccionados al azar, cuyas reglas individuales aún están por definir.
- Un antagonista original cuyo nombre y apariencia todavía están por diseñar.
- Efectos pixel art, diálogos expresivos y una introducción de estilo arcade.
- Una capa verificada sobre el escritorio que reciba los clics sin transmitirlos a las aplicaciones
  que estén debajo.
- Controles de ajustes y más verificaciones de accesibilidad y entrada para el menú de pausa existente.

Estos son objetivos de desarrollo, no funciones terminadas de la demo de interacción. La selección
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

Esto inicia Electron y el servidor de desarrollo de Vite en el menú de la demo. Play intercepta
temporalmente los clics sobre el escritorio; Esc pausa y Exit o Alt+F4 cierra la aplicación.
Si quieres contribuir, sigue el flujo de ramas descrito en
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

## Estructura del proyecto

```text
build/                  Recursos de empaquetado para Windows
src/
  main/                 Ventana de Electron y ciclo de vida de la aplicación
  preload/              API de escritorio tipada y de alcance limitado
  shared/               Contratos de la API y validación de comandos
    game/               Transiciones de estado compartidas en TypeScript puro
  renderer/
    index.html          Punto de entrada HTML de la interfaz
    src/
      assets/           CSS global y recursos visuales
      components/       Componentes de React
      App.tsx           Menús y superficie de prueba de la demo
      main.tsx          Punto de entrada de React
```

La estructura sigue la plantilla de React y TypeScript de electron-vite. Las responsabilidades de
escritorio se mantienen separadas de la interfaz de React. El núcleo de estados del juego es
independiente de ambos; los sistemas de juego se incorporarán a medida que avance el desarrollo.
Consulta [estructura y nombres](../CONTRIBUTING.md#layout-and-naming) para conocer la responsabilidad
de cada archivo y [archivos en Git](../CONTRIBUTING.md#files-in-git) para distinguir recursos versionados
de archivos locales o generados. Ambas secciones están escritas en inglés.

## Creadores

Creado por **Diego Avalos** y **Giovanni Vilela**. Giovanni propuso la idea inicial,
que ambos creadores fueron desarrollando juntos.

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
