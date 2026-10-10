import api from './api'

/**
 * Upload 5 ảnh GPLX/CCCD/selfie (Legacy frontend batch).
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

/** Gửi hồ sơ cho admin duyệt (Legacy frontend) */
export async function submitForReview() {
  const response = await api.post('/verification/submit')
  return response.data
}

// ============================================================
// CONTRACT MODULE 2 METHODS
// ============================================================

/** 2.2 Upload GPLX */
export async function uploadGplx(front, back, number, gClass) {
  const formData = new FormData()
  formData.append('gplx_front', front)
  formData.append('gplx_back', back)
  if (number) formData.append('gplx_number', number)
  if (gClass) formData.append('gplx_class', gClass)
  const response = await api.post('/users/documents/gplx', formData)
  return response.data
}

/** 2.3 Upload CCCD */
export async function uploadCccd(front, back, number) {
  const formData = new FormData()
  formData.append('cccd_front', front)
  formData.append('cccd_back', back)
  if (number) formData.append('cccd_number', number)
  const response = await api.post('/users/documents/cccd', formData)
  return response.data
}

/** 2.4 Upload Selfie */
export async function uploadSelfie(file) {
  const formData = new FormData()
  formData.append('selfie', file)
  const response = await api.post('/users/documents/selfie', formData)
  return response.data
}

/** 2.5 Gửi hồ sơ xác thực */
export async function submitVerification(gplxDocIds, cccdDocIds, selfieDocId) {
  const response = await api.post('/users/submit-verification', {
    gplx_doc_ids: gplxDocIds,
    cccd_doc_ids: cccdDocIds,
    selfie_doc_id: selfieDocId,
  })
  return response.data
}

// ============================================================
// STATUS & ADMIN
// ============================================================

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