# Contributing to Manager.exe

Thanks for helping build Manager.exe. Whether you are reporting a confusing instruction, improving
accessibility, fixing a bug, or proposing a game mechanic, a clear and focused contribution is welcome.

The project has an early Windows desktop interaction demo: menus, a transparent test surface, and
input shields are connected to the pure game-state core. There are no finished minigames or
settings interface. Multi-monitor and real Windows task-switching behavior still need manual
verification. Keep implemented code separate from verified desktop behavior and future plans.

Windows is the only platform targeted for the initial version. macOS and Linux adaptations are
future possibilities, not part of the current scope. Proposals to add platform support should be
discussed separately before implementation.

## Before you start

- Check existing [issues](https://github.com/diegodev-22/manager.exe/issues) and
  [pull requests](https://github.com/diegodev-22/manager.exe/pulls) to avoid duplicating work.
- For substantial changes to gameplay, desktop interaction, architecture, or dependencies, open an
  issue to agree on the problem and scope before implementing them.
- Keep each contribution focused. Avoid mixing an unrelated cleanup with a bug fix or feature.
- Be respectful, explain tradeoffs, and ask when a requirement is unclear.

Small fixes and documentation corrections do not need a separate design proposal.

## Development setup

Use Windows, Node.js 24 LTS, and pnpm 10.34.9. The package manager version and available scripts are
defined in [`package.json`](package.json); dependency versions are locked in
[`pnpm-lock.yaml`](pnpm-lock.yaml).

```powershell
git clone https://github.com/diegodev-22/manager.exe.git
cd manager.exe
git switch develop
pnpm install --frozen-lockfile
pnpm dev
```

The application opens the demo menu. No external service, account, environment file, or administrator
privileges are needed. Play temporarily shields all displays from clicks; Escape pauses and
Alt+F4 remains available. Manual gameplay checks are performed by the maintainer; see
[verification](#verification) for the current policy.

If pnpm is not installed, replace `pnpm` with `npx --yes pnpm@10.34.9` in these commands.

### Contributing from a fork

If you do not have write access, fork the repository and clone your fork instead. Add the original
repository as `upstream`:

```powershell
git remote add upstream https://github.com/diegodev-22/manager.exe.git
git fetch upstream
```

Create your feature branch from the current `upstream/develop`, push the feature branch to your
fork, and open a pull request against this repository's `develop` branch. For example:

```powershell
git switch --no-track -c feature/short-description upstream/develop
```

## Project architecture

| Location                       | Responsibility                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------ |
| `src/main/`                    | Electron windows, application lifecycle, and privileged desktop operations.    |
| `src/preload/`                 | A narrow, typed bridge for demo intents and state/cursor subscriptions.        |
| `src/shared/`                  | Serializable bridge contracts, command validation, and pure shared game rules. |
| `src/renderer/src/`            | React components, CSS, and future game presentation.                           |
| `src/shared/game/`             | Pure TypeScript lifecycle rules, independent of React, DOM, and Electron.      |
| `src/renderer/src/components/` | React components such as the gameplay surface.                                 |
| `src/renderer/src/assets/`     | CSS, the cursor sprite, and locally bundled fonts with their licenses.         |
| `build/`                       | Versioned packaging resources, including the Windows icon.                     |
| `out/` and `dist/`             | Generated application and distribution output; never edit or commit these.     |

Keep Electron and Node.js privileges out of the renderer. Future game rules should be independent
of React, the DOM, and Electron where practical, so they can be tested without a desktop window.
Do not add an architecture layer or library before there is a concrete need for it.

Keep shared game logic portable where practical and isolate Windows-specific integration in the
desktop layer. This prepares for possible future adaptations without adding unused platform code.

### Layout and naming

Keep the electron-vite process boundaries: `main` owns desktop effects, `preload` exposes the narrow
bridge, `renderer` owns presentation, and `shared` owns code used across those boundaries. Shared
modules must not import from `main`, `preload`, or `renderer`; do not place shared rules under a UI
directory. The two application TypeScript configurations explicitly include `src/shared/`.

Use these project conventions consistently rather than renaming files to impose a different style:

- English, lowercase directory names; use `kebab-case` for multiword directories, ordinary
  TypeScript modules, CSS files, and authored visual assets.
- `PascalCase.tsx` for React components, matching the component name: `App.tsx`, `GameSurface.tsx`.
- Preserve conventional tool/entry names such as `index.ts`, `main.tsx`, `env.d.ts`, and the root
  configuration filenames. Keep canonical documentation names such as `README.md` and `LICENSE`.
- Preserve third-party font and license filenames, including `PressStart2P-Regular.ttf` and
  `OFL.txt`; do not rename or modify them merely to normalize project naming.
- Create folders for existing responsibilities, not empty future systems. Remove `.gitkeep` when
  a real file already keeps the directory in Git. Do not introduce generic `utils` or `helpers`
  buckets when a descriptive module name is clearer.

For the current implementation, start with these owners:

| File                                                                                         | Responsibility                                                                                    |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| [`src/main/index.ts`](src/main/index.ts)                                                     | Application startup, native windows, overlays, focus, input, IPC ownership, and shutdown cleanup. |
| [`src/main/demo-controller.ts`](src/main/demo-controller.ts)                                 | Demo session ownership and cancellable lifecycle activation.                                      |
| [`src/main/desktop-boundaries.ts`](src/main/desktop-boundaries.ts)                           | DIP cursor bounds and privileged sender checks.                                                   |
| [`src/shared/desktop-api.ts`](src/shared/desktop-api.ts)                                     | Typed bridge contracts and the command allowlist.                                                 |
| [`src/shared/game/game-state.ts`](src/shared/game/game-state.ts)                             | Pure state transitions and session-reference preservation.                                        |
| [`src/preload/index.ts`](src/preload/index.ts)                                               | Scoped bridge implementation, with no raw IPC exposed to React.                                   |
| [`src/renderer/src/App.tsx`](src/renderer/src/App.tsx)                                       | Menu presentation, keyboard navigation, and snapshot subscription.                                |
| [`src/renderer/src/components/GameSurface.tsx`](src/renderer/src/components/GameSurface.tsx) | Cursor rendering, idle help, and mounted gameplay presentation.                                   |
| [`src/renderer/src/assets/base.css`](src/renderer/src/assets/base.css)                       | Shared palette, typography defaults, and transparent document baseline.                           |
| [`src/renderer/src/assets/main.css`](src/renderer/src/assets/main.css)                       | Menu, game surface, edge vignette, hint, and cursor styling.                                      |

### Files in Git

Version application source, root tooling/configuration files, `pnpm-lock.yaml`, documentation,
`build/icon.ico`, authored cursor artwork, and the local font with its copyright/license notice.
The font is an application resource, not an installed dependency directory. See
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) for its provenance and license.

Do not version `node_modules/`, `out/`, `dist/`, local `.vscode/` settings, tool caches, logs, secrets,
or signing certificates. These local/generated files may be present without belonging in a commit;
do not delete them just to make the checkout look smaller. Keep existing ignore entries for legacy
test output so old caches cannot accidentally be committed, even though tests are currently removed.
Keep tests and their tooling removed unless the maintainer explicitly requests them again.

### Game lifecycle

The core starts in `ready` and accepts these transitions:

| Current state              | Action                     | Next state |
| -------------------------- | -------------------------- | ---------- |
| `ready`                    | `start`, with session data | `playing`  |
| `playing`                  | `pause`                    | `paused`   |
| `paused`                   | `resume`                   | `playing`  |
| `paused`                   | `open-settings`            | `settings` |
| `settings`                 | `close-settings`           | `paused`   |
| Any state except `exiting` | `exit`                     | `exiting`  |

Actions that are not allowed leave the same state object unchanged. `exiting` is terminal and
ignores further actions, including another `exit`.

Session data is supplied by the caller, not defined by the core. Pausing, resuming, and visiting
settings preserve the exact session reference without cloning or mutating it. This does not provide
deep immutability or persistence; callers own their session data. Closing settings never resumes
automatically.

The core owns no timers, input listeners, React state, or Electron APIs. `exiting` records a request
to leave. The desktop controller now connects this lifecycle to menus and owns the opaque demo
session; the Electron window layer performs cleanup and actual shutdown. The demo does not expose
settings actions or implement real minigame rules.

Focus loss, minimization, renderer reload, or display changes pause active play and release the
input shields. The ordinary menu window remains available for returning to the paused session.
Only explicit Resume reactivates play. Native cursor confinement and global input hooks are not
used; a visual cursor is clamped to the primary display using Electron DIP coordinates.

## Coding conventions

- Write all source code, identifiers, comments, test descriptions, commit messages, and PR titles
  in English. English is the canonical documentation language. Explicitly translated READMEs and
  localized player-facing text may use their target language; source identifiers and comments
  remain in English.
- Keep TypeScript strict mode enabled. Prefer precise types and `unknown` at untrusted boundaries
  over `any` or unchecked assertions.
- Use React function components and follow the Rules of Hooks.
- Keep components and functions focused. Extract shared behavior when it improves clarity, not to
  satisfy an arbitrary abstraction pattern.
- Use CSS for styling and follow the structure of the surrounding code.
- Let [ESLint](eslint.config.mjs), [Prettier](.prettierrc.yaml), and
  [EditorConfig](.editorconfig) define formatting and lint conventions. The current style uses
  two-space indentation, single quotes, and no semicolons.
- Document responsibilities and non-obvious constraints so new contributors can understand the
  purpose and safe use of each part of the code.
- Avoid new dependencies unless their benefit justifies their maintenance and distribution cost.

Use `pnpm format` to apply formatting. Review the resulting diff and keep unrelated formatting
changes out of your contribution.

### Comments and API documentation

Useful documentation is part of a contribution, not an optional finishing step. Aim for enough
context that another contributor can understand the contract and its limitations without tracing
every caller. Prefer clear naming and focused code, then use comments to explain what names and
types cannot express. More comments are helpful when they add information, not when they repeat
each statement.

Use [TSDoc](https://tsdoc.org/) conventions for TypeScript documentation blocks:

- Document exported functions, types, hooks, and components, plus nontrivial internal functions.
- Start with a short summary of the responsibility. Document a module's purpose near its primary
  API or entry point when that purpose would otherwise be unclear.
- Add `@param` and `@returns` for behavioral contracts, `@typeParam` for generic responsibilities,
  and `@remarks` for ownership, side effects, invariants, or important limitations.
- Use `@example` when a short example makes an API easier to use correctly. Add `@throws` only for
  errors the implementation actually throws.
- Keep TypeScript as the source of type information. Do not repeat parameter types with annotations
  such as `@param {string}` in a TypeScript file.

For example, this is the structure of a lifecycle API comment:

```ts
/**
 * Applies a supported lifecycle action without mutating its inputs.
 *
 * @typeParam Session - The caller-owned data preserved across lifecycle transitions.
 * @param state - The current lifecycle state.
 * @param action - The intent to apply if the current state permits it.
 * @returns A new state for an allowed action, or the same object when it is ignored.
 */
```

See [`game-state.ts`](src/shared/game/game-state.ts) for a complete example with
ownership notes and usage documentation.

Use the comment format appropriate to the technology:

| Area       | What to explain                                                                                           |
| ---------- | --------------------------------------------------------------------------------------------------------- |
| TypeScript | Contracts, ownership, units, non-obvious decisions, and failure or no-op behavior.                        |
| React      | Component and hook responsibilities, non-obvious props, effect dependencies, and cleanup ownership.       |
| Electron   | Privilege boundaries, resource lifecycle, platform constraints, and security decisions.                   |
| CSS        | Unusual layout constraints, stacking, interaction, accessibility, or rendering tradeoffs.                 |
| Tests      | Expected behavior through descriptive test names, plus comments for non-obvious fixtures and regressions. |

Use `//` for local reasoning in TypeScript, `/* ... */` in CSS, and `{/* ... */}` for useful comments
inside JSX. Do not add a comment to every selector, JSX element, or assertion when it is already
self-explanatory. Never use a comment to justify suppressing a valid Hooks dependency or hiding a
security problem.

Update comments and examples in the same change as the behavior they describe. Remove obsolete
comments and commented-out implementations; Git preserves the history. Comments complement types
and tests, but do not replace them.

### Reuse and clean structure

Before adding a new function, hook, component, type, or fixture, look for an existing implementation
with the same responsibility. Reuse it when its behavior, units, ownership, and dependencies fit.
Do not copy an existing implementation and let the two versions drift.

When changing shared behavior, inspect its consumers and verify the affected cases. Keep reusable
game rules free of React and Electron dependencies; similar-looking UI code is not a suitable core
utility if it brings those dependencies with it.

Extract shared helpers when they remove real duplication or name a meaningful concept. Do not build
generic frameworks, add layers of wrappers, or combine unrelated operations behind boolean flags
just to reduce line count. Short, explicit code can be clearer than an unnecessary abstraction.

### Desktop safety

Keep the existing Electron sandbox and context isolation enabled, with Node integration disabled
in the renderer. Validate any future privileged IPC inputs and their sender at the owning boundary.

As desktop interaction is introduced, gameplay clicks must not be forwarded to underlying
applications while the game is active. Preserve a reliable pause and exit path, release input
capture on pause, focus loss, or shutdown, and do not block Windows system shortcuts. Do not
introduce global input hooks, screen capture, administrator requirements, or background services
without an explicit scope discussion.

## GitFlow

`main` holds the release line; `develop` is the integration branch for upcoming work. This does not
mean the current scaffold is a finished or playable release.

| Branch                        | Start from | Integrate into                                |
| ----------------------------- | ---------- | --------------------------------------------- |
| `feature/<short-description>` | `develop`  | `develop`, through a pull request.            |
| `release/<version>`           | `develop`  | `main`, then synchronize back into `develop`. |
| `hotfix/<short-description>`  | `main`     | `main`, then synchronize back into `develop`. |

Maintainers coordinate release and hotfix preparation. Use short, lowercase, hyphen-separated
descriptions after the prefix, such as `feature/pause-menu` or `feature/documentation`.

For contributors working directly in this repository:

```powershell
git fetch origin
git switch develop
git pull --ff-only origin develop
git switch -c feature/short-description
```

Start with a clean working tree. Do not discard existing changes to make these commands work.
Fork contributors should use the current `upstream/develop` as described above.

- Target ordinary feature, fix, and documentation PRs at `develop`, not `main`.
- Do not push routine work directly to shared integration or release branches.
- Do not force-push shared branches or rewrite other contributors' history.
- If rewriting your own feature branch is agreed with collaborators, use `--force-with-lease`
  rather than an unconditional force push.

These are project conventions, not a guarantee of enforced GitHub branch protections. CI workflows
and automated commit-validation hooks are not part of the current scaffold.

## Conventional Commits

Use Conventional Commits for commit messages and PR titles:

```text
type(scope): short description
```

The scope is optional. Use it when it identifies the affected area, such as `main`, `preload`,
`renderer`, or `input`.

Common types are `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, and `chore`.
Use `!` or a `BREAKING CHANGE:` footer for an incompatible change, with an explanation.

```text
docs: add project contribution guidelines
feat(input): add virtual cursor movement
fix(main): release input capture on shutdown
```

Keep commits focused and descriptions factual. Do not mark a feature as implemented or a problem
as fixed unless the change actually provides that behavior.

## Changelog maintenance

[`CHANGELOG.md`](CHANGELOG.md) is a curated history of notable changes for players and contributors,
not a copy of the Git log or a list of future tasks. Follow
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and write entries in English.

### During a contribution

- Update `Unreleased` in the same feature branch and pull request as each notable change. Write
  the entry once its outcome is clear and revise it if the implementation changes; there is no
  need to edit the changelog after every file edit or intermediate commit.
- Before requesting review, confirm that the entry describes what was actually implemented,
  including relevant limitations. Do not wait until release preparation to reconstruct the work.
- Summarize the outcome and why it matters rather than listing files or commits. Link to an issue
  or PR when it provides useful context and exists; do not invent references.
- Record features, behavior changes, compatibility changes, important fixes, security changes,
  and significant contributor tooling or documentation updates. Routine formatting, typo fixes,
  and internal cleanup with no notable impact normally do not need a separate entry.
- Consolidate related entries and omit empty categories. Use the categories below only when they
  apply; do not use Conventional Commit types as changelog headings.

| Category     | Use for                                   |
| ------------ | ----------------------------------------- |
| `Added`      | New features or capabilities.             |
| `Changed`    | Changes to existing behavior or guidance. |
| `Deprecated` | Features scheduled for future removal.    |
| `Removed`    | Features that have been removed.          |
| `Fixed`      | Corrections to existing defects.          |
| `Security`   | Security-related changes.                 |

[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) describes commit messages;
it does not replace a human-reviewed changelog. Automated changelog generation is not configured.

### Preparing a release

Maintainers review and consolidate the relevant `Unreleased` entries on the release branch, or
the hotfix branch for a hotfix. Include only changes actually included in that release; leave
unshipped work under `Unreleased`. Follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
when choosing the release version; `0.y.z` denotes initial development, not a stable public API.

When publishing a release, move its entries into a section headed `## [version] - YYYY-MM-DD`,
using the actual version and release date, and link the heading to its real tag or comparison.
Keep `Unreleased` at the top for upcoming work and published releases below it, newest first.
Synchronize release notes back into `develop` as part of the GitFlow release or hotfix process.

Do not create a dated release section merely because `package.json` has a version, and do not
publish or tag a release just to update the changelog. Historical published entries must remain
accurate; corrections should be explicit rather than silently rewriting what was shipped.

## Verification

Choose checks that match the change and report what you actually ran.

| Change                                  | Expected verification                                                               |
| --------------------------------------- | ----------------------------------------------------------------------------------- |
| Documentation only                      | Formatting, relative links, referenced commands, and accuracy against the source.   |
| TypeScript or application configuration | Formatting, lint, type checking, and an application build.                          |
| Interface or CSS                        | Relevant static checks; describe manual layout and interaction checks for the user. |
| Desktop lifecycle or input behavior     | Relevant static checks; describe manual Windows verification for the user.          |
| Packaging                               | An application build and the relevant Windows packaging command.                    |

The available checks are:

```powershell
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

Use `pnpm build:unpack` or `pnpm build:win` when packaging is affected. `pnpm start` previews a
compiled build; it does not build the application first.

Automated tests, desktop probes, and their tooling have been removed at the maintainer's request.
Do not add or execute tests, install a test runner, or launch scripted Electron/browser checks
unless the user explicitly requests testing. The maintainer performs manual gameplay checks.
Formatting, lint, type checking, and compilation remain available static checks.

For interface and desktop changes, describe what the maintainer should check: menu controls,
Escape pause, explicit resume, Alt+Tab/Win+Tab, transparent click shielding, cursor visibility,
display changes, and complete shutdown. Do not claim those scenarios were verified just because
the app compiled. Automated testing, coverage reporting, and CI workflows are not configured.

A successful build does not establish that desktop input, focus handling, accessibility, or an
installer works correctly. Record those checks separately, including anything you could not verify.

## Pull requests

Before asking for review:

- [ ] Review the complete diff, including any AI-assisted changes.
- [ ] Check that comments and examples are accurate, in English, and explain the relevant contracts.
- [ ] Reuse suitable existing code and keep new abstractions justified by a concrete need.
- [ ] Update `Unreleased` for notable changes, or explain why no changelog entry is needed.
- [ ] Confirm the scope is focused and the target branch is correct.
- [ ] Use a conventional PR title and link the related issue when there is one.
- [ ] Explain the problem, the approach, and the observable outcome briefly.
- [ ] List executed checks, their results, and any remaining verification gaps.
- [ ] Include screenshots or a short recording for visible changes, without private desktop content.
- [ ] Check that no secrets, signing certificates, `.vscode/`, dependencies, or build output are included.

AI-assisted contributions are welcome. A human contributor remains responsible for understanding
and reviewing the final change; an automated check or agent summary is not a substitute for that
review. Leave checklist items unchecked until their work has actually been completed.

## Reporting bugs and suggesting features

Open an [issue](https://github.com/diegodev-22/manager.exe/issues) with the smallest useful description.
For a bug, include:

- The version or commit and relevant Windows, Node.js, or pnpm details.
- Reproduction steps, expected behavior, and what actually happened.
- Relevant error output or screenshots, with secrets and private information removed.

An incomplete report is still useful: say what you observed and what remains uncertain. A diagnosis
or working fix is not required. For a feature, start with the player or contributor problem and the
outcome you want, rather than a large implementation proposal.

## License

Contributions are provided under the project's [MIT License](LICENSE). Only submit code and assets
you have the right to contribute, and preserve applicable third-party attribution.
