---
title: "Applying Meta-Harness to self-optimize my Copilot setup"
summary: "How I turned a Stanford research concept into a closed-loop system that scores my AI sessions and proposes fixes to its own instructions."
date: "May 21 2026"
tags:
- LLM
- Self-Optimization
- Agent Systems
- Python
draft: false
---

I run a heavily customized GitHub Copilot setup — 20+ instruction files, 30+ skills, 15+ specialized agents. It's powerful, but changes to this configuration were vibes-based. "This instruction seems helpful" isn't evidence. Sessions still failed for reasons nobody traced back to the root cause.

Then I read [Meta-Harness (Lee et al. 2026)](https://arxiv.org/abs/2603.28052) from Stanford. Their key insight: give the optimizer access to **full execution traces** (10M tokens per iteration step) so it can trace failures to the exact harness code that caused them. They used this to automatically discover better agent scaffolding on ToolBench, achieving 76.4% pass rate with Claude Opus 4.6.

I don't need to optimize benchmark scores. But the same principle applies perfectly to my daily workflow — if I can see the full conversation trace of a failed session, I can diagnose exactly which instruction was missing, wrong, or poorly routed.

## What I built

A scoring + diagnosis loop that runs automatically:

**Daily (zero LLM cost):** A Python worker reads my Copilot session transcripts and scores each one — did the task complete? How many wasted turns? Did the right skill fire? Were relevant instructions followed? Pure regex and heuristic signals, stored as JSON scorecards in SQLite.

**Weekly (LLM-powered):** The diagnosis engine pulls low-scoring sessions, feeds the full conversation trace plus the loaded instruction files to Azure OpenAI, and asks: "What specifically caused this to go sideways?" The output is a typed proposal — add instruction X, modify skill Y, reroute agent Z — with the exact turn where the failure manifested.

## The closed loop

```
USE → MEASURE → DIAGNOSE → PROPOSE → APPLY → USE...
```

Proposals feed into my existing flywheel (a self-improvement loop that applies changes as git commits). Next scoring cycle measures whether the fix actually improved outcomes. If scores regress, the change gets reverted.

## Why evidence-backed matters

The constraint that changed everything: you can't propose a change without pointing at a specific failed session and explaining *why* your fix would have changed the outcome. That single rule eliminated most of the speculative churn my flywheel was generating before.

"This instruction looks useful" → rejected.
"Session abc-123 failed at turn 4 because the TypeScript instruction was too restrictive on `any` types, causing 3 self-correction loops" → accepted.

## Current status

Scoring works — 41 scorecards generated so far. The diagnosis pipeline is being implemented now. Once it's running, the full closed loop will be autonomous: use the system normally, let it measure itself, let it fix itself.

The Meta-Harness paper optimizes benchmark agents. I'm using the same principle to optimize the agent I actually use 8 hours a day.
