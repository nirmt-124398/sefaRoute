import { apiRequest } from "./client"

export interface Summary {
  total_requests: number
  by_tier: { weak: number; mid: number; strong: number }
  total_cost_usd: number
  cost_saved_vs_always_strong: number
  avg_latency_ms: number
  success_rate: number
}

export interface RequestLog {
  id: string
  virtual_key_id: string
  prompt_preview: string | null
  prompt_length: number
  tier_assigned: number
  confidence: number
  model_used: string
  input_tokens: number | null
  output_tokens: number | null
  latency_ms: number
  cost_estimate_usd: number | null
  status: string
  error_message: string | null
  created_at: string
}

export function getSummary(key_id?: string, days = 30) {
  const params = new URLSearchParams()
  if (key_id) params.set("key_id", key_id)
  params.set("days", String(days))
  return apiRequest<Summary>(`/analytics/summary?${params}`)
}

export function getRequests(key_id?: string, limit = 50, offset = 0) {
  const params = new URLSearchParams()
  if (key_id) params.set("key_id", key_id)
  params.set("limit", String(limit))
  params.set("offset", String(offset))
  return apiRequest<RequestLog[]>(`/analytics/requests?${params}`)
}

export interface DailyStats {
  date: string
  requests: number
  cost_usd: number
}

export function getDailyStats(key_id?: string, days = 30) {
  const params = new URLSearchParams()
  if (key_id) params.set("key_id", key_id)
  params.set("days", String(days))
  return apiRequest<DailyStats[]>(`/analytics/daily?${params}`)
}
