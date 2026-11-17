# Weborg

A simple, feature-rich new tab page for Chrome and Firefox that you can
customise without writing code.

> Early development. Not yet published to browser stores.

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

`npm run dev` looks for Google Chrome and sulks if it can't find it. Point it
at any Chromium browser (Brave, Helium, Edge...) with a `web-ext.config.ts`
in the project root. It's gitignored, so your browser stays your business:

```ts
import { defineWebExtConfig } from "wxt";

export default defineWebExtConfig({
  binaries: { chrome: "/usr/bin/helium" },
  startUrls: ["chrome://newtab"],
});
```

## Contributing

Glad you're here. A few house rules keep the history readable and the
maintainer's blood pressure low.

### Branches

```
main      what people actually run. Treat it like a museum: look, don't touch.
dev       where finished features hang out before a release.
feature/* one branch per feature, cut from dev.
fix/*     same idea, for bugs.
docs/*    same idea, for words.
```

The flow, every time:

1. Start from an up-to-date `dev`:
   `git checkout dev && git pull && git checkout -b feature/your-thing`
2. Build the thing. Commit in small pieces.
3. Run `npm run check`. If it's red, it's not done, no matter how good it
   looked on your machine.
4. Merge into `dev` with `--no-ff`, so the feature stays visible as one
   bundle in the history instead of dissolving into a pile of commits.
5. Delete the feature branch. It served bravely.
6. `dev` goes into `main` (also `--no-ff`) only when cutting a release.

Fast-forward merges are off for this repo; set it once in your clone too:

```sh
git config merge.ff false
```

### Commits

- [Conventional Commits](https://www.conventionalcommits.org):
  `feat(links): add folders`, `fix(search): ignore empty queries`.
- Say **why**, not just what. "Fix bug" tells future-you nothing;
  future-you will be annoyed.
- No `Co-authored-by` trailers or tool credits in commit or merge messages.
- Never commit `.env` files or secrets. Git remembers forever, and so does
  the internet.

### Before you open a pull request

- `npm run check` passes (typecheck, lint, formatting, tests).
- New behaviour has tests. "It works on my machine" is not a test.
- If you changed how something is structured, update
  [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) in the same branch.

## License

[MIT](LICENSE)
