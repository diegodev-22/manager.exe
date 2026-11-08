# Contributing to Manager.exe

Thanks for helping build Manager.exe. Whether you are reporting a confusing instruction, improving
accessibility, fixing a bug, or proposing a game mechanic, a clear and focused contribution is welcome.

The project has an early Windows desktop interaction demo: menus, a transparent gameplay surface, and
input shields are connected to the pure game-state core. Theme and language settings are implemented,
but there are no finished minigames. Multi-monitor and broader Windows desktop acceptance still need manual
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
| `src/renderer/src/assets/`     | CSS, authored cursor/supervisor artwork, and locally bundled fonts/licenses.   |
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

| File                                                                                                       | Responsibility                                                                                    |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| [`src/main/index.ts`](src/main/index.ts)                                                                   | Application startup, native windows, overlays, focus, input, IPC ownership, and shutdown cleanup. |
| [`src/main/demo-controller.ts`](src/main/demo-controller.ts)                                               | Demo session ownership and cancellable lifecycle activation.                                      |
| [`src/main/preferences-store.ts`](src/main/preferences-store.ts)                                           | Validated, versioned preference loading and serialized file replacement under userData.           |
| [`src/main/desktop-boundaries.ts`](src/main/desktop-boundaries.ts)                                         | DIP cursor bounds, work-area insets, and privileged sender checks.                                |
| [`src/main/windows-display.ts`](src/main/windows-display.ts)                                               | Bounded, read-only Windows primary desktop resolution query in physical pixels.                   |
| [`src/shared/desktop-api.ts`](src/shared/desktop-api.ts)                                                   | Typed bridge contracts and the command allowlist.                                                 |
| [`src/shared/preferences.ts`](src/shared/preferences.ts)                                                   | Supported themes/languages, default selection, preference contracts, and validation.              |
| [`src/shared/game/game-state.ts`](src/shared/game/game-state.ts)                                           | Pure state transitions and session-reference preservation.                                        |
| [`src/preload/index.ts`](src/preload/index.ts)                                                             | Scoped bridge implementation, with no raw IPC exposed to React.                                   |
| [`src/renderer/src/App.tsx`](src/renderer/src/App.tsx)                                                     | Menu presentation, keyboard navigation, and snapshot subscription.                                |
| [`src/renderer/src/components/GameSurface.tsx`](src/renderer/src/components/GameSurface.tsx)               | Introduction handoff, cursor rendering, idle help, and mounted gameplay presentation.             |
| [`src/renderer/src/components/SettingsPanel.tsx`](src/renderer/src/components/SettingsPanel.tsx)           | Accessible theme/language choices and return navigation.                                          |
| [`src/renderer/src/components/DisplayInformation.tsx`](src/renderer/src/components/DisplayInformation.tsx) | Three read-only display values in minimal pixel-framed rows.                                      |
| [`src/renderer/src/hooks/use-preferences.ts`](src/renderer/src/hooks/use-preferences.ts)                   | Committed presentation preferences, explicit saving, and failure feedback.                        |
| [`src/renderer/src/menu-navigation.ts`](src/renderer/src/menu-navigation.ts)                               | Shared arrow-key focus navigation without intercepting Tab or system modifiers.                   |
| [`src/renderer/src/i18n/`](src/renderer/src/i18n/)                                                         | Offline i18next initialization, type augmentation, message mapping, and English/Spanish catalogs. |
| [`src/renderer/src/assets/base.css`](src/renderer/src/assets/base.css)                                     | Shared palette, typography defaults, and transparent document baseline.                           |
| [`src/renderer/src/assets/main.css`](src/renderer/src/assets/main.css)                                     | Menu, game surface, edge vignette, hint, and cursor styling.                                      |

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

| Current state              | Action                     | Next state                          |
| -------------------------- | -------------------------- | ----------------------------------- |
| `ready`                    | `start`, with session data | `playing`                           |
| `ready`                    | `open-settings`            | `settings`, returning to `ready`    |
| `playing`                  | `pause`                    | `paused`                            |
| `paused`                   | `resume`                   | `playing`                           |
| `paused`                   | `open-settings`            | `settings`, returning to `paused`   |
| `settings`                 | `close-settings`           | Recorded `ready` or `paused` origin |
| Any state except `exiting` | `exit`                     | `exiting`                           |

Actions that are not allowed leave the same state object unchanged. `exiting` is terminal and
ignores further actions, including another `exit`.

Session data is supplied by the caller, not defined by the core. Pausing, resuming, and visiting
settings preserve the exact session reference without cloning or mutating it. This does not provide
deep immutability or persistence; callers own their session data. Closing settings never resumes
automatically. Settings opened from `ready` carry no session; settings opened from `paused` carry
the same session and an explicit `returnTo` discriminant. Closing returns to the recorded origin.

The core owns no timers, input listeners, React state, or Electron APIs. `exiting` records a request
to leave. The desktop controller now connects this lifecycle to menus and owns the opaque demo
session; the Electron window layer performs cleanup and actual shutdown. The demo exposes settings
actions but does not implement real minigame rules. Preferences are separate from the game session.

Focus loss, minimization, renderer reload, or display changes pause active play and release the
input shields. Losing native focus also minimizes the primary window from ready, paused, settings,
or play so its display-sized transparent surface cannot remain in front of another application.
Drop always-on-top and destroy pending/visible shields before minimizing; guard re-entrant native
blur/minimize callbacks. Windows can report `blur` while the window is already focused during
restoration: ignore that notification and coalesce other focus-loss checks to the next main-loop
turn. Cancel the owned check on focus recovery and disposal, then recheck actual native focus before
minimizing. Keep ready/settings state and unsaved drafts intact. The window stays in
Windows' normal taskbar/task-switching lifecycle, not hidden or restored by an application timer.
Only user-driven native restoration brings it back, and only explicit Resume reactivates play.
Native cursor confinement and global input hooks are not
used; a visual cursor is clamped to the primary display using Electron DIP coordinates.
The primary native window spans the display bounds from startup, rather than resizing between a
small menu window and gameplay. The renderer keeps menu cards compact and shares one screen-edge
background fade across menus, settings, pause, and play. The window is not movable, exclusive
fullscreen, or kiosk mode; menu titles do not drag it away from the display edges. Display changes
realign every view to the current primary bounds. The primary window stays in normal z-order even
during play to avoid Windows focus/hit-testing regressions. Only active secondary input shields
use always-on-top. Primary transparent-area hit testing,
taskbar overlap, and broader task switching remain
manual Windows acceptance checks; do not infer click-through from visual transparency.
Keep the root CSS `color-scheme` neutral and the `html`, `body`, and React root backgrounds
transparent. Apply native light/dark control schemes below the document root so Chromium's default
canvas color cannot replace desktop transparency. Menu margins show the real moving desktop;
there is no menu screenshot, refresh timer, or live capture stream.
Within the primary window, use Windows' reported work area for menu layout. The main process
converts screen-space bounds/workArea to clamped DIP insets, which travel in revisioned snapshots;
the controller stores this presentation metadata without changing the pure lifecycle or session.
The initial menu and settings are centered within that area. Pause menus anchor bottom-left with
a 24–40 DIP responsive margin inside the work area, not against the screen edge or taskbar.
The full-display vignette remains outside this inset layout so its bands stay on the screen edges.
Work-area changes refresh the snapshot even while paused or in settings; do not poll native screen
APIs from React or assume a fixed taskbar height. Auto-hide taskbars still require manual acceptance.
While minimized or unfocused, update cached display metadata without setting native bounds. Apply
pending geometry on user-driven focus, changing bounds only if necessary. Overlay activation must
validate foreground state before preparation/entry, and cancellation identity, lifecycle status, and
minimization around native side effects. Let the owned focus-loss check settle transient native blur;
never call `focus`, `show`, or `restore` to recover a pending Play/Resume. Renderer DOM focus restoration
also waits for a visible, focused document. These safeguards do not establish compatibility with
every Windows/display configuration; follow the manual acceptance guidance under verification.

### Display adaptation and diagnostics

The native window and responsive CSS continue to use the primary display's DIP bounds and Windows
work area; do not replace those layout units with physical pixels or change Windows display modes.
Read-only `DisplayMetrics` travels through the existing revisioned, primary-only snapshot. It is not
a saved preference, editable draft, or game rule. Refresh metadata on display events and user-driven
focus without restoring a background window or replacing settings drafts.

Electron supplies the nominal display frequency and scale factor. Exact current desktop dimensions
come from Windows `EnumDisplayDevicesW`/`EnumDisplaySettingsW`, not DIP dimensions multiplied by scale:
fractional DPI rounding can otherwise add pixels. Main owns a hidden Windows PowerShell invocation
of fixed local C# interop, with a 5-second deadline, bounded output, and abort on replacement/disposal.
No renderer strings enter the command; it reads no images, user files, or remote content, needs no
administrator privileges, and changes no system settings. A blocked/unavailable query shows an
unavailable value, never guessed dimensions. Unchanged focus returns reuse the resolution cache.

The cursor already uses on-demand `requestAnimationFrame` with transforms outside per-frame React
state. CSS places its initial hotspot at the primary surface's center, including after the
introduction and on resume, until the first real movement replaces it with primary-local coordinates.
This never repositions the Windows system cursor. Leave synchronization to Chromium/Windows;
Hz is not a measured FPS target or instantaneous
VRR rate. Do not add a fixed 60 FPS timer, offscreen-only frame-rate API, GPU-disabling flags, or an
idle gameplay loop. Settings has only three display rows: FPS, Screen resolution, and Scaling, with
labels on the left and read-only pixel-framed values on the right. The requested FPS label reports
monitor Hz; do not present it as measured/guaranteed gameplay FPS. There is no FPS sampling loop,
extra heading, explanatory paragraph, or permanent saved-status text. Missing/loading values use
compact glyphs with localized accessible descriptions. Keep settings copy minimal; errors and the
required discard confirmation remain concise rather than removing their feedback or safeguards.
Keep more space between settings sections than within choice groups. Read-only values use muted,
recessed pixel frames and a default cursor, not raised button shadows or hover/pressed effects.
Preserve text contrast in both themes; do not dim the entire element with opacity or add disabled
form controls merely to style static information.

The screen supervisor design preview uses one renderer-owned animation loop only during visible,
focused play, independent of the on-demand cursor. Its 64x48px floating shell and discrete face layers
use an integer CSS scale up to 2x (128x96 CSS pixels), falling back to 1x on smaller views. There are
no humanoid arms, legs, or torso. Reduced motion stops its loop and shows a still pose.
Renderer-owned preview storage survives pause/settings unmounts, but not a renderer reload;
it never changes the main-owned session. Resizing clamps the full sprite to the primary surface.
The preview has no attacks, damage, secondary-display movement, or desktop privileges.

Play now begins with a renderer-owned Manager introduction: an empty
beat, automatic temporary desktop-background zoom, a white/gray smoke pop, a sleepy wake-up,
interactive dialogue, and zoom-out into roaming. Windows zoom/settings are never modified. The pure game
lifecycle remains `playing` throughout; Esc pauses any stage without a visible hint during the intro.
The menu owns the retained timeline across pause/settings. Only glyph/phase changes enter React
state; animation frames own camera/sprite transforms. Only left click or unmodified Enter first
completes typing, then advances the sentence. Space is suppressed, including native button key-up
activation, and held Enter does not skip sentences. The reusable speech balloon reserves the current sentence's width, uses
stepped corners and hard shadows, and stays just above and slightly right of the actor.
Screen readers receive whole sentences, not per-character announcements. A compact single-line
Click · Enter hint sits inside the solid balloon's lower edge, without an extra card, icons, or action
row. Its tiny stepped arrow only animates when the sentence is complete, without flashing or moving
the speech text. Stable, localized accessible instructions and reveal/continue action labels remain
available even though the decorative hint is hidden from screen readers.
All input remains local to the game surface; other mouse buttons do
not advance the dialogue.

