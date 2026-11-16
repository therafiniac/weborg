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

## License

[MIT](LICENSE)
