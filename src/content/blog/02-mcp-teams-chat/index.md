---
title: "Building an MCP server for Teams chat"
summary: "How I built a Model Context Protocol server that lets AI agents read Microsoft Teams conversations."
date: "Mar 15 2026"
tags:
- MCP
- TypeScript
- AI
- Teams
draft: false
---

I got tired of copy-pasting Teams messages into Copilot for context. So I built an MCP server that connects directly to Teams via the Graph API.

## What's MCP?

Model Context Protocol is an open standard (from Anthropic) that lets AI assistants call external tools. Instead of the AI guessing about your codebase or chat history, it can directly query real data sources.

## The architecture

```
VS Code (Copilot) → MCP Client → stdio → MCP Server → Graph API → Teams
```

The server authenticates with Azure AD using device code flow (you sign in once via browser, then the token refreshes automatically). After that, it exposes a few tools:

- `teams_list_chats` — list your recent chats
- `teams_read_chat` — read messages from a specific chat
- `teams_search_messages` — search across all chats by keyword
- `teams_find_chat` — find a chat by participant name

## Why this matters

When Copilot has access to your actual team conversations, it can:
- Reference decisions made in chat when reviewing code
- Find the answer to "what did we agree on for X?" without you searching manually
- Pull context from standup threads, PR discussions, etc.

The server runs locally — your messages never leave your machine (except the standard Graph API calls to Microsoft's servers that Teams itself makes).

## Lessons learned

1. **Device code flow is the right auth pattern** for CLI/MCP tools — no redirect URIs needed
2. **Graph API pagination** is essential — Teams returns max 50 messages per request
3. **MCP's stdio transport** is dead simple but debugging is annoying (no stdout available for logs)
