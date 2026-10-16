import { create } from 'zustand'

const getUserFromStorage = () => {
  try {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  } catch {
    return null
  }
}

export const useAuthStore = create((set) => ({
  user: getUserFromStorage(),
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),

  setAuth: (token, user, refreshToken = null) => {
    localStorage.setItem('token', token)
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken)
    }
    localStorage.setItem('user', JSON.stringify(user))
    set({ token, user, refreshToken: refreshToken || localStorage.getItem('refreshToken') })
  },

  setTokens: (token, refreshToken = null) => {
    localStorage.setItem('token', token)
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken)
    }
    set({ token, refreshToken: refreshToken || localStorage.getItem('refreshToken') })
  },

  updateUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user))
    set({ user })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    set({ token: null, refreshToken: null, user: null })
  },

  isLoggedIn: () => !!localStorage.getItem('token'),
}))