export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'
export const AI_URL = import.meta.env.VITE_AI_URL || 'http://localhost:8000'

export const BOOKING_STATUS = {
  PENDING: { label: 'Chờ thanh toán', color: '#8b2c2c' },
  PAID: { label: 'Đã cọc', color: '#c9a961' },
  APPROVED: { label: 'Đã duyệt', color: '#4a5d3f' },
  IN_PROGRESS: { label: 'Đang thuê', color: '#2a9d8f' },
  COMPLETED: { label: 'Hoàn tất', color: '#6b6660' },
  CANCELLED: { label: 'Đã hủy', color: '#8b2c2c' },
}

export const CAR_TYPES = ['SEDAN', 'SUV', 'MPV', 'HATCHBACK', 'PICKUP']

export const TRANSMISSIONS = ['AUTOMATIC', 'MANUAL']

export const FUEL_TYPES = ['GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID']

export const PAYMENT_METHODS = [
  { id: 'MOMO', name: 'Momo', desc: 'Ví điện tử' },
  { id: 'ZALOPAY', name: 'ZaloPay', desc: 'Ví điện tử' },
  { id: 'VNPAY', name: 'VNPAY', desc: 'Cổng ngân hàng' },
  { id: 'BANK_CARD', name: 'Thẻ ngân hàng', desc: 'Visa / Mastercard' },
]