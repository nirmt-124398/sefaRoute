import { apiRequest } from "./client"

export interface UserProfile {
  id: string
  email: string
  username: string
  created_at: string | null
}

export interface UpdateProfileRequest {
  username?: string
  email?: string
  password?: string
}

export function getProfile() {
  return apiRequest<UserProfile>("/users/me")
}

export function updateProfile(data: UpdateProfileRequest) {
  return apiRequest<UserProfile>("/users/me", {
    method: "PUT",
    body: data,
  })
}

export function getUser(userId: string) {
  return apiRequest<UserProfile>(`/users/${userId}`)
}

export function listUsers(skip = 0, limit = 100) {
  return apiRequest<UserProfile[]>(`/users/?skip=${skip}&limit=${limit}`)
}