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
    appearance/        Built: appearance model, fonts, CSS variable mapping
  widgets/
    index.ts           Built: the widget registry
    <widget-id>/       Built: one folder per widget (6 widgets)
  backgrounds/         Built: background registry and per-type settings
  ui/                  Built: ErrorBoundary, form fields, FontField
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
   Migrations only **fill missing fields** and never overwrite existing
   ones: WXT re-runs them on data written without a version marker (for
   example widget data from a backup restore).
2. Migrations are pure functions with unit tests.
3. Readers always get a fully-defaulted value: `normalizeSettings` and
   `normalizeBackground` repair or drop invalid data, and widget data is
   merged over the widget's `defaultData`.

### Settings shape (v2)

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
  display: WidgetDisplay; // per-widget overrides, section 6
}
```

History: v1 had only `widgets`; the v2 migration adds the default
`appearance` (`settingsMigrations` in `core/storage/settings.ts`).

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

Built: Clock, Greeting, Search, Quick Links (tiles, presets, folders),
Notes, and Text (the minimal reference implementation). Default layout:
Clock, Greeting, Search and Quick Links in the centre.

Shared pieces: `core/time` (aligned `useTime` hook and `Intl` formatting)
and `ui/fields.tsx` (labelled form controls every settings screen uses).

Widget settings changes are pure functions in `core/widgets/actions.ts`
(add, remove, update, move) so they are unit tested without React.

### Quick Links data (Built)

```ts
type Item = Link | Folder;
interface Link {
  kind: "link";
  id: string;
  url: string; // raw user input; normalised when rendered
  name: string; // "" = show the domain
  icon: string; // "auto" | "none" | curated icon name
}
interface Folder {
  kind: "folder";
  id: string;
  name: string;
  icon: string; // curated icon name
  links: Link[];
}
interface LinksData {
  items: Item[];
  layout: "grid" | "tabs";
  tabSwitch: "click" | "hover"; // tabs layout only
  activeTab: string | null; // last selected tab, restored next time
  columns: number;
  openInNewTab: boolean;
  shortcuts: boolean; // number keys 1-9
  favicons: boolean; // opt-in, see section 10
  style: LinkStyle; // preset values, see section 6
}
```

- Folders hold links only (one level, no nesting). Items have ids, so
  editing and future drag-and-drop do not depend on array positions.
- Tree updates are pure functions in `widgets/links/items.ts`.
- Icons come from a curated Lucide subset (`icons.tsx`); importing all of
  Lucide would add over 1 MB. "auto" shows a letter badge, or the website
  icon when favicons are enabled.
- Number-key shortcuts ignore key presses while typing in any field or
  inside the settings panel. With a folder open, they target its links.
- **Grid layout**: a folder opens as a popover attached to its tile
  (`popover.ts` places it below, flips above when there is no room, keeps
  it on screen and caps its height). It is rendered into `<body>` with
  fixed coordinates so slot transforms cannot offset it. No page dimming;
  Esc, an outside click or the tile closes it, and focus returns to the
  tile.
- **Tabs layout**: links outside folders form a first "Links" tab (omitted
  when empty), then one tab per folder. Follows the WAI-ARIA tabs pattern
  (arrow keys, Home/End, roving tabindex); switches on click or, if chosen,
  hover after 150 ms. Number keys open links in the active tab.
- Data history: v1 had no layout fields; v2 adds them (`linksMigrations`).

## 6. Styling and customisation (Built)

Styles cascade in four layers, all through CSS custom properties:

1. **Tokens**: `styles/global.css` defines base variables (`--color-text`,
   `--font-sans`, ...) with light and dark values for the settings UI.
2. **Global appearance** (`Settings.appearance`): font, weight, text colour,
   text shadow, text size, edge padding and widget spacing, written by
   `appearanceVars()` as `--dashboard-*`, `--edge-padding` and
   `--widget-spacing` on the dashboard root.
3. **Per-widget overrides** (`WidgetInstance.display`): font, weight, size
   (percent of the page size) and colour, written by `displayVars()` as
   `--widget-font`, `--widget-weight`, `--widget-scale` and
   `--widget-colour` on that widget's wrapper.
4. **Widget style presets**: e.g. Quick Links _Glass_ and _Plain_, which
   are named bundles of setting values, not separate stylesheets.

Rules:

- Only options the user actually set are written, so unset options fall back
  to the layer below. Clearing an override deletes it.
- Widgets that need a default weight read
  `var(--widget-weight, var(--dashboard-weight, <default>))`.
- Widget sizes use `em`, so the page text size scales them. Quick Links
  tiles and form inputs keep their own sizes.
- Font names typed by users and colours are sanitised before they reach
  CSS (`fontFamilyCss`, hex-only colours), so settings cannot inject CSS.
- Animations respect `prefers-reduced-motion`; interactive elements have
  visible `:focus-visible` styles. Buttons have unique accessible names.

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

Gradient presets (`core/background/presets.ts`) are built from the
Catppuccin Mocha palette. Each preset carries the darken level that keeps
white text at WCAG AA contrast (4.5:1); `presets.test.ts` fails if a preset
breaks that. Reset restores the default background and, after asking,
deletes an uploaded image.

## 9. Testing and quality

- **Unit**: storage migrations, reducers, appearance-to-variables mapping.
- **Component**: widgets and settings with Testing Library, using WXT
  `fakeBrowser` for storage.
- `npm run check` (typecheck, lint, format, tests) must pass before every
  commit. CI runs the same, then builds and zips both browsers.

## 10. Privacy and security

- No analytics, crash reporting or remote logging.
- No remote code; everything ships in the extension bundle.
- External requests, all triggered by the user's own settings:

  | Feature                   | Request                              | What is sent       |
  | ------------------------- | ------------------------------------ | ------------------ |
  | Quick Links website icons | `icons.duckduckgo.com` (opt-in, off) | Each link's domain |
  | Search                    | Chosen engine, on submit only        | The search query   |

- User-entered link URLs and custom search URLs are validated
  (`http`/`https` only), so `javascript:` URLs can never run.
- No `dangerouslySetInnerHTML` with user content.

## 11. Decisions log

| Date       | Decision                                   | Reason                                            |
| ---------- | ------------------------------------------ | ------------------------------------------------- |
| 2026-11-16 | Fresh codebase instead of a Tabliss fork   | Own product, modern stack, MIT licence            |
| 2026-11-16 | WXT + React 19 + TypeScript + plain CSS    | See section 2                                     |
| 2026-11-16 | MIT licence                                | Permissive; no Tabliss code is copied             |
| 2026-11-16 | Extensions only, no website build          | Focus; can be added later with Vite               |
| 2026-11-16 | Widget data in `storage.local`, not sync   | Avoid the 8 KB per-item sync limit                |
| 2026-11-16 | No telemetry or crash reporting            | Privacy by default                                |
| 2026-11-16 | Background images in IndexedDB             | Too large for browser.storage; never synced       |
| 2026-11-16 | Settings panel is non-modal                | Changes preview live on the page behind it        |
| 2026-11-16 | DuckDuckGo is the default search engine    | Privacy by default; user can change it            |
| 2026-11-16 | Website icons are opt-in                   | Loading them reveals link domains to DuckDuckGo   |
| 2026-11-16 | Curated icon set instead of all of Lucide  | Bundle size                                       |
| 2026-11-16 | Text size as a percentage, not px          | One control scales every widget consistently      |
| 2026-11-16 | No user custom CSS                         | Every option has a control; sanitised inputs only |
| 2026-11-17 | Folder popover anchored to its tile        | Keeps the visual link to the folder; no dimming   |
| 2026-11-17 | Tabs layout for Quick Links                | Every category one click away; folders as tabs    |
| 2026-11-17 | Migrations never overwrite existing values | WXT re-runs them on unversioned (restored) data   |
| 2026-11-17 | Presets carry their own darken level       | Colourful pastels stay readable with white text   |