`getIntroductionFacePose` in `src/renderer/src/manager-introduction.ts` first directs closed/downcast
eyes, heavy half-open lids with a sleepy blink, open eyes still looking down, then eye contact and
a small smile. Ambient blink timing cannot override these authored wake-up poses. Dialogue then uses
friendly, skeptical, confident, playful, and pleased acting by story line, independent of translation.
The reusable supervisor sprite has sleepy eyelids/brows and closed/half/open LED mouth frames. The existing
foreground animation loop selects talking frames at 9 Hz while letters appear, resting at spaces,
punctuation, full reveal, and completion. It is silent typewriter-linked acting, not audio lip sync.
It never adds per-frame React state or another timer/loop, and pause/settings retain the actor clock.
Reduced motion removes zoom, smoke, waking motion, typing, mouth cycling, and prompt animation but
keeps each sentence's static facial expression and a visible, usable continuation cue. The static
pre-dialogue greeting is shortened to 0.35 seconds instead of holding a sleeping pose for 4.5 seconds.
The background and actor/smoke camera share the same zoom, up to 2x, toward the screen center
through the entrance, dialogue, and closing zoom-out. Manager appears enlarged during the close-up
and returns continuously to his original size; completion hands off at 1x. The balloon
counter-scales to preserve text readability, and its width/vertical budget reserves room above the
enlarged actor, limiting zoom on short/narrow surfaces before sacrificing readable speech/controls.
A final 0.25-second settle runs at 1x after the image has been released.
The same entrance image remains behind the dialogue and the pull-back, so the conversation and the
zoom-out share one stable background. It is cleared and its Blob URL revoked when the camera reaches
1x (`return-live`/`complete`), never in the middle of the dialogue. `cameraEnabled` keeps the actor
perspective across dialogue/pause/zoom-out. `needsIntroductionCapture` includes the entrance phases,
dialogue, and zoom-out; `return-live` and `complete` hold no pixels. Pause discards the image, and an
explicit Resume recaptures only while the introduction is unfinished, without restarting dialogue.

The balloon anchors its own bottom edge, not a group containing a separate footer. Main camera
scale, text counter-scale, and the actor's source-pixel bob all contribute to its offset, preserving
a four-CSS-pixel gap between the tail tip and the head. `ACTOR_HEAD_TOP` and `BALLOON_TAIL_REACH`
in `ManagerIntroduction.tsx` document the sprite/SVG geometry; update them with any tail/art changes.
Its rightward nudge is at most 20 viewport CSS pixels, reduced on very narrow surfaces. The tail
counter-offset uses text-local coordinates so the head alignment survives camera/text scaling;
the width budget reserves the extra right-hand margin instead of letting long sentences clip.

The 1.4-second pop/smoke beat is painted by `src/renderer/src/introduction-arrival.ts` over static artwork in
`components/IntroductionArrival.tsx`. Twelve paired smoke puffs expand to the sides in white and
neutral grays only, behind the actor and away from the face. The impact itself remains quick; the
smoke expands more gently, holds its volume longer, and dissolves across the final 58% of the beat.
The character rests closer to center in a gently lowered, eyes-closed/downcast pose after a small
squash/stretch rebound. The existing `greeting` presentation phase owns a 4.5-second wake-up before
any dialogue input becomes active. Whole-body keyframes favor restrained vertical breathing over
lateral wobble: sideways drift stays below one local CSS pixel during waking, lean stays within
1.6 degrees, and straightening has only a small upward overshoot without a sideways counter-swing.
Final scale is exactly 1x with zero tilt. Idle bob blends back in at the
end; eyebrow/eyelid/gaze changes stay authored on the source-pixel grid. The previous colored
particles, energy brackets/rings, aura, and CRT boot mask/scan have been removed, not hidden behind
another effect. The existing foreground timeline owns every pose and puff: no extra timers,
emitters, randomness, per-frame React state, blur filters, screen shake, or full-screen flashes.
Pause resumes the same progress through pop, closed eyes, waking gaze, and body settling. The
smoke artwork is memoized independently of typewriter updates. These are bounded design choices,
not a claim of measured performance or verified visual quality.

Play starts directly without an in-game permission dialog. The maintainer explicitly approved this
automatic capture behavior; this does not bypass Windows protections or change any system permission.
No images are acquired at app startup or while browsing menus. Reduced motion skips capture entirely.
`src/main/capture-request.ts` owns one
attempt per explicit foreground activation and rejects stale/focus/display-invalid results. Requests
remain serialized; this is not periodic capture, runs only while the introduction is unfinished, and
never runs in menus or roaming.
`src/main/introduction-capture.ts` enumerates screen identities with zero-sized thumbnails, selects
only the main-owned primary display ID, and acquires one stored frame in a disposable sandboxed
window with a private memory-only session. The game renderer/shields themselves have no media or
display-capture permission. No system picker, audio, recording, network transfer, or image file is used.
The helper stops all tracks before returning PNG bytes and is destroyed on completion/abort or its
3.5-second deadline, including a stalled acquisition renderer. A brief stream can deliver intermediate
frames internally; only one is retained, rather than claiming there is no capture stream at all.

