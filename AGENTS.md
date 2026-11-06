# Repository guidelines

## Project context

Manager.exe is an open-source Windows desktop arcade game built with Electron, React, TypeScript,
and CSS, built around a planned collection of minigames and an original antagonist.
Keep public documentation focused on Manager.exe; do not reference private projects or their characters.

Windows is the only current development and packaging target. macOS and Linux are possible future
adaptations, not supported platforms. Do not implement their integration or claim compatibility
without a separately approved task and verification.

The application has an early Windows interaction demo with menus, transparent overlays, and a
virtual cursor connected to the pure lifecycle core. Finished minigames and settings UI are not
implemented. Real task-switching and multi-monitor acceptance checks remain manual and unverified.
Keep implemented code, executed checks, and planned behavior separate in documentation and reports.

Read [CONTRIBUTING.md](CONTRIBUTING.md) for contributor policy, GitFlow, and PR expectations.
Use [README.md](README.md) for the project overview, not as a substitute for inspecting the code.

## Repository map

- `src/main/`: Electron windows, application lifecycle, and future privileged desktop operations.
- `src/preload/`: Narrow, typed demo API bridge; never raw IPC.
- `src/shared/`: Serializable bridge contracts and command validation.
- `src/shared/game/`: Pure game lifecycle rules shared across process boundaries.
- `src/renderer/src/`: React interface, CSS, and future game presentation.
- `build/`: Authored packaging resources. Keep the Windows icon versioned.
- `out/` and `dist/`: Generated output. Do not edit or commit it.
- `package.json`: Available scripts and the pinned package manager.
- `pnpm-lock.yaml`: Dependency lockfile. Keep it versioned.

Preserve the existing electron-vite structure. Do not introduce a monorepo, framework, game engine,
or speculative directory hierarchy without an agreed requirement.
Follow [layout and naming](CONTRIBUTING.md#layout-and-naming) and
[files in Git](CONTRIBUTING.md#files-in-git). Shared code must not import process-specific layers.

## Development commands

Use Node.js 24 LTS and the pnpm version in `package.json` (currently 10.34.9). Run commands from the
repository root.

| Command                          | Purpose                                  |
| -------------------------------- | ---------------------------------------- |
| `pnpm install --frozen-lockfile` | Install the locked dependency graph.     |
| `pnpm dev`                       | Start the development application.       |
| `pnpm format:check`              | Check formatting without changing files. |
| `pnpm lint`                      | Run ESLint.                              |
| `pnpm typecheck`                 | Check application types.                 |
| `pnpm build`                     | Check types and compile the application. |
| `pnpm start`                     | Preview an existing compiled build.      |
| `pnpm build:unpack`              | Build an unpacked Windows application.   |
| `pnpm build:win`                 | Build the Windows installer.             |

If pnpm is unavailable, use `npx --yes pnpm@10.34.9` in its place. Do not install global tools,
replace the package manager, or add unrelated dependencies without approval.

## Architecture boundaries

- Keep Electron and Node.js privileges in the main process, not in React components.
- Expose only explicitly scoped APIs through preload when needed. Do not expose raw IPC objects.
- Validate untrusted data and IPC senders at their owning boundary, then pass typed data inward.
- Keep future game rules independent of React, the DOM, and Electron where practical.
- Keep shared game logic portable and isolate Windows-specific integration in the desktop layer.
  Do not add unused macOS or Linux implementations for speculative future support.
- Keep simulation state out of per-frame React renders. Prefer transforms for moving visual elements
  and bounded Canvas effects when gameplay is introduced.
- Give event listeners, timers, animation loops, and input capture a clear lifecycle and cleanup owner.

The core starts in `ready`. Settings open only from `paused` and close back to `paused`; resuming
is explicit. Preserve the caller's exact session reference through pause, resume, and settings.
Unsupported actions return the same state object. `exit` enters terminal `exiting`, which ignores
all further actions. This is a shutdown request, not an Electron side effect. See
[game lifecycle](CONTRIBUTING.md#game-lifecycle) before changing these rules.

## Coding conventions

- Write all source code, identifiers, comments, test descriptions, commit messages, and PR titles
  in English. English is the canonical documentation language; explicitly translated READMEs and
  localized player-facing text are intentional exceptions, not permission to translate source names
  or comments.
- Follow the surrounding code and the checked-in ESLint, Prettier, and EditorConfig settings.
- Keep strict TypeScript enabled. Avoid `any`, unchecked assertions, and suppressed errors.
- Use React function components and respect the Rules of Hooks.
- Prefer readable, focused implementations. Extract helpers when they name a useful concept or
  remove duplication; do not add abstractions for hypothetical future use.
- Use CSS for styling. Do not add a styling framework or component library without agreement.
- Make responsibilities, contracts, and non-obvious constraints understandable to new contributors.
- Optimize observed problems and report measurements before claiming performance improvements.

Do not change dependencies or regenerate the lockfile for a documentation-only task.

### Comments and reuse

- Document exported APIs, hooks, components, and nontrivial internal responsibilities with English
  TSDoc. Explain session ownership, side effects, lifecycle, units, and limitations where applicable.
- Use a concise summary and meaningful `@typeParam`, `@param`, `@returns`, `@remarks`, and `@example`
  sections. Do not duplicate TypeScript types in JSDoc annotations or add tags without useful content.
- Use inline comments for the reason behind non-obvious logic. Explain effect cleanup in React,
  security boundaries in Electron, and unusual CSS or test constraints where they occur.
- Keep comments current with behavior. Do not narrate every line or leave obsolete commented-out code.
- Search for existing functions, hooks, components, types, and fixtures before adding alternatives.
  Reuse them when their contracts and architecture boundaries fit; inspect consumers before changing
  a shared helper. Do not force unrelated behavior into a generic abstraction just to remove a few lines.

Follow [comments and API documentation](CONTRIBUTING.md#comments-and-api-documentation) and
[reuse and clean structure](CONTRIBUTING.md#reuse-and-clean-structure) when implementing or reviewing.

## Desktop safety

Keep `sandbox: true`, `contextIsolation: true`, and `nodeIntegration: false` in the application window.
Do not weaken security settings to bypass implementation problems.

For future desktop gameplay:

- Receive gameplay clicks in the active game surface; never inject or forward them into other apps.
- Use a virtual cursor for game effects rather than manipulating the Windows system cursor.
- The demo plays on the primary monitor and shields secondary monitors from clicks. Native cursor
  movement is not confined. Focus loss pauses and releases all shields; returning never auto-resumes.
- Preserve a reliable pause and exit path. Release input capture on pause, focus loss, and shutdown.
- Do not block Windows system shortcuts or repeatedly steal focus.
- Do not add global input hooks, desktop capture, administrator requirements, background services,
  remote code, or telemetry without explicit scope approval.

Do not include screenshots, logs, environment values, or credentials containing private user data
in committed files or public reports.

## Verification

Choose checks based on the affected behavior:

- Documentation-only changes: run formatting checks and verify links, paths, commands, and claims.
  Do not run a desktop build solely to validate prose.
- TypeScript or application configuration changes: run formatting, lint, type checking, and build.
- Interface or desktop behavior changes: explain relevant manual Windows checks for the user.
  Do not launch the app or automate interaction checks without a request. A successful build does
  not prove that input capture, focus, accessibility, or cleanup works.
- Packaging changes: run the relevant Windows packaging command as well as the application build.

Tests and their tooling have been removed at the maintainer's request. Do not add or run unit tests,
integration tests, or Electron/browser test probes unless the user explicitly requests tests.
The user performs manual gameplay checks. Formatting, lint, type checking, and compilation remain
available static checks and are not a substitute for manual verification.

Automated testing, coverage reporting, and CI workflows are not configured. Do not report unexecuted
checks as passing. Distinguish source inspection, executed static checks, and remaining desktop gaps.

## Git and change management

- Start ordinary work from `develop` in `feature/<short-description>`. Use lowercase, hyphen-separated
  descriptions and target feature PRs at `develop`.
- Follow the release and hotfix paths in `CONTRIBUTING.md`; do not treat `main` as a feature branch.
- Check the current branch and working tree before making changes. Preserve unrelated user work.
- Make only changes needed for the requested task. Do not silently fix unrelated code or formatting.
- Use Conventional Commits and conventional PR titles: `type(scope): short description`.
- Create commits, push branches, open PRs, merge, or change repository settings only when requested.
- Do not amend commits, rewrite shared history, force-push, or delete branches without explicit approval.
- Keep `.vscode/`, secrets, signing certificates, dependencies, and generated output out of version control.

## Documentation maintenance

Keep the README approachable, the contribution guide actionable, and these instructions concise.
Link to the document that owns a policy instead of copying long sections into multiple files.

Do not claim that branch protections, CI, releases, downloads, or gameplay features exist unless
verified. The version in `package.json` alone is not evidence of a published release.

Update `CHANGELOG.md` under `Unreleased` for notable changes in the same branch and PR.
Follow [changelog maintenance](CONTRIBUTING.md#changelog-maintenance); do not invent releases or dates.
