---
title: "MCP Teams Chat Server"
summary: "MCP server that reads Microsoft Teams chat history via Graph API — so AI agents can search and summarize your team conversations."
date: "Mar 01 2026"
draft: false
tags:
- TypeScript
- MCP
- Graph API
- Azure
repoUrl: https://github.com/Mingz6/mcp-servers
---

A Model Context Protocol (MCP) server that connects AI coding assistants (like GitHub Copilot) to Microsoft Teams chat data via the Graph API.

## What it does

- Reads chats, channels, and messages from Teams
- Searches message history by keyword
- Lets AI agents pull conversation context without you copy-pasting
- Works with any MCP-compatible client (VS Code, Claude Desktop, etc.)

## How it works

The server authenticates with Azure AD using device code flow, then exposes Teams data as MCP tools. When Copilot needs to reference a conversation, it calls the MCP tool instead of you digging through Teams manually.

Built with TypeScript, runs as a stdio MCP server.
