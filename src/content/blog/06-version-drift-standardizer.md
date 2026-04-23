---
title: "I Wrote a Script to Stop Version Drift in Infrastructure Code"
summary: "When your Bicep files and GitHub Actions are all pinned to different versions, manual updates don't scale. So I built a config-driven Python tool to standardize them all at once."
date: "Apr 15 2026"
tags:
  - Python
  - DevOps
  - Infrastructure as Code
draft: false
---

## The Problem

If you manage more than a couple of repos with infrastructure code, you've seen this: one Bicep file uses `Microsoft.KeyVault/vaults@2023-02-01`, another uses `@2024-04-01`, and a third uses `@2022-07-01`. Same story with GitHub Actions — `actions/checkout@v3` in one workflow, `@v4` in another, `@v3.5.2` in a third.

It's version drift, and it creeps in silently. Every time someone copies a Bicep module or a workflow file from one repo to another, they bring whatever version was current at the time. Nobody goes back to update the old ones.

I had dozens of Bicep files and GitHub Actions workflows across multiple repos. Updating them one by one wasn't realistic. I needed a way to declare "here's the version everything should be on" and apply it everywhere.

## The Tool

I built a Python script (`version-standardizer.py`) that does config-driven regex find-and-replace across an entire directory tree. The idea is simple:

1. Define your desired versions in a JSON config file
2. Point the tool at your repos
3. It finds every outdated version and updates it

Here's what a GitHub Actions config looks like:

```json
{
  "patterns": [
    {
      "description": "GitHub Checkout Action",
      "pattern": "actions/checkout@(v\\d+(\\.\\d+)*|main)",
      "replacement": "actions/checkout@v4"
    },
    {
      "description": "Azure Login Action",
      "pattern": "azure/login@(v\\d+(\\.\\d+)*|main)",
      "replacement": "azure/login@v2"
    },
    {
      "description": "Setup .NET Action",
      "pattern": "actions/setup-dotnet@(v\\d+(\\.\\d+)*|main)",
      "replacement": "actions/setup-dotnet@v4"
    }
  ]
}
```

And a Bicep version config:

```json
{
  "patterns": [
    {
      "description": "Key Vault Resource",
      "pattern": "Microsoft.KeyVault/vaults@(\\d{4}-\\d{2}-\\d{2}(?:-preview)?)",
      "replacement": "Microsoft.KeyVault/vaults@2024-12-01-preview"
    },
    {
      "description": "App Service Plan",
      "pattern": "Microsoft.Web/serverfarms@(\\d{4}-\\d{2}-\\d{2}(?:-preview)?)",
      "replacement": "Microsoft.Web/serverfarms@2024-11-01"
    }
  ]
}
```

Each entry has a regex pattern that matches any version suffix and a replacement with the target version. The tool walks the file tree, skips binary files and `node_modules`, and applies every pattern.

## Dry Run by Default

The most important feature: `--dry-run` mode shows you exactly what would change without touching anything.

```bash
python version-standardizer.py --dry-run

# Output:
# Processing: GitHub Checkout Action
# Would modify: ./repo-a/.github/workflows/deploy.yml (2 replacements)
#   actions/checkout@v3 -> actions/checkout@v4
# Would modify: ./repo-b/.github/workflows/ci.yml (1 replacement)
#   actions/checkout@v3.5.2 -> actions/checkout@v4
```

You can also target just one type:

```bash
python version-standardizer.py --github-only    # only GitHub Actions
python version-standardizer.py --bicep-only     # only Bicep resources
python version-standardizer.py --single --pattern "some/action@v\\d+" --replacement "some/action@v5"
```

## How It Works

The core is a recursive `find_and_replace` function that:

1. Walks the directory tree with `os.walk`
2. Skips known non-text directories (`.git`, `node_modules`, `__pycache__`, etc.)
3. Detects binary files by checking for null bytes in the first 1KB
4. Applies each regex pattern from the config
5. Reports what changed (or would change, in dry-run mode)

Nothing fancy — just `re.compile`, `regex.findall`, `regex.sub`, and careful file I/O. The power comes from the config files, not the code.

## Why Not Just Use `sed`?

You could. `sed -i 's/actions\/checkout@v3/actions\/checkout@v4/g' **/*.yml` works for one pattern. But when you have 20+ patterns across two config files (GitHub Actions and Bicep), maintaining a shell script of `sed` commands gets ugly fast. The JSON config is easier to read, easier to update, and the dry-run mode gives you confidence before you commit.

## What I'd Do Differently Today

This tool predates Dependabot's GitHub Actions version updates and Bicep linting. If I were starting fresh:

- **GitHub Actions**: Dependabot can auto-PR version bumps now. For most teams, that's enough.
- **Bicep**: The Bicep linter (`bicep linter`) can flag outdated API versions. The [Bicep MCP tools](https://github.com/Azure/bicep) can suggest current versions.
- **Multi-repo updates**: Tools like [Renovate](https://github.com/renovatebot/renovate) handle cross-repo dependency updates with auto-merge.

But for a quick one-shot "bring 15 repos up to the same baseline" — a config-driven regex tool is still the fastest path. Sometimes the simple approach wins.
