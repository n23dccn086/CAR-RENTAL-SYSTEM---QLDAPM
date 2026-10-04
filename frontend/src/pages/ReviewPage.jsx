import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../services/api'

export default function ReviewPage() {
  const { bookingId } = useParams()
  const navigate = useNavigate()

  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [existingReview, setExistingReview] = useState(null)

  const [form, setForm] = useState({
    carRating: 5,
    ownerRating: 5,
    comment: '',
    isAnonymous: false,
  })

  useEffect(() => {
    loadData()
  }, [bookingId])

  const loadData = async () => {
    try {
      // Load booking info
      const bookingRes = await api.get(`/bookings/${bookingId}`)
      setBooking(bookingRes.data.data)

      // Check xem đã review chưa
      try {
        const reviewsRes = await api.get(`/reviews/my`)
        const reviews = reviewsRes.data.data || []
        const found = reviews.find(r => r.bookingId === parseInt(bookingId))
        if (found) setExistingReview(found)
      } catch (e) {
        // ignore
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không tải được thông tin đơn')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.comment && form.comment.length > 1000) {
      return setError('Nhận xét không quá 1000 ký tự')
    }

    setSubmitting(true)
    try {
      await api.post('/reviews', {
        bookingId: parseInt(bookingId),
        carRating: form.carRating,
        ownerRating: form.ownerRating,
        comment: form.comment?.trim() || null,
        isAnonymous: form.isAnonymous,
      })
      navigate('/my-bookings')
    } catch (err) {
      setError(err.response?.data?.message || 'Gửi đánh giá thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN').format(p || 0)
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—'

  // ===== LOADING =====
  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 48px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', color: 'var(--muc-mo)' }}>
          Đang tải...
        </p>
      </div>
    )
  }

  // ===== ERROR =====
  if (error && !booking) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 48px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: '96px', fontWeight: 900, color: 'var(--do)' }}>
          !
        </h1>
        <p style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '22px', color: 'var(--muc-mo)' }}>
          {error}
        </p>
        <Link to="/my-bookings" style={{ display: 'inline-block', marginTop: '24px', color: 'var(--do)', borderBottom: '1px solid var(--do)' }}>
          ← Về chuyến đi
        </Link>
      </div>
    )
  }

  // ===== ĐÃ ĐÁNH GIÁ =====
  if (existingReview) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 48px' }}>
        <div className="chapter-num" style={{ marginBottom: '24px' }}>Chương Đánh Giá</div>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900, letterSpacing: '-2px', marginBottom: '40px' }}>
          Đã <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>đánh giá.</em>
        </h1>

        <div style={{ background: 'var(--kem-dam)', border: '1px solid var(--muc)', padding: '32px', marginBottom: '32px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px', color: 'var(--muc-mo)', marginBottom: '16px' }}>
            BẠN ĐÃ ĐÁNH GIÁ ĐƠN #{existingReview.bookingId}
          </div>
          <div style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '18px', color: 'var(--muc-mo)', lineHeight: 1.7 }}>
            {existingReview.comment || '(Không có nhận xét)'}
          </div>
          <div style={{ marginTop: '20px', fontFamily: 'var(--mono)', fontSize: '14px' }}>
            <span>Xe: {'★'.repeat(existingReview.carRating)}{'☆'.repeat(5 - existingReview.carRating)}</span>
            <span style={{ marginLeft: '24px' }}>Chủ xe: {'★'.repeat(existingReview.ownerRating)}{'☆'.repeat(5 - existingReview.ownerRating)}</span>
          </div>
        </div>

        <Link
          to="/my-bookings"
          style={{
            display: 'inline-block',
            padding: '16px 32px',
            background: 'var(--muc)',
            color: 'var(--kem)',
            textDecoration: 'none',
            fontFamily: 'var(--mono)',
            fontSize: '11px',
            letterSpacing: '2px',
            textTransform: 'uppercase'
          }}
        >
          ← Về chuyến đi
        </Link>
      </div>
    )
  }

  // ===== FORM =====
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 48px' }}>
      <div className="chapter-num" style={{ marginBottom: '24px' }}>Chương Đánh Giá</div>
      <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900, letterSpacing: '-2px', marginBottom: '12px' }}>
        Đánh giá <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>chuyến đi.</em>
      </h1>
      <p style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '18px', color: 'var(--muc-mo)', marginBottom: '40px' }}>
        Chia sẻ trải nghiệm của bạn để giúp cộng đồng MAISON.
      </p>

      {/* BOOKING SUMMARY */}
      {booking && (
        <div style={{ background: 'var(--kem-dam)', border: '1px solid rgba(15,14,12,0.15)', padding: '24px', marginBottom: '32px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '2px', color: 'var(--muc-mo)', marginBottom: '8px' }}>
            ĐƠN #{booking.id}
          </div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
            {booking.carName || 'Cỗ xe'}
          </div>
          <div style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', color: 'var(--muc-mo)' }}>
            {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
          </div>
        </div>
      )}

      {error && (
        <div style={{
          background: 'rgba(139,44,44,0.1)',
          border: '1px solid var(--do)',
          padding: '12px 16px',
          marginBottom: '24px',
          color: 'var(--do)',
          fontFamily: 'var(--serif-2)',
          fontStyle: 'italic'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* CAR RATING */}
        <div style={{ marginBottom: '32px' }}>
          <label style={labelStyle}>Đánh giá cỗ xe *</label>
          <StarRating
            value={form.carRating}
            onChange={(v) => setForm({ ...form, carRating: v })}
          />
        </div>

        {/* OWNER RATING */}
        <div style={{ marginBottom: '32px' }}>
          <label style={labelStyle}>Đánh giá chủ xe *</label>
          <StarRating
            value={form.ownerRating}
            onChange={(v) => setForm({ ...form, ownerRating: v })}
          />
        </div>

        {/* COMMENT */}
        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>Nhận xét (tùy chọn, tối đa 1000 ký tự)</label>
          <textarea
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
            rows="5"
            maxLength={1000}
            placeholder="Xe sạch sẽ, chủ thân thiện, giao xe đúng hẹn..."
            style={{
              width: '100%',
              padding: '16px',
              background: 'var(--kem-dam)',
              border: '1px solid rgba(15,14,12,0.2)',
              fontFamily: 'var(--serif-2)',
              fontSize: '16px',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          <div style={{
            textAlign: 'right',
            fontFamily: 'var(--mono)',
            fontSize: '10px',
            color: 'var(--muc-mo)',
            marginTop: '6px'
          }}>
            {form.comment.length}/1000
          </div>
        </div>

        {/* ANONYMOUS */}
        <div style={{ marginBottom: '32px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontFamily: 'var(--serif-2)',
            fontSize: '16px',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={form.isAnonymous}
              onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })}
              style={{ cursor: 'pointer', width: '18px', height: '18px' }}
            />
            Đánh giá ẩn danh (không hiển thị tên)
          </label>
        </div>

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%',
            padding: '20px',
            background: 'var(--muc)',
            border: '2px solid var(--muc)',
            color: 'var(--kem)',
            fontFamily: 'var(--mono)',
            fontSize: '12px',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            cursor: submitting ? 'wait' : 'pointer',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--do)'; e.currentTarget.style.borderColor = 'var(--do)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--muc)'; e.currentTarget.style.borderColor = 'var(--muc)' }}
        >
          {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
        </button>
      </form>
    </div>
  )
}

// ===== STAR RATING COMPONENT =====
function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0)

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '42px',
            lineHeight: 1,
            padding: 0,
            color: (hover || value) >= star ? 'var(--dong)' : 'rgba(15,14,12,0.15)',
            transition: 'color 0.2s, transform 0.2s',
            transform: (hover || value) >= star ? 'scale(1.15)' : 'scale(1)'
          }}
        >
          ★
        </button>
      ))}
      <span style={{
        fontFamily: 'var(--serif)',
        fontSize: '20px',
        fontWeight: 700,
        color: 'var(--dong)',
        marginLeft: '12px'
      }}>
        {value}/5
      </span>
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontFamily: 'var(--mono)',
  fontSize: '10px',
  letterSpacing: '3px',
  textTransform: 'uppercase',
  color: 'var(--muc-mo)',
  marginBottom: '12px'
}