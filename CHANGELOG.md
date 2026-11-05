# Changelog

All notable changes to Manager.exe are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Release versioning will follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
See [changelog maintenance](CONTRIBUTING.md#changelog-maintenance) for contribution and release guidance.

## Unreleased

### Added

- Initial Windows application scaffold using Electron, React, strict TypeScript, CSS, and
  electron-vite, with pnpm scripts, linting, formatting, and Windows packaging configuration.
  The application currently opens an empty window, not a playable game.
- English and Spanish READMEs, contributor setup and GitFlow guidance, desktop safety rules,
  and repository instructions for coding agents.
- Pure TypeScript game lifecycle with `ready`, `playing`, `paused`, `settings`, and terminal
  `exiting` states. Pause, resume, and settings transitions preserve the caller's exact session
  reference; unsupported actions leave the same state object unchanged. The core is not yet
  connected to the window, and an exit request does not close Electron.
- Vitest unit tests for lifecycle transitions and session preservation, standalone Node.js test
  configuration, test and watch commands, and test type checking included in the build checks.

### Changed

- Clarified the planned collection of minigames, original antagonist, Windows-only initial scope,
  and future English and Spanish localization, keeping plans separate from implemented behavior.
- Expanded English TSDoc and contextual comments across the game core, application scaffold,
  configuration, and tests; documented API contracts, session ownership, reuse practices, and
  changelog maintenance for contributors.
