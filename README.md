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
series of arcade challenges with pixel-art presentation. Built with Electron, React, and TypeScript.

## Project status

> [!IMPORTANT]
> Early development: the desktop interaction demo is implemented, but there are **no finished
> minigames**. Visuals, accessibility, task switching, and multi-monitor behavior need manual Windows review.

- Transparent desktop menus, pause/resume, and a primary-screen virtual cursor.
- Manager's animated introduction, interactive dialogue, and floating supervisor preview.
- Light/dark themes and offline English/Spanish text; settings apply only after **Save**.

Temporary preview mode replays the introduction on each app launch without changing saved progress.
Play automatically captures one primary-screen image in memory for the introduction, including
dialogue and zoom-out. It is released at normal zoom or on pause; an unfinished intro recaptures on
Resume. Images are never saved, sent, or logged. Reduced motion or capture failure skips desktop zoom;
Windows zoom and the system cursor are never changed.

See the [changelog](CHANGELOG.md) for notable changes and the
[contribution guide](CONTRIBUTING.md) for architecture and verification details.

## Controls

| Action                        | Control                       |
| ----------------------------- | ----------------------------- |
| Reveal dialogue / continue    | Left click or Enter           |
| Pause                         | Esc                           |
| Navigate menus                | Arrow keys or Tab / Shift+Tab |
| Select menu / settings option | Enter, Space, or click        |
| Close                         | Exit or Alt+F4                |

Switching applications minimizes the demo and pauses play; restoring it never auto-resumes.
Settings is available before play and while paused. Back/Esc asks before discarding unsaved changes.

## Requirements

- **Windows** — the only development and packaging target; macOS and Linux are not supported.
  The desktop zoom effect requires Windows 10 build 19041+.
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

This opens the demo menu. During play, the app receives clicks on the primary display and shields
secondary displays. If pnpm is unavailable, replace `pnpm` with `npx --yes pnpm@10.34.9`.

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

Gameplay checks are manual; automated tests and CI are not configured.

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
