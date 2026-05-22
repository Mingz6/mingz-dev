---
title: "Meta-Harness"
summary: "A closed-loop system that scores AI coding sessions, diagnoses failures, and proposes evidence-backed improvements to its own instruction set."
date: "May 21 2026"
draft: false
tags:
- Python
- LLM
- Self-Optimization
- Agent Systems
---

I run a heavily customized Copilot setup — 20+ instruction files, 30+ skills, 15+ agents. The problem: changes to this harness were based on vibes. "This instruction seems helpful" is not evidence. Sessions still failed for reasons nobody traced back to root cause.

Meta-Harness fixes that. Inspired by [Lee et al. 2026](https://arxiv.org/abs/2603.28052) at Stanford — which showed that giving a proposer access to full execution traces (10M tokens per step) enables it to trace failures to the exact code that caused them — I built a closed-loop optimizer for my own agent system.

## How it works

Every session gets scored automatically: did the task complete? How many wasted turns? Did the right skill fire? Were relevant instructions followed? Scores land in a SQLite database as structured scorecards.

Weekly, the diagnosis engine kicks in. It pulls low-scoring sessions, feeds the full conversation trace plus the loaded instruction files to an LLM, and asks: "What specifically caused this to go sideways?" The output is a typed proposal — add instruction X, modify skill Y, reroute agent Z — with the exact turn where the failure manifested as evidence.

Proposals feed into the flywheel (my existing self-improvement loop), which applies them as commits. Next cycle measures whether scores improved. If they didn't, the change gets reverted.

```
USE → MEASURE → DIAGNOSE → PROPOSE → APPLY → USE...
```

## What makes it different

Most agent optimization is "try stuff and hope." This system requires causal evidence — you can't propose a change without pointing at a specific failed session and explaining why your fix would have changed the outcome. That constraint alone eliminated 80% of the speculative churn my flywheel was generating.

## Tech stack

- **Scoring**: Python worker on cron, regex + heuristic signals, zero LLM cost
- **Diagnosis**: Azure OpenAI with full session trace as context
- **Storage**: SQLite — scorecards, weekly aggregates, proposal lifecycle
- **Integration**: Feeds directly into the flywheel for auto-apply with git commits
- **Inspiration**: Meta-Harness (Lee et al. 2026, Stanford) — applied to dev tooling instead of benchmarks
