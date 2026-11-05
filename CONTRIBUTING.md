# Contributing to Manager.exe

Thanks for helping build Manager.exe. Whether you are reporting a confusing instruction, improving
accessibility, fixing a bug, or proposing a game mechanic, a clear and focused contribution is welcome.

The project is still at the scaffold stage. Desktop overlays, gameplay, and menus are planned, not
implemented. Please keep that distinction clear in code, discussions, and documentation.

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

| Location            | Responsibility                                                                     |
| ------------------- | ---------------------------------------------------------------------------------- |
| `src/main/`         | Electron windows, application lifecycle, and future privileged desktop operations. |
| `src/preload/`      | A narrow, explicitly scoped bridge for desktop APIs when needed.                   |
| `src/renderer/src/` | React components, CSS, and future game presentation.                               |
| `build/`            | Versioned packaging resources, including the Windows icon.                         |
| `out/` and `dist/`  | Generated application and distribution output; never edit or commit these.         |

Keep Electron and Node.js privileges out of the renderer. Future game rules should be independent
of React, the DOM, and Electron where practical, so they can be tested without a desktop window.
Do not add an architecture layer or library before there is a concrete need for it.

Keep shared game logic portable where practical and isolate Windows-specific integration in the
desktop layer. This prepares for possible future adaptations without adding unused platform code.

## Coding conventions

- Write source code, identifiers, comments, documentation, commit messages, and PR titles in English.
- Keep TypeScript strict mode enabled. Prefer precise types and `unknown` at untrusted boundaries
  over `any` or unchecked assertions.
- Use React function components and follow the Rules of Hooks.
- Keep components and functions focused. Extract shared behavior when it improves clarity, not to
  satisfy an arbitrary abstraction pattern.
- Use CSS for styling and follow the structure of the surrounding code.
- Let [ESLint](eslint.config.mjs), [Prettier](.prettierrc.yaml), and
  [EditorConfig](.editorconfig) define formatting and lint conventions. The current style uses
  two-space indentation, single quotes, and no semicolons.
- Explain non-obvious constraints in comments; avoid comments that repeat the code.
- Avoid new dependencies unless their benefit justifies their maintenance and distribution cost.

Use `pnpm format` to apply formatting. Review the resulting diff and keep unrelated formatting
changes out of your contribution.

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

## Verification

Choose checks that match the change and report what you actually ran.

| Change                                  | Expected verification                                                              |
| --------------------------------------- | ---------------------------------------------------------------------------------- |
| Documentation only                      | Formatting, relative links, referenced commands, and accuracy against the source.  |
| TypeScript or application configuration | Formatting, lint, type checking, and an application build.                         |
| Interface or CSS                        | Relevant static checks, plus manual review of the affected layout and interaction. |
| Desktop lifecycle or input behavior     | Relevant static checks, plus manual verification on Windows.                       |
| Packaging                               | An application build and the relevant Windows packaging command.                   |

The available checks are:

```powershell
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

Use `pnpm build:unpack` or `pnpm build:win` when packaging is affected. `pnpm start` previews a
compiled build; it does not build the application first.

There is no automated test suite configured yet. Do not report `pnpm test`, coverage, or CI results
as available checks. Agree on test infrastructure when adding it; until then, describe the manual
steps and observed results for behavior changes.

A successful build does not establish that desktop input, focus handling, accessibility, or an
installer works correctly. Record those checks separately, including anything you could not verify.

## Pull requests

Before asking for review:

- [ ] Review the complete diff, including any AI-assisted changes.
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
