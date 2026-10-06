import api from './api'

/**
 * Lấy tất cả config public (support_hotline, support_email)
 * Không cần auth.
 * Có cache-busting để luôn lấy config mới nhất sau khi Admin sửa.
 */
export async function getPublicConfigs() {
  try {
    const response = await api.get('/public/config', {
      params: { _t: Date.now() },  // Cache busting
      headers: { 'Cache-Control': 'no-cache' },
    })
    return response.data?.data || {}
  } catch (err) {
    console.warn('Failed to load public configs:', err.message)
    return {}
  }
}

/**
 * Lấy 1 config theo key.
 * Chỉ cho phép: support_hotline, support_email
 */
export async function getPublicConfig(key) {
  try {
    const response = await api.get(`/public/config/${key}`, {
      params: { _t: Date.now() },  // Cache busting
      headers: { 'Cache-Control': 'no-cache' },
    })
    return response.data?.data || null
  } catch (err) {
    console.warn(`Failed to load config "${key}":`, err.message)
    return null
  }
}