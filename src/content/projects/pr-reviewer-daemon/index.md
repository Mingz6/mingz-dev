---
title: "PR Reviewer Daemon"
summary: "Autonomous AI code reviewer that runs on your machine — polls GitHub for PRs, gathers context from multiple sources, and posts inline review comments."
date: "Apr 07 2026"
draft: false
repoUrl: https://github.com/Mingz6/pr-reviewer-daemon
tags:
- TypeScript
- AI
- GitHub API
- Code Review
---

I got tired of context-switching to review PRs. So I built a daemon that does it automatically.

## What it does

Runs on my Mac as a background service. During business hours, it polls GitHub for open PRs, gathers context from five sources (codebase, work items, team chat, database schemas, git history), runs a multi-step AI review chain, and posts inline comments on the exact file and line.

Not a toy linter — it checks requirement coverage, security (OWASP), data integrity, and even triages existing Copilot suggestions.

## How it works

1. **Discovery** — GitHub Search API finds open PRs. Optionally monitors a Teams chat for PR links.
2. **Triage** — Skips drafts, bot PRs, and anything it already reviewed (tracked in SQLite).
3. **Context** — Pulls the PR diff, linked work item + discussion, local codebase, DB schema, and recent git history.
4. **Review** — Four-stage AI chain: requirement check → code review (10 categories) → deep dive on risky findings → Copilot comment triage.
5. **Post** — Inline GitHub comments on specific lines, thread replies, and a summary with a verdict.

## Graceful degradation

If Teams tokens expire, it skips chat monitoring. If the database is down, it skips schema checks. If the AI rate-limits, it backs off and retries. Each piece is optional — the core GitHub → AI → comment loop always works.

## Stack

- TypeScript + Node.js
- Azure OpenAI (GPT-4o)
- GitHub REST API (Octokit)
- SQLite for review state
- node-cron for scheduling
- launchd / Docker for deployment
