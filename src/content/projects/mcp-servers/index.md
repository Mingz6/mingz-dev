---
title: "MCP Servers"
summary: "15 MCP servers that give GitHub Copilot and Claude Code my real inboxes and tools: Teams, Outlook, iMessage, WhatsApp, WeChat, Telegram, Discord, LinkedIn and more, all local over stdio."
date: "Apr 30 2026"
draft: false
tags:
- TypeScript
- Python
- MCP
- Microsoft Graph
- AI Agents
repoUrl: https://github.com/Mingz6/mcp-servers
---

![npm run demo: brain-mcp answers a search and a backlinks query over stdio, on a made-up wiki](/images/projects/mcp-servers-demo.gif)

I run most of my day through agent chats in VS Code and Claude Code: a morning scan of every channel, replies drafted in my voice, review asks for my PRs, a board of open loops. An agent can only work with what it can read, so I gave it a way into each place my messages live. That's this repo: 15 MCP (Model Context Protocol) servers, a shared Microsoft login library, and a demo you can run without any account.

## What's in it

- **Microsoft 365.** `msgraph` puts Teams chats, meeting transcripts, Outlook mail and Loop pages behind one login for my work account. `outlook` does the same for a personal Outlook.com account, and `imap-mail` covers Gmail and QQ Mail.
- **Chat apps.** iMessage (it resends as SMS when Apple refuses an iMessage), WhatsApp, Telegram, WeChat and Discord. WeChat and Discord are read-only.
- **The web.** LinkedIn and Xiaohongshu, through a persistent browser profile, because neither has a personal API.
- **My own tools.** `brain-mcp` searches and edits my Markdown knowledge base, `flywheel` tracks the repos I learn from, and `worker-center-mcp` reads my job runner's database.

The [README](https://github.com/Mingz6/mcp-servers#servers) has the full table, with what each server talks to and whether it's still in daily use.

## How it works

Every server is a local process that the agent's client starts over stdio, so there's no HTTP port to secure. Each package has a `run.sh` that finds nvm's Node or the package's Python virtualenv. Clients start servers with a bare environment and no shell profile, and the wrapper is why a Node upgrade never breaks my config.

The Microsoft servers share one app registration, so they share `msgraph-auth`: one MSAL token cache and a sign-in lock that works across processes.

Anything that sends is meant to sit behind a person. In my setup a pre-tool hook blocks a direct send and stages the message in an outbox; I read it, and only then does it go.

## What I learned building it

- **Clients start servers with nothing.** A server that worked in my terminal failed in VS Code because the client never loaded my shell profile. The `run.sh` wrapper fixed that whole class of bug.
- **Sign-in races are real.** When the work token expired and two agents called Graph tools at about the same time, each server process started its own device-code flow and opened its own browser tab. A lock file that every process checks first fixed it: the first one signs in, the others wait for its token.
- **Read the platform's terms before writing a send tool.** Automating a Discord user token is against Discord's terms, so that server can only read.
- **A demo must not touch real data.** `npm run demo` runs brain-mcp against a made-up wiki with a throwaway home folder, because its semantic search would otherwise open the index of whatever brain lives on the machine.

## Status

In daily use on my Macs. CI builds and tests every Node package on Node 22 and 24, runs the Python tests and the demo, and the repo is MIT licensed. `imessage` and `wechat` need macOS.

## Stack

- TypeScript (strict) on Node.js workspaces; Python where a server needs macOS or a browser
- MSAL and Microsoft Graph; Baileys for WhatsApp, Telethon for Telegram, Patchright for browser automation
- GitHub Actions, with every action pinned to a commit SHA
