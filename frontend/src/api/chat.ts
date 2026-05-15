import { apiRequest, ApiError } from "./client"

export interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

export interface ChatRequest {
  messages: ChatMessage[]
  stream?: boolean
}

export interface ChatResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: ChatMessage
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  "x-llmrouter"?: {
    tier: number
    tier_name: string
    confidence: number
    difficulty_score: number
    upgraded: boolean
    rerouted: boolean
  }
}

export interface ChatChunk {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    delta: Partial<ChatMessage>
    finish_reason: string | null
  }>
  "x-llmrouter"?: {
    tier: number
    tier_name: string
    confidence: number
    difficulty_score: number
    upgraded: boolean
    rerouted: boolean
  }
}

export interface ChatError {
  error: string
}

export async function sendChatMessage(
  virtualKey: string,
  messages: ChatMessage[],
  stream = false
): Promise<ChatResponse> {
  return apiRequest<ChatResponse>("/v1/chat/completions", {
    method: "POST",
    body: { messages, stream },
    headers: {
      Authorization: `Bearer ${virtualKey}`,
    },
  }, false)
}

export async function* streamChatMessage(
  virtualKey: string,
  messages: ChatMessage[]
): AsyncGenerator<ChatChunk | ChatError> {
  const response = await fetch("/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${virtualKey}`,
    },
    body: JSON.stringify({ messages, stream: true }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: "Stream error" }))
    throw new ApiError(response.status, err.detail ?? "Stream error")
  }

  if (!response.body) {
    throw new ApiError(500, "No response body")
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const text = decoder.decode(value)
    const lines = text.split("\n")

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6)
        if (data === "[DONE]") return
        try {
          yield JSON.parse(data) as ChatChunk
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }
}