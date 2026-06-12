import { create } from 'zustand'
import { setSession, clearSession, getSession } from '../api/request'
import type { UserProfile } from '../api'

export type Role = 'client' | 'counselor' | 'admin'

interface AuthState {
  user: UserProfile | null
  role: Role
  session: string | null
  isLoggedIn: boolean
  // Actions
  setUser: (user: UserProfile, session: string) => void
  setRole: (role: Role) => void
  logout: () => void
  restoreSession: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: 'client',
  session: null,
  isLoggedIn: false,

  setUser: (user, session) => {
    setSession(session)
    set({ user, session, isLoggedIn: true })
  },

  setRole: (role) => set({ role }),

  logout: () => {
    clearSession()
    set({ user: null, session: null, isLoggedIn: false, role: 'client' })
  },

  restoreSession: () => {
    const session = getSession()
    if (session) {
      set({ session, isLoggedIn: true })
    }
  },
}))
