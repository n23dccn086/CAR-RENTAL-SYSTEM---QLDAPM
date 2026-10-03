import api from './api'

export async function createBooking(data) {
  const response = await api.post('/bookings', data)
  return response.data
}

export async function getMyBookings() {
  const response = await api.get('/bookings/my')
  return response.data
}

export async function getBookingById(id) {
  const response = await api.get(`/bookings/${id}`)
  return response.data
}

export async function createPayment(data) {
  const response = await api.post('/payments', data)
  return response.data
}

export async function getMyPayments() {
  const response = await api.get('/payments/my')
  return response.data
}

// ===== OWNER =====
export async function getOwnerDashboard() {
  const response = await api.get('/owner/dashboard')
  return response.data
}

export async function requestWithdrawal(data) {
  const response = await api.post('/owner/withdrawals', data)
  return response.data
}

// ===== ADMIN =====
export async function getAllConfigs() {
  try {
    const response = await api.get('/admin/config')
    return response.data
  } catch {
    return { data: [] }
  }
}

export async function getPendingApprovals() {
  try {
    const response = await api.get('/admin/approvals')
    return response.data
  } catch {
    return { data: [] }
  }
}