# Repository guidelines

## Project context

Manager.exe is an open-source Windows desktop arcade game built with Electron, React, TypeScript,
and CSS. It is inspired by the clock minigame in Zoom Manager.

Windows is the only current development and packaging target. macOS and Linux are possible future
adaptations, not supported platforms. Do not implement their integration or claim compatibility
without a separately approved task and verification.

The current application is a scaffold that opens an empty window. Gameplay, desktop overlays,
pointer capture, and menus are not implemented. Keep planned behavior separate from existing
behavior in documentation and completion reports.

Read [CONTRIBUTING.md](CONTRIBUTING.md) for contributor policy, GitFlow, and PR expectations.
Use [README.md](README.md) for the project overview, not as a substitute for inspecting the code.

## Repository map

- `src/main/`: Electron windows, application lifecycle, and future privileged desktop operations.
- `src/preload/`: Entry point for a future narrow, typed desktop API bridge.
- `src/renderer/src/`: React interface, CSS, and future game presentation.
- `build/`: Authored packaging resources. Keep the Windows icon versioned.
- `out/` and `dist/`: Generated output. Do not edit or commit it.
- `package.json`: Available scripts and the pinned package manager.
- `pnpm-lock.yaml`: Dependency lockfile. Keep it versioned.

Preserve the existing electron-vite structure. Do not introduce a monorepo, framework, game engine,
or speculative directory hierarchy without an agreed requirement.

## Development commands

Use Node.js 24 LTS and the pnpm version in `package.json` (currently 10.34.9). Run commands from the
repository root.

| Command                          | Purpose                                  |
| -------------------------------- | ---------------------------------------- |
| `pnpm install --frozen-lockfile` | Install the locked dependency graph.     |
| `pnpm dev`                       | Start the development application.       |
| `pnpm format:check`              | Check formatting without changing files. |
| `pnpm lint`                      | Run ESLint.                              |
| `pnpm typecheck`                 | Check main, preload, and renderer types. |
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

## Coding conventions

- Write code, identifiers, comments, documentation, commit messages, and PR titles in English.
- Follow the surrounding code and the checked-in ESLint, Prettier, and EditorConfig settings.
- Keep strict TypeScript enabled. Avoid `any`, unchecked assertions, and suppressed errors.
- Use React function components and respect the Rules of Hooks.
- Prefer readable, focused implementations. Extract helpers when they name a useful concept or
  remove duplication; do not add abstractions for hypothetical future use.
- Use CSS for styling. Do not add a styling framework or component library without agreement.
- Explain non-obvious constraints, not obvious assignments or control flow.
- Optimize observed problems and report measurements before claiming performance improvements.

Do not change dependencies or regenerate the lockfile for a documentation-only task.

## Desktop safety

Keep `sandbox: true`, `contextIsolation: true`, and `nodeIntegration: false` in the application window.
Do not weaken security settings to bypass implementation problems.

For future desktop gameplay:

- Receive gameplay clicks in the active game surface; never inject or forward them into other apps.
- Use a virtual cursor for game effects rather than manipulating the Windows system cursor.
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
- Interface or desktop behavior changes: add relevant manual Windows checks. A successful build
  does not prove that input capture, focus, accessibility, or cleanup works.
- Packaging changes: run the relevant Windows packaging command as well as the application build.

No automated test suite or CI workflows are configured yet. Do not invent test commands or report
unexecuted checks as passing. Distinguish source inspection, executed checks, and remaining gaps.

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

`CHANGELOG.md` is currently an empty placeholder. Leave it empty until its format and content are agreed.
