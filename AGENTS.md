# Repository Guidance

## Repository purpose

This repository stores engineering documentation and reusable analysis skills.

## Directory ownership

- `docs/`: human-readable technical documentation and its HTML entry pages.
- `skills/`: reusable Codex skills. Every real skill must contain a complete `SKILL.md`.
- `assets/`: shared, offline-capable site styles and scripts.
- `index.html`: the GitHub Pages and local offline entry point.

## Documentation structure

RNOH documentation is organized by:

```text
docs/rnoh/
├── performance/
├── features/
└── components/
```

Component-specific documents belong under `docs/rnoh/components/<component>/`.

## Site requirements

- Use relative links so GitHub Pages project paths and local `file://` browsing both work.
- Do not depend on CDN assets.
- Every directory visible in navigation should contain an `index.html`.
- Keep source-grounded paths and call sites in technical documents.
- Preserve UTF-8 encoding for Chinese content.
- Update parent index pages when adding or moving a document.
- Verify local links before committing.
