import api from './api'

// ===== UPLOAD =====

/** Upload ảnh chữ ký vẽ tay → trả URL */
export async function uploadSignature(file) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post('/handovers/upload-signature', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

/** Upload ảnh xe (xước, nội thất, đồng hồ...) → trả URL */
export async function uploadImage(file) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post('/handovers/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

// ===== CRUD =====

/** Tạo biên bản PICKUP hoặc RETURN — chỉ OWNER */
export async function createHandover(data) {
  // data: { bookingId, handoverType, kmReading, fuelLevel, exteriorNote, interiorNote, damages, extraFees, extraFeesNote, images: [] }
  const response = await api.post('/handovers', data)
  return response.data
}

/** Lấy chi tiết 1 biên bản */
export async function getHandoverById(id) {
  const response = await api.get(`/handovers/${id}`)
  return response.data
}

/** Lấy danh sách biên bản của 1 booking */
export async function getHandoversByBooking(bookingId) {
  const response = await api.get(`/handovers/booking/${bookingId}`)
  return response.data
}

/** Ký biên bản — role: 'OWNER' hoặc 'CUSTOMER' */
export async function signHandover(id, role, signatureUrl) {
  const response = await api.post(`/handovers/${id}/sign?role=${role}`, {
    signatureUrl,
  })
  return response.data
}