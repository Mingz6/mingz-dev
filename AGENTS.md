# mingz-dev — Agent Instructions

Personal portfolio + blog at mingz.dev. Astro 4 static site with SolidJS interactive islands.

See `.github/copilot-instructions.md` for full stack, structure, and conventions.

## Quick reference

- Dev: `npm install && npm run dev` → http://localhost:4321
- Build: `npm run build` (runs `astro check` — must pass, don't suppress errors)
- Prefer `.astro` for static content; `.tsx` + SolidJS only when interactivity is required
- No React, no backend — SolidJS is the interactive layer; dynamic features live in external APIs
