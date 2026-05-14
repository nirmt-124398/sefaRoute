import { apiRequest } from "./client"

export interface VirtualKey {
  key_id: string
  name: string
  weak_model: string
  mid_model: string
  strong_model: string
  is_active: boolean
  created_at: string
  last_used_at: string | null
  key_raw: string | null
}

export interface CreateKeyPayload {
  name: string
  weak_model: string
  weak_api_key: string
  weak_base_url: string
  mid_model: string
  mid_api_key: string
  mid_base_url: string
  strong_model: string
  strong_api_key: string
  strong_base_url: string
}

export interface CreateKeyResponse {
  key: string
  key_id: string
  name: string
}

export function listKeys() {
  return apiRequest<VirtualKey[]>("/keys/list")
}

export function createKey(payload: CreateKeyPayload) {
  return apiRequest<CreateKeyResponse>("/keys/create", {
    method: "POST",
    body: payload,
  })
}

export function revokeKey(key_id: string) {
  return apiRequest<{ message: string }>("/keys/revoke", {
    method: "POST",
    body: { key_id },
  })
}

export interface NvidiaModelsPayload {
  api_key: string
  base_url: string
}

export interface NvidiaModelsResponse {
  models: string[]
}

export function listNvidiaModels(payload: NvidiaModelsPayload) {
  return apiRequest<NvidiaModelsResponse>("/keys/nvidia/models", {
    method: "POST",
    body: payload,
  })
}
