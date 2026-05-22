---
title: "React Component Library"
summary: "Shared UI component library with Storybook — built as an internal design system inside an Nx monorepo with strict TypeScript and SCSS modules."
date: "Mar 15 2024"
draft: false
tags:
- React
- TypeScript
- Storybook
- Nx
---

<!-- TODO: Migrate from mingz-projects repo into mingz-dev. Add repoUrl back once public. Delete old repo after. Due: June 7, 2026 -->

An internal design system built to keep UI consistent across multiple apps in an Nx monorepo. Components are developed in isolation with Storybook, versioned, and consumed by a demo app.

## Why

Every team project I touched had slightly different buttons, inputs, and layout patterns. This library extracted the common pieces into one source of truth — change it once, propagate everywhere.

## Components

- **Buttons** — primary, secondary, icon-only, loading state variants
- **Form inputs** — text, select, textarea with built-in validation and error display
- **Navigation tabs** — accessible keyboard navigation, active state indicators
- **Layout primitives** — stack, cluster, sidebar patterns

## Tech

- React 18 + strict TypeScript (no `any`)
- Storybook 8 for interactive documentation and visual regression
- Nx workspace — build/test caching, affected-only CI
- SCSS modules with design tokens for consistent spacing and color
