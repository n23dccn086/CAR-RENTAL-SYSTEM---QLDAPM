import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../services/api'

export default function ReviewPage() {
  // Route /review/:bookingId (tạo/xem đánh giá) hoặc /my-reviews/:reviewId (link từ thông báo)
  const { bookingId: bookingIdParam, reviewId } = useParams()
  const navigate = useNavigate()

  const [bookingId, setBookingId] = useState(bookingIdParam)
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [existingReview, setExistingReview] = useState(null)

  // ===== TRẢ LỜI PHẢN HỒI CỦA CHỦ XE =====
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replySubmitting, setReplySubmitting] = useState(false)
  const [replyError, setReplyError] = useState('')

  const handleCustomerReply = async () => {
    const text = replyText.trim()
    if (!text || !existingReview) return
    if (text.length > 1000) return setReplyError('Trả lời không quá 1000 ký tự')
    setReplySubmitting(true)
    setReplyError('')
    try {
      const res = await api.post(`/reviews/${existingReview.id}/customer-reply`, { reply: text })
      const updated = res.data.data
      setExistingReview(prev => ({
        ...prev,
        customerReply: updated?.customerReply ?? text,
        customerRepliedAt: updated?.customerRepliedAt ?? new Date().toISOString(),
      }))
      setReplyOpen(false)
      setReplyText('')
    } catch (err) {
      setReplyError(err.response?.data?.message || 'Gửi trả lời thất bại')
    } finally {
      setReplySubmitting(false)
    }
  }

  const [form, setForm] = useState({
    carRating: 5,
    ownerRating: 5,
    comment: '',
    isAnonymous: false,
  })

  useEffect(() => {
    loadData()
  }, [bookingIdParam, reviewId])

  const loadData = async () => {
    setLoading(true)
    setError('')
    setExistingReview(null)
    try {
      // Danh sách đánh giá của tôi (để biết đã review chưa / tìm theo reviewId)
      let reviews = []
      try {
        const reviewsRes = await api.get(`/reviews/my`)
        reviews = reviewsRes.data.data || []
      } catch (e) {
        if (reviewId) throw e
      }

      let found = null
      let resolvedBookingId = bookingIdParam
      if (reviewId) {
        found = reviews.find(r => r.id === parseInt(reviewId))
        if (!found) {
          setError('Không tìm thấy đánh giá')
          return
        }
        resolvedBookingId = found.bookingId
      } else {
        found = reviews.find(r => r.bookingId === parseInt(bookingIdParam))
      }
      setBookingId(resolvedBookingId)

      // Load booking info
      const bookingRes = await api.get(`/bookings/${resolvedBookingId}`)
      setBooking(bookingRes.data.data)
      if (found) setExistingReview(found)
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
  const formatDateTime = (d) => d ? new Date(d).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : ''

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

          {/* PHẢN HỒI CỦA CHỦ XE */}
          {existingReview.ownerReply && (
            <div style={{ marginTop: '24px', padding: '14px 18px', background: 'var(--kem)', borderLeft: '3px solid var(--muc)' }}>
              <div style={replyLabelStyle}>
                Phản hồi của chủ xe{existingReview.repliedAt ? ` · ${formatDateTime(existingReview.repliedAt)}` : ''}
              </div>
              <div style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '16px', color: 'var(--muc)', whiteSpace: 'pre-wrap' }}>
                "{existingReview.ownerReply}"
              </div>
            </div>
          )}

          {/* TRẢ LỜI CỦA KHÁCH */}
          {existingReview.ownerReply && existingReview.customerReply && !replyOpen && (
            <div style={{ marginTop: '12px', marginLeft: '24px', padding: '14px 18px', background: 'var(--kem)', borderLeft: '3px solid var(--dong)' }}>
              <div style={replyLabelStyle}>
                Trả lời của bạn{existingReview.customerRepliedAt ? ` · ${formatDateTime(existingReview.customerRepliedAt)}` : ''}
              </div>
              <div style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '16px', color: 'var(--muc)', whiteSpace: 'pre-wrap' }}>
                "{existingReview.customerReply}"
              </div>
            </div>
          )}

          {existingReview.ownerReply && (
            <div style={{ marginTop: '14px', marginLeft: '24px' }}>
              {replyOpen ? (
                <div style={{ background: 'var(--kem)', padding: '16px', border: '1px solid rgba(15,14,12,0.2)' }}>
                  <textarea
                    rows={3}
                    maxLength={1000}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Trả lời chủ xe..."
                    style={{ width: '100%', padding: '10px', fontFamily: 'var(--serif-2)', fontSize: '14px', border: '1px solid rgba(15,14,12,0.2)', background: 'var(--kem-dam)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                  {replyError && <div style={{ color: 'var(--do)', fontFamily: 'var(--mono)', fontSize: '11px', marginTop: '6px' }}>{replyError}</div>}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={handleCustomerReply}
                      disabled={replySubmitting || !replyText.trim()}
                      style={{ padding: '6px 16px', background: 'var(--muc)', color: 'var(--kem)', border: 'none', fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', cursor: replySubmitting ? 'wait' : 'pointer', opacity: !replyText.trim() ? 0.5 : 1 }}
                    >
                      {replySubmitting ? 'Đang gửi...' : 'Gửi trả lời'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setReplyOpen(false); setReplyText(''); setReplyError('') }}
                      style={{ padding: '6px 14px', background: 'transparent', border: '1px solid rgba(15,14,12,0.3)', fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer' }}
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { setReplyOpen(true); setReplyText(existingReview.customerReply || ''); setReplyError('') }}
                  style={{ padding: '4px 12px', background: 'transparent', border: '1px dashed var(--muc-mo)', color: 'var(--muc)', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer' }}
                >
                  {existingReview.customerReply ? '✎ Sửa trả lời' : '↩ Trả lời chủ xe'}
                </button>
              )}
            </div>
          )}
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

const replyLabelStyle = {
  fontFamily: 'var(--mono)',
  fontSize: '10px',
  letterSpacing: '1px',
  textTransform: 'uppercase',
  color: 'var(--muc-mo)',
  marginBottom: '4px'
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