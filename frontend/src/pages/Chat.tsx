import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { listKeys, type VirtualKey } from "@/api/keys"
import { streamChatMessage, type ChatMessage } from "@/api/chat"
import { ApiError } from "@/api/client"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent } from "@/components/ui/Card"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select"
import { Send, Loader2, Bot, User, Sparkles, Zap, Cpu, KeyRound } from "lucide-react"

function getStoredKey(keyId: string): string | null {
  try {
    const stored = JSON.parse(localStorage.getItem("created_keys") || "{}")
    return stored[keyId]?.key || null
  } catch {
    return null
  }
}

export default function Chat() {
  const { loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [keys, setKeys] = useState<VirtualKey[]>([])
  const [selectedKey, setSelectedKey] = useState<string>("")
  const [manualKey, setManualKey] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [lastRouting, setLastRouting] = useState<{ tier: number; confidence: number } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (authLoading) return
    listKeys()
      .then((ks) => {
        const activeKeys = ks.filter(k => k.is_active)
        setKeys(activeKeys)
        if (activeKeys.length > 0) setSelectedKey(activeKeys[0].key_id)
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          navigate("/login", { replace: true })
        }
      })
  }, [authLoading, navigate])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function resolveKey(): string | null {
    if (manualKey.trim()) return manualKey.trim()
    if (selectedKey) {
      const selected = keys.find(k => k.key_id === selectedKey)
      if (selected?.key_raw) return selected.key_raw
      const stored = getStoredKey(selectedKey)
      if (stored) return stored
    }
    return null
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || sending) return

    const rawKey = resolveKey()
    if (!rawKey) {
      setError("No virtual key available. Select a key created in this session or paste one below.")
      return
    }

    const userMsg: ChatMessage = { role: "user", content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setSending(true)
    setError("")
    setLastRouting(null)

    const allMessages = [...messages, userMsg]

    try {
      let content = ""
      let firstChunk = true
      for await (const chunk of streamChatMessage(rawKey, allMessages)) {
        if ("error" in chunk) {
          setError(`Backend error: ${chunk.error}`)
          break
        }
        if (firstChunk && chunk["x-llmrouter"]) {
          setLastRouting(chunk["x-llmrouter"])
          firstChunk = false
        }
        if (chunk.choices?.[0]?.delta?.content) {
          content += chunk.choices[0].delta.content
          setMessages((prev) => {
            const updated = [...prev]
            const last = updated[updated.length - 1]
            if (last && last.role === "assistant") {
              updated[updated.length - 1] = { role: "assistant", content }
            } else {
              updated.push({ role: "assistant", content })
            }
            return updated
          })
        }
      }
    } catch (err) {
      if (err instanceof ApiError) {
        console.error("Chat API error:", err.status, err.detail)
        setError(`Error (${err.status}): ${err.detail}`)
      } else if (err instanceof Error) {
        console.error("Chat error:", err.message)
        setError(`Error: ${err.message}`)
      } else {
        setError("Request failed")
      }
    } finally {
      setSending(false)
    }
  }

  function hasKey(): boolean {
    if (manualKey.trim()) return true
    if (selectedKey) {
      const selected = keys.find(k => k.key_id === selectedKey)
      if (selected?.key_raw) return true
      if (getStoredKey(selectedKey)) return true
    }
    return false
  }

  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
      </div>
    )
  }

  if (keys.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Bot className="mb-4 h-12 w-12 text-brand-mid" />
        <h3 className="font-heading text-lg font-semibold text-brand-dark">No API Keys</h3>
        <p className="mt-2 text-sm text-brand-mid font-body">
          Create an API key first to test the chat routing feature.
        </p>
        <Button className="mt-4" onClick={() => navigate("/keys")}>
          Go to Keys
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-dark">Playground</h1>
          <p className="text-sm text-brand-mid font-body">
            Send prompts to test the intelligent routing engine
          </p>
        </div>
      </div>

      <Card className="flex-1 overflow-hidden">
        <CardContent className="flex h-full flex-col p-0">
          <div className="flex-1 overflow-y-auto space-y-4 p-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <Bot className="mb-4 h-16 w-16 text-brand-lightgray" />
                <h3 className="font-heading text-lg font-semibold text-brand-dark">
                  Test Your Router
                </h3>
                <p className="mt-2 max-w-md text-sm text-brand-mid font-body">
                  Select a key below (or paste one) and send a prompt to see which tier
                  the router selects based on complexity analysis.
                </p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      msg.role === "user" ? "bg-brand-orange" : "bg-brand-dark"
                    }`}
                  >
                    {msg.role === "user"
                      ? <User className="h-4 w-4 text-white" />
                      : <Bot className="h-4 w-4 text-white" />
                    }
                  </div>
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      msg.role === "user"
                        ? "bg-brand-orange text-white"
                        : "bg-brand-light text-brand-dark"
                    }`}
                  >
                    <p className="whitespace-pre-wrap font-body text-sm">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            {sending && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-dark">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-brand-mid" />
                  <span className="text-sm text-brand-mid font-body">Thinking...</span>
                </div>
              </div>
            )}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-brand-lightgray space-y-3 p-5">
            <div className="flex items-center gap-3">
              <Select value={selectedKey} onValueChange={setSelectedKey}>
                <SelectTrigger className="w-64 sm:w-72">
                  <SelectValue placeholder="Select a key" />
                </SelectTrigger>
                <SelectContent>
                  {keys.map((k) => (
                    <SelectItem key={k.key_id} value={k.key_id}>
                      {k.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!manualKey.trim() && !getStoredKey(selectedKey) && (
                <span className="text-xs text-brand-mid font-body">
                  (key not available — paste below)
                </span>
              )}
            </div>

            {!hasKey() && (
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 shrink-0 text-brand-mid" />
                <Input
                  placeholder="Paste virtual key (lmr-...)"
                  value={manualKey}
                  onChange={(e) => setManualKey(e.target.value)}
                  className="font-mono text-sm flex-1"
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <Input
                placeholder="Enter a prompt..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                disabled={sending}
                className="flex-1 text-base py-3 h-auto min-h-[56px]"
              />
              <Button onClick={handleSend} disabled={sending || !input.trim() || !hasKey()}>
                {sending
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Send className="h-4 w-4" />
                }
              </Button>
            </div>

            {lastRouting && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-brand-mid font-body">Routed to:</span>
                <span
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-white ${
                    lastRouting.tier === 0 ? "bg-yellow-500"
                    : lastRouting.tier === 1 ? "bg-blue-500"
                    : "bg-purple-500"
                  }`}
                >
                  {lastRouting.tier === 0 ? <Zap className="h-3 w-3" />
                    : lastRouting.tier === 1 ? <Cpu className="h-3 w-3" />
                    : <Sparkles className="h-3 w-3" />
                  }
                  {lastRouting.tier === 0 ? "Weak" : lastRouting.tier === 1 ? "Mid" : "Strong"}
                </span>
                <span className="text-brand-mid font-body">
                  ({(lastRouting.confidence * 100).toFixed(0)}% confidence)
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}