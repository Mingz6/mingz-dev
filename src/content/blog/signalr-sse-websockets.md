---
title: "SignalR, SSE, or raw WebSockets? Picking the right real-time transport"
summary: "SignalR's killer feature was automatic transport fallback in the IE era. In 2026, on a non-.NET stack, that machinery is overkill — pick SSE or raw WebSockets instead. Here's the decision matrix."
date: "Apr 23 2026"
tags:
- SignalR
- WebSockets
- SSE
- Real-time
- .NET
- FastAPI
draft: false
---

I was reading the [classic ASP.NET SignalR intro](https://learn.microsoft.com/en-us/aspnet/signalr/overview/getting-started/introduction-to-signalr) — partly nostalgia, partly because I needed to decide whether to add real-time push to two of my Python projects. The doc itself warns "this isn't the latest version" and points at ASP.NET Core SignalR. Fair enough.

But it left me with a more useful question than "how do I use SignalR?" — namely **when shouldn't I**?

Short answer: most of the time, on a non-.NET stack, in 2026.

## What SignalR actually does

A .NET library. You write a `Hub` class on the server with methods. Clients call those methods like local functions and subscribe to events the hub broadcasts. Underneath, it negotiates the best available transport: WebSocket → Server-Sent Events → Forever Frame (IE-only) → long polling.

The cleverness is in the negotiation. You write one API, and it picks WebSocket when both ends support it, falls back to SSE when they don't, falls back to long polling when neither works. In the IE6-IE10 era this was a real win — you got modern push without writing four code paths.

## The 2026 reality check

WebSocket is supported in every browser anyone actually uses. SSE is supported in everything except IE (which is dead). Long polling is a fallback for hostile corporate proxies, not a primary transport.

So the "automatic fallback" feature SignalR was famous for is solving a problem that mostly went away. You're paying the abstraction cost for fallbacks you'll almost never trigger.

## When SignalR is the right call

Three things have to be true at the same time:

1. **You're already on .NET 8/9.** SignalR is a first-class .NET library. The Python and Node ports are either client-only or unmaintained.
2. **You want strongly-typed Hub RPC ergonomics.** Calling `await Clients.Group(id).SendAsync("ApprovalAdded", payload)` is genuinely nicer than serializing your own JSON envelope and routing it on the client.
3. **You're deploying to Azure App Service multi-instance and want a managed backplane.** [Azure SignalR Service](https://learn.microsoft.com/en-us/azure/azure-signalr/) handles connection scale-out so your App Service stops being the connection-count bottleneck. One line: `services.AddSignalR().AddAzureSignalR(connectionString)`.

If all three are true, use SignalR. It's the right tool.

## When to skip SignalR

This is where most projects actually live.

### Stack: Python (FastAPI / Starlette / Django)

Use **Server-Sent Events** for one-way push, **raw WebSockets** for full-duplex. Both are one or two lines in FastAPI:

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse

app = FastAPI()

async def event_stream():
    async for chunk in some_async_source():
        yield f"data: {chunk}\n\n"

@app.get("/events")
async def events():
    return StreamingResponse(event_stream(), media_type="text/event-stream")
```

Browser side, no library needed:

```js
const es = new EventSource("/events");
es.onmessage = (e) => console.log(e.data);
```

That's it. No Hub, no client library, no fallback negotiation. SSE just works.

I did this in my AI assistant project ([neuro-ming](/projects/neuro-ming)) for streaming LLM tokens. The chat UI used to wait for the whole response before showing anything (~3 second delay). With SSE streaming each token, first paint dropped to about 300ms. Same end-to-end work, dramatically better perceived latency.

### Stack: Node.js / TypeScript

Same answer. Native `EventSource` on the client, `Response` with a `ReadableStream` on the server. Or pull in `ws` for raw WebSockets. Adding a SignalR client library to call a hypothetical .NET backend only makes sense if there's already a .NET backend.

### Stack: Static site or single-page app with no backend

You don't need real-time push at all — your "backend" is a CDN. If you genuinely need live data, that's an external API call, and the API decides the transport.

### Use case: server pushing to one browser, infrequently

A status page that updates when a long job finishes. A dashboard that refreshes when a worker run completes. SSE. Every time.

For my [worker-center](/projects/worker-center) dashboard, the page used to regenerate as static HTML every 4 hours. Anything that happened in between was invisible until the next regeneration. Adding SSE to push worker-completion events meant the dashboard updates within seconds of a run finishing. No SignalR, no Hub, no backplane — just an asyncio queue and a `StreamingResponse`.

### Use case: high-frequency two-way (multiplayer game, collaborative editor)

Raw WebSockets. SSE is one-way only. SignalR's hub model is convenient but adds latency and a non-trivial wire format. If you're in the millisecond-counting territory, you want as little between you and the socket as possible.

## The decision matrix

| Scenario | Pick |
|---|---|
| .NET 8/9 backend + multi-instance Azure App Service | **ASP.NET Core SignalR + Azure SignalR Service** |
| .NET backend + single-instance | ASP.NET Core SignalR (self-hosted) |
| Python / Node, one-way server→client push | **Server-Sent Events** |
| Python / Node, full duplex (game, chat, collab editor) | **Raw WebSockets** |
| Status that changes every 30+ seconds | Plain HTTP polling |
| Static site / SPA without your own backend | Whatever the upstream API uses |

## Gotchas regardless of which you pick

A few things bit me that nobody talks about in the intro docs:

**WebSocket auth via the browser.** The native browser WebSocket API doesn't support custom headers. If your auth is bearer-token based, the token has to go via query string. Server-side, that means an `OnMessageReceived` handler that pulls `?access_token=...` from the request when the path matches your hub/socket route. Easy to forget, easy to debug for an hour.

**Azure App Service WebSockets are off by default.** You have to explicitly toggle "Web sockets" in App Service configuration. Until you do, your "WebSocket" connection silently falls back to long polling and you wonder why your latency is so high.

**Sticky sessions for multi-instance.** Without a backplane, a connection to instance A can't receive messages broadcast from instance B. Either pin sessions (ARR Affinity) or use a shared backplane (Redis, Service Bus, or Azure SignalR Service). On a single instance this doesn't apply.

**SSE doesn't reconnect automatically across server restarts cleanly.** The browser will reopen the connection, but anything published while it was disconnected is lost unless you implement event IDs and `Last-Event-ID` resume on the server.

## The bottom line

SignalR is excellent at what it was built for: a real-time .NET app on a .NET stack, with strong typing and managed Azure scale-out. Outside that lane, modern primitives (SSE, raw WebSockets) do the same job with less abstraction and less to maintain.

The real skill isn't picking the most powerful transport. It's picking the smallest one that fits.