Windows 10 build 19041+ is required for temporary window capture exclusion. The existing primary
window is never hidden or focused by capture. Its prior content-protection flag is restored after
acquisition; the helper waits briefly for composition and the renderer also hides scene artwork while
preparing. This transient protection can affect other screen-capture software during acquisition.
Do not bypass protected content, remote-session restrictions, local policy, or capture failure.
Unavailable capture uses a localized no-zoom fallback, keeping dialogue and non-camera effects.

Frame output is capped at a 3840-pixel edge, 8,294,400 pixels, and 12 MiB encoded PNG. One decoded
4K RGBA image is about 31.6 MiB; copies, capture surfaces, and compositor allocations mean this is
not a total-process memory limit. `src/renderer/src/introduction-background.ts` bounds decoding,
owns an abortable lease/Blob URL, and never puts pixel data in React state or persistence. The
renderer CSP permits image-only Blob URLs, not Blob scripts or unrestricted network access.
Blur, pause, settings, display changes, suspend/lock, reload, completion, and shutdown release or
invalidate resources. Explicit Resume recaptures the current desktop only while the introduction is
unfinished (entrance, dialogue, or closing zoom-out), without restarting the dialogue or enabling a
zoom the player never saw. The timeline and actor perspective survive without retaining stale pixels.
Enabling animation again after reduced motion never silently starts another capture.
Renderer reload resets the renderer-local preview timeline, not the saved completion marker.

`INTRODUCTION_PREVIEW_ENABLED` in `src/renderer/src/manager-introduction.ts` is temporarily enabled
for visual iteration. It replays on each renderer/app startup regardless of saved completion,
suppresses progress-storage warnings, and sends no completion writes. Pause/settings still retain
the current timeline. Disable this single switch to restore the once-per-profile policy below;
do not delete or overwrite player progress merely to replay the scene.

`src/main/introduction-store.ts` persists only the completed marker at
`userData/progress/introduction.json`, using a 256-byte versioned schema. Completion is saved only
after zoom-out; closing earlier replays the introduction. The narrow primary-frame IPC takes no
arguments and accepts completion only during foreground play. Failed reads replay with localized
feedback; failed writes leave the marker unsaved and retry on explicit resume, not on a timer.
`src/main/profile-storage.ts` shares bounded JSON reads and temporary-file replacement with
`PreferencesStore`, preserving its existing schema and explicit-Save semantics. Interrupted timeline
details are renderer-local, not saved to disk. These new paths still need manual Windows acceptance.

No combat simulation or automatic quality scaler is introduced for the current preview. A real
minigame should separate fixed-step rules from interpolated presentation and measure frame times
before adding quality adaptation. Do not claim performance improvements without measurements.

References: [Electron Display](https://www.electronjs.org/docs/latest/api/structures/display),
[Windows display modes](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-enumdisplaysettingsw),
and [animation frames](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame).

### Preferences and localization

- `PreferencesStore` owns `settings/preferences.json` under Electron's `app.getPath('userData')`.
  The version-1 schema accepts only the two themes (`dark`, `light`) and languages (`en`, `es`).
  The renderer cannot choose paths or use a generic file API. Main-process IPC validates the sender,
  argument count, update keys, values, and that the lifecycle is currently in `settings`.
- On first launch, the theme is dark. Use the first supported base language in
  `app.getPreferredSystemLanguages()` (for example, `es-PE` becomes `es`); otherwise use English.
  A saved explicit choice wins over the system language on future launches. There is no system-theme
  mode in this initial scope, and changing the theme never changes Windows or the desktop background.
- The settings panel owns an unapplied draft. Save appears only when choices differ from the applied
  preferences; selecting an option never changes the global theme/language or writes to disk. Save
  submits both choices together and only applies them after successful persistence. On failure,
  the applied preferences stay unchanged and the editable draft remains available for retry.
  Writes are serialized, use unique temporary
  files in the same directory, and replace the target by rename. Loading is capped at 4 KiB. Missing
  files are normal; corrupt, unsupported, or unreadable files fall back with a localized warning and
  are only replaced after an explicit Save. Failed saves show a localized warning.
  A saving indicator is not a guarantee against power loss or
  forced process termination; wait for saving to finish before closing the application.
- `i18next` and `react-i18next` run only in the renderer. Both small catalogs are bundled in
  `src/renderer/src/i18n/locales/` and initialized before React mounts, with `supportedLngs` set to
  English/Spanish and `fallbackLng` explicitly set to English. No HTTP backend, remote translation
  service, browser-storage detector, or extra localization tooling is needed.
- Use stable semantic keys and complete sentences, not concatenated translated fragments. Add every
  player-facing string, error, hint, title, and accessible label to both catalogs. Proper names,
  technical key names such as Esc, and the language autonyms English/Español remain unchanged.
  The English catalog supplies i18next's `CustomTypeOptions`; the Spanish catalog must satisfy its
  shape. Use typed selectors with `useTranslation`, not unchecked string keys or raw translated HTML.
  React escapes interpolated text; `escapeValue: false` is scoped to this React-rendered content.
- Keep lifecycle/native messages as typed codes in shared contracts and translate them in React.
  Update the document's `lang`, CSS theme tokens, and `color-scheme` with the current preferences.
  Keep transparent game and secondary-shield backgrounds unchanged in both themes.
- Menus and settings use fully opaque cards inside a transparent menu surface. Never reduce the
  card's opacity or put readable UI directly on the desktop: its unknown colors cannot provide a
  stable text contrast. Keep pixel frames/shadows and the local arcade font for headings, with a
  system font for larger controls and supporting text. The discard dialog is also opaque; blur and
  desktop capture are not needed. Use shared CSS tokens for control borders, focus rings, and primary
  actions, retaining native radio indicators so selection is not conveyed by color alone.
  Static sRGB calculations for the current active menu palette pairs give at least 6.33:1 for the
  evaluated text and 3.44:1 for evaluated control borders. These palette calculations exclude disabled
  controls and do not establish rendered accessibility or Windows desktop acceptance. Check both themes
  over bright, dark, and visually busy desktops, including scrolling and keyboard focus. No new
  click-through behavior is configured; transparent-margin hit testing remains a manual Windows check.
  Preserve initial and restored logical focus, but reveal its menu ring only after arrow-key or
  Tab/Shift+Tab navigation. Pointer-down switches back to pointer presentation without blurring the
  control. Do not globally suppress outlines or remove keyboard focusability to hide startup rings.
- Settings uses labeled native radio groups. Up/Down moves between groups/actions, and Left/Right
  moves focus within the current group without selecting. Override the native radio arrow behavior
  so only Enter/Space or a click selects an option; Tab/Shift+Tab remains native. Clicking a label
  selects its draft option. Back or unmodified Esc returns directly if there are no changes;
  otherwise it opens a native modal dialog with Keep editing (the safe initial focus) and Discard
  and return. Escape in the dialog keeps the draft and returns focus to the originating control.
  Only confirmed discard returns without saving. While saving, editing and Back are temporarily
  unavailable to avoid leaving an in-flight submission. Native application close remains available.
  A successful Save keeps settings open, hides Save until another choice changes, and moves focus to
  the remaining Back button only in the foreground. Back/Esc return to the recorded menu origin and
  restore focus to Settings; a pause-origin menu is bottom-left, while a ready-origin menu is centered.
  A failed Save stays in settings with its draft intact. Neither saving nor leaving settings resumes
  gameplay. Language changes must not remount controls.

References: [react-i18next setup](https://react.i18next.com/getting-started),
[i18next configuration](https://www.i18next.com/overview/configuration-options),
[i18next TypeScript](https://www.i18next.com/overview/typescript),
[Electron userData](https://www.electronjs.org/docs/latest/api/app#appgetpathname),
[Electron preferred languages](https://www.electronjs.org/docs/latest/api/app#appgetpreferredsystemlanguages),
and [WAI keyboard guidance](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html).
For palette decisions, see [WAI text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
and [WAI non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

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
For task switching, manually check ready/paused/settings (including a discard dialog), active play,
and switching away immediately after Play/Resume. Click and type in the other application; Manager.exe
must remain minimized with no shields or edge shading. Restore it via Alt+Tab/Win+Tab or the taskbar,
confirm state/draft preservation and explicit resume, and change display layout/DPI while minimized
to confirm that geometry updates cannot restore it by themselves.
For settings, manually check initial and paused entry/return, mouse and arrow-key controls, focus
retention after saving a language change, English/Spanish accents and text wrapping, both theme contrasts,
unchanged desktop transparency, saved choices after restart, and visible read/write failure feedback.
Also check that changing a choice alone does not apply it, Save appears only for real differences,
failed saves retain the draft, and Back/Esc supports both continuing to edit and confirmed discard.
After saving from either menu origin, settings must remain open with the saved theme/language applied,
Save hidden, and usable keyboard focus. Editing again must reveal Save; Back/Esc after a successful
save must leave without a discard prompt unless new changes were made, and never resume play.
For display diagnostics, compare Hz, current resolution, and scaling with Windows Advanced display
settings at 100%, 125%, 150%, and 175% scaling where available, including portrait and high-refresh
modes. Verify read-only values, localized wrapping, scrolling on small screens, and no Save/discard
prompt from diagnostics alone. Change resolution/Hz/DPI or the primary display while minimized;
Manager.exe must stay minimized, refresh its readings on return, preserve the draft, and not resume.
Check left-label/right-value alignment and pixel frames in both themes. Nominal Hz may be rounded by
Windows/Electron, and VRR does not guarantee a matching callback/presentation rate.
Native display readings and settings focus retention after Save need manual acceptance.

For the supervisor preview, check bright/dark/busy desktop backgrounds, face readability, all edge
rebounds, and small/portrait displays. Verify blinking, gaze, smiles, and pause/resume with no position
reset or time jump, including a visit to settings. Check dynamic reduced-motion changes, fractional
Windows scaling, resize/primary-display changes, cursor/help layering, and normal focus-loss cleanup.
The artwork and animation need manual visual review.

For first-play introduction acceptance, use a fresh disposable app profile: check the empty opening
has no actor/cursor/Esc hint, camera framing, white/gray side smoke, the wake-up sequence, and five localized
balloons. Left click/Enter must complete or advance only once per activation, without key-repeat
skipping. Space, including press/release on a focused balloon, and right/middle clicks must not advance.
Check sentence-specific eyebrows/gaze/smiles and that mouth motion stops at punctuation and full
reveal, including when typing is skipped. The single-line click/Enter hint must remain legible inside
the balloon without crowding speech. The slightly right-shifted balloon's tail must stay aligned and close to Manager through idle
bob, text changes, pause/resume, reduced motion, and resizing. Only the tiny ready arrow animates
in active play; reduced motion must leave it static.
Check every phrase fits in landscape/portrait/small views, both locales, and fractional DPI.
Check that the actor first pops in with closed eyes and a downward gaze; the lateral smoke must be
white/neutral gray only. Eyes must open with heavy sleepy lids while still looking down, then look
at the player as the whole body gently straightens. No colored particles or boot overlay should
appear, and dialogue must wait for eye contact and settling. Check the pop/rebound, breathing,
lean/lift, and final handoff on bright/dark desktops and fractional DPI. Esc/Alt+Tab during the pop,
closed-eye hold, sleepy blink, gaze lift, and body settling must preserve the stage without another
pop on Resume. Changing reduced motion mid-entry must settle the actor, hide smoke, and avoid a
long static waking wait.
Keep the desktop image visible through every sentence and the entire closing zoom-out; release it
only at normal 1x. Finish using Enter without moving the mouse: the virtual cursor must first appear
at the screen center, then follow real movement without a top-left flash. Check resume and the
already-completed introduction path as well; neither may move the Windows cursor.
Pause or Alt+Tab during every phase and during partial text, visit settings, then explicitly resume:
no time jump, replay, automatic resume, or hidden input blocker is allowed. Finish, restart with the
same profile, and confirm replay while preview mode is enabled. With preview disabled, completion
must skip future introductions; closing before completion must replay on next startup.
Check reduced motion (including changes mid-scene), read/save failure feedback in a disposable
profile, and unchanged explicit preference saving after the shared profile IO extraction.

A successful build does not establish that desktop input, focus handling, accessibility, or an
installer works correctly. Record those checks separately, including anything you could not verify.

Do not retain test/audit scripts, profiles, reports, or desktop pixels. Real monitor hot-plug/DPI/HDR
changes, secure desktop/actual lock or suspend, Win+Tab, remote sessions, other Windows/GPU
configurations, cursor capture, and final visual/accessibility review remain manual acceptance work.

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
