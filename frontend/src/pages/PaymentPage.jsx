import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getBookingById } from '../services/bookingService'
import { createPayment } from '../services/bookingService'

export default function PaymentPage() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [method, setMethod] = useState('MOMO')
  const [loading, setLoading] = useState(false)

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
    try {
      await createPayment({
        bookingId: parseInt(bookingId),
        paymentType: 'DEPOSIT',
        paymentMethod: method, 
        amount: booking?.depositAmount,
      })
      alert('Thanh toán thành công! (demo)')
      navigate('/my-bookings')
    } catch (err) {
      alert('Thanh toán thất bại: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 48px' }}>
      <div className="chapter-num" style={{ marginBottom: '24px' }}>Chương Thanh Toán</div>
      <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900, letterSpacing: '-2px', marginBottom: '40px' }}>
        Gửi <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>chút cọc.</em>
      </h1>

      <div style={{ background: 'var(--kem-dam)', border: '1px solid var(--muc)', padding: '32px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muc-mo)' }}>Mã đơn</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '14px' }}>#{bookingId}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muc-mo)' }}>Tiền cọc (30%)</span>
          <span style={{ fontFamily: 'var(--serif)', fontSize: '42px', fontWeight: 900, color: 'var(--do)' }}>
            {formatPrice(booking?.depositAmount)}<span style={{ fontSize: '16px', fontFamily: 'var(--mono)', fontWeight: 400, marginLeft: '4px' }}>đ</span>
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

      <button onClick={handlePayment} disabled={loading} className="btn-login" style={{ width: '100%', justifyContent: 'center', padding: '20px', fontSize: '12px' }}>
        <span>{loading ? 'Đang xử lý...' : `Thanh toán ${formatPrice(booking?.depositAmount)}đ`}</span>
      </button>
    </div>
  )
}