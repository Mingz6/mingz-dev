---
title: "Why I ditched Docker Desktop for OrbStack"
summary: "Docker Desktop was eating 4GB+ of RAM doing nothing. OrbStack runs the same containers with dynamic resources and no VM overhead."
date: "Apr 13 2026"
tags:
- Docker
- OrbStack
- macOS
- Dev Environment
draft: false
---

Docker Desktop worked fine for years. Then I started paying attention to Activity Monitor.

## The problem

I run three containers for local dev work: SQL Server 2025, Azurite (Azure Storage emulator), and Redis. That's it — three services, not exactly Kubernetes.

Docker Desktop was holding **4GB+ of RAM** in its HyperKit VM even when the containers were mostly idle. The Linux VM allocates memory and **never gives it back to macOS** until you restart Docker. So after a regular day of dev work, I'd see the VM sitting at 6-8GB while my actual containers needed maybe 2GB.

The CPU wasn't great either. Docker Desktop's file system bridge (`osxfs` / `virtiofs`) adds overhead to every volume mount. Hot reload in a React app with a mounted source directory was noticeably slower than it should be.

And then there's the licensing. Docker Desktop requires a paid subscription for companies with >250 employees or >$10M revenue. I use it for personal projects too, but the line between "personal" and "work" gets blurry when you're running the same containers.

## Why OrbStack

[OrbStack](https://orbstack.dev/) runs on Apple Silicon natively. No HyperKit, no heavy Linux VM.

The key difference: **dynamic resource management**. OrbStack allocates RAM as containers need it, and gives it back when they release it. No settings panel, no manual caps — it just stays out of your way.

| | Docker Desktop | OrbStack |
|---|---|---|
| RAM | Pre-allocated VM (holds memory) | Dynamic (returns unused memory) |
| CPU | VM overhead + file system bridge | Native Apple Silicon, low priority |
| Disk | Fixed `Docker.raw` disk image | Thin provisioning, grows as needed |
| Startup | 15-30 sec | ~2 sec |
| Licensing | Paid for business use | Free for personal, $8/mo business |
| CLI | `docker` via socket proxy | Drop-in `docker` CLI compatible |

OrbStack is a drop-in replacement. Same `docker` and `docker compose` commands. Same images. Same volumes. My `docker-compose.yml` didn't change at all.

## How I migrated

### 1. Created a proper docker-compose.yml

My three containers were created with individual `docker run` commands — no compose file, no documentation. Before switching anything, I wrote a `docker-compose.yml` that captured the full setup:

```yaml
services:
  sql2025:
    image: mcr.microsoft.com/mssql/server:2025-latest
    ports:
      - "1433:1433"
    environment:
      ACCEPT_EULA: "Y"
      MSSQL_SA_PASSWORD: ${MSSQL_SA_PASSWORD}
      MSSQL_PID: developer
      TZ: America/Edmonton
    volumes:
      - sql-data:/var/opt/mssql
    restart: always

  azurite:
    image: mcr.microsoft.com/azure-storage/azurite
    ports:
      - "10000:10000"
      - "10001:10001"
      - "10002:10002"
    volumes:
      - azurite-data:/data
    restart: unless-stopped

  redis:
    image: redis/redis-stack-server:latest
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: always
```

Each service got its own named volume. Previously all three shared a single volume called `sql2022-msttime` — a relic from the SQL 2022 days. That's asking for trouble.

The SA password moved to a `.env` file (gitignored) instead of being hardcoded in container environment variables.

### 2. Installed OrbStack and migrated

```bash
brew install orbstack
```

On first launch, OrbStack detects Docker Desktop and offers to migrate your images, containers, and volumes. One click. It imported everything — all three images, all volumes with data intact.

After migration, `docker context ls` shows `orbstack` as the active context. The `docker` CLI just works.

### 3. Verified everything

```bash
docker compose up -d
docker ps  # all 3 running
```

SQL Server — all databases came up ONLINE with data intact. Azurite responded on ports 10000-10002. Redis returned PONG.

No config changes needed anywhere. Every app that was hitting `localhost:1433`, `localhost:6379`, or `localhost:10000` kept working.

### 4. Uninstalled Docker Desktop

```bash
rm -rf /Applications/Docker.app
rm -rf ~/Library/Group\ Containers/group.com.docker
rm -rf ~/Library/Containers/com.docker.docker
rm -rf ~/Library/Application\ Support/Docker\ Desktop
```

Kept `~/.docker/` since OrbStack references some of those configs.

## After two days

RAM usage is noticeably lower. No more 4-6GB phantom VM sitting in the background. Containers start nearly instantly — the ~20 second Docker Desktop startup is gone.

The one thing I deferred: renaming the `sql2022-msttime` volume to `sql2025-data`. The SQL data is 63GB, so a volume copy inside the VM would take a while. It works fine with the old name — it's cosmetic.

If you're on Apple Silicon and your containers are straightforward (no Windows containers, no special Docker Desktop extensions), OrbStack is a strict upgrade. Same CLI, less overhead, cheaper license.
