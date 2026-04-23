---
title: "8 patterns I stole from reverse-engineering Claude Code's agent harness"
summary: "A clean-room rewrite of Claude Code's internals revealed eight design patterns worth keeping for any AI coding agent — tool registries, permission triads, multi-turn loops, and context compaction that actually works."
date: "Mar 31 2026"
tags:
- AI
- Agents
- Architecture
- Rust
- Python
draft: false
---

I spent an evening reading [claw-code](https://github.com/instructkr/claw-code) — a clean-room Python + Rust reimplementation that maps Claude Code's internal architecture without copying the proprietary logic. Most of what's interesting isn't the AI part. It's the *harness* — the boring infrastructure that makes a multi-turn agent feel reliable.

Eight patterns kept showing up. They're worth knowing whether you're building your own agent, integrating one, or just trying to understand why some agents feel solid and others feel flaky.

## 1. Tools are data, not code

Tools aren't hardcoded. They're declared as data — a `ToolSpec` with `name`, `description`, and a JSON Schema for `input` — then loaded into a typed registry at startup.

Execution goes through a single `execute_tool(name, input)` dispatcher. The Rust port uses a `StaticToolExecutor` that stores `Box<dyn FnMut>` handlers keyed by name.

The win is separation: tool *definition* (what it accepts) is independent from tool *execution* (how it runs). You can filter, permission-gate, or mock without touching implementations. Listing tools for the LLM is just iterating the registry.

## 2. Permissions are a first-class concern

Every tool has three modes:

| Mode | Behavior |
|---|---|
| `Allow` | Run without asking |
| `Deny` | Block with a reason message |
| `Prompt` | Ask the user via a `PermissionPrompter` trait |

A `PermissionPolicy` stores a default mode plus per-tool overrides. Before any tool executes, the runtime calls `policy.authorize(tool_name, input, prompter)`.

The lesson: don't bolt this on later. Build authorize-before-execute from day one. And **fail safe in non-interactive mode** — when the mode is `Prompt` but no prompter exists, the outcome must be `Deny`, not "default to allow."

## 3. Prompt routing by token matching, not embeddings

When a user types something, the runtime scores every registered tool and command:

1. Tokenize the prompt (split on spaces, `/`, `-`)
2. For each module, check matches against name, source hint, responsibility text
3. Score = match count
4. Return top-N, ensuring at least one command and one tool are represented

No embeddings. No semantic search. Just substring matching. It works fine for fewer than a couple hundred tools and you don't pay an embedding-API round trip on every prompt.

The bar for "good enough" here is lower than it feels.

## 4. The conversation loop is the whole agent

Strip everything else away and this is it:

```
1. Push user message to session
2. Loop:
   a. Build API request (system prompt + all messages)
   b. Stream response from LLM
   c. Parse events: TextDelta, ToolUse, Usage, MessageStop
   d. If ToolUse blocks → authorize + execute → push results
   e. If no ToolUse blocks → break (assistant is done)
3. Return TurnSummary
```

A max-iterations guard (default: 16) prevents infinite tool-call loops. That's the agent. Tool registry, permissions, routing, compaction — all of it exists to serve this loop.

When debugging an agent that "feels off," start here. Every weird behavior maps to one of these five steps.

## 5. Context compaction that doesn't recap itself

When the conversation gets long, old messages get summarized. The Rust implementation does it well:

- Keep the N most recent messages verbatim (default: 4)
- Summarize the rest into one system message
- Use `<summary>` tags, strip out internal `<analysis>` blocks
- Tell the LLM in the continuation: *"This session continues from a previous conversation. Recent messages are preserved. Don't recap — just keep going."*

That last line is the critical one. Without it, the LLM wastes the next response politely summarizing the summary. With it, it just continues.

Token estimation can be rough — `len(content) / 4 + 1` chars per block is good enough for compaction decisions.

## 6. System prompt as a builder, with a cache boundary

The system prompt is assembled from sections via a builder:

1. Intro
2. System rules (tool execution, permission modes, prompt-injection warnings)
3. Doing tasks (read code before changing it, no speculative abstractions, report outcomes)
4. Actions (reversibility, blast radius)
5. **Dynamic boundary marker** — `__SYSTEM_PROMPT_DYNAMIC_BOUNDARY__`
6. Environment context (model, cwd, date, platform)
7. Project context (git status, instruction files)
8. Runtime config

Prompt-caching services cache everything before the boundary marker. Everything after it is per-request and uncacheable. If you don't draw the line explicitly, your caching either breaks or becomes useless.

Instruction files are discovered by walking up the directory tree from `cwd` to root, collecting and merging `CLAUDE.md` (and `.local` overrides) at each level. This is the same pattern as `.gitignore` or `.eslintrc`, but the *merge* across levels is the part most config systems get wrong.

## 7. Track cache tokens separately

Cache creation and cache reads are billed at wildly different rates from regular input/output tokens. The Rust `TokenUsage` struct has four fields:

```
input_tokens
output_tokens
cache_creation_input_tokens
cache_read_input_tokens
```

`UsageTracker` stores `latest_turn` and `cumulative`. On session reload, costs are reconstructed from persisted messages — no separate counter to keep in sync.

Conflating these into one "tokens" number is how you end up with a cost dashboard that's quietly wrong by 10x.

## 8. Coverage floor assertions instead of hand-counted tests

claw-code has a parity audit module that compares ported Python surface against original TypeScript. It counts files, directories, commands, tools — and asserts a floor:

```python
assertGreaterEqual(len(PORTED_COMMANDS), 150)
```

CI breaks if coverage degrades. This isn't a porting tracker; it's a regression test for completeness.

The version of this for any project: don't hardcode "expected 28 plugins." Scan the directory and assert a minimum. The test becomes self-updating.

## What I'm taking forward

For my own Copilot setup, three patterns landed immediately:

- **Permission triad** — every skill that executes shell or hits an external API needs Allow/Deny/Prompt routing, not "ask first time, allow forever"
- **Compaction with continuation prompt** — the "don't recap" instruction is the difference between a usable resume and a token-burning recap
- **Coverage floor in CI** — my brain repo's health check now asserts minimum counts of skills and instruction files instead of hardcoded numbers

The others are good to know about even if I don't need them today. The conversation loop in particular is worth committing to memory — debugging an agent without it is painful.

Source isn't going anywhere: <https://github.com/instructkr/claw-code>. Worth an evening.
