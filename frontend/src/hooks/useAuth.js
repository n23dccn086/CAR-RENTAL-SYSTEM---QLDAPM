import { useAuthStore } from '../stores/authStore'

export function useAuth() {
  const { user, token, setAuth, updateUser, logout, isLoggedIn } = useAuthStore()
  return {
    user,
    token,
    isLoggedIn: isLoggedIn(),
    setAuth,
    updateUser,
    logout,
  }
}