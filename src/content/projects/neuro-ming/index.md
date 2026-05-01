---
title: "Neuro-Ming"
summary: "AI VTuber assistant — personality, memory, text-to-speech. Chat with Ming's AI twin on mingz.dev."
date: "Feb 15 2026"
draft: false
repoUrl: https://github.com/Mingz6/neuro-ming
tags:
- Python
- AI
- LLM
- TTS
- Azure
---

An AI assistant with a distinct personality — part chatbot, part VTuber experiment. Talk to it in the bottom-right corner of this site.

## What it does

- **M1 — Chat**: Azure OpenAI GPT-5.4, real Ming persona (mined from brain repo, PII-scrubbed), multi-turn memory
- **M2 — Voice**: Text-to-speech on every bot response. Mute toggle, click-to-replay. Azure OpenAI TTS (nova voice)

## Architecture

- **Backend**: Python / FastAPI (async), deployed as Azure Container App
- **Core**: Multi-provider LLM wrapper (6 providers), personality module, session memory (sliding window)
- **TTS**: Separate Azure OpenAI resource, `core/tts.py` returns base64 mp3 alongside text
- **Frontend**: Standalone dark-theme chat UI + SolidJS widget embedded in this Astro site

## Why build this?

Wanted to explore what happens when you give an AI agent a persistent personality and memory across sessions — not just a stateless Q&A bot. M2 proved that voice makes the personality feel real.
