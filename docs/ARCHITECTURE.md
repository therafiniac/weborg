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
  app/                 Planned: app shell, providers, settings panel
  core/
    storage/           Planned: storage items, migrations, React hooks
    layout/            Planned: positions, slot rendering
    appearance/        Planned: global appearance -> CSS variables
  widgets/
    <widget-id>/       Planned: one folder per widget (see section 5)
  backgrounds/
    <background-id>/   Planned: one folder per background type
  ui/                  Planned: shared components (Button, ColourInput, ...)
  styles/              Built: global.css and design tokens
  test/                Built: test setup
public/icon/           Built: extension icons (placeholder)
docs/                  This document
```

Rule: `widgets/*` and `backgrounds/*` may import from `core/` and `ui/`, never
from each other. `core/` never imports from `widgets/` except through the
registry.

## 4. Data and storage (Planned)

### Storage areas

`browser.storage.sync` follows the user across devices but is small: about
100 KB total and **8 KB per item** in Chrome. `storage.local` is per device
and much larger. Weborg splits data by size:

| Key                 | Area  | Contents                                             |
| ------------------- | ----- | ---------------------------------------------------- |
| `sync:settings`     | sync  | Appearance, layout, list of widget instances         |
| `local:widget:<id>` | local | Each widget instance's data (links, folders, notes)  |
| `local:background`  | local | Background type and its settings                     |
| `local:cache:<id>`  | local | Disposable cached data (fetched images, API results) |

Large or unbounded data (links, notes, uploaded images) never goes in sync.
Syncing widget data across devices can come later as an explicit opt-in.

### Versioning

Every item is defined with `storage.defineItem(key, { fallback, version,
migrations })`. Rules:

1. Changing a stored shape bumps `version` and adds a migration.
2. Migrations are pure functions with unit tests.
3. Readers always get a fully-defaulted value; components never handle
   `undefined` settings.

### Settings shape (initial)

```ts
interface Settings {
  appearance: Appearance; // section 6
  widgets: WidgetInstance[];
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

### Import / export

Export writes one JSON file containing all non-cache items plus a
`formatVersion`. Import validates the file, runs migrations, then replaces
local data. Importing Tabliss exports may be added later as a converter.

## 5. Widget system (Planned)

Each widget is a self-contained module registered in one list:

```ts
interface WidgetDefinition<Data> {
  type: string; // unique, stable: stored in settings
  name: string;
  description: string;
  icon: string; // Lucide icon name
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

First widgets: Clock, Greeting, Search, Quick Links (tiles, presets, folders),
Notes.

### Quick Links data

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
   variables on that widget's wrapper.
4. **Widget style presets**: e.g. Quick Links _Plain_ and _Glass_, which
   are named bundles of setting values, not separate stylesheets.

Rules:

- Components style themselves only with variables and their own classes; no
  inline colours.
- Only options the user actually set are written, so unset options fall back
  to the layer below.
- Animations respect `prefers-reduced-motion`; interactive elements have
  visible `:focus-visible` styles.

## 7. Layout (Planned)

Phase 1 uses nine fixed positions (top/middle/bottom × left/centre/right).
Widgets in the same position stack in `order`. `Position` is stored as a
string union so a free-form grid layout can be added later as a new position
kind without migrating existing data.

## 8. Backgrounds (Planned)

Same registry pattern as widgets: colour, gradient and user image first.
Uploaded images are stored locally (IndexedDB if they exceed
`storage.local` comfort limits), never synced. Display options (blur,
dimming) apply to all background types.

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
