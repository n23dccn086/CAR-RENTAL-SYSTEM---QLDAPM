import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor: tự động gán Bearer access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// State và hàng đợi (queue) để xử lý các request song song khi đang refresh token
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

const clearAuthAndRedirect = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

// Response interceptor: Bắt 401 (hoặc 403 do token hết hạn) và tự động gọi refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status

    // Bỏ qua nếu không có response hoặc là các endpoint xác thực (để tránh lặp vô tận)
    const url = originalRequest?.url || ''
    const isAuthEndpoint =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh')

    if ((status === 401 || status === 403) && !isAuthEndpoint) {
      // Phân biệt 403 quyền truy cập (Forbidden) và 403 do token hết hạn
      let isTokenExpired = status === 401
      const currentToken = localStorage.getItem('token')

      if (status === 403 && currentToken) {
        try {
          const payload = JSON.parse(atob(currentToken.split('.')[1]))
          const exp = payload.exp * 1000
          if (Date.now() > exp) {
            isTokenExpired = true
          }
        } catch {
          isTokenExpired = true
        }
      }

      // Nếu là lỗi 403 quyền hạn thật (không phải hết hạn token), trả về lỗi thông thường
      if (!isTokenExpired) {
        return Promise.reject(error)
      }

      // Nếu request này đã từng retry một lần rồi mà vẫn lỗi → buộc logout
      if (originalRequest._retry) {
        clearAuthAndRedirect()
        return Promise.reject(error)
      }

      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        clearAuthAndRedirect()
        return Promise.reject(error)
      }

      // Nếu đang có 1 request refresh đang chạy ngầm, đưa request này vào queue chờ
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Dùng raw axios (không qua interceptor của api instance) để tránh vòng lặp
        const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken })
        const authData = res.data?.data
        const newAccessToken = authData?.accessToken || authData?.token
        const newRefreshToken = authData?.refreshToken || authData?.refresh_token

        if (!newAccessToken) {
          throw new Error('Không nhận được accessToken mới từ máy chủ')
        }

        localStorage.setItem('token', newAccessToken)
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken)
        }

        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`

        processQueue(null, newAccessToken)
        return api(originalRequest)
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        clearAuthAndRedirect()
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api