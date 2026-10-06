import api from './api'

// ===== ADMIN =====

/** Lấy tất cả config */
export async function getAllConfigs() {
  const response = await api.get('/admin/config')
  return response.data
}

/** Lấy 1 config theo key */
export async function getConfigByKey(key) {
  const response = await api.get(`/admin/config/${key}`)
  return response.data
}

/** Cập nhật config */
export async function updateConfig(key, value) {
  const response = await api.put(
    `/admin/config/${key}?value=${encodeURIComponent(value)}`
  )
  return response.data
}

/** Tạo config mới */
export async function createConfig(key, value, type = 'STRING', description = null) {
  const params = new URLSearchParams()
  params.append('key', key)
  params.append('value', value)
  params.append('type', type)
  if (description) params.append('description', description)

  const response = await api.post(`/admin/config?${params.toString()}`)
  return response.data
}