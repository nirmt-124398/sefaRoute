import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { AuthResponse } from "@/api/auth"
import * as authApi from "@/api/auth"

interface AuthState {
  token: string | null
  user: { id: string; email: string; username: string } | null
  loading: boolean
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

function loadStoredAuth(): AuthState {
  const stored = localStorage.getItem("auth")
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      // corrupted storage
    }
  }
  return { token: null, user: null, loading: true }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadStoredAuth)

  useEffect(() => {
    if (state.token) {
      authApi.getMe().then((user) => {
        setState((prev) => ({ ...prev, user, loading: false }))
      }).catch(() => {
        localStorage.removeItem("auth")
        setState({ token: null, user: null, loading: false })
      })
    } else {
      setState((prev) => ({ ...prev, loading: false }))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const persist = useCallback((data: AuthResponse) => {
    const newState: AuthState = {
      token: data.token,
      user: data.user,
      loading: false,
    }
    localStorage.setItem("auth", JSON.stringify(newState))
    setState(newState)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login(email, password)
    persist(data)
  }, [persist])

  const register = useCallback(async (email: string, username: string, password: string) => {
    const data = await authApi.register(email, username, password)
    persist(data)
  }, [persist])

  const logout = useCallback(() => {
    localStorage.removeItem("auth")
    setState({ token: null, user: null, loading: false })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
