import api from './api'

export async function login(phone, password) {
  const response = await api.post('/auth/login', { phone, password })
  return response.data
}

export async function register(data) {
  const response = await api.post('/auth/register', data)
  return response.data
}

export async function getCurrentUser() {
  const response = await api.get('/auth/me')
  return response.data
}

export async function updateProfile(data) {
  const response = await api.put('/auth/me', data)   // ← SỬA: /users/me → /auth/me
  return response.data
}

export async function changePassword(currentPassword, newPassword) {
  const response = await api.post('/auth/change-password', {
    currentPassword,
    newPassword,
  })
  return response.data
}

export async function logout() {
  try {
    await api.post('/auth/logout')
  } finally {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
}