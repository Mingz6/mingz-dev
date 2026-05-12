---
title: "JobClaw"
summary: "AI job-hunting agent built at the OpenClaw Hackathon — scrapes 7+ sources, scores fit with LLM, drafts cover letters, and tracks the pipeline."
date: "May 08 2026"
draft: false
tags:
- Python
- AI
- Flask
- Azure OpenAI
- LangGraph
---

Built this at the OpenClaw Hackathon (Vancouver AI Meetup, Q2 2026). The prompt was simple: build an AI agent that solves a real problem. Job hunting felt like the obvious pick — it's repetitive, soul-crushing, and ripe for automation.

## Demo

<a href="https://youtu.be/7_22k9xAfk8" target="_blank" rel="noopener noreferrer" class="block relative group my-4 rounded-lg overflow-hidden">
  <img
    src="https://img.youtube.com/vi/7_22k9xAfk8/maxresdefault.jpg"
    alt="Watch JobClaw demo on YouTube"
    class="w-full rounded-lg"
  />
  <div class="absolute inset-0 flex flex-col items-center justify-center bg-black/40 group-hover:bg-black/50 transition-colors rounded-lg gap-2">
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" class="drop-shadow-lg">
      <circle cx="12" cy="12" r="12" fill="rgba(255,0,0,0.85)" />
      <polygon points="10,8 17,12 10,16" fill="white" />
    </svg>
    <span class="text-white text-sm font-medium opacity-90">Watch on YouTube</span>
  </div>
</a>

## What it does

JobClaw wraps a job-scraping + scoring pipeline into a web UI with an AI co-pilot:

- **Scan** — pulls from LinkedIn, Indeed, RemoteOK, Remotive, Reddit r/forhire, and Punchcard. LLM scores each posting against my resume and flags qualified matches
- **Analyze** — paste any job URL or description, get a fit score and gap analysis on demand
- **Draft** — generates tailored cover letters and resume bullet points for a specific posting
- **Track** — application pipeline from interested → applied → interviewing → offer, backed by a JSONL ledger
- **Agent chat** — multi-turn AI assistant that knows the full job feed and can walk through applying to a specific role

## How it works

The backend is Flask with four components wired as modules (`scan_jobs`, `analyze_fit`, `draft_application`, `track_pipeline`). Each component reads from a shared data directory — the job scraper runs as a scheduled worker and dumps scored verdicts to JSON. JobClaw reads those files, so the UI is always showing pre-scored results without re-scraping on every page load.

The LLM layer uses Azure OpenAI with multi-turn history stored in-memory per session. The agent knows your current job feed and pipeline state, so you can ask things like "which roles should I apply to today?" and get answers grounded in actual data.

## Stack

- Python, Flask
- Azure OpenAI (GPT-5.4)
- LangGraph (agent routing)
- Multi-source job scraping (7 sources)
- JSONL application ledger
