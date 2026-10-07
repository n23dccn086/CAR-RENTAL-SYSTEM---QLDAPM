import api from './api'

// ============================================================
// CUSTOMER
// ============================================================

/** Customer gửi yêu cầu đăng ký */
export async function submitOwnerRequest(data) {
  const response = await api.post('/owner-register/submit', data)
  return response.data
}

/** Customer upload 5 ảnh */
export async function uploadOwnerDocuments(requestId, files, types) {
  const formData = new FormData()
  files.forEach((f) => formData.append('files', f))
  types.forEach((t) => formData.append('types', t))

  const response = await api.post(
    `/owner-register/${requestId}/upload`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return response.data
}

/** Customer xem request mới nhất của mình */
export async function getMyOwnerRequest() {
  const response = await api.get('/owner-register/my')
  return response.data
}

// ============================================================
// ADMIN
// ============================================================

/** Admin list tất cả request (filter theo status) */
export async function getAllOwnerRequests(status = null) {
  const params = status ? { status } : {}
  const response = await api.get('/admin/owner-requests', { params })
  return response.data
}

/** Admin xem chi tiết */
export async function getOwnerRequestById(id) {
  const response = await api.get(`/admin/owner-requests/${id}`)
  return response.data
}

/** Admin đếm số PENDING */
export async function countPendingOwnerRequests() {
  const response = await api.get('/admin/owner-requests/pending-count')
  return response.data
}

/** Admin duyệt */
export async function approveOwnerRequest(id) {
  const response = await api.put(`/admin/owner-requests/${id}/approve`)
  return response.data
}

/** Admin từ chối */
export async function rejectOwnerRequest(id, reason) {
  const response = await api.put(
    `/admin/owner-requests/${id}/reject?reason=${encodeURIComponent(reason)}`
  )
  return response.data
}