# Repository guidelines

Read [CONTRIBUTING.md](CONTRIBUTING.md) before changing this repository; it owns architecture,
naming, desktop safety, GitFlow, and verification policy. Inspect the source for implementation
details; the [README](README.md) is only the overview. These instructions add agent-specific guardrails.

## Scope and workflow

- Manager.exe is an open-source Electron/React/TypeScript/CSS Windows arcade game in early
  development. The demo includes menus, settings, an introduction, and a floating supervisor;
  finished minigames are not implemented. Do not claim macOS/Linux support or add it speculatively.
- Keep public documentation focused on Manager.exe, never private projects or their characters.
- Check the current branch and working tree first. Preserve unrelated work and inspect existing
  helpers/consumers before editing. Make only requested changes; avoid speculative abstractions.
- Work from `develop` in `feature/<short-description>`; target feature PRs at `develop`. Follow the
  separate release/hotfix paths in [GitFlow](CONTRIBUTING.md#gitflow), not routine work on `main`.
- Use Node.js 24 LTS and pinned pnpm 10.34.9 (`npx --yes pnpm@10.34.9` if unavailable). Commands are
  listed in the [README](README.md#available-commands). Do not install global tools or change
  dependencies/lockfiles without scope approval, especially for documentation-only work.

## Implementation constraints

- Preserve electron-vite process boundaries: main owns privileges, preload exposes a narrow typed
  API, renderer owns presentation, and shared owns portable contracts/rules. Validate IPC senders
  and untrusted data; never expose raw IPC or Node.js to React.
- Write source, comments, commits, PR titles, and canonical documentation in English; localized
  player text and translated READMEs are exceptions. Keep strict TypeScript, the Rules of Hooks,
  existing naming/formatting, and CSS styling; no unapproved frameworks or engines.
- Use concise TSDoc for exported/nontrivial responsibilities and comments for non-obvious reasons,
  ownership, units, and cleanup. Keep them current; avoid narration and hypothetical generalization.
- Follow [game lifecycle](CONTRIBUTING.md#game-lifecycle): preserve exact session references through
  pause/resume/settings, recorded settings origins, no-op identity, and terminal `exiting`.
- Settings remain local drafts until Save succeeds. Back/Esc confirms discard and never applies a
  draft or resumes play. Use bundled i18next catalogs for all player-facing text/accessibility;
  pass stable message codes across IPC. See [preferences](CONTRIBUTING.md#preferences-and-localization).

## Desktop invariants

- Keep `sandbox: true`, `contextIsolation: true`, and `nodeIntegration: false`; never weaken security.
- Never forward clicks to other apps, move/confine the system cursor, block Windows shortcuts, or
  steal focus. Play uses the primary monitor and secondary click shields; only those shields use
  always-on-top. Confirm focus loss, release shields, and minimize; never restore automatically or auto-resume.
- Keep the primary window display-sized, root backgrounds transparent, and menu cards opaque.
  Keep animation state outside per-frame React renders and give external resources cleanup owners.
- The approved introduction frame is isolated, primary-screen-only, bounded, and memory-only.
  Retain it through dialogue/zoom-out, release at 1x or interruption, and recapture only on explicit
  unfinished-intro resume. Never persist, transmit, or log pixels; reject stale responses.
- Preserve the retained timeline, left-click/Enter-only dialogue, reduced motion, and replay preview
  without overwriting saved progress. See [introduction](CONTRIBUTING.md#introduction-and-capture).
- New global input hooks, capture capabilities, administrator requirements, services, remote code, and telemetry
  require explicit scope approval. Do not publish private screenshots, logs, environment values, or secrets.

## Verification

- Documentation only: formatting and link/path/command/claim checks; no desktop build.
- TypeScript/configuration: formatting, lint, type checking, and build. Packaging also needs the
  relevant Windows packaging command. UI/desktop changes need manual follow-up described to the user.
- Do not add/run tests, desktop probes, or launch/automate the app unless explicitly requested.
  The maintainer checks gameplay. Do not retain temporary audit scripts, profiles, or reports.
- Report executed checks separately from source inspection and manual gaps. Never infer desktop,
  focus, accessibility, performance, or multi-monitor acceptance from compilation alone.

## Git and documentation

- Use Conventional Commits. Commit, push, open/merge PRs, change repository settings, amend,
  rewrite history, force-push, or delete branches only when explicitly authorized.
- Never discard unrelated changes. Keep `.vscode/`, dependencies, generated output, secrets, and
  certificates out of Git; retain the lockfile, Windows icon, authored assets, and required licenses.
- Keep documents task-oriented and avoid duplicated policies or source-level implementation detail.
  Link to the owning section rather than copying it; preserve legal notices and published history.
- Update `Unreleased` for notable changes in the same branch/PR. Do not invent releases, dates,
  downloads, CI, or branch protections. See [changelog policy](CONTRIBUTING.md#changelog-maintenance).
