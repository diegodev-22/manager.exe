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
> con el escritorio; todavía no hay minijuegos terminados. Una auditoría temporal de foco pasó en
> un monitor de Windows; la interacción con varios monitores y la aceptación más amplia del escritorio
> siguen pendientes antes de dar por lista la capa.

La base ya está preparada: Electron, una interfaz con React, TypeScript en modo estricto, CSS,
herramientas de análisis y formato de código, y configuración de empaquetado para Windows.

El núcleo de estados en TypeScript puro está conectado a un menú mínimo: Manager.exe y, debajo,
Jugar (Continuar al pausar), Ajustes y Salir. La ventana transparente ocupa el monitor principal desde
el inicio, con la tarjeta inicial compacta centrada. Tras comenzar a jugar, la pausa coloca el menú
abajo a la izquierda del área de trabajo de Windows, con margen y por encima de la barra de tareas.
Ajustes permanece centrado; Volver regresa al menú en su posición de origen, sin reanudar la partida,
y Guardar mantiene Ajustes abierto. Jugar activa la partida y las capas que interceptan clics
en las pantallas secundarias.
La demo dibuja un cursor
virtual y se pausa al perder el foco. Al cambiar de aplicación, Manager.exe se minimiza desde cualquier
vista y libera las capas de entrada y la prioridad sobre otras ventanas. Puedes restaurarlo con los
atajos de cambio de aplicación de Windows o su botón en la barra de tareas; la partida sigue en pausa
y solo Continuar reactiva la capa. El menú inicial y los ajustes, incluidas las selecciones sin guardar,
conservan su estado mientras la aplicación está minimizada.
El menú compacto permite recorrer los botones disponibles con las flechas, activarlos con Enter
y seguir usando Tab o Mayús+Tab.

