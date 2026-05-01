---
title: "MCP Servers Monorepo"
summary: "Monorepo of custom MCP servers (Teams, Outlook, WeChat, iMessage) plus third-party integrations to power AI automation workflows."
date: "Apr 30 2026"
draft: false
repoUrl: https://github.com/Mingz6/mcp-servers
tags:
- TypeScript
- Python
- MCP
- Microsoft Graph
- Automation
---

A single monorepo that houses my MCP server ecosystem: custom servers I built for real workflows, plus wrappers around third-party servers.

## What it does

- **Teams server**: read/send Teams messages and extract PR links for review workflows
- **Outlook server**: query and triage emails from Copilot
- **WeChat server**: read-only chat search through SQLCipher data
- **iMessage server**: send/read Messages data on macOS
- **Unified runtime wrappers**: `run.sh` per package so VS Code MCP config stays stable across runtime upgrades

## Why it matters

This repo is the plumbing behind several higher-level automations (standup prep, PR review routing, inbox triage, and life-scan workflows). It turned one-off scripts into reusable tools that any agent can call through MCP.

## Stack

- TypeScript + Node.js workspaces
- Python package servers where native/macOS access is needed
- Microsoft Graph API auth for Teams/Outlook
- VS Code MCP (`mcp.json`) integration
