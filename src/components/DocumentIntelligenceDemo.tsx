import { createSignal, For, Show } from "solid-js"

interface DocumentField {
  name: string
  value: string
  confidence: number
}

interface AnalysisResult {
  documentType: string
  confidence: number
  fields: DocumentField[]
}

const MOCK_RESULTS: Record<string, AnalysisResult> = {
  "tax": {
    documentType: "Canadian T4 — Employment Income",
    confidence: 97.1,
    fields: [
      { name: "Employee Name", value: "Alex Rivera", confidence: 99.3 },
      { name: "SIN (last 3)", value: "***-***-482", confidence: 98.8 },
      { name: "Employer Name", value: "Northern Tech Solutions Inc.", confidence: 96.5 },
      { name: "Employment Income", value: "$87,420.00", confidence: 97.2 },
      { name: "Income Tax Deducted", value: "$18,653.40", confidence: 96.9 },
      { name: "CPP Contributions", value: "$3,754.45", confidence: 98.1 },
      { name: "EI Premiums", value: "$1,002.45", confidence: 97.6 },
      { name: "Tax Year", value: "2025", confidence: 99.7 },
    ],
  },
  "lease": {
    documentType: "Residential Lease Agreement",
    confidence: 93.4,
    fields: [
      { name: "Landlord", value: "Maple Property Management Ltd.", confidence: 95.8 },
      { name: "Tenant", value: "Jordan K. Nguyen", confidence: 97.2 },
      { name: "Property Address", value: "1204-88 Harbour St, Vancouver, BC V6B 1R3", confidence: 94.1 },
      { name: "Monthly Rent", value: "$2,150.00", confidence: 96.7 },
      { name: "Lease Start", value: "2025-09-01", confidence: 98.3 },
      { name: "Lease End", value: "2026-08-31", confidence: 97.9 },
      { name: "Security Deposit", value: "$2,150.00", confidence: 95.0 },
      { name: "Pet Clause", value: "One cat permitted, no dogs", confidence: 88.4 },
    ],
  },
}

function confidenceColor(pct: number): string {
  if (pct >= 95) return "text-green-600 dark:text-green-400"
  if (pct >= 85) return "text-yellow-600 dark:text-yellow-400"
  return "text-red-600 dark:text-red-400"
}

export default function DocumentIntelligenceDemo() {
  const [fileName, setFileName] = createSignal("")
  const [dragging, setDragging] = createSignal(false)
  const [analyzing, setAnalyzing] = createSignal(false)
  const [result, setResult] = createSignal<AnalysisResult | null>(null)
  const [selectedModel, setSelectedModel] = createSignal("tax")

  const simulateAnalysis = (name: string) => {
    setFileName(name)
    setResult(null)
    setAnalyzing(true)
    setTimeout(() => {
      setResult(MOCK_RESULTS[selectedModel()])
      setAnalyzing(false)
    }, 2200)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer?.files[0]
    if (file) simulateAnalysis(file.name)
  }

  const handleFileInput = (e: Event) => {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (file) simulateAnalysis(file.name)
  }

  const reset = () => {
    setFileName("")
    setResult(null)
    setAnalyzing(false)
  }

  return (
    <div class="my-6 rounded-lg border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.04] overflow-hidden">
      {/* Header */}
      <div class="px-4 py-3 border-b border-black/10 dark:border-white/10 flex items-center justify-between flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium opacity-75">Interactive Demo</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-yellow-200/80 dark:bg-yellow-800/50 text-yellow-800 dark:text-yellow-200 font-medium">
            MOCK DATA
          </span>
        </div>
        <select
          value={selectedModel()}
          onChange={(e) => { setSelectedModel(e.currentTarget.value); reset() }}
          class="text-xs px-2 py-1 rounded border border-black/15 dark:border-white/15 bg-transparent"
        >
          <option value="tax">Tax Slip (T4)</option>
          <option value="lease">Lease Agreement</option>
        </select>
      </div>

      {/* Drop zone */}
      <div class="p-4">
        <Show when={!result() && !analyzing()}>
          <div
            class={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              dragging()
                ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20"
                : "border-black/15 dark:border-white/15 hover:border-black/30 dark:hover:border-white/30"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById("doc-file-input")?.click()}
          >
            <div class="text-3xl mb-2 opacity-40">📄</div>
            <p class="text-sm font-medium opacity-75">
              Drop a file here or click to browse
            </p>
            <p class="text-xs opacity-50 mt-1">
              Any file works — the demo uses sample {selectedModel().toUpperCase()} results
            </p>
            <input
              id="doc-file-input"
              type="file"
              class="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.tiff"
              onChange={handleFileInput}
            />
          </div>
        </Show>

        {/* Analyzing state */}
        <Show when={analyzing()}>
          <div class="text-center py-8">
            <div class="inline-block w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p class="text-sm font-medium">Analyzing <span class="font-mono text-xs opacity-60">{fileName()}</span></p>
            <p class="text-xs opacity-50 mt-1">Running Azure Document Intelligence custom model...</p>
          </div>
        </Show>

        {/* Results */}
        <Show when={result()}>
          <div>
            <div class="flex items-center justify-between mb-3">
              <div>
                <span class="text-sm font-semibold">{result()!.documentType}</span>
                <span class={`ml-2 text-xs font-mono ${confidenceColor(result()!.confidence)}`}>
                  {result()!.confidence}%
                </span>
              </div>
              <button
                onClick={reset}
                class="text-xs px-2 py-1 rounded border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                Try another
              </button>
            </div>

            <div class="text-xs text-black/50 dark:text-white/40 mb-2 font-mono">
              Source: {fileName()}
            </div>

            <div class="border border-black/10 dark:border-white/10 rounded overflow-hidden">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-black/[0.03] dark:bg-white/[0.05] text-left">
                    <th class="px-3 py-2 font-medium text-xs opacity-60">Field</th>
                    <th class="px-3 py-2 font-medium text-xs opacity-60">Extracted Value</th>
                    <th class="px-3 py-2 font-medium text-xs opacity-60 text-right">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  <For each={result()!.fields}>
                    {(field) => (
                      <tr class="border-t border-black/5 dark:border-white/5">
                        <td class="px-3 py-2 text-xs opacity-60">{field.name}</td>
                        <td class="px-3 py-2 text-xs font-medium">{field.value}</td>
                        <td class={`px-3 py-2 text-xs font-mono text-right ${confidenceColor(field.confidence)}`}>
                          {field.confidence}%
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </div>
          </div>
        </Show>
      </div>
    </div>
  )
}