El cursor de Windows no se confina ni se mueve por código. Puede cruzar pantallas, pero el cursor
virtual visible permanece en el área principal y el juego ignora los clics de otras pantallas.
El menú y los ajustes usan una tarjeta flotante opaca con márgenes transparentes, temas oscuro y
claro, bordes pixelados y títulos con una fuente arcade local. Los controles y textos secundarios
usan una fuente del sistema más grande para facilitar la lectura; Jugar/Continuar y Guardar destacan
como acciones principales. El texto se apoya en superficies sólidas, no directamente sobre los
colores del escritorio. El cursor pixel art monocromo sigue la referencia proporcionada y mide
12 por 21 píxeles tanto en el menú como en el juego. La respuesta a los clics en los márgenes
transparentes sigue pendiente de verificación manual en Windows; no se configura un comportamiento
nuevo de paso de clics.
Los bordes de la pantalla principal se oscurecen desde el menú inicial, incluidos ajustes, pausa y
partida. Un único fondo degradado mantiene el centro transparente y queda detrás de menús,
notificaciones y cursor. Es una ventana normal del tamaño de la pantalla, no un modo de pantalla
completa exclusiva ni un modo quiosco; la ventana principal no se fuerza por encima de otras
aplicaciones, tampoco durante la partida.
El cursor se dibuja con la posición más reciente en
fotogramas bajo demanda, sin interpolación ni un bucle permanente de animación. El rendimiento en
equipos de bajos recursos todavía no se ha medido.
La ayuda breve de Esc aparece tras 1,5 segundos sin mover el cursor y sale de la pantalla al moverlo;
la preferencia de movimiento reducido desactiva la animación. Esc abre la pausa, no cierra el programa
directamente. Salir cierra Electron mediante una
API de preload de alcance limitado. Ajustes se abre desde ambos menús; Volver o Esc regresa
al menú de origen sin reanudar la partida y pide confirmación si hay cambios sin guardar. Consulta el
[ciclo de vida del juego](../CONTRIBUTING.md#game-lifecycle).

Ajustes muestra tres filas de solo lectura con valores en recuadros pixel art: **FPS** (Hz nominales
del monitor principal, no FPS medidos del juego), **Resolución de pantalla** (píxeles físicos actuales)
y **Escalado**. No hay párrafos explicativos ni mensajes de estado permanentes. La resolución se lee
de Windows, sin reconstruirla a partir de dimensiones lógicas redondeadas; los valores no disponibles
se muestran con una raya. No se modifica Windows. La detección y el comportamiento a altas frecuencias
aún requieren comparación manual con la configuración de pantalla avanzada de Windows.

Las pruebas y sus herramientas se han retirado por ahora. El mantenedor prueba el juego manualmente;
solo se añadirán o ejecutarán pruebas cuando se solicite explícitamente. Las comprobaciones estáticas
siguen disponibles en los comandos de abajo.

La experiencia prevista incluye:

- Una colección de minijuegos seleccionados al azar, cuyas reglas individuales aún están por definir.
- Un antagonista original cuyo nombre y apariencia todavía están por diseñar.
- Efectos pixel art, diálogos expresivos y una introducción de estilo arcade.
- Una capa verificada sobre el escritorio que reciba los clics sin transmitirlos a las aplicaciones
  que estén debajo.
- Más verificaciones de accesibilidad, ajustes y entrada sobre el escritorio.

Estos son objetivos de desarrollo, no funciones terminadas de la demo de interacción. La selección
de minijuegos, el diseño del personaje y otros detalles podrán evolucionar a medida que avance el
desarrollo.

## Plataformas

**Por ahora, Windows es la única plataforma de desarrollo y empaquetado.** Se están considerando
adaptaciones para macOS y Linux en futuras versiones; ninguna de estas dos plataformas es compatible
ni está verificada actualmente.

## Idiomas

La interfaz actual está disponible en **español e inglés**, incluidos los menús, los ajustes,
los errores y la ayuda durante el juego. Las traducciones se incluyen localmente con i18next,
sin necesidad de conexión a internet. Este README también está disponible en ambos idiomas mediante
el selector de la parte superior.

### Ajustes

Abre **Ajustes** antes de jugar o desde la pausa para elegir el tema claro/oscuro y el idioma.
Puedes usar el ratón, Arriba/Abajo para moverte entre grupos y acciones, Izquierda/Derecha para enfocar
una opción sin seleccionarla, Enter/Espacio para seleccionar y la navegación habitual con Tab o
Mayús+Tab. Volver o Esc regresa al mismo menú; continuar la partida siempre requiere una acción explícita.

Al cambiar una opción aparece **Guardar**. El tema y el idioma solo cambian cuando el guardado
termina correctamente; seleccionar una opción no modifica la interfaz ni los ajustes guardados.
Volver o Esc pregunta si quieres descartar los cambios o seguir editando. Si falla el guardado,
las selecciones se conservan para volver a intentarlo.
Guardar correctamente mantiene Ajustes abierto y oculta Guardar hasta que cambie otra opción.
Volver o Esc regresa al menú de origen tras resolver los cambios pendientes, sin reanudar la partida.

En el primer inicio se usa el
tema oscuro y el primer idioma del sistema compatible, con inglés como alternativa. Las elecciones
guardadas tienen prioridad en los siguientes inicios. Los ajustes permanecen en el archivo local
`settings/preferences.json` dentro de la carpeta userData de Electron; si falla el almacenamiento,
se muestra un aviso. Espera a que termine el guardado antes de cerrar la aplicación.
El tema solo afecta a la interfaz de Manager.exe, no a Windows ni al fondo transparente del escritorio.
La aceptación manual en Windows de estos controles y del guardado sigue pendiente.

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

Esto inicia Electron y el servidor de desarrollo de Vite en el menú de la demo. Jugar intercepta
temporalmente los clics sobre el escritorio; Esc pausa y Salir o Alt+F4 cierra la aplicación.
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
  shared/               Contratos de la API y validación de ajustes
    game/               Transiciones de estado compartidas en TypeScript puro
  renderer/
    index.html          Punto de entrada HTML de la interfaz
    src/
      assets/           CSS global y recursos visuales
      components/       Componentes de React
      hooks/            Preferencias visuales y ciclo de guardado
      i18n/             Inicialización local y catálogos de inglés y español
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
