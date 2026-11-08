# Contributing to Manager.exe

Focused bug fixes, ideas, and documentation improvements are welcome. See the [README](README.md)
for the current demo and setup. Windows is the only development and packaging target; finished
minigames and support for other platforms are not implemented.

## Before you start

- Check existing [issues](https://github.com/diegodev-22/manager.exe/issues) and
  [pull requests](https://github.com/diegodev-22/manager.exe/pulls).
- Agree on substantial gameplay, desktop interaction, architecture, or dependency changes before
  implementing them. Small fixes and documentation corrections need no separate proposal.
- Keep changes focused, preserve unrelated work, and distinguish implemented behavior from plans.

## Development setup

Use Windows, Node.js 24 LTS, and the pnpm version pinned in [package.json](package.json).

```powershell
git clone https://github.com/diegodev-22/manager.exe.git
cd manager.exe
git switch develop
pnpm install --frozen-lockfile
pnpm dev
```

If pnpm is unavailable, use `npx --yes pnpm@10.34.9` instead. Run commands from the repository root;
the [command list](README.md#available-commands) covers checks and Windows packaging. No account,
external service, environment file, or administrator privileges are needed to run the demo.

## Project architecture

| Location            | Owner                                                                    |
| ------------------- | ------------------------------------------------------------------------ |
| `src/main/`         | Electron windows, native input, IPC validation, and profile persistence. |
| `src/preload/`      | Narrow typed bridge; never expose raw IPC or Node.js APIs.               |
| `src/shared/`       | Serializable contracts and pure lifecycle rules in `game/`.              |
| `src/renderer/src/` | React presentation, CSS, local catalogs, and visual timelines.           |
| `build/`            | Authored Windows packaging resources.                                    |

Keep privileges in main. Validate untrusted data and IPC senders before passing typed values inward.
Shared code must not import process-specific layers; game rules should not depend on React or
Electron. Keep the electron-vite structure and avoid speculative layers, engines, or platform code.

### Layout and naming

- Use English names, lowercase directories, and `kebab-case` for ordinary modules, CSS, and assets.
- React components use `PascalCase.tsx`, matching the component name.
- Preserve entry/configuration names, canonical documentation names, and third-party asset filenames.
- Create folders for existing responsibilities, not hypothetical systems or generic `utils` buckets.
  Remove `.gitkeep` when a real file already keeps the directory in Git.

### Files in Git

Version source, configuration, documentation, `pnpm-lock.yaml`, `build/icon.ico`, authored artwork,
and bundled fonts with their licenses. See [third-party notices](THIRD_PARTY_NOTICES.md).

Do not commit dependencies, generated `out/` or `dist/`, `.vscode/`, caches, logs, secrets, or signing
certificates. Do not delete local/generated files merely to tidy the checkout. Keep legacy test-output
ignore rules; tests and their tooling remain removed unless explicitly requested.

### Game lifecycle

The [pure core](src/shared/game/game-state.ts) starts in `ready`; Start supplies a session and enters
`playing`. Pause enters `paused`, and only explicit Resume returns to play. Settings opens from
`ready` or `paused` and closes to its recorded origin, never resuming automatically.

Preserve the caller's exact session reference through pause, resume, and pause-origin settings;
ready-origin settings must not create a session. Unsupported actions return the same state object.
`exit` enters terminal `exiting`, which ignores later actions. This is a shutdown request, not an
Electron side effect. Preferences, display metadata, and visual timelines remain separate from it.

### Desktop safety

- Keep `sandbox: true`, `contextIsolation: true`, and `nodeIntegration: false`; do not weaken them
  to bypass implementation problems.
- Receive clicks only on application surfaces; never inject or forward them into other apps.
  Use a virtual cursor without moving or confining Windows' cursor, and preserve system shortcuts.
- The demo uses the primary monitor and shields secondary displays during play. Confirm actual
  focus loss rather than a transient blur, release shields/topmost behavior, and minimize every view.
  Stay minimized until the user restores the app; restoration never resumes play or steals focus.
- Keep the primary window display-sized, in normal z-order; only active secondary shields use
  always-on-top. Apply pending bounds on user-driven focus, never restore a background window.
- Keep document/root backgrounds transparent and the root color scheme neutral. Menu cards must
  remain opaque and readable; visual transparency does not establish click-through behavior.
- Give listeners, timers, animation loops, and capture resources a clear cleanup owner. Release
  capture on interruption and shutdown. Keep animation state outside per-frame React renders;
  use transforms and bounded effects rather than an idle cursor loop.
- Do not add global hooks, new desktop capture, administrator requirements, services, remote code,
  or telemetry without explicit scope approval. Never publish private desktop pixels or credentials.

### Introduction and capture

The current approved effect acquires one bounded, memory-only primary-screen frame per foreground
Play/Resume activation in an isolated disposable window, never the game renderer. Keep it through
entrance, dialogue, and zoom-out; release it at normal 1x, on pause, or on interruption. Stop capture
tracks after acquisition, revoke image URLs, reject stale replies, and never save, send, or log pixels.
Do not bypass Windows protections; unavailable capture continues without zoom. Reduced motion skips it.

Retain the renderer's timeline through pause/settings. Resume may recapture an unfinished introduction
without restarting dialogue or enabling a previously unavailable zoom mid-conversation. Only left
click or unmodified Enter reveals/advances dialogue; Space and held Enter must not skip it. Preserve
authored acting, readable balloon positioning, and reduced-motion support when changing presentation.

The preview switch in [manager-introduction.ts](src/renderer/src/manager-introduction.ts) replays on
startup without changing saved progress. Outside preview mode, save completion only after zoom-out,
separately from settings; never overwrite progress merely to replay a scene. Source comments own
phase timing, geometry, capture limits, and resource-lifetime details.

### Display adaptation and diagnostics

Use Electron DIP bounds and the Windows work area for layout; physical resolution is a separate,
read-only native query. Never change Windows display modes or infer exact pixels from rounded DIP.
The settings FPS label reports nominal monitor Hz, not measured gameplay FPS or VRR. Unavailable
readings stay explicit. Refresh display metadata without restoring windows or replacing settings drafts.

### Preferences and localization

[PreferencesStore](src/main/preferences-store.ts) owns validated, versioned local settings through
the typed preload bridge. Paths stay main-owned; serialize writes and replace files using unique
same-directory temporary files. Commit saved state only after success, and show localized failure
feedback without leaking filesystem diagnostics. This is not a power-loss durability guarantee.

Settings edits remain local drafts until explicit Save succeeds. Save keeps settings open; failed
saves retain the draft. Back/Esc confirms discarding unsaved changes and returns to the originating
menu, never applying a draft or resuming play. Preserve native Tab order, labeled controls, safe modal
focus, and foreground-only focus restoration. Theme changes must not fill the desktop background.

Use both bundled i18next catalogs for all player-facing text and accessible labels, with typed keys
and complete sentences. Translate stable IPC message codes in the renderer, not in main. English is
the fallback; initial settings use dark mode and the first supported system language. Saved choices
take priority. Update document language/theme without remounting controls or loading remote content.

## Coding conventions

- Write source, comments, commits, PR titles, and canonical documentation in English. Translated
  READMEs and localized player-facing text are intentional exceptions.
- Follow checked-in ESLint, Prettier, and EditorConfig settings; keep TypeScript strict. Prefer
  `unknown` at untrusted boundaries over `any`, unchecked assertions, or suppressed errors.
- Use React function components, the Rules of Hooks, and CSS; do not add frameworks or dependencies
  without agreement. Measure observed problems before claiming performance improvements.

### Comments and API documentation

Document exported APIs, hooks, components, and nontrivial responsibilities with concise English
TSDoc. Explain ownership, units, side effects, cleanup, and limitations where useful. Add tags/examples
only when they clarify the contract; do not repeat TypeScript types or narrate each statement.
Keep comments current and remove obsolete commented-out code. Implementation details belong beside
their code, not duplicated across Markdown files.

### Reuse and clean structure

Search for existing implementations and inspect their consumers before adding or changing helpers.
Reuse matching contracts without forcing unrelated behavior into generic abstractions. Prefer a
short explicit implementation to speculative wrappers or copied code that will drift.

## GitFlow

| Branch                        | Start from | Integrate into                              |
| ----------------------------- | ---------- | ------------------------------------------- |
| `feature/<short-description>` | `develop`  | `develop`, through a PR.                    |
| `release/<version>`           | `develop`  | `main`, then synchronize back to `develop`. |
| `hotfix/<short-description>`  | `main`     | `main`, then synchronize back to `develop`. |

Use short lowercase, hyphen-separated names. For direct contributors:

```powershell
git fetch origin
git switch develop
git pull --ff-only origin develop
git switch -c feature/short-description
```

Start clean without discarding existing work. Fork contributors clone their fork, add this repository
as `upstream`, fetch it, and branch from `upstream/develop`; push to the fork and target this
repository's `develop`. Maintainers coordinate releases and hotfixes.

Do not push ordinary work directly to shared branches, rewrite shared history, or force-push without
explicit agreement. Respect required reviews/checks; verify integration before deleting a feature
branch. These conventions do not imply configured branch protections or CI.

## Conventional Commits

Use `type(scope): short description` for commits and PR titles; scope is optional. Common types:
`feat`, `fix`, `docs`, `refactor`, `perf`, `build`, and `chore`. Mark incompatible changes with `!`
or a `BREAKING CHANGE:` footer. Keep commits focused and factual, for example:

```text
fix(input): center virtual cursor before pointer movement
docs: simplify contribution guidelines
```

## Changelog maintenance

Update [CHANGELOG.md](CHANGELOG.md) under `Unreleased` for notable changes in the same branch/PR.
Summarize outcomes, not files or intermediate iterations; consolidate related entries and omit empty
categories. Use Added, Changed, Deprecated, Removed, Fixed, or Security as appropriate. Routine
formatting/typos need no entry. Follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Only a real release gets a dated version section and actual tag/compare links. Follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html), keep unpublished work under `Unreleased`,
preserve published history, and synchronize release notes back to `develop`. A package version alone
does not prove a release; never invent dates, downloads, CI, or protection claims.

## Verification

| Change                   | Required checks                                                                   |
| ------------------------ | --------------------------------------------------------------------------------- |
| Documentation only       | `pnpm format:check`; verify links, paths, commands, and claims. No desktop build. |
| TypeScript/configuration | Formatting, `pnpm lint`, `pnpm typecheck`, and `pnpm build`.                      |
| UI/desktop behavior      | Relevant static checks plus manual Windows follow-up described in the PR.         |
| Packaging                | Application build and the relevant `pnpm build:unpack` or `pnpm build:win`.       |

Tests, desktop probes, coverage, and CI are not configured. Do not add/run tests or launch the app
or scripted Electron/browser checks unless explicitly requested. The maintainer checks gameplay
manually. Report source inspection, executed checks, and remaining gaps separately; compilation does
not prove desktop safety, accessibility, performance, or installer behavior.

For affected Windows behavior, describe relevant manual checks:

- Menus/settings: both themes/locales, keyboard focus, draft/save/discard, persistence, and failures.
- Task switching: Esc, explicit resume, Alt+Tab/Win+Tab from all views, no lingering shields or focus
  theft, and staying minimized while display/DPI metadata changes.
- Introduction: retained background until 1x, dialogue input, pause/settings continuity, reduced
  motion, capture failure, saved-progress/preview behavior, and a centered cursor at handoff.
- Displays: primary/secondary click shielding, Windows-reported diagnostics, fractional DPI,
  small/portrait layouts, and complete cleanup on exit, lock, or suspend.

Do not retain temporary test/audit scripts, profiles, reports, or private desktop images.

## Pull requests

- [ ] Review the full diff, scope, comments, and reused code, including AI-assisted changes.
- [ ] Target the correct branch with a conventional title and a concise problem/solution summary.
- [ ] Update `Unreleased` when warranted; include only intended source/docs, never private/generated files.
- [ ] List checks actually run and remaining manual gaps; resolve required reviews/checks before merge.
- [ ] For visual changes, include sanitized evidence when available, without private desktop content.

AI assistance does not replace human responsibility for understanding and reviewing the change.
Leave checklist items unchecked until completed.

## Reporting bugs and suggesting features

Open an [issue](https://github.com/diegodev-22/manager.exe/issues) with the problem, reproduction steps,
expected/actual behavior, relevant version/Windows details, and sanitized evidence. For ideas, explain
the player/contributor need first. An incomplete report is welcome; label uncertainty honestly.

## License

Contributions use the project's [MIT License](LICENSE). Submit only code/assets you may contribute
and preserve third-party attribution.
