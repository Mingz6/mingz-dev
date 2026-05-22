---
title: "Running AI locally on macOS with WhisperKit and MLX"
summary: "How I set up on-device speech-to-text and LLM inference on Apple Silicon — no cloud, no API keys, full privacy."
date: "May 21 2026"
tags:
- AI
- macOS
- Swift
- Local LLM
- WhisperKit
draft: false
---

Cloud AI is great until your internet is out, your API key expires, or you don't want your meeting audio leaving your machine. I wanted fully local AI for two things: real-time transcription and quick LLM summarization. Here's what works on Apple Silicon in 2026.

## The stack

| Layer | Tool | Why |
|-------|------|-----|
| Speech-to-text | WhisperKit | Native Swift, Metal-accelerated, streaming support |
| LLM inference | MLX (via mlx-swift) | Apple's own framework, runs Qwen3/Llama on GPU |
| Orchestration | Swift + async/await | One binary, no Python deps, no Docker |

## WhisperKit for transcription

[WhisperKit](https://github.com/argmaxinc/WhisperKit) is a Swift package that runs OpenAI's Whisper models natively on Apple Silicon. No Python, no ONNX conversion — just CoreML under the hood.

```swift
import WhisperKit

let whisper = try await WhisperKit(model: "large-v3-turbo")
let result = try await whisper.transcribe(audioPath: meetingAudio)
print(result.text)
```

Performance on M3 Pro (18GB):
- `large-v3-turbo`: ~6x realtime (a 60-min meeting transcribes in ~10 min)
- `base`: ~30x realtime (good enough for live streaming with a sliding window)

The trick for live transcription is a sliding window — feed 30-second chunks with 5-second overlap, deduplicate at segment boundaries. WhisperKit's `transcribe(audioArray:)` accepts raw Float arrays so you can pipe from AVAudioEngine directly.

## MLX for local LLM

Apple's [MLX framework](https://github.com/ml-explore/mlx-swift) lets you run quantized LLMs entirely on the GPU. I use Qwen3-8B (4-bit quantized, ~5GB) for summarization:

```swift
import MLX
import MLXLLM

let model = try await LLMModelFactory.shared.load(
    configuration: .init(id: "mlx-community/Qwen3-8B-4bit")
)

let prompt = "/no_think\nSummarize this meeting transcript:\n\(transcript)"
let response = try await model.generate(prompt: prompt, maxTokens: 512)
```

Key gotchas:
- **GPU cache management** — After generating, call `MLX.GPU.clearCache()` or you'll OOM on the next run
- **Qwen3's `/no_think`** — Disables chain-of-thought for faster, more direct responses
- **Token streaming** — Use the async sequence API for real-time output to UI

## Why not just use Ollama?

Ollama works great for CLI use. But if you're building a native macOS app (like I am with [MeetMate](/projects/meetmate)), embedding mlx-swift gives you:
- No external process to manage
- Direct Metal GPU access (faster cold start)
- Smaller binary — ship just the model weights, not an entire server

For scripts and one-offs, Ollama with `ollama run qwen3:8b` is still my go-to.

## Practical numbers

All on M3 Pro, 18GB unified memory:

| Task | Model | Time | Memory |
|------|-------|------|--------|
| Transcribe 1hr meeting | whisper-large-v3-turbo | ~10 min | ~3GB |
| Summarize 5000 tokens | Qwen3-8B-4bit | ~8 sec | ~5GB |
| Live transcription | whisper-base | Realtime | ~1.5GB |
| Full pipeline (transcribe + summarize) | Both | ~11 min | ~6GB peak |

## The workflow

1. Record meeting (or grab existing .m4a from Voice Memos)
2. WhisperKit transcribes → structured text with timestamps
3. MLX Qwen3 summarizes → action items, decisions, key quotes
4. Output saved to markdown — indexed by Spotlight and my notes system

No network calls. Works on a plane. Audio never leaves my machine.

## What I'd do differently

- **Start with `base` model for live, `large-v3-turbo` for post-hoc.** I wasted time trying to make large-v3 work in real-time — it's not fast enough for streaming on 18GB.
- **Pre-download models at build time.** First-run downloads are 3-6GB and there's no progress callback in WhisperKit's high-level API.
- **Use `@MainActor` session tokens for cancellation.** Async tasks that cross `await` boundaries need explicit cancellation or they zombie after the user hits stop.

## Links

- [WhisperKit](https://github.com/argmaxinc/WhisperKit)
- [MLX Swift](https://github.com/ml-explore/mlx-swift)
- [mlx-swift-examples](https://github.com/ml-explore/mlx-swift-examples) — reference implementations
- [MeetMate](/projects/meetmate) — my macOS app that ties this together
