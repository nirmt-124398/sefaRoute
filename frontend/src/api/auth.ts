import { apiRequest } from "./client"

export interface AuthResponse {
  token: string
  user: { id: string; email: string; username: string }
}

export function login(email: string, password: string) {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
  }, false)
}

export function register(email: string, username: string, password: string) {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: { email, username, password },
  }, false)
}

export function getMe() {
  return apiRequest<{ id: string; email: string; username: string }>("/auth/me")
}
