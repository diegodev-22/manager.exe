# Changelog

All notable changes to Manager.exe are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Release versioning will follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
See [changelog maintenance](CONTRIBUTING.md#changelog-maintenance) for contribution and release guidance.

## Unreleased

### Added

- Initial Windows application scaffold using Electron, React, strict TypeScript, CSS, and
  electron-vite, with pnpm scripts, linting, formatting, and Windows packaging configuration.
- English and Spanish READMEs, contributor setup and GitFlow guidance, desktop safety rules,
  and repository instructions for coding agents.
- Pure TypeScript game lifecycle with `ready`, `playing`, `paused`, `settings`, and terminal
  `exiting` states. Pause, resume, and settings transitions preserve the caller's exact session
  reference; unsupported actions leave the same state object unchanged.
- Windows interaction demo with Play/Exit and Esc pause/Resume menus, real Electron shutdown,
  a primary-display click test and virtual cursor, and transparent secondary-display input shields.
  Focus loss and display changes pause and release the shields; returning never auto-resumes.
  Real task switching and multi-monitor behavior still require manual Windows verification.
- Narrow typed preload API with sender/frame and command validation and cancellable overlay loading.
- Static, softly darkened edges on the primary gameplay display, fading to a fully transparent
  center beneath notifications and the cursor. Secondary input shields remain visually transparent.

### Changed

- Simplified the initial and pause menus to Manager.exe and a vertical stack of Play/Resume,
  Settings (not yet available), and Exit buttons on a plain dark-gray background. Removed slogans,
  decorative artwork, the grid, and the visible click counter; reduced the Esc reminder to a compact hint.
- Reduced the menu window to at most 480 by 420 DIP with tighter spacing. Arrow keys cycle through
  enabled buttons, skipping unavailable settings; Enter and Space retain native button activation,
  and Tab navigation remains available. Gameplay still covers the full primary display.
- Replaced the colored cursor with a white pixel arrow and black outline based on the supplied
  visual reference. The local Press Start 2P font and its attribution remain bundled without
  adding visible license text to the menu.
- Reduced the gameplay cursor to the menu cursor's 12-by-21-pixel size. The short Esc help slides
  into view after 1.5 seconds without pointer movement and slides out when movement resumes,
  including movement on secondary displays. Reduced-motion preferences disable the animation.
- Coalesced cursor drawing into on-demand display frames using the latest position, without motion
  interpolation or a persistent animation loop. Idle help uses one deadline-based timeout instead
  of replacing a timer for every movement event. Low-end hardware performance remains unmeasured.
- Strengthened and widened the edge vignette, painting it directly on the gameplay background
  rather than in a negative stacking layer. The center stays clear and game content remains above it.
- Clarified the planned collection of minigames, original antagonist, Windows-only initial scope,
  and future English and Spanish localization, keeping plans separate from implemented behavior.
- Expanded English TSDoc and contextual comments across the game core, application scaffold,
  and configuration; documented API contracts, session ownership, reuse practices, and
  changelog maintenance for contributors.
- Moved the pure lifecycle into `src/shared/game/` so shared contracts and the main process no
  longer depend on renderer-owned source. Documented file ownership, naming conventions, and
  versioned-resource policy; removed the obsolete component-directory placeholder.

### Removed

- Automated tests, scripted Electron probes, Vitest, test scripts, and test TypeScript configuration
  at the maintainer's request. Tests will only be added or run when explicitly requested; gameplay
  verification is currently manual, while formatting, lint, type checking, and compilation remain available.
