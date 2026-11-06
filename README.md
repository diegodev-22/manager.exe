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
series of challenges rather than a single cursor-versus-clock duel.

The project takes inspiration from the minigame originally created for Zoom Manager. Its catching
mechanic will be adapted into one of Manager.exe's minigames, where the player tries to catch the
enemy with the cursor. The rest of the minigame lineup is still being defined.

Manager.exe will have its own villain: it will not be Horacio or a clock. The antagonist's new name
and avatar have not been decided yet. The game is developing its own identity, not recreating the
original minigame unchanged.

## Project status

> [!IMPORTANT]
> Manager.exe is in early development. A desktop interaction demo is implemented; there are no
> finished minigames yet. Multi-monitor interaction and Windows task switching still need manual
> verification before the overlay can be considered ready.

The foundation is in place: Electron, a React renderer, strict TypeScript, CSS, linting, formatting,
and Windows packaging configuration.

A pure TypeScript game-state core is connected to a minimal menu: Manager.exe above Play (Resume
when paused), a disabled Settings placeholder, and Exit. Play activates a transparent primary-monitor
surface and secondary-display input shields. The demo draws a primary-monitor virtual cursor and pauses on
focus loss. Returning leaves the pause menu open; only Resume reactivates the overlay.
The compact menu supports arrow-key navigation between enabled buttons, Enter to activate, and
ordinary Tab/Shift+Tab navigation.

The native Windows cursor is not confined or moved. It can cross displays, but the visible virtual
cursor stays inside the primary play area and secondary-display clicks are ignored by the game.
The menu uses a plain dark-gray palette, a local arcade font, and a monochrome pixel cursor based on
the supplied visual reference. The 12-by-21-pixel gameplay cursor matches the menu cursor's size.
The primary play area's edges darken softly toward the outside, leaving the center transparent
and keeping notifications and the cursor above the shading. Cursor drawing uses the latest position
in on-demand display frames, without interpolation or an idle animation loop. Performance on
low-end hardware has not been measured.
Short Esc help appears after 1.5 seconds of pointer inactivity and slides away when movement resumes;
reduced-motion preferences disable the animation. Esc opens the pause menu rather than immediately quitting.
Exit requests are handled through
a narrow preload bridge and close Electron. Settings remain a
core state only, with no settings interface yet. See the [game lifecycle](CONTRIBUTING.md#game-lifecycle).

Tests and test tooling are currently removed. The maintainer performs manual gameplay checks;
tests will only be added or run when explicitly requested. Static checks remain available below.

The planned experience includes:

- A collection of randomly selected minigames, with their individual rules still being defined.
- A catching minigame adapted from Zoom Manager's original minigame to the new antagonist.
- An original villain with a new name and avatar, both still to be designed.
- Pixel-art effects, expressive dialogue, and an arcade-style introduction.
- A verified desktop overlay that receives gameplay clicks without passing them to applications underneath.
- Settings controls and further accessibility and input verification for the existing pause menu.

These are development goals, not completed features of the interaction demo. The minigame lineup,
character design, and other details may evolve as development progresses.

## Platforms

**Windows is the only development and packaging target for now.** Adaptations for macOS and Linux
are being considered for future versions; neither platform is currently supported or verified.

## Languages

The game is planned to be available in **English and Spanish**. In-game localization has not been
implemented yet. This README is already available in both languages through the selector above.

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
  shared/               Desktop bridge contracts and command validation
    game/               Pure shared game-state transitions
  renderer/
    index.html          Renderer HTML entry point
    src/
      assets/           Global CSS and visual assets
      components/       React components
      App.tsx           Demo menu, pause view, and test surface
      main.tsx          React entry point
```

The layout follows the electron-vite React + TypeScript template. Desktop responsibilities stay
separate from the React interface. The game-state core is independent of both; gameplay systems
will be added as development progresses.
See [layout and naming](CONTRIBUTING.md#layout-and-naming) for file ownership and naming conventions,
and [files in Git](CONTRIBUTING.md#files-in-git) for versioned resources versus generated output.

## Contributing

Bug reports, thoughtful ideas, documentation improvements, and focused code contributions are
welcome. You do not need a complete solution to start a conversation.

Read [CONTRIBUTING.md](CONTRIBUTING.md) for setup, GitFlow, commit conventions, and review guidance.
Instructions for coding agents live in [AGENTS.md](AGENTS.md).

## License

Manager.exe is licensed under the [MIT License](LICENSE).
Bundled fonts retain their own license; see [third-party notices](THIRD_PARTY_NOTICES.md).
