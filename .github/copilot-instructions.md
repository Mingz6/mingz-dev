# mingz-dev — Copilot Instructions

Personal portfolio + blog at [mingz.dev](https://mingz.dev). Static site with some interactive islands.

## Stack

- **Framework:** Astro 4 (SSG)
- **Styling:** Tailwind CSS 3 + `@tailwindcss/typography`
- **Interactive islands:** SolidJS (search, chat widget, document-intelligence demo)
- **Hosting:** Azure Static Web Apps (auto-deploy on push to `main`)
- **Type checking:** `astro check` runs in `build`

## Dev

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # runs astro check + builds to ./dist/
npm run lint      # eslint
```

## Structure

```
src/
  content/blog/       Markdown posts (frontmatter-driven)
  content/projects/   Project showcase entries
  components/         Astro + Solid islands (.astro for SSG, .tsx for interactive)
  layouts/            Shared page shells
  pages/              Routes (file-based)
  data/               Static build-time data (e.g. build log)
  styles/             Global CSS (minimal — Tailwind does most of it)
public/js/            Vanilla JS progressive enhancement (animate, tilt, theme)
```

## Conventions

- Prefer `.astro` components for anything that doesn't need client JS. Use `.tsx` + SolidJS only when interactivity is required.
- Content is Markdown + frontmatter under `src/content/`. Follow the schema in `src/content/config.ts`.
- Tailwind utility classes in templates; custom CSS only when utilities can't express it.
- Images: keep source in `src/assets/` so Astro optimizes them. Use `<Image>` from `astro:assets`.
- Fonts: self-hosted under `public/fonts/`. Don't add Google Fonts.

## Coding Rules

- `build` must pass `astro check` — fix type errors, don't suppress.
- SolidJS components export a default function. Keep them small; split when they get over ~150 lines.
- Don't import Node-only modules into components that render at build time.
- For client-only code, use `client:load`, `client:idle`, or `client:visible` deliberately — default to SSG.

## What NOT to do

- Don't add React. SolidJS is the interactive layer.
- Don't add a backend — this is a static site. Dynamic features live in external APIs (neuro-ming, worker-center).
- Don't change the hosting target without updating `astro.config.mjs` and the SWA pipeline.
