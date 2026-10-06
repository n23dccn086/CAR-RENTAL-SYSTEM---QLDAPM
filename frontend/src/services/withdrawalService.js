import api from './api'

// ===== OWNER =====

/** Owner tạo yêu cầu rút tiền */
export async function createWithdrawal(data) {
  // data: { amount, bankName, bankAccount, accountHolder }
  const response = await api.post('/owner/withdrawals', data)
  return response.data
}

/** Owner xem lịch sử rút tiền */
export async function getMyWithdrawals() {
  const response = await api.get('/owner/withdrawals/my')
  return response.data
}

/** Owner xem số dư khả dụng + thông tin */
export async function getBalanceInfo() {
  const response = await api.get('/owner/withdrawals/balance')
  return response.data
}

// ===== ADMIN =====

/** Admin xem tất cả yêu cầu */
export async function getAllWithdrawals(status = null) {
  const params = status ? { status } : {}
  const response = await api.get('/admin/withdrawals', { params })
  return response.data
}

/** Admin xem chi tiết */
export async function getWithdrawalById(id) {
  const response = await api.get(`/admin/withdrawals/${id}`)
  return response.data
}

/** Admin đếm số yêu cầu PENDING */
export async function countPendingWithdrawals() {
  const response = await api.get('/admin/withdrawals/pending-count')
  return response.data
}

/** Admin duyệt yêu cầu */
export async function approveWithdrawal(id, transactionId = null) {
  const params = transactionId ? { transactionId } : {}
  const response = await api.put(`/admin/withdrawals/${id}/approve`, null, { params })
  return response.data
}

/** Admin từ chối yêu cầu */
export async function rejectWithdrawal(id, reason) {
  const response = await api.put(
    `/admin/withdrawals/${id}/reject?reason=${encodeURIComponent(reason)}`
  )
  return response.data
}