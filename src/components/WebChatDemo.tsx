import { createSignal, For, Show } from "solid-js"

interface ChatMessage {
  from: "user" | "bot"
  text: string
  timestamp: string
}

const BOT_RESPONSES: Record<string, string[]> = {
  "hello": ["Hey there! I'm a demo bot. Try asking me something like 'What can you do?' or 'Help me with my account'."],
  "help": ["I can help with:\n• Account questions\n• Password resets\n• Document submissions\n• General inquiries\n\nWhat do you need?"],
  "account": ["I'd pull up your account details here. In the real system, this connects to the backend via Direct Line and can look up your info."],
  "password": ["To reset your password:\n1. Go to the login page\n2. Click 'Forgot Password'\n3. Check your email\n\nNeed anything else?"],
  "document": ["You can upload documents through the portal. Supported formats: PDF, DOCX, JPG, PNG. Max 10MB per file."],
  "default": [
    "Hmm, I'm not sure about that one. Try 'help' to see what I can do.",
    "Interesting question! In the real system, this would route to an AI model or a human agent.",
    "I'm just a demo — the real bot would handle this with Power Virtual Agents or a custom Bot Framework skill.",
  ],
}

function getBotResponse(input: string): string {
  const lower = input.toLowerCase()
  for (const [key, responses] of Object.entries(BOT_RESPONSES)) {
    if (key !== "default" && lower.includes(key)) {
      return responses[0]
    }
  }
  const defaults = BOT_RESPONSES["default"]
  return defaults[Math.floor(Math.random() * defaults.length)]
}

function timeStr(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

type ChatPhase = "disconnected" | "connecting" | "connected"

export default function WebChatDemo() {
  const [phase, setPhase] = createSignal<ChatPhase>("disconnected")
  const [minimized, setMinimized] = createSignal(true)
  const [messages, setMessages] = createSignal<ChatMessage[]>([])
  const [input, setInput] = createSignal("")
  const [newMsg, setNewMsg] = createSignal(false)
  const [side, setSide] = createSignal<"left" | "right">("right")
  const [typing, setTyping] = createSignal(false)

  const open = () => {
    setMinimized(false)
    setNewMsg(false)
    if (phase() === "disconnected") {
      setPhase("connecting")
      setTimeout(() => {
        setPhase("connected")
        setMessages([{
          from: "bot",
          text: "Hi! I'm a demo bot running on Bot Framework Web Chat. Try typing 'hello' or 'help'.",
          timestamp: timeStr(),
        }])
      }, 1800)
    }
  }

  const minimize = () => setMinimized(true)
  const switchSide = () => setSide(s => s === "left" ? "right" : "left")

  const send = () => {
    const text = input().trim()
    if (!text || phase() !== "connected") return
    setMessages(prev => [...prev, { from: "user", text, timestamp: timeStr() }])
    setInput("")
    setTyping(true)
    const delay = 800 + Math.random() * 1200
    setTimeout(() => {
      setTyping(false)
      const reply = getBotResponse(text)
      setMessages(prev => [...prev, { from: "bot", text: reply, timestamp: timeStr() }])
      if (minimized()) setNewMsg(true)
    }, delay)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div class="my-6 rounded-lg border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.04] overflow-hidden">
      {/* Header */}
      <div class="px-4 py-3 border-b border-black/10 dark:border-white/10 flex items-center gap-2">
        <span class="text-sm font-medium opacity-75">Interactive Demo</span>
        <span class="text-[10px] px-1.5 py-0.5 rounded bg-yellow-200/80 dark:bg-yellow-800/50 text-yellow-800 dark:text-yellow-200 font-medium">
          SIMULATED
        </span>
      </div>

      {/* Chat area */}
      <div class="relative h-[420px] bg-gradient-to-b from-slate-50 to-white dark:from-zinc-900 dark:to-zinc-950 overflow-hidden">
        {/* Fake app background */}
        <div class="absolute inset-0 flex items-center justify-center opacity-10">
          <div class="text-center">
            <div class="text-4xl mb-2">🌐</div>
            <p class="text-sm">Your Web App</p>
          </div>
        </div>

        {/* Floating bot button */}
        <Show when={minimized()}>
          <button
            onClick={open}
            class={`absolute bottom-4 ${side() === "right" ? "right-4" : "left-4"} w-14 h-14 rounded-full bg-sky-600 hover:bg-sky-700 text-white shadow-lg transition-all flex items-center justify-center text-2xl z-10`}
          >
            💬
            <Show when={newMsg()}>
              <span class="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white dark:border-zinc-950" />
            </Show>
          </button>
        </Show>

        {/* Chat panel */}
        <Show when={!minimized()}>
          <div class={`absolute bottom-4 ${side() === "right" ? "right-4" : "left-4"} w-80 h-[380px] bg-white dark:bg-zinc-900 border border-black/15 dark:border-white/15 rounded-lg shadow-2xl flex flex-col z-10 overflow-hidden`}>
            {/* Chat header */}
            <div class="flex items-center justify-between px-3 py-2 bg-sky-600 text-white text-sm shrink-0">
              <span class="font-medium">Bot Assistant</span>
              <div class="flex gap-1">
                <button onClick={switchSide} class="p-1 hover:bg-white/20 rounded" title="Switch side">⇄</button>
                <button onClick={minimize} class="p-1 hover:bg-white/20 rounded" title="Minimize">−</button>
              </div>
            </div>

            {/* Connecting state */}
            <Show when={phase() === "connecting"}>
              <div class="flex-1 flex items-center justify-center">
                <div class="text-center">
                  <div class="inline-block w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-2" />
                  <p class="text-xs opacity-60">Connecting to Direct Line...</p>
                  <p class="text-[10px] opacity-40 mt-1">Fetching token → Creating conversation</p>
                </div>
              </div>
            </Show>

            {/* Messages */}
            <Show when={phase() === "connected"}>
              <div class="flex-1 overflow-y-auto p-3 space-y-3" id="webchat-messages">
                <For each={messages()}>
                  {(msg) => (
                    <div class={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                      <div class={`max-w-[75%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                        msg.from === "user"
                          ? "bg-sky-100 dark:bg-sky-900/40 text-sky-900 dark:text-sky-100"
                          : "bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
                      }`}>
                        <p class="whitespace-pre-wrap">{msg.text}</p>
                        <p class={`text-[9px] mt-1 ${msg.from === "user" ? "text-sky-500/60" : "text-gray-400/60"}`}>{msg.timestamp}</p>
                      </div>
                    </div>
                  )}
                </For>
                <Show when={typing()}>
                  <div class="flex justify-start">
                    <div class="bg-gray-100 dark:bg-zinc-800 rounded-lg px-3 py-2 text-xs">
                      <span class="inline-flex gap-1">
                        <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms" />
                        <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms" />
                        <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms" />
                      </span>
                    </div>
                  </div>
                </Show>
              </div>

              {/* Input */}
              <div class="border-t border-black/10 dark:border-white/10 p-2 flex gap-2 shrink-0">
                <input
                  type="text"
                  value={input()}
                  onInput={(e) => setInput(e.currentTarget.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  class="flex-1 text-xs px-2 py-1.5 rounded border border-black/10 dark:border-white/15 bg-transparent outline-none focus:border-sky-500"
                />
                <button
                  onClick={send}
                  class="text-xs px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white transition-colors"
                >
                  Send
                </button>
              </div>
            </Show>
          </div>
        </Show>
      </div>
    </div>
  )
}
