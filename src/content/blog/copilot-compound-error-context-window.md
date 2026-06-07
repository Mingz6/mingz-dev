---
title: "The math behind why Copilot agents fail silently"
summary: "Two numbers most devs skip: 95% per-step accuracy → 8% success over 50 steps. Context at 50% → loss-in-the-middle. Notes from GitHub Copilot Dev Days Vancouver #2."
date: "Jun 7 2026"
tags:
- AI
- Copilot
- Agents
- Prompt Engineering
draft: false
---

![GitHub Copilot Dev Days Vancouver — Microsoft Waterfront, June 4 2026](/images/blog/copilot-dev-days-2026/event-signage.jpeg)

Last Thursday I was at GitHub Copilot Dev Days Vancouver #2 at the Microsoft Waterfront office. Two talks in particular had numbers I hadn't seen spelled out clearly before. Ve Sharma (Copilot engineering) opened with a question nobody in the room had a clean answer to: "You're getting 95% accuracy on every step of your agent — what's your success rate after 50 steps?"

The room guessed high. The answer is **8%**.

That number comes from compounding. If each step of a multi-step agent task succeeds 95% of the time, success across 50 steps is `0.95^50 ≈ 0.077`. Raise that to 99% per step and you still only land at 61%. Push it to 99.9% and you finally clear 95%.

| Per-step accuracy | 10 steps | 25 steps | 50 steps |
|---|---|---|---|
| 95% | 60% | 28% | **8%** |
| 99% | 90% | 78% | **61%** |
| 99.9% | 99% | 97.5% | **95%** |

The engineering implication: every agentic pipeline is a probability product. A dozen tools, a few retries, some file reads — you're already at 20+ steps. At 95% per-step reliability, you've burned through most of your success budget before writing a single line of output.

GitHub's full agentic SDLC loop makes this visceral. They showed this diagram:

<div style="border-radius:8px;overflow:hidden;border:1px solid #d0d7de;margin:1.5rem 0;overflow-x:auto;">
  <div style="background:#0969da;color:#fff;text-align:center;padding:0.45rem 1rem;font-size:0.7rem;letter-spacing:0.1em;text-transform:uppercase;font-weight:600;">
    Policy &amp; Governance — Mission Control ↻
  </div>
  <div style="display:grid;grid-template-columns:repeat(5,1fr);min-width:560px;">
    <div style="padding:0.45rem 0.6rem;background:#f6f8fa;font-weight:700;color:#0969da;border-right:1px solid #d0d7de;border-bottom:1px solid #d0d7de;text-align:center;font-size:0.78rem;">① Plan</div>
    <div style="padding:0.45rem 0.6rem;background:#f6f8fa;font-weight:700;color:#0969da;border-right:1px solid #d0d7de;border-bottom:1px solid #d0d7de;text-align:center;font-size:0.78rem;">② Code</div>
    <div style="padding:0.45rem 0.6rem;background:#f6f8fa;font-weight:700;color:#0969da;border-right:1px solid #d0d7de;border-bottom:1px solid #d0d7de;text-align:center;font-size:0.78rem;">③ Review</div>
    <div style="padding:0.45rem 0.6rem;background:#f6f8fa;font-weight:700;color:#0969da;border-right:1px solid #d0d7de;border-bottom:1px solid #d0d7de;text-align:center;font-size:0.78rem;">④ Test &amp; Secure</div>
    <div style="padding:0.45rem 0.6rem;background:#f6f8fa;font-weight:700;color:#0969da;border-bottom:1px solid #d0d7de;text-align:center;font-size:0.78rem;">⑤ Operate</div>
    <div style="padding:0.7rem 0.6rem;border-right:1px solid #d0d7de;font-size:0.82rem;line-height:1.8;">
      Brainstorming Agent<br>Issues<br>Planning Agent<br>Spaces
    </div>
    <div style="padding:0.7rem 0.6rem;border-right:1px solid #d0d7de;font-size:0.82rem;line-height:1.8;">
      Agent Mode<br>Coding Agent<br>Loops<br>Spark Workbench
    </div>
    <div style="padding:0.7rem 0.6rem;border-right:1px solid #d0d7de;font-size:0.82rem;line-height:1.8;">
      Coding Agent<br>Coding Review<br>Playwright<br>Pull Requests
    </div>
    <div style="padding:0.7rem 0.6rem;border-right:1px solid #d0d7de;font-size:0.82rem;line-height:1.8;">
      Actions<br>Autofix<br>Code Quality<br>Spark Runtime
    </div>
    <div style="padding:0.7rem 0.6rem;font-size:0.82rem;line-height:1.8;">
      Metrics<br>Models<br>Spark Runtime<br>SRE Agent
    </div>
  </div>
  <div style="background:#f6f8fa;padding:0.4rem 1rem;font-size:0.72rem;color:#666;text-align:center;border-top:1px solid #d0d7de;">
    3rd-party agents &nbsp;·&nbsp; Custom Agents &nbsp;·&nbsp; AI Controls &nbsp;·&nbsp; Copilot CLI &nbsp;·&nbsp; Integrations &amp; MCP
  </div>
</div>

Five phases, each with its own agents. A real task touches Planning Agent → Coding Agent → Coding Review → Autofix → SRE Agent, plus tool calls at each step. The 50-step number in the compound error math isn't hypothetical — it's conservative.

## Why context windows make this worse

Compound error explains why agents fail over time. Context window degradation explains why they fail right now.

Two specific thresholds matter:

**50% context used → loss-in-the-middle.** This is well-documented in LLM research: when a context window is half full, the model systematically underweights content in the middle of the context. It attends to the start (system prompt, early instructions) and the end (most recent messages) but the middle becomes noise. If your relevant code or constraints landed there, the model will quietly ignore them.

Fix: `/clear` to start a fresh context before starting a new task. Don't let context carry over from an unrelated thread.

**70–80% context used → recency bias.** At this threshold, the model's attention collapses toward the most recent tokens. Everything earlier — your original requirements, earlier tool results, constraints you set up — deprioritises. The model is now effectively a different agent than the one you started with.

Fix: `/compact` to summarise and compress context before you hit this threshold. In VS Code Copilot's agent mode, you can see context usage — make `/compact` a reflex when you see it approaching 70%.

## The ROI formula he used

Ve framed the whole talk around a simple formula for agent value:

```
Agent ROI = (Value delivered - Agent cost) / Agent cost × 100%
```

The cost side includes token spend, latency, and developer time to review outputs. The value side is the work the agent actually completed correctly. Given the compounding math above, the denominator rises faster than most teams expect — especially after GitHub moved to token-based billing on June 2, 2026.

The obvious way to push ROI up isn't better models — it's **reducing step count and increasing per-step accuracy**. Both of these are engineering problems, not AI problems.

## The research → plan → implement pattern

Ve's concrete fix was workflow structure. Rather than asking an agent to "do the whole thing," you constrain it to three sequential modes:

1. **Research** — read only, no writes. Understand the codebase, gather context, surface relevant files.
2. **Plan** — write a plan to a file or comment. No code yet. Get human sign-off if needed.
3. **Implement** — execute the plan. Context is fresh and scoped. Steps are well-defined.

This pattern keeps each mode's step count small. A 10-step research phase at 99% accuracy delivers 90% success. That's a much better input to a 10-step implementation phase than a monolithic 50-step task.

It also maps directly to the `/clear` and `/compact` rhythm: research → `/clear` → plan → `/clear` → implement.

## Unit tests as agent guardrails

Ve's team runs the Copilot CLI codebase with 53% test coverage and ships ~500 PRs per week using agents. The coverage number sounds low — but the point wasn't coverage percentage.

Tests serve a different function for agents than for humans. A human developer reads code and reasons about it. An agent generates code and submits it. Tests are the **deterministic gate** that catches the generation errors the model can't self-detect. Without tests, the agent has no falsifiable signal — it can only compare its output to its own prediction.

The minimum viable guardrail: any function the agent touches should have at least one test that verifies the happy path. Not 100% branch coverage — just enough that a broken implementation fails the suite.

## Five things to start today

Ve's closing list (his words, not mine):

1. Write a `copilot-instructions.md` at the repo root. Even 10 lines of context cuts hallucination on project-specific patterns.
2. Use `/clear` before starting any new task, not just when things break.
3. Set a context threshold alert — `/compact` at 70%, not 90%.
4. Add tests before asking an agent to touch a function, not after.
5. Pick one task this week and run Research → Plan → Implement explicitly. Notice how much less rework you do.

The math isn't discouraging. A 99% per-step accuracy × 50 steps still delivers 61%. That's actually impressive for automated software work. The problem is assuming the 61% is 100% and being surprised when it isn't.
