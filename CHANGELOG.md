# Changelog

All notable changes to Manager.exe are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Release versioning will follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
See [changelog maintenance](CONTRIBUTING.md#changelog-maintenance) for contribution and release guidance.

## Unreleased

### Added

- Settings available from the start and pause menus, with light/dark themes and offline
  English/Spanish localization. Choices remain drafts until Save succeeds; saving keeps settings
  open, while Back/Esc confirms discarding pending edits and returns without resuming play.
  Mouse, keyboard navigation, native Tab order, and a safe discard dialog are supported.
- Validated, versioned preferences saved under Electron userData through the narrow preload bridge.
  Fresh settings use dark mode and the first supported system language, falling back to English.
  Corrupt/unreadable settings and failed saves show localized feedback; updates are serialized.
- Three read-only settings rows: FPS (nominal monitor Hz, not measured gameplay FPS), Screen
  resolution (current physical pixels), and Scaling. Bounded, cancellable Windows resolution reads
  avoid reconstructing physical pixels from rounded DIP bounds; unavailable readings are explicit.
  Detection and high-refresh acceptance remain manual; no Windows display modes are changed.
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
- Static, softly darkened edges on the primary display from startup, including the initial menu,
  settings, pause, and play. One shared background fades to a clear center beneath menu cards,
  notifications, and the cursor. Secondary input shields remain visually transparent.

### Changed

- Centered the initial menu and settings within the Windows work area, with pause menus anchored
  bottom-left clear of the taskbar. Revisioned DIP insets update layout without changing the session.
- Presented menus as opaque pixel-framed cards over transparent margins, with theme-specific
  contrast, keyboard-only navigation rings, larger system-font controls, and compact copy. Read-only
  display values use muted recessed frames and more section spacing instead of button affordances.
  No background blur, desktop capture, or new click-through behavior is configured.
- Refocused the English and Spanish READMEs on Manager.exe's own identity and plans, with brief
  creator credits for Diego Avalos and Giovanni Vilela.
- Simplified the initial and pause menus to Manager.exe and a vertical stack of Play/Resume,
  Settings, and Exit buttons. Dark mode retains a plain dark-gray card background. Removed slogans,
  decorative artwork, the grid, and the visible click counter; reduced the Esc reminder to a compact hint.
- Kept the menu as a compact card while the transparent native window spans the primary display
  from startup, without exclusive fullscreen, kiosk mode, or forcing menus always-on-top. The window
  stays aligned to the primary display on layout/DPI changes. Arrow keys cycle through enabled
  buttons; Enter/Space retain native activation and Tab navigation remains available.
- Replaced the colored cursor with a white pixel arrow and black outline based on the supplied
  visual reference. The local Press Start 2P font and its attribution remain bundled without
  adding visible license text to the menu.
- Reduced the gameplay cursor to the menu cursor's 12-by-21-pixel size. The short Esc help slides
  into view after 1.5 seconds without pointer movement and slides out when movement resumes,
  including movement on secondary displays. Reduced-motion preferences disable the animation.
- Coalesced cursor drawing into on-demand display frames using the latest position, without motion
  interpolation or a persistent animation loop. Idle help uses one deadline-based timeout instead
  of replacing a timer for every movement event. Low-end hardware performance remains unmeasured.
- Strengthened and widened the edge vignette, painting it directly on the menu and gameplay backgrounds
  rather than in a negative stacking layer. The center stays clear and game content remains above it.
- Extended the pure lifecycle so settings record a `ready` or `paused` return destination. Only
  settings opened from pause carry a session, preserving its exact reference. Desktop messages now
  cross the bridge as stable codes and are translated along with errors, help, and accessible labels.
- Clarified the planned collection of minigames, original antagonist, and Windows-only initial scope,
  keeping plans separate from implemented behavior.
- Expanded English TSDoc and contextual comments across the game core, application scaffold,
  and configuration; documented API contracts, session ownership, reuse practices, and
  changelog maintenance for contributors.
- Moved the pure lifecycle into `src/shared/game/` so shared contracts and the main process no
  longer depend on renderer-owned source. Documented file ownership, naming conventions, and
  versioned-resource policy; removed the obsolete component-directory placeholder.

### Fixed

- Confirmed actual focus loss before minimizing any view, ignoring transient Windows blur events.
  Released shields/topmost behavior before yielding, removed primary-window topmost promotion and
  focus recovery, and guarded pending activation against cancellation. Background display updates
  cannot restore the window; returning preserves menus/drafts and never auto-resumes gameplay.
  An earlier temporary one-display Windows audit passed Play/Resume, Esc, Alt+Tab, Win+Tab departure,
  and controlled other-window input scenarios. Its scripts/profiles were removed; later settings
  refinements, native display readings, and actual multi-monitor shielding remain manually unverified.

### Removed

- Automated tests, scripted Electron probes, Vitest, test scripts, and test TypeScript configuration
  at the maintainer's request. Tests will only be added or run when explicitly requested; gameplay
  verification is currently manual, while formatting, lint, type checking, and compilation remain available.
