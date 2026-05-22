import { createEffect, createSignal, For, onMount, Show } from "solid-js"

interface Message {
  role: "user" | "bot"
  text: string
  audio?: string
}

function formatBotText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\s*-\s+/gm, "• ")
    .replace(/\s{2,}\n/g, "\n")
    .trim()
}

const API_URL = import.meta.env.PUBLIC_CHAT_API_URL || ""
const STORAGE_KEYS = {
  session: "neuro-ming-session",
  messages: "neuro-ming-messages",
  open: "neuro-ming-open",
}

function getSessionId(): string {
  let id = sessionStorage.getItem(STORAGE_KEYS.session)
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem(STORAGE_KEYS.session, id)
  }
  return id
}

export default function ChatWidget() {
  if (!API_URL) return null

  const [open, setOpen] = createSignal(false)
  const [maximized, setMaximized] = createSignal(false)
  const [messages, setMessages] = createSignal<Message[]>([])
  const [input, setInput] = createSignal("")
  const [loading, setLoading] = createSignal(false)
  const [muted, setMuted] = createSignal(true)
  const [playingIdx, setPlayingIdx] = createSignal<number | null>(null)
  const [audioState, setAudioState] = createSignal<"idle" | "playing" | "paused">("idle")
  let currentAudio: HTMLAudioElement | null = null
  let messagesEnd: HTMLDivElement | undefined
  let inputRef: HTMLInputElement | undefined

  // Restore state from sessionStorage on mount
  onMount(() => {
    const saved = sessionStorage.getItem(STORAGE_KEYS.messages)
    if (saved) {
      try { setMessages(JSON.parse(saved)) } catch { /* ignore bad data */ }
    }
    setOpen(sessionStorage.getItem(STORAGE_KEYS.open) === "true")
    setMuted(sessionStorage.getItem("neuro-ming-muted") === "true")
  })

  // Persist messages (without audio — too large for sessionStorage)
  createEffect(() => {
    const stripped = messages().map(({ role, text }) => ({ role, text }))
    sessionStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(stripped))
  })

  // Persist open/closed state
  createEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.open, String(open()))
  })

  const scrollToBottom = () => {
    messagesEnd?.scrollIntoView({ behavior: "smooth" })
  }

  createEffect(() => {
    messages()
    scrollToBottom()
  })

  createEffect(() => {
    if (open() && inputRef) {
      setTimeout(() => inputRef?.focus(), 100)
    }
  })

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio = null
    }
    setPlayingIdx(null)
    setAudioState("idle")
  }

  const playAudioForMsg = (base64Data: string, idx: number) => {
    stopAudio()
    const audio = new Audio("data:audio/mpeg;base64," + base64Data)
    currentAudio = audio
    setPlayingIdx(idx)
    setAudioState("playing")
    audio.addEventListener("ended", () => {
      currentAudio = null
      setPlayingIdx(null)
      setAudioState("idle")
    })
    audio.play().catch(() => stopAudio())
  }

  const pauseAudio = () => {
    if (currentAudio && !currentAudio.paused) {
      currentAudio.pause()
      setAudioState("paused")
    }
  }

  const resumeAudio = () => {
    if (currentAudio?.paused) {
      currentAudio.play().catch(() => stopAudio())
      setAudioState("playing")
    }
  }

  const restartAudio = (base64Data: string, idx: number) => {
    if (currentAudio && playingIdx() === idx) {
      currentAudio.currentTime = 0
      currentAudio.play().catch(() => stopAudio())
      setAudioState("playing")
    } else {
      playAudioForMsg(base64Data, idx)
    }
  }

  const toggleMute = () => {
    const next = !muted()
    setMuted(next)
    sessionStorage.setItem("neuro-ming-muted", String(next))
    if (next) stopAudio()
  }

  const sendMessage = async () => {
    const text = input().trim()
    if (!text || loading()) return

    setMessages((prev) => [...prev, { role: "user", text }])
    setInput("")
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          session_id: getSessionId(),
          tts_enabled: !muted(),
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const newIdx = messages().length
      setMessages((prev) => [...prev, { role: "bot", text: data.response, audio: data.audio }])
      if (!muted() && data.audio) playAudioForMsg(data.audio, newIdx)
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "meow... can't reach the server right now 😿" },
      ])
    } finally {
      setLoading(false)
    }
  }

  const clearChat = async () => {
    try {
      await fetch(`${API_URL}/clear`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: getSessionId() }),
      })
    } catch {
      /* ignore */
    }
    setMessages([])
    sessionStorage.removeItem(STORAGE_KEYS.messages)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
    if (e.key === "Escape" && maximized()) {
      setMaximized(false)
    }
  }

  return (
    <>
      {/* Floating toggle button */}
      <Show when={!open()}>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open chat"
          class="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent-1 to-accent-3 text-white shadow-lg shadow-accent-1/25 transition-all duration-300 hover:scale-110 hover:shadow-accent-1/40"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </Show>

      {/* Chat panel */}
      <Show when={open()}>
        {/* Backdrop when maximized */}
        <Show when={maximized()}>
          <div
            class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setMaximized(false)}
          />
        </Show>
        <div
          class={`fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl transition-all duration-300 dark:border-white/10 dark:bg-neutral-900 ${
            maximized()
              ? "inset-4 sm:inset-8 md:inset-12 lg:inset-16"
              : "bottom-6 right-6 h-[min(520px,80vh)] w-[min(380px,calc(100vw-48px))]"
          }`}
        >
          {/* Header */}
          <div class="flex items-center justify-between border-b border-black/10 px-4 py-3 dark:border-white/10">
            <div class="flex items-center gap-2">
              <span class="text-lg">🐈‍⬛</span>
              <span class="font-semibold text-black dark:text-white">
                Neuro-Ming
              </span>
              <span class="text-xs opacity-50">AI twin</span>
            </div>
            <div class="flex items-center gap-1">
              <button
                onClick={toggleMute}
                aria-label={muted() ? "Unmute voice" : "Mute voice"}
                class="rounded-lg p-1.5 text-sm opacity-50 transition-opacity hover:opacity-100"
                title={muted() ? "Unmute voice" : "Mute voice"}
              >
                {muted() ? "🔇" : "🔊"}
              </button>
              <button
                onClick={clearChat}
                aria-label="Clear chat"
                class="rounded-lg p-1.5 text-sm opacity-50 transition-opacity hover:opacity-100"
                title="Clear conversation"
              >
                🗑️
              </button>
              <button
                onClick={() => setMaximized(!maximized())}
                aria-label={maximized() ? "Minimize chat" : "Maximize chat"}
                class="rounded-lg p-1.5 opacity-50 transition-opacity hover:opacity-100"
                title={maximized() ? "Minimize" : "Maximize"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  {maximized() ? (
                    <>
                      <polyline points="4 14 10 14 10 20" />
                      <polyline points="20 10 14 10 14 4" />
                      <line x1="14" y1="10" x2="21" y2="3" />
                      <line x1="3" y1="21" x2="10" y2="14" />
                    </>
                  ) : (
                    <>
                      <polyline points="15 3 21 3 21 9" />
                      <polyline points="9 21 3 21 3 15" />
                      <line x1="21" y1="3" x2="14" y2="10" />
                      <line x1="3" y1="21" x2="10" y2="14" />
                    </>
                  )}
                </svg>
              </button>
              <button
                onClick={() => { setOpen(false); setMaximized(false) }}
                aria-label="Close chat"
                class="rounded-lg p-1.5 text-sm opacity-50 transition-opacity hover:opacity-100"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div class="flex-1 overflow-y-auto px-4 py-3">
            <Show when={messages().length === 0}>
              <div class="flex h-full flex-col items-center justify-center gap-2 text-center opacity-50">
                <span class="text-3xl">🐈‍⬛</span>
                <p class="text-sm">
                  hey, I'm Neuro-Ming — Ming's AI twin.
                  <br />
                  code, tech, smart home, whatever. meow.
                </p>
              </div>
            </Show>

            <For each={messages()}>
              {(msg, idx) => (
                <div
                  class={`mb-3 flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div class={`group flex items-end gap-1 ${msg.role === "user" ? "w-[90%] justify-end" : ""}`}>
                    <div
                      class={`whitespace-pre-line break-words rounded-2xl px-4 py-2.5 text-sm leading-7 ${
                        msg.role === "user"
                          ? "w-full rounded-br-md bg-accent-1 text-white"
                          : "max-w-[90%] rounded-bl-md border border-black/5 bg-black/5 text-black dark:border-white/10 dark:bg-white/10 dark:text-white"
                      }`}
                    >
                      {msg.role === "bot" ? formatBotText(msg.text) : msg.text}
                    </div>
                    <Show when={msg.role === "bot" && msg.audio}>
                      <div class="mb-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Show
                          when={playingIdx() === idx() && audioState() !== "idle"}
                          fallback={
                            <button
                              onClick={() => playAudioForMsg(msg.audio!, idx())}
                              class="rounded p-1 text-xs hover:opacity-100 opacity-50"
                              title="Play"
                              aria-label="Play audio"
                            >▶</button>
                          }
                        >
                          <Show
                            when={audioState() === "playing"}
                            fallback={
                              <>
                                <button
                                  onClick={() => restartAudio(msg.audio!, idx())}
                                  class="rounded p-1 text-xs hover:opacity-100 opacity-50"
                                  title="Start over"
                                  aria-label="Start over"
                                >⟳</button>
                                <button
                                  onClick={resumeAudio}
                                  class="rounded p-1 text-xs hover:opacity-100 opacity-50"
                                  title="Resume"
                                  aria-label="Resume audio"
                                >▶</button>
                              </>
                            }
                          >
                            <button
                              onClick={pauseAudio}
                              class="rounded p-1 text-xs hover:opacity-100 opacity-50"
                              title="Pause"
                              aria-label="Pause audio"
                            >⏸</button>
                          </Show>
                        </Show>
                      </div>
                    </Show>
                  </div>
                </div>
              )}
            </For>

            <Show when={loading()}>
              <div class="mb-3 flex justify-start">
                <div class="flex gap-1 rounded-2xl rounded-bl-md bg-black/5 px-4 py-3 dark:bg-white/10">
                  <span class="animate-bounce text-xs opacity-60 [animation-delay:0ms]">●</span>
                  <span class="animate-bounce text-xs opacity-60 [animation-delay:150ms]">●</span>
                  <span class="animate-bounce text-xs opacity-60 [animation-delay:300ms]">●</span>
                </div>
              </div>
            </Show>

            <div ref={messagesEnd} />
          </div>

          {/* Input */}
          <div class="border-t border-black/10 px-3 py-3 dark:border-white/10">
            <div class="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input()}
                onInput={(e) => setInput(e.currentTarget.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                disabled={loading()}
                maxLength={4000}
                class="flex-1 rounded-xl border border-black/10 bg-black/5 px-3.5 py-2 text-sm text-black outline-none transition-colors placeholder:opacity-50 focus:border-accent-1/50 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
              <button
                onClick={sendMessage}
                disabled={loading() || !input().trim()}
                aria-label="Send message"
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-1 text-white transition-all hover:bg-accent-2 disabled:opacity-30"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </Show>
    </>
  )
}
