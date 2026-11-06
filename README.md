<div align="center">

**English** · [Español](readme/README_es.md)

# Manager.exe

A Windows desktop arcade game in development.

[![Electron](https://img.shields.io/badge/Electron-47848F?style=flat-square&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-149ECA?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Target: Windows](https://img.shields.io/badge/Target-Windows-0078D4?style=flat-square)](#requirements)
[![Status: Early development](https://img.shields.io/badge/Status-Early_development-orange?style=flat-square)](#project-status)

[Get started](#getting-started) · [Contribute](CONTRIBUTING.md) · [Changelog](CHANGELOG.md) · [Report a bug](https://github.com/diegodev-22/manager.exe/issues)

</div>

## About

Manager.exe is being developed as an open-source desktop arcade game built around a collection of
randomly selected minigames and an original antagonist. Your desktop becomes the backdrop for a
series of arcade challenges with pixel-art presentation.

The minigame lineup, individual rules, and antagonist's name and appearance are still being designed.

## Project status

> [!IMPORTANT]
> Manager.exe is in early development. A desktop interaction demo is implemented; there are no
> finished minigames yet. A temporary focus audit passed on one Windows display; multi-monitor
> interaction and broader desktop acceptance still need verification before the overlay is ready.

The foundation is in place: Electron, a React renderer, strict TypeScript, CSS, linting, formatting,
and Windows packaging configuration.

A pure TypeScript game-state core is connected to a minimal menu: Manager.exe above Play (Resume
when paused), Settings, and Exit. The transparent main window spans the primary display from startup,
with the initial compact card centered inside it. After play begins, pausing puts the menu in the
bottom-left of the Windows work area, with a margin clear of the taskbar. Settings remains centered;
Back returns to the originating menu position without resuming play; Save keeps settings open.
Play activates gameplay and secondary-display input shields.
The demo draws a primary-monitor virtual cursor and pauses on
focus loss. Switching to another application minimizes Manager.exe from any view and removes the
active shields/topmost behavior. Restore it using Windows task switching or its taskbar button;
active play remains paused and only Resume reactivates the overlay. Initial-menu and settings state,
including an unsaved settings draft, stay intact while minimized.
The compact menu supports arrow-key navigation between enabled buttons, Enter to activate, and
ordinary Tab/Shift+Tab navigation.

The native Windows cursor is not confined or moved. It can cross displays, but the visible virtual
cursor stays inside the primary play area and secondary-display clicks are ignored by the game.
Menus and settings use an opaque floating card with transparent margins, dark/light palettes,
pixel borders, and a local arcade title font. Controls and supporting text use a larger system font
for readability; Play/Resume and Save have primary-action styling. Text sits on solid surfaces,
not directly on desktop colors. The monochrome pixel cursor follows the supplied visual reference;
the 12-by-21-pixel gameplay cursor matches the menu cursor's size. Transparent-margin click behavior
still needs manual Windows verification; no new click-through behavior is configured.
The primary screen's edges darken from the initial menu onward, including settings, pause, and play.
One shared background fade leaves the center transparent and stays below menus, notifications, and
the cursor. This is a display-sized ordinary window, not exclusive fullscreen or kiosk mode; the
primary window is not forced always-on-top, including during play. Cursor drawing uses the latest position
in on-demand display frames, without interpolation or an idle animation loop. Performance on
low-end hardware has not been measured.
Short Esc help appears after 1.5 seconds of pointer inactivity and slides away when movement resumes;
reduced-motion preferences disable the animation. Esc opens the pause menu rather than immediately quitting.
Exit requests are handled through
a narrow preload bridge and close Electron. Settings opens from either menu; Back or Esc returns
to that menu without resuming play, asking before discarding unsaved choices. See the
[game lifecycle](CONTRIBUTING.md#game-lifecycle).

Settings shows three read-only rows with pixel-framed values: **FPS** (the primary monitor's nominal
Hz, not measured gameplay FPS), **Screen resolution** (current physical pixels), and **Scaling**.
There are no explanatory paragraphs or persistent status messages. Resolution is read from Windows
rather than reconstructed from rounded logical dimensions; missing values display a dash.
No Windows settings are changed. Detection and high-refresh behavior still need manual comparison
with Windows Advanced display settings.

Tests and test tooling are currently removed. The maintainer performs manual gameplay checks;
tests will only be added or run when explicitly requested. Static checks remain available below.

The planned experience includes:

- A collection of randomly selected minigames, with their individual rules still being defined.
- An original antagonist whose name and appearance are still to be designed.
- Pixel-art effects, expressive dialogue, and an arcade-style introduction.
- A verified desktop overlay that receives gameplay clicks without passing them to applications underneath.
- Further accessibility, settings, and desktop input verification.

These are development goals, not completed features of the interaction demo. The minigame lineup,
character design, and other details may evolve as development progresses.

## Platforms

**Windows is the only development and packaging target for now.** Adaptations for macOS and Linux
are being considered for future versions; neither platform is currently supported or verified.

## Languages

The current interface is available in **English and Spanish**, including menus, settings, errors,
and gameplay help. Translations are bundled locally with i18next; no network connection is needed.
This README is also available in both languages through the selector above.

### Settings

Choose **Settings** before playing or from the pause menu to select a light/dark theme and language.
Use the mouse, Up/Down between groups/actions, Left/Right to focus an option without selecting it,
Enter/Space to select, or native Tab/Shift+Tab navigation. Back or Esc returns to the same menu;
continuing play is always explicit.

Editing a choice reveals **Save**. Theme and language only change after saving succeeds; selecting
an option alone changes neither the interface nor the saved preferences. Back or Esc asks whether
to discard unsaved changes or keep editing. A failed save keeps the draft available for retry.
A successful Save keeps settings open and hides Save until another choice changes. Back or Esc
returns to the originating menu after resolving any unsaved changes, without resuming play.

On first launch, Manager.exe starts in dark mode
and uses the first supported system language, falling back to English. Saved choices take priority
on future launches. Preferences stay local in `settings/preferences.json` under Electron's userData
directory; storage failures show a warning. Wait for saving to finish before closing the application.
Theme changes affect only Manager.exe's interface, not Windows or the transparent desktop background.
Manual Windows acceptance checks for these controls and persistence remain pending.

## Requirements

- **Windows** for the initial desktop target.
- **Node.js 24 LTS** as the development baseline.
- **pnpm 10.34.9**, pinned in [`package.json`](package.json).

## Getting started

Clone the repository and run the application from source:

```powershell
git clone https://github.com/diegodev-22/manager.exe.git
cd manager.exe
pnpm install --frozen-lockfile
pnpm dev
```

This starts Electron and the Vite development server at the demo menu. Play temporarily shields
the desktop from clicks; Esc pauses, and Exit or Alt+F4 closes the application. Contributors should
follow the branch workflow in [CONTRIBUTING.md](CONTRIBUTING.md#gitflow).

<details>
<summary>Don't have pnpm installed?</summary>

Use the pinned version without installing it globally. From the project root:

```powershell
npx --yes pnpm@10.34.9 install --frozen-lockfile
npx --yes pnpm@10.34.9 dev
```

For the other commands below, replace `pnpm` with `npx --yes pnpm@10.34.9`.

</details>

## Available commands

Run commands from the project root.

| Command             | Purpose                                         |
| ------------------- | ----------------------------------------------- |
| `pnpm dev`          | Start the application in development mode.      |
| `pnpm format:check` | Check formatting without changing files.        |
| `pnpm lint`         | Run ESLint.                                     |
| `pnpm typecheck`    | Check application types.                        |
| `pnpm build`        | Check types and compile the application.        |
| `pnpm start`        | Preview the compiled application after a build. |
| `pnpm build:unpack` | Build an unpacked Windows application.          |
| `pnpm build:win`    | Build the Windows installer.                    |

## Project structure

```text
build/                  Windows packaging resources
src/
  main/                 Electron window and application lifecycle
  preload/              Narrow typed desktop bridge
  shared/               Desktop bridge contracts and preference validation
    game/               Pure shared game-state transitions
  renderer/
    index.html          Renderer HTML entry point
    src/
      assets/           Global CSS and visual assets
      components/       React components
      hooks/            Presentation preferences and save lifecycle
      i18n/             Offline initialization and English/Spanish catalogs
      App.tsx           Demo menu, pause view, and test surface
      main.tsx          React entry point
```

The layout follows the electron-vite React + TypeScript template. Desktop responsibilities stay
separate from the React interface. The game-state core is independent of both; gameplay systems
will be added as development progresses.
See [layout and naming](CONTRIBUTING.md#layout-and-naming) for file ownership and naming conventions,
and [files in Git](CONTRIBUTING.md#files-in-git) for versioned resources versus generated output.

## Creators

Created by **Diego Avalos** and **Giovanni Vilela**.

## Contributing

Bug reports, thoughtful ideas, documentation improvements, and focused code contributions are
welcome. You do not need a complete solution to start a conversation.

Read [CONTRIBUTING.md](CONTRIBUTING.md) for setup, GitFlow, commit conventions, and review guidance.
Instructions for coding agents live in [AGENTS.md](AGENTS.md).

## License

Manager.exe is licensed under the [MIT License](LICENSE).
Bundled fonts retain their own license; see [third-party notices](THIRD_PARTY_NOTICES.md).
