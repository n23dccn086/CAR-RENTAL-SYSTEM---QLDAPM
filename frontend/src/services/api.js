import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    
    // Xử lý 401 HOẶC 403 — đều là vấn đề xác thực
    if (status === 401 || status === 403) {
      // Kiểm tra token hết hạn
      const token = localStorage.getItem('token')
      let shouldLogout = status === 401  // 401 chắc chắn phải logout
      
      if (status === 403 && token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          const exp = payload.exp * 1000  // JWT exp là giây, đổi sang ms
          if (Date.now() > exp) {
            shouldLogout = true  // Token hết hạn → logout
          }
        } catch (e) {
          shouldLogout = true  // Token lỗi → logout
        }
      }
      
      if (shouldLogout) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    }
    
    return Promise.reject(error)
  }
)

export default api