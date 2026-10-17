import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor: tự động gán Bearer access token (trừ các endpoint auth public)
api.interceptors.request.use((config) => {
  const url = config.url || ''
  const isAuthEndpoint =
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/forgot-password') ||
    url.includes('/auth/reset-password')

  if (!isAuthEndpoint) {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  } else {
    // Đảm bảo không gửi token cũ/hết hạn vào endpoint đăng nhập/đăng ký
    delete config.headers.Authorization
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
      // Phân biệt lỗi phân quyền (Forbidden) và lỗi token hết hạn (Unauthorized)
      const errorCode = error.response?.data?.code
      const isPermissionDenied =
        status === 403 ||
        errorCode === 2102 || // PERMISSION_DENIED
        errorCode === 3002 || // UNAUTHORIZED (FORBIDDEN)
        errorCode === 4004 || // CAR_NOT_OWNED
        errorCode === 5006    // BOOKING_NOT_OWNED

      // Nếu là lỗi do không có quyền truy cập dữ liệu, tuyệt đối không đăng xuất người dùng
      if (isPermissionDenied) {
        return Promise.reject(error)
      }

      // Kiểm tra token thực sự có hết hạn không
      let isTokenExpired = status === 401
      const currentToken = localStorage.getItem('token')

      if (currentToken) {
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

      // Nếu không phải hết hạn token, trả về lỗi thông thường
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