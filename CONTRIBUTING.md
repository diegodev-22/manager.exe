# Contributing to Manager.exe

Thanks for helping build Manager.exe. Whether you are reporting a confusing instruction, improving
accessibility, fixing a bug, or proposing a game mechanic, a clear and focused contribution is welcome.

The project is still at the foundation stage. The game-state core has unit tests but is not connected
to the application window. Desktop overlays, gameplay, and menus are planned, not implemented.
Please keep that distinction clear in code, discussions, and documentation.

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

The application currently opens an empty window. No external service, account, environment file, or
administrator privileges are needed for the scaffold.

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

| Location                      | Responsibility                                                                     |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| `src/main/`                   | Electron windows, application lifecycle, and future privileged desktop operations. |
| `src/preload/`                | A narrow, explicitly scoped bridge for desktop APIs when needed.                   |
| `src/renderer/src/`           | React components, CSS, and future game presentation.                               |
| `src/renderer/src/game/core/` | Pure TypeScript lifecycle rules, independent of React and Electron.                |
| `tests/unit/`                 | Versioned unit tests that import and exercise the production implementation.       |
| `build/`                      | Versioned packaging resources, including the Windows icon.                         |
| `out/` and `dist/`            | Generated application and distribution output; never edit or commit these.         |

Keep Electron and Node.js privileges out of the renderer. Future game rules should be independent
of React, the DOM, and Electron where practical, so they can be tested without a desktop window.
Do not add an architecture layer or library before there is a concrete need for it.

Keep shared game logic portable where practical and isolate Windows-specific integration in the
desktop layer. This prepares for possible future adaptations without adding unused platform code.

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
to leave; the application shell will be responsible for cleanup and actual shutdown when integrated.
These rules do not yet provide working menus, input capture, or a playable session.

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

See [`game-state.ts`](src/renderer/src/game/core/game-state.ts) for a complete example with
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
Share test fixtures and setup where useful, but keep expected outcomes independent of the production
algorithm so tests can detect defects rather than reproduce them.

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

| Change                                  | Expected verification                                                              |
| --------------------------------------- | ---------------------------------------------------------------------------------- |
| Documentation only                      | Formatting, relative links, referenced commands, and accuracy against the source.  |
| TypeScript or application configuration | Formatting, lint, type checking, relevant unit tests, and an application build.    |
| Interface or CSS                        | Relevant static checks, plus manual review of the affected layout and interaction. |
| Desktop lifecycle or input behavior     | Relevant static checks, plus manual verification on Windows.                       |
| Packaging                               | An application build and the relevant Windows packaging command.                   |

The available checks are:

```powershell
pnpm format:check
pnpm lint
pnpm test
pnpm typecheck
pnpm build
```

Use `pnpm build:unpack` or `pnpm build:win` when packaging is affected. `pnpm start` previews a
compiled build; it does not build the application first.

Vitest runs unit tests from `tests/unit/**/*.test.ts` in a Node.js environment, without launching
Electron or a browser. Use explicit imports from `vitest` and test the production implementation
rather than duplicating its logic. `pnpm typecheck` also checks the tests and their configuration;
running Vitest alone does not replace static type checking.

For a focused run or local iteration:

```powershell
pnpm test tests/unit/game/game-state.test.ts
pnpm test:watch
```

Test source files, test configuration, and the lockfile belong in Git. Generated `.vitest/` artifacts,
coverage output, and test reports remain ignored. Coverage reporting and CI workflows have not been
configured; do not report them as passing checks.

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
