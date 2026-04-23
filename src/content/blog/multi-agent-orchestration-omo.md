---
title: "What I copied from a 48k-star multi-agent orchestration framework"
summary: "Oh My OpenAgent runs 11 specialised agents on top of a Claude Code fork. You can't use most of it inside VS Code Copilot — but four patterns translated cleanly, and one of them changed how I run multi-step tasks."
date: "Apr 5 2026"
tags:
- AI
- Agents
- Orchestration
- Copilot
draft: false
---

[Oh My OpenAgent](https://github.com/code-yeongyu/oh-my-openagent) (OmO) is a multi-model orchestration plugin for OpenCode — a Claude Code fork. 48.3k stars, ~214k lines of TypeScript, and a level of architectural ambition that makes Copilot look like a hand-rolled bash script.

Its central idea: a single AI agent is replaced by a team of 11 specialists, each with a fixed role and a preferred model. A main orchestrator (Sisyphus) classifies user intent, delegates to specialists, and enforces completion. Tasks route by *category* — research vs. implementation vs. fix vs. plan — not by model name.

Most of OmO's machinery doesn't port to VS Code Copilot. There's no pre-execution hook system, no model fallback chain, no tmux multi-pane visualisation. But after going through the source, four patterns translated cleanly. One of them is now in my daily setup.

## Pattern 1 — Discipline enforcement (the one that mattered)

**What OmO does.** Three mechanisms prevent premature stopping:

- **Todo Continuation Enforcer** — a hook that fires when the agent goes idle. If unchecked todos remain, it injects a system message: *"You have incomplete todos! DO NOT respond until all todos are marked completed."*
- **Ralph Loop** — runs until the agent emits `<promise>DONE</promise>`. Auto-continues if the agent stops without marking completion. Capped at 100 iterations.
- **Boulder State** — `boulder.json` tracks plan progress. If the session dies, the next `/start-work` resumes where it left off.

**What translated.** No hook system in Copilot, but I do have `manage_todo_list` in every session. The fix was an instruction that the model reads on every turn:

> Before yielding control back to the user, check:
> 1. Is your todo list fully completed? If not, keep working.
> 2. Did you verify your changes work? If not, verify.
> 3. Are there unresolved issues you discovered? If so, address or flag them.
> Never stop at "good enough" — finish the job.

This sits in my `think-deeper.instructions.md` as a "Don't Stop Early" section. Effect was immediate: tasks that used to end with "let me know if you want me to continue" now run to completion.

The lesson generalises. LLMs default to *plausible stopping points*. The fix isn't a smarter model; it's an explicit rule about when stopping is allowed.

## Pattern 2 — Wisdom accumulation across tasks

**What OmO does.** After each subtask completes, Atlas extracts learnings into structured files:

```
.sisyphus/notepads/{plan-name}/
├── learnings.md     # patterns, conventions
├── decisions.md     # architectural choices
├── issues.md        # blockers, gotchas
├── verification.md  # test results
└── problems.md      # unresolved debt
```

These get passed forward to every subsequent subagent. Task 5 benefits from what task 1 discovered. Mistakes don't repeat.

**What translated.** I added a single `learnings.md` to my delegate task queue. When a task completes, the completion summary appends a one-line learning. When the next task starts, the agent reads `learnings.md` and pulls in anything relevant.

It's lightweight. No subagent fan-out, no JSON parsing — just a markdown file the orchestrator reads on pickup. The cost is one extra file read per task. The benefit is that "I remember this gotcha from last week" becomes structural instead of accidental.

## Pattern 3 — Hierarchical context injection

**What OmO does.** `/init-deep` generates `AGENTS.md` files throughout a project tree:

```
project/
├── AGENTS.md              # project-wide
├── src/
│   ├── AGENTS.md          # src-specific
│   └── components/
│       └── AGENTS.md      # component-specific
```

Reading a file walks up from its directory to the root, collecting all `AGENTS.md` along the way. The agent gets progressively more specific context as it drills in.

**What translated.** VS Code Copilot already supports `.github/copilot-instructions.md` at the repo root and `.instructions.md` files with `applyTo` patterns. The unused capability is *directory-level* context — telling the agent about the specific module it's working in, not just the whole repo.

For complex codebases this is high-leverage and almost free. A `services/copilot-instructions.md` saying "this layer uses Dapper, not EF, and returns `Result<T>`" prevents an entire class of confused suggestions before they happen.

## Pattern 4 — Plan validation before execution

**What OmO does.** Before any plan runs, three reviewers gate it:

1. **Prometheus** creates the plan via interviews
2. **Metis** does gap analysis — hidden intentions, ambiguities, missing acceptance criteria
3. **Momus** validates against four criteria: *Clarity* (where to find details?), *Verification* (measurable acceptance?), *Context* (≤10% guesswork?), *Big picture* (purpose clear?)

Momus only approves when 100% of file references are verified, ≥90% of tasks have concrete acceptance criteria, and zero tasks require business-logic assumptions.

**What translated.** Full three-reviewer pipeline is overkill, but the Momus checklist is directly stealable as a pre-write self-check on any task plan:

- Do all referenced file paths actually exist? (Run `ls`.)
- Is each step specific enough that a fresh agent won't guess?
- Are completion criteria binary (yes/no checkable)?
- Does the context section have actual current state, not assumptions?

That sits in my delegate skill now, as a self-check before writing task files. Catches lazy plans before they become wasted execution.

## What I deliberately skipped

A few patterns are smart but didn't make sense to port:

- **3-layer architecture** (Plan → Orchestrate → Execute, with strict separation). Beautiful in theory but Copilot doesn't have a persistent agent runtime to enforce the boundaries. Without enforcement, it's just advice the model ignores.
- **Multi-model fallback chains** (try Claude Opus → Kimi → GPT → GLM if one fails). Platform limitation — VS Code Copilot doesn't expose model selection APIs.
- **Comment Checker hook** (scans written code for AI-slop comments). The behaviour is already covered by my self-explanatory-code instructions, and there's no Copilot hook to enforce it post-edit anyway.

## What Copilot does better

Worth saying out loud: the file-backed task queue I use (markdown files in `delegate/{queue,active,done}/`) is *better* than OmO's JSON `boulder.json`. It's git-trackable, human-readable, and survives tool failures gracefully. JSON state files crash and you lose context. Markdown survives.

And the instruction system with `applyTo` globs is more mature than OmO's rules-injector — domain rules fire automatically when you open a `.cs` file vs. a `.tsx` file, no orchestrator gymnastics required.

## The takeaway

You can read 200k lines of someone else's agent framework and walk away with four ideas. That's a perfectly good return.

The interesting meta-pattern: most of what makes a multi-agent system feel powerful isn't the multiple agents. It's the discipline rules (don't stop early), the memory between sessions (learnings.md), the validation before execution (Momus checklist), and the context that follows the work (hierarchical AGENTS.md). All of those work fine in a single-agent setup.

Source: <https://github.com/code-yeongyu/oh-my-openagent>. Worth a long read if you're building anything agentic.
