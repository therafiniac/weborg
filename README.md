# Weborg

A calm, customisable new tab page for Chrome and Firefox. Arrange widgets,
pick a background that follows your light or dark theme, and keep your
links and tasks one keypress away, all without writing a line of code.

Free and open source. No accounts, no analytics, no tracking.

<a href="https://ko-fi.com/Q3C02B5R99" target="_blank"><img height="36" src="https://storage.ko-fi.com/cdn/kofi6.png?v=6" alt="Buy Me a Coffee at ko-fi.com" /></a>

[![MIT licence](https://img.shields.io/badge/licence-MIT-blue)](LICENSE)

> **Status:** v0.2.2, an early public release. Install it locally from
> the [latest release](https://github.com/therafiniac/weborg/releases/latest).
> Chrome Web Store and Firefox Add-ons listings are coming soon.

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

| Where            | Status                                                                             |
| ---------------- | ---------------------------------------------------------------------------------- |
| GitHub (local)   | Available: [latest release](https://github.com/therafiniac/weborg/releases/latest) |
| Chrome Web Store | Coming soon                                                                        |
| Firefox Add-ons  | Coming soon                                                                        |

Until the store listings are live, install Weborg from GitHub. It takes
about a minute.

### Chrome, Brave, Edge, Opera, Vivaldi and other Chromium browsers

1. Open the [latest release](https://github.com/therafiniac/weborg/releases/latest)
   and download `weborg-<version>-chrome.zip`.
2. Unzip it into a folder you will **keep**, for example
   `Documents/weborg`. Not in Downloads: if the folder is deleted or
   moved, the browser removes Weborg and your settings with it.
3. Open the extensions page (`chrome://extensions`, or
   `brave://extensions` in Brave, `edge://extensions` in Edge).
4. Turn on **Developer mode** (top right).
5. Click **Load unpacked** and choose the unzipped folder (the one that
   contains `manifest.json`).
6. Open a new tab. If the browser asks whether to keep the changed new
   tab page, choose to keep it.

The browser may remind you at startup that a developer-mode extension is
installed. That is expected for extensions installed this way.

**Updating:** download the new zip and unzip it **over the same folder**,
replacing the old files, then click the reload button on Weborg's card in
the extensions page. Keeping the same folder keeps your settings.

### Firefox (140 or newer)

Firefox installs only signed add-ons permanently, and the signed listing
is coming soon. Until then you can try Weborg for one session:

1. Download `weborg-<version>-firefox.zip` from the
   [latest release](https://github.com/therafiniac/weborg/releases/latest).
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…** and choose the zip.

Firefox removes temporary add-ons when it closes.

### Keep your settings safe

Before updating or moving browsers, open **Settings → Backup → Export**
to save your settings to a file. **Import** restores them in any browser.
Background images, passwords and the Todoist token are not in backups.

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

## Support

Weborg is free and always will be. If it makes your new tab nicer, you
can **[buy me a coffee on Ko-fi ☕](https://ko-fi.com/therafiniac)**. Stars,
bug reports and ideas help just as much.

<a href="https://ko-fi.com/Q3C02B5R99" target="_blank"><img height="36" src="https://storage.ko-fi.com/cdn/kofi6.png?v=6" alt="Buy Me a Coffee at ko-fi.com" /></a>

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
