# Weborg architecture

This document describes how Weborg is structured and why. Update it in the
same pull request as any change that affects it.

Status legend: **Built** exists in the code; **Planned** is the agreed design
for upcoming phases.

## 1. Goals and principles

- **Customisable without code.** Every visual option is a setting with a
  control. No user-facing custom CSS (it may return later as an advanced
  escape hatch, never as the main path).
- **Fast on every new tab.** The page opens many times a day: keep the bundle
  small, render from local data first, never block on the network.
- **Private by default.** No telemetry, no analytics, no remote code. Network
  access happens only inside widgets that need it (weather, Unsplash) and only
  after the user adds them.
- **Minimal permissions.** `storage` only. Adding a permission needs a
  documented reason here.
- **Forward-compatible data.** Every stored shape is versioned with
  migrations, so new features never break saved setups.

## 2. Tech stack

| Concern   | Choice                                       | Why                                                      |
| --------- | -------------------------------------------- | -------------------------------------------------------- |
| Extension | [WXT](https://wxt.dev) (Vite)                | Chrome + Firefox from one codebase, MV3, fast dev reload |
| UI        | React 19 + TypeScript (strict)               | Ecosystem, familiarity, settings-heavy UI                |
| Styling   | Plain CSS + CSS custom properties            | Customisation is just variables; no preprocessor         |
| Storage   | WXT `storage` (`browser.storage` wrapper)    | Typed items, built-in versioning and migrations          |
| Icons     | Lucide (planned)                             | Maintained, tree-shakeable                               |
| Tests     | Vitest + Testing Library + WXT `fakeBrowser` | Fast, same config as Vite                                |
| Quality   | ESLint, Prettier, `tsc --noEmit`, CI         | `npm run check` runs all of them                         |

Targets: Chrome MV3 and Firefox MV3 (Firefox 140+). No standalone website
build for now.

## 3. Repository layout

```
src/
  entrypoints/
    newtab/            Built: the new tab page (WXT entrypoint)
  app/                 Built: dashboard, widget host, background layer
    settings/          Built: settings panel and its sections
  core/
    storage/           Built: settings item, useStorageItem, backup
    layout/            Built: positions and grouping
    widgets/           Built: widget contract, per-instance data, actions
    background/        Built: background model, image store (IndexedDB)
    appearance/        Planned: global appearance -> CSS variables
  widgets/
    index.ts           Built: the widget registry
    <widget-id>/       Built: one folder per widget (text so far)
  backgrounds/         Built: background registry and per-type settings
  ui/                  Built: shared components (ErrorBoundary)
  styles/              Built: global.css (tokens), ui.css (controls)
  test/                Built: test setup
public/icon/           Built: extension icons (placeholder)
docs/                  This document
```

Rule: `widgets/*` and `backgrounds/*` may import from `core/` and `ui/`, never
from each other. `core/` never imports from `widgets/` except through the
registry.

## 4. Data and storage (Built)

### Storage areas

`browser.storage.sync` follows the user across devices but is small: about
100 KB total and **8 KB per item** in Chrome. `storage.local` is per device
and much larger. Weborg splits data by size:

| Key                 | Area  | Contents                                            |
| ------------------- | ----- | --------------------------------------------------- |
| `sync:settings`     | sync  | Appearance, layout, list of widget instances        |
| `local:widget:<id>` | local | Each widget instance's data (links, folders, notes) |
| `local:background`  | local | Background type and its settings                    |
| `local:cache:<id>`  | local | Planned: disposable cached data (API results)       |

Uploaded background images are stored in IndexedDB (`weborg` database,
`files` store), not in `browser.storage`.

Large or unbounded data (links, notes, uploaded images) never goes in sync.
Syncing widget data across devices can come later as an explicit opt-in.

### Versioning

Every item is defined with `storage.defineItem(key, { fallback, version,
migrations })`. Rules:

1. Changing a stored shape bumps `version` and adds a migration.
2. Migrations are pure functions with unit tests.
3. Readers always get a fully-defaulted value: `normalizeSettings` and
   `normalizeBackground` repair or drop invalid data, and widget data is
   merged over the widget's `defaultData`.

### Settings shape (initial)

```ts
interface Settings {
  widgets: WidgetInstance[];
  // appearance: Appearance — added in Phase 3 (section 6)
}

interface WidgetInstance {
  id: string; // stable random id
  type: string; // widget id from the registry, e.g. "links"
  position: Position; // section 7
  order: number;
  display: Partial<WidgetDisplay>; // per-widget style overrides
}
```

### State in React

A small hook layer wraps storage items with `useSyncExternalStore`:
`useStorageItem(item)` returns `[value, setValue]` and re-renders when the
item changes, including from another open tab. No global state library.

- The value is `undefined` until the first read finishes; the app renders
  nothing until settings and background load, so defaults never flash.
- `setValue` updates every subscriber immediately, then persists.
- When the last subscriber unmounts, the cached value is dropped so the next
  reader gets fresh data.

### Import / export

Export writes one JSON file: `{ format: "weborg", formatVersion, exportedAt,
settings, background, widgets }`, where `widgets` maps instance ids to their
data. The background image is not included. Import validates the file,
rejects newer `formatVersion`s, drops data for unknown widgets, resets, then
writes. Reset clears both storage areas and the image. Importing Tabliss
exports may be added later as a converter.

## 5. Widget system (Built)

Each widget is a self-contained module registered in one list:

```ts
interface WidgetDefinition<Data> {
  type: string; // unique, stable: stored in settings
  name: string;
  description: string;
  defaultData: Data;
  dataVersion: number;
  migrations?: Record<number, (old: unknown) => unknown>;
  Component: React.ComponentType<WidgetProps<Data>>;
  Settings?: React.ComponentType<WidgetSettingsProps<Data>>;
}
```

- The registry (`widgets/index.ts`) is the only place that lists widgets.
- A widget reads and writes only its own data through the props it is given.
- Each widget is wrapped in an error boundary: a crashing widget shows an
  inline error and never takes down the page.
- Widgets that use the network must handle offline and failure states and
  show cached data when available.

Built: Text (the reference implementation). Next (Phase 2): Clock,
Greeting, Search, Quick Links (tiles, presets, folders), Notes.

Widget settings changes are pure functions in `core/widgets/actions.ts`
(add, remove, update, move) so they are unit tested without React.

### Quick Links data (Planned)

```ts
type LinkItem = Link | Folder;
interface Link {
  kind: "link";
  id: string;
  name?: string;
  url: string;
  icon?: Icon;
}
interface Folder {
  kind: "folder";
  id: string;
  name: string;
  icon?: string;
  links: Link[];
}
```

Folders hold links only (one level, no nesting). Items have ids, so editing
and drag-and-drop do not depend on array positions.

## 6. Styling and customisation (Planned)

Styles cascade in four layers, all through CSS custom properties:

1. **Tokens**: `styles/global.css` defines base variables (`--color-text`,
   `--font-sans`, ...) with light and dark values.
2. **Global appearance**: settings for font, weight, text colour, text
   shadow, edge padding and widget spacing, written as variables on the
   dashboard root.
3. **Per-widget overrides**: a widget's `display` settings, written as
   `--widget-font`, `--widget-size`, `--widget-weight` and `--widget-colour`
   on that widget's wrapper. (Built; the controls come in Phase 3.)
4. **Widget style presets**: e.g. Quick Links _Plain_ and _Glass_, which
   are named bundles of setting values, not separate stylesheets.

Rules:

- Components style themselves only with variables and their own classes; no
  inline colours.
- Only options the user actually set are written, so unset options fall back
  to the layer below.
- Animations respect `prefers-reduced-motion`; interactive elements have
  visible `:focus-visible` styles.

## 7. Layout (Built)

Phase 1 uses nine fixed positions (top/middle/bottom × left/centre/right).
Widgets in the same position stack in `order`. `Position` is stored as a
string union so a free-form grid layout can be added later as a new position
kind without migrating existing data.

## 8. Backgrounds (Built)

Same registry pattern as widgets (`backgrounds/index.ts`): colour, gradient
and uploaded image. Each type keeps its options when the user switches, so
switching back restores them. Uploaded images (max 15 MB, `image/*` only)
are stored in IndexedDB on the device and never synced. Blur and darken
apply to every type; darken is an overlay so it never affects blur edges.

## 9. Testing and quality

- **Unit**: storage migrations, reducers, appearance-to-variables mapping.
- **Component**: widgets and settings with Testing Library, using WXT
  `fakeBrowser` for storage.
- `npm run check` (typecheck, lint, format, tests) must pass before every
  commit. CI runs the same, then builds and zips both browsers.

## 10. Privacy and security

- No analytics, crash reporting or remote logging.
- No remote code; everything ships in the extension bundle.
- External requests are listed here as widgets add them, with what is sent.
  Example to decide later: website favicons via a third-party service reveal
  the visited domain to that service; an offline fallback icon is the
  default.
- User-entered URLs are validated (`http`/`https` only) before rendering as
  links, so `javascript:` URLs cannot run.
- No `dangerouslySetInnerHTML` with user content.

## 11. Decisions log

| Date       | Decision                                 | Reason                                 |
| ---------- | ---------------------------------------- | -------------------------------------- |
| 2026-11-16 | Fresh codebase instead of a Tabliss fork | Own product, modern stack, MIT licence |
| 2026-11-16 | WXT + React 19 + TypeScript + plain CSS  | See section 2                          |
| 2026-11-16 | MIT licence                              | Permissive; no Tabliss code is copied  |
| 2026-11-16 | Extensions only, no website build        | Focus; can be added later with Vite    |
| 2026-11-16 | Widget data in `storage.local`, not sync | Avoid the 8 KB per-item sync limit     |
| 2026-11-16 | No telemetry or crash reporting          | Privacy by default                     |
