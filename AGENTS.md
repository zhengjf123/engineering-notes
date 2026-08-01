# Repository Guidance

## Repository purpose

This repository stores engineering documentation and reusable analysis skills.

## Directory ownership

- `markdown/`: editable Markdown source documents.
- `docs/`: HTML reading copies generated or synchronized from `markdown/`.
- `skills/`: reusable Codex skills. Every real skill must contain a complete `SKILL.md`.
- `assets/`: shared, offline-capable site styles and scripts.
- `index.html`: the GitHub Pages and local offline entry point.

## Documentation structure

Top-level technical domains are mirrored under both roots:

```text
markdown/android/              docs/android/
markdown/rnoh/                 docs/rnoh/
markdown/cpp/                  docs/cpp/
```

RNOH documentation is further organized as:

```text
markdown/rnoh/                 docs/rnoh/
├── performance/               ├── performance/
├── features/                  ├── features/
└── components/                └── components/
```

Component-specific source documents belong under
`markdown/rnoh/components/<component>/`, with matching HTML copies under
`docs/rnoh/components/<component>/`.

## Markdown and HTML pairing

- `markdown/<relative-path>/<name>.md` must pair with
  `docs/<relative-path>/<name>.html`.
- Treat Markdown as the editable source and HTML as the reading copy.
- When a Markdown document changes, synchronize the corresponding HTML in the
  same change.
- Do not add, rename, move, or delete only one side of a pair.
- Keep index files paired as `markdown/**/index.md` and `docs/**/index.html`.

## Site requirements

- Use relative links so GitHub Pages project paths and local `file://` browsing both work.
- Do not depend on CDN assets.
- Every directory visible in navigation should contain an `index.html`.
- Keep source-grounded paths and call sites in technical documents.
- Preserve UTF-8 encoding for Chinese content.
- Update parent index pages when adding or moving a document.
- Run `node tools/check-site.mjs` to verify HTML links and Markdown/HTML pairs.
- Verify local links before committing.
