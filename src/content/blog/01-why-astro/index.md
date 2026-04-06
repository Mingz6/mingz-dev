---
title: "Why I rebuilt my portfolio with Astro"
summary: "Moved from a React SPA in an Nx monorepo to a standalone Astro site. Here's why."
date: "Apr 06 2026"
tags:
- Astro
- React
- Portfolio
draft: false
---

I had a working portfolio in React — Vite, Nx monorepo, SCSS modules, the whole thing. It rendered project cards, had filtering by category, looked decent on mobile.

So why throw it away and start over?

## The problem with a React SPA for a content site

**SEO is invisible.** A React SPA renders everything client-side. Google technically renders JavaScript now, but my project pages and blog posts would be invisible to search crawlers in the critical first few seconds. For a portfolio that's supposed to attract employers, that's a dealbreaker.

**Every page ships the React runtime.** Even a blog post that's 100% static text was shipping ~140kb of JavaScript just to render paragraphs. Astro ships zero JS by default — my blog posts are now static HTML.

**Writing content required JSX.** Want to add a new project page? Write a React component. Want a blog post? Write JSX. With Astro, I just write Markdown files and they become pages automatically through Content Collections.

**The Nx monorepo was overkill.** Nx shines when multiple apps share libraries. I had one app consuming one component library that nobody else used. A standalone Astro project with Tailwind does the same thing in a fraction of the complexity.

## What I kept

The project data (`projects.json`) ported directly into Astro content collections. The design decisions (mobile-first, dark mode, project categories) carry over. The Azure SWA hosting stays the same — Astro outputs a `dist/` folder of static files, same as before.

## The stack now

- **Astro** — static site generator, content collections, MDX support
- **Tailwind CSS** — utility-first styling with `dark:` variants
- **TypeScript** — type-safe content schemas
- **Azure Static Web Apps** — same hosting, same CI/CD

100/100 Lighthouse. Every page under 100kb. Blog posts in Markdown.

Sometimes the right move is throwing away working code for something that fits the actual problem better.
