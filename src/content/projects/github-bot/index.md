---
title: "GitHubBot"
summary: "Flask app that discovers GitHub repositories using DuckDuckGo search — find repos by topic without hitting GitHub API rate limits."
date: "Sep 20 2025"
draft: false
tags:
- Python
- Flask
- Bot
- Web Scraping
repoUrl: https://github.com/Mingz6/GitHubBot
---

A Flask web application that searches for GitHub repositories using DuckDuckGo, bypassing GitHub's API rate limits while still returning relevant results.

## How it works

Instead of hitting the GitHub Search API (which is rate-limited), this bot routes searches through DuckDuckGo with `site:github.com` filters. Results are parsed and displayed in a clean web interface.

Good for discovering repos when you've burned through your API quota or when you want broader search results than GitHub's own search provides.
