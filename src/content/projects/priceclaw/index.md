---
title: "PriceClaw"
summary: "Agentic deal hunter that scrapes multiple marketplaces, scores every listing with LLM triage, and texts you when something is genuinely worth buying."
date: "Jun 15 2026"
draft: false
tags:
- Python
- Docker
- LLM
- FastAPI
- Web Scraping
---

I hate manually refreshing marketplaces looking for a deal on used hardware. So I built PriceClaw: an agentic deal hunter that watches multiple platforms every 15 minutes and only alerts me when something is genuinely worth buying.

![Vancouver AI Meetup — May 2026](./vamai-group.png)

## What it does

**Scrapes 5 sources every 15 minutes:** Amazon, Apple Refurbished, FB Marketplace, Kijiji, eBay sold prices, and Groupchat buy/sell groups. Each listing gets parsed, SKU-classified by RAM/storage config, and stored in SQLite.

**Scores every listing** against a retail price matrix by config. The scorer calculates the actual discount percentage for the exact spec combination — not just "is this cheap" but "is this cheap for what it is."

**LLM triage before any alert fires.** When a listing crosses the sniper threshold, it goes through GPT with five possible verdicts:
- **BUY** — legit deal, alert immediately
- **APPROACHING** — within 10% of target, worth watching
- **WATCH** — fair price, not urgent, no alert
- **TYPO** — suspiciously cheap, might be a pricing mistake, alert with caveat
- **SCAM** — obvious red flags, ignore

Only BUY and TYPO trigger a notification. "TYPO" is my favourite — listings at 40% of retail that might be a mistake, but worth a fast look.

**iMessage alerts** land on my phone with the listing link, price context, and the model's one-sentence reasoning.

## The tricky parts

**TLS fingerprinting:** Amazon and Cloudflare-protected retailers block standard HTTP clients. PriceClaw uses `curl_cffi` with Chrome 131 impersonation for those — transparent to the rest of the pipeline.

**iMessage from Docker:** iMessage only works via macOS AppleScript, but the workers run in Linux containers. There's a tiny HTTP relay server on the Mac host — Docker POSTs to it via `host.docker.internal`, and the relay runs `osascript` to push the message through Messages.app.

**SKU extraction from messy seller text:** "M4 Pro w/ 24GB/512 — barely used" needs to map to a canonical config before scoring. A regex classifier handles 95% of cases; LLM verify handles the rest.

**Delta-only price history:** The SQLite price store only writes a row when the price changes — like git commits for prices. Keeps the DB compact even with continuous scraping across hundreds of listings.

## Demoed at Vancouver AI Meetup

Presented PriceClaw at [Vancouver AI Meetup (VAM!)](https://vanaimeetup.com/) in May 2026 as part of the Agentic Personal Assistants workshop. Walked away with a certificate.

![Certificate of Completion — Agentic Personal Assistants, VamAI 2026](./certificate.png)

## Tech Stack

- **Python 3.12**, APScheduler, Docker Compose
- **Azure OpenAI GPT-5.4** — deal triage and SKU verification
- **SQLite** (WAL mode) — price history, listing store, worker run logs
- **curl_cffi** — TLS fingerprint spoofing for hardened retailers
- **FastAPI** — dashboard, chat endpoint, and iMessage relay
- **Playwright** — FB Marketplace and WeChat scraping
- **BeautifulSoup / selectolax** — HTML parsing for standard retailers
