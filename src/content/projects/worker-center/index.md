---
title: "Worker Center"
summary: "Dockerized deal hunter for Mac Mini M4 — scrapes 5 marketplaces, scores deals with LLM, sends iMessage alerts when it finds a steal."
date: "Jun 22 2026"
draft: false
repoUrl: https://github.com/Mingz6/worker-center
tags:
- Python
- Docker
- LLM
- FastAPI
- Web Scraping
---

A self-hosted deal hunting system that scrapes secondhand marketplaces for Mac Mini M4 listings, scores them against real market data, and texts me when something's worth buying.

## What it does

- **Scrapes 5 sources** every 15 minutes: FB Marketplace, Kijiji, eBay sold prices, Apple Refurbished, and WeChat buy/sell groups
- **Classifies listings** by SKU (M4 Base, M4 Pro 12-core, M4 Pro 14-core) and extracts specs from messy seller text
- **Scores every deal** 0–100 based on price vs eBay sold data, seller reputation tier, listing freshness, and spec completeness
- **LLM triage** — when a deal hits the sniper threshold, GPT-5.2 evaluates it as BUY / WATCH / TYPO / SCAM before alerting
- **iMessage alerts** land on my phone with the listing link, price context, and the LLM's reasoning
- **Live dashboard** with a chat widget — I can ask "what are the best deals right now?" and get real answers from the data

## How it works

Two Docker containers run on a Mac Mini. The main container runs APScheduler, firing workers on cron schedules. Workers scrape, classify, and store everything in SQLite. A FastAPI container serves the dashboard and a streaming chat endpoint backed by Azure OpenAI.

The tricky part: iMessage can only be sent via macOS AppleScript, but Docker runs Linux. So there's a tiny HTTP relay server on the Mac host — Docker POSTs to it via `host.docker.internal`, and the relay runs `osascript` to push the message through Messages.app.

## Tech stack

- **Runtime**: Python 3.12, Docker Compose
- **Scraping**: Playwright (FB Marketplace), httpx + BeautifulSoup (Kijiji, eBay, Apple), sqlcipher (WeChat)
- **Data**: SQLite with WAL mode, JSON state files
- **LLM**: Azure OpenAI GPT-5.2 for deal triage + daily market digest + chat
- **Dashboard**: FastAPI + server-sent events for streaming chat
- **Alerts**: iMessage via macOS AppleScript relay, ntfy.sh as fallback
