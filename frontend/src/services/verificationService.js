import api from './api'

/**
 * Upload 5 ảnh GPLX/CCCD/selfie.
 * @param {File[]} files - mảng 5 File
 * @param {string[]} types - ['GPLX_FRONT','GPLX_BACK','CCCD_FRONT','CCCD_BACK','SELFIE']
 */
export async function uploadDocuments(files, types) {
  const formData = new FormData()
  files.forEach((f) => formData.append('files', f))
  types.forEach((t) => formData.append('types', t))

  const response = await api.post('/verification/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

/** Gửi hồ sơ cho admin duyệt */
export async function submitForReview() {
  const response = await api.post('/verification/submit')
  return response.data
}

/** Xem trạng thái xác thực của mình */
export async function getMyVerification() {
  const response = await api.get('/verification/me')
  return response.data
}

/** Admin: xem hồ sơ user */
export async function getUserVerification(userId) {
  const response = await api.get(`/admin/users/${userId}/verification`)
  return response.data
}

/** Admin: duyệt */
export async function approveVerification(userId) {
  const response = await api.put(`/admin/users/${userId}/verify`)
  return response.data
}

/** Admin: từ chối */
export async function rejectVerification(userId, reason) {
  const response = await api.put(
    `/admin/users/${userId}/reject-verification?reason=${encodeURIComponent(reason)}`
  )
  return response.data
}