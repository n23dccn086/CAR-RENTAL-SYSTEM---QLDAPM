import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { getBookingById } from '../services/bookingService'
import PaymentSuccessModal from '../components/PaymentSuccessModal'

export default function PaymentFinalPage() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [method, setMethod] = useState('MOMO')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successData, setSuccessData] = useState(null)

  useEffect(() => {
    getBookingById(bookingId).then(res => setBooking(res.data)).catch(console.error)
  }, [bookingId])

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN').format(p || 0)

  const methods = [
    { id: 'MOMO', name: 'Momo', desc: 'Ví điện tử' },
    { id: 'ZALOPAY', name: 'ZaloPay', desc: 'Ví điện tử' },
    { id: 'VNPAY', name: 'VNPAY', desc: 'Cổng ngân hàng' },
    { id: 'BANKING', name: 'Thẻ ngân hàng', desc: 'Visa / Mastercard' },
  ]

  const handlePayment = async () => {
    setLoading(true)
    setError('')
    try {
      // Tạo payment với type = REMAINING (backend tự tính lại số tiền từ remainingAmount)
      const res = await api.post('/payments', {
        bookingId: parseInt(bookingId),
        paymentType: 'REMAINING',
        paymentMethod: method,
        amount: remaining,
      })

      const paymentId = res.data.data?.id
      if (paymentId) {
        await api.post(`/payments/${paymentId}/mock-success?method=${method}`)
      }

      setSuccessData({
        bookingId: parseInt(bookingId),
        amount: remaining,
        method: method,
        type: "REMAINING",
        carName: booking?.carName,
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Thanh toán thất bại')
    } finally {
      setLoading(false)
    }
  }

  if (!booking) return <div style={{ padding: '120px', textAlign: 'center' }}>Đang tải...</div>

  // Trang này chỉ dùng khi đơn RETURNED: lúc ký biên bản trả xe, backend đã cộng phí trễ / vượt km / phát sinh
  // vào totalPrice và remainingAmount → số cần trả = remainingAmount (KHÔNG cộng totalExtraFees lần nữa).
  // Các khoản phí lấy từ biên bản trả xe — backend đã gắn sẵn vào booking (BookingServiceImpl.buildResponse)
  const lateFee = Number(booking.lateFee || 0)
  const kmOverageFee = Number(booking.kmOverageFee || 0)
  const otherFee = Number(booking.extraFees || 0)
  const totalExtraFees = Number(booking.totalExtraFees || 0)
  const baseRental = Math.max(0, (booking.totalPrice || 0) - totalExtraFees)
  const remaining = booking.remainingAmount != null
    ? booking.remainingAmount
    : Math.max(0, (booking.totalPrice || 0) - (booking.depositAmount || 0))

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 48px' }}>
      <div className="chapter-num" style={{ marginBottom: '24px' }}>Chương Thanh Toán — Nốt</div>
      <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900, letterSpacing: '-2px', marginBottom: '40px' }}>
        Thanh toán <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>nốt.</em>
      </h1>

      {error && (
        <div style={{ background: 'rgba(139,44,44,0.1)', border: '1px solid var(--do)', padding: '12px 16px', marginBottom: '24px', color: 'var(--do)' }}>
          {error}
        </div>
      )}

      <div style={{ background: 'var(--kem-dam)', border: '1px solid var(--muc)', padding: '32px', marginBottom: '32px' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px', color: 'var(--muc-mo)', marginBottom: '16px' }}>
          ĐƠN #{bookingId} · {booking.carName}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontFamily: 'var(--serif-2)', fontSize: '16px' }}>
          <span>Tổng tiền thuê</span>
          <span style={{ fontFamily: 'var(--mono)' }}>{formatPrice(baseRental)}đ</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontFamily: 'var(--serif-2)', fontSize: '16px' }}>
          <span>Đã cọc</span>
          <span style={{ fontFamily: 'var(--mono)' }}>-{formatPrice(booking.depositAmount)}đ</span>
        </div>
        {totalExtraFees > 0 && (
          <div style={{ marginBottom: '12px', fontFamily: 'var(--serif-2)', fontSize: '16px', color: 'var(--do)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>Phí phát sinh (theo biên bản trả xe)</span>
              <span style={{ fontFamily: 'var(--mono)' }}>+{formatPrice(totalExtraFees)}đ</span>
            </div>
            <div style={{ paddingLeft: '16px', fontSize: '14px', color: 'var(--muc-mo)' }}>
              {lateFee > 0 && (
                <FeeLine
                  label={`• Phí trả xe trễ hạn${booking.lateMinutes ? ` (${Math.floor(booking.lateMinutes / 60)}h${booking.lateMinutes % 60}p)` : ''}`}
                  value={lateFee}
                  fmt={formatPrice}
                />
              )}
              {kmOverageFee > 0 && (
                <FeeLine
                  label={`• Phí vượt giới hạn km${booking.kmOverage ? ` (vượt ${Number(booking.kmOverage).toLocaleString('vi-VN')} km)` : ''}`}
                  value={kmOverageFee}
                  fmt={formatPrice}
                />
              )}
              {otherFee > 0 && (
                <FeeLine
                  label={`• Phí phát sinh khác${booking.extraFeesNote ? ` (${booking.extraFeesNote})` : ''}`}
                  value={otherFee}
                  fmt={formatPrice}
                />
              )}
            </div>
          </div>
        )}

        <div style={{ height: '1px', background: 'rgba(15,14,12,0.15)', margin: '16px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase' }}>Cần thanh toán</span>
          <span style={{ fontFamily: 'var(--serif)', fontSize: '42px', fontWeight: 900, color: 'var(--do)' }}>
            {formatPrice(remaining)}đ
          </span>
        </div>
      </div>

      <h3 style={{ fontFamily: 'var(--serif)', fontSize: '24px', marginBottom: '20px' }}>Chọn cổng thanh toán</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '40px' }}>
        {methods.map(m => (
          <div key={m.id} onClick={() => setMethod(m.id)} style={{
            padding: '20px',
            background: method === m.id ? 'var(--muc)' : 'var(--kem-dam)',
            color: method === m.id ? 'var(--kem)' : 'var(--muc)',
            border: `1px solid ${method === m.id ? 'var(--dong)' : 'rgba(15,14,12,0.2)'}`,
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '20px', fontWeight: 700 }}>{m.name}</div>
            <div style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '14px', opacity: 0.7 }}>{m.desc}</div>
          </div>
        ))}
      </div>

      <button
        onClick={handlePayment}
        disabled={loading}
        className="btn-login"
        style={{ width: '100%', justifyContent: 'center', padding: '20px', fontSize: '12px' }}
      >
        <span>{loading ? 'Đang xử lý...' : `Thanh toán ${formatPrice(remaining)}đ`}</span>
      </button>

      <PaymentSuccessModal
        isOpen={!!successData}
        data={successData}
        onClose={() => navigate("/my-bookings")}
        onGoToDetail={() => navigate(`/bookings/${bookingId}`)}
      />
    </div>
  )
}
function FeeLine({ label, value, fmt }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
      <span>{label}</span>
      <span style={{ fontFamily: 'var(--mono)' }}>+{fmt(value)}đ</span>
    </div>
  )
}
