# Weborg

A calm, customisable new tab page for Chrome and Firefox. Arrange widgets,
pick a background that follows your light or dark theme, and keep your
links and tasks one keypress away, all without writing a line of code.

Free and open source. No accounts, no analytics, no tracking.

> **Status:** ready for testing; store listings are on the way.

## Features

- **Widgets you place anywhere:** clock, greeting, search, quick links,
  notes, text and Todoist, in nine screen positions.
- **Quick links:** tiles or plain links, folders, tabs, website icons
  (optional), drag to reorder, and number keys to open links (1–9).
- **Todoist:** see, add, edit, complete and delete tasks; Todoist's own
  views (Inbox, Today, Next 7 days, Upcoming, projects, labels, filters);
  Quick Add syntax with live highlighting (`tomorrow 5pm #Work @call p1`).
- **Light, dark or system theme**, with a one-click switch in the corner.
- **Backgrounds:** dynamic presets that change with the theme, colours,
  gradients, or your own image (optionally a different one per theme).
  Text on the background turns white or dark automatically to stay
  readable.
- **Privacy tools:** hide all widgets or just your tasks; lock the page so
  nothing changes; optional password to unlock or to show hidden tasks.
- **Appearance:** fonts, weights, text size, colour, shadow and spacing,
  globally or per widget.
- **Backup:** export and restore your settings as a file.
- **Accessible:** full keyboard support, visible focus, screen reader
  labels, and reduced motion respected.

## Install

Store links will appear here once published. Until then, install a build
by hand:

**Chrome, Brave, Edge and other Chromium browsers**

1. Download `weborg-<version>-chrome.zip` from the releases page and
   unzip it into a folder you will keep.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and choose that folder.

**Firefox (140 or newer)**

Firefox installs only signed add-ons permanently. To try an unsigned
build, open `about:debugging#/runtime/this-firefox`, click **Load
Temporary Add-on…** and choose `weborg-<version>-firefox.zip`. It is
removed when Firefox closes.

## Privacy

Everything you set up stays in your browser. Weborg has no servers and
collects nothing. It only talks to other sites when a feature you turn on
needs to:

| Feature             | Request                                 | What is sent         |
| ------------------- | --------------------------------------- | -------------------- |
| Quick link icons    | `icons.duckduckgo.com` (off by default) | Each link's domain   |
| Search              | Your chosen search engine, on submit    | Your search          |
| Todoist (connected) | `api.todoist.com`                       | Your token and tasks |

- The Todoist token and any passwords stay on this device: never synced
  and never included in backups. Passwords are stored only as salted
  hashes.
- Passwords keep out people glancing at your screen, not someone with
  access to your computer; nothing is encrypted.

### Permissions

| Permission                   | Why                                            |
| ---------------------------- | ---------------------------------------------- |
| `storage`                    | Save your settings                             |
| `api.todoist.com` (optional) | Asked only when you connect the Todoist widget |

## Development

Requires Node.js 20 or newer.

```sh
npm install
npm run dev            # Chrome, with live reload
npm run dev:firefox    # Firefox
```

| Script                            | What it does                            |
| --------------------------------- | --------------------------------------- |
| `npm run build` / `build:firefox` | Production build into `.output/`        |
| `npm run zip` / `zip:firefox`     | Store-ready zip                         |
| `npm run check`                   | Typecheck, lint, format check and tests |

Built with [WXT](https://wxt.dev), React, TypeScript and Vitest. See
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how it fits together.

### Using a browser other than Chrome

`npm run dev` looks for Google Chrome. Point it at any Chromium browser
(Brave, Helium, Edge…) with a `web-ext.config.ts` in the project root.
It's gitignored, so your setup stays local:

```ts
import { defineWebExtConfig } from "wxt";

export default defineWebExtConfig({
  binaries: { chrome: "/usr/bin/helium" },
  startUrls: ["chrome://newtab"],
});
```

## Contributing

Bug reports, ideas and pull requests are welcome. Please open an issue
before starting on anything large, so we can agree on the approach.

### Branches

```
main      what people actually run. Treat it like a museum: look, don't touch.
dev       where finished features wait for a release.
feature/* one branch per feature, cut from dev.
fix/*     same idea, for bugs.
docs/*    same idea, for words.
```

1. Start from an up-to-date `dev`:
   `git checkout dev && git pull && git checkout -b feature/your-thing`
2. Build the thing. Commit in small pieces.
3. Run `npm run check`. If it's red, it's not done.
4. Open a pull request into `dev`. Merges use `--no-ff`, so each feature
   stays one visible bundle in the history.
5. `dev` goes into `main` (also `--no-ff`) only when cutting a release.

Fast-forward merges are off for this repo; set it once in your clone too:

```sh
git config merge.ff false
```

### Commits

- [Conventional Commits](https://www.conventionalcommits.org):
  `feat(links): add folders`, `fix(search): ignore empty queries`.
- Say **why**, not just what. "Fix bug" tells future readers nothing.
- No `Co-authored-by` trailers or tool credits in commit or merge messages.
- Never commit `.env` files or secrets.

### Before you open a pull request

- `npm run check` passes (typecheck, lint, formatting, tests).
- New behaviour has tests.
- If you changed how something is structured, update
  [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) in the same branch.

### Reporting a security issue

Please don't open a public issue for security problems. Use GitHub's
**Report a vulnerability** (private advisory) on this repository instead.

## Credits

- Colours from [Catppuccin](https://catppuccin.com) (MIT).
- Icons from [Lucide](https://lucide.dev) (ISC).
- Built with [WXT](https://wxt.dev) (MIT) and [React](https://react.dev)
  (MIT).

## License

[MIT](LICENSE) © therafiniac
