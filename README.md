# mingz.dev

Personal portfolio and blog at [mingz.dev](https://mingz.dev).

## Stack

- **Framework:** Astro 4 (static site generation)
- **Styling:** Tailwind CSS 3
- **Interactive:** SolidJS (search)
- **Hosting:** Azure Static Web Apps
- **CI/CD:** GitHub Actions (auto-deploy on push to main)

## Structure

```
src/
├── content/
│   ├── blog/          # Markdown blog posts
│   └── projects/      # Project showcase entries
├── components/        # Reusable Astro/Solid components
├── data/              # Static data (build log, etc.)
├── layouts/           # Page layouts
├── pages/             # Routes
└── styles/            # Global CSS
```

## Dev

```bash
npm install
npm run dev          # localhost:4321
npm run build        # production build to ./dist/
```

## Based on

[Astro Sphere](https://github.com/markhorn-dev/astro-sphere) by Mark Horn — heavily customized.
