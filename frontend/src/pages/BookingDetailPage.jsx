import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getBookingById } from '../services/bookingService'
import api from '../services/api'

export default function BookingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [handovers, setHandovers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getBookingById(id),
      api.get(`/handovers/booking/${id}`).catch(() => ({ data: { data: [] } })),
    ])
      .then(([bookingRes, handoverRes]) => {
        setBooking(bookingRes.data)
        setHandovers(handoverRes.data.data || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN').format(p || 0)
  const formatDate = (d) => d ? new Date(d).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }) : '—'

  const statusMap = {
    PENDING: { label: 'Chờ thanh toán', color: 'var(--do)' },
    PAID: { label: 'Đã cọc', color: 'var(--dong)' },
    APPROVED: { label: 'Đã duyệt', color: 'var(--xanh-reu)' },
    RENTED: { label: 'Đang thuê', color: 'var(--xanh-ngoc)' },
    RETURNED: { label: 'Đã trả xe', color: 'var(--tim)' },
    COMPLETED: { label: 'Hoàn tất', color: 'var(--muc-mo)' },
    CANCELLED: { label: 'Đã hủy', color: 'var(--do)' },
  }

  if (loading) {
    return <div style={{ padding: '120px', textAlign: 'center', fontFamily: 'var(--serif-2)', fontStyle: 'italic' }}>Đang tải...</div>
  }

  if (!booking) {
    return (
      <div style={{ padding: '120px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: '96px', color: 'var(--do)' }}>404</h1>
        <p style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic' }}>Không tìm thấy đơn.</p>
        <Link to="/my-bookings" style={{ color: 'var(--do)' }}>← Về chuyến đi</Link>
      </div>
    )
  }

  const pickupHandover = handovers.find(h => h.handoverType === 'PICKUP')
  const returnHandover = handovers.find(h => h.handoverType === 'RETURN')
  const canPayFinal = booking.status === 'RETURNED' && (booking.remainingAmount > 0 || booking.totalExtraFees > 0)

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 48px' }}>
      <Link to="/my-bookings" style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muc-mo)', display: 'inline-block', marginBottom: '24px' }}>
        ← Về chuyến đi
      </Link>

      <div className="chapter-num" style={{ marginBottom: '24px' }}>Chương Chuyến Đi — Chi Tiết</div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900, letterSpacing: '-2px', margin: 0 }}>
            Đơn <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>#{booking.id}.</em>
          </h1>
          <p style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '16px', color: 'var(--muc-mo)', marginTop: '8px' }}>
            {booking.carName} {booking.carPlate && `— ${booking.carPlate}`}
          </p>
        </div>
        <div style={{
          padding: '10px 20px',
          border: `2px solid ${statusMap[booking.status]?.color}`,
          color: statusMap[booking.status]?.color,
          fontFamily: 'var(--mono)', fontSize: '12px', letterSpacing: '2px',
          textTransform: 'uppercase', whiteSpace: 'nowrap'
        }}>
          {statusMap[booking.status]?.label || booking.status}
        </div>
      </div>

      {/* Info */}
      <div style={{ background: 'var(--kem-dam)', border: '1px solid rgba(15,14,12,0.15)', padding: '32px', marginBottom: '32px' }}>
        <h3 style={{ fontFamily: 'var(--serif)', fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>Thông tin đơn</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <InfoRow label="Ngày nhận xe" value={formatDate(booking.startDate)} />
          <InfoRow label="Ngày trả xe" value={formatDate(booking.endDate)} />
          <InfoRow label="Địa chỉ nhận" value={booking.pickupAddress} />
          <InfoRow label="Hình thức thuê" value={booking.rentalMode === 'SELF_DRIVE' ? 'Tự lái' : 'Có tài xế'} />
          <InfoRow label="Khách hàng" value={booking.customerName} />
          <InfoRow label="Chủ xe" value={booking.ownerName} />
        </div>
      </div>

      {/* Tiền */}
      <div style={{ background: 'var(--kem-dam)', border: '1px solid rgba(15,14,12,0.15)', padding: '32px', marginBottom: '32px' }}>
        <h3 style={{ fontFamily: 'var(--serif)', fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>Chi tiết tiền</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontFamily: 'var(--serif-2)', fontSize: '16px' }}>
          <span>Tổng tiền thuê</span>
          <span style={{ fontFamily: 'var(--mono)' }}>{formatPrice(booking.totalPrice)}đ</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontFamily: 'var(--serif-2)', fontSize: '16px' }}>
          <span>Tiền cọc (đã trả)</span>
          <span style={{ fontFamily: 'var(--mono)' }}>{formatPrice(booking.depositAmount)}đ</span>
        </div>
        {booking.totalExtraFees > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontFamily: 'var(--serif-2)', fontSize: '16px', color: 'var(--do)' }}>
            <span>Phí phát sinh</span>
            <span style={{ fontFamily: 'var(--mono)' }}>+{formatPrice(booking.totalExtraFees)}đ</span>
          </div>
        )}
        <div style={{ height: '1px', background: 'rgba(15,14,12,0.15)', margin: '16px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase' }}>Còn lại phải trả</span>
          <span style={{ fontFamily: 'var(--serif)', fontSize: '28px', fontWeight: 900, color: 'var(--do)' }}>
            {formatPrice((booking.totalPrice || 0) - (booking.depositAmount || 0))}đ
          </span>
        </div>
      </div>

      {/* Biên bản */}
      {(pickupHandover || returnHandover) && (
        <div style={{ background: 'var(--kem-dam)', border: '1px solid rgba(15,14,12,0.15)', padding: '32px', marginBottom: '32px' }}>
          <h3 style={{ fontFamily: 'var(--serif)', fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>Biên bản</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {pickupHandover && (
              <Link to={`/handover/${pickupHandover.id}`} style={{
                padding: '16px', background: 'var(--kem)', border: '1px solid var(--muc)',
                textDecoration: 'none', color: 'var(--muc)', fontFamily: 'var(--mono)',
                fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase'
              }}>
                📝 Biên bản giao xe ({pickupHandover.status})
              </Link>
            )}
            {returnHandover && (
              <Link to={`/handover/${returnHandover.id}`} style={{
                padding: '16px', background: 'var(--kem)', border: '1px solid var(--muc)',
                textDecoration: 'none', color: 'var(--muc)', fontFamily: 'var(--mono)',
                fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase'
              }}>
                📝 Biên bản nhận xe ({returnHandover.status})
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {canPayFinal && (
          <Link to={`/payment-final/${booking.id}`} style={{
            padding: '16px 32px', background: 'var(--do)', color: 'var(--kem)',
            textDecoration: 'none', fontFamily: 'var(--mono)', fontSize: '12px',
            letterSpacing: '2px', textTransform: 'uppercase'
          }}>
            💰 Thanh toán nốt
          </Link>
        )}

        {booking.status === 'COMPLETED' && !booking.reviewed && (
          <Link to={`/review/${booking.id}`} style={{
            padding: '16px 32px', background: 'var(--dong)', color: 'var(--muc)',
            textDecoration: 'none', fontFamily: 'var(--mono)', fontSize: '12px',
            letterSpacing: '2px', textTransform: 'uppercase'
          }}>
            ★ Đánh giá
          </Link>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muc-mo)', marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--serif-2)', fontSize: '16px', color: 'var(--muc)' }}>
        {value || '—'}
      </div>
    </div>
  )
}