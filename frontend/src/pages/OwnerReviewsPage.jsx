import { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'

export default function OwnerReviewsPage() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [carFilter, setCarFilter] = useState('')
  const [starFilter, setStarFilter] = useState('')

  // ===== PHÂN TRANG =====
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  // ===== PHẢN HỒI ĐÁNH GIÁ =====
  const [replyingId, setReplyingId] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [replySubmitting, setReplySubmitting] = useState(false)
  const [replyError, setReplyError] = useState('')

  const handleReplySubmit = async (reviewId) => {
    if (!replyText.trim()) return
    setReplySubmitting(true)
    setReplyError('')
    try {
      await api.post(`/reviews/${reviewId}/reply`, { reply: replyText.trim() })
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, ownerReply: replyText.trim(), owner_reply: replyText.trim() } : r))
      setReplyingId(null)
      setReplyText('')
    } catch (err) {
      setReplyError(err.response?.data?.message || 'Gửi phản hồi thất bại')
    } finally {
      setReplySubmitting(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [user])

  // Reset page khi filter đổi
  useEffect(() => {
    setCurrentPage(1)
  }, [carFilter, starFilter])

  const fetchReviews = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const res = await api.get(`/reviews/owner/${user.id}`)
      setReviews(res.data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (d) => {
    if (!d) return ''
    return new Date(d).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const totalReviews = reviews.length
  const avgCarRating = totalReviews > 0
    ? (reviews.reduce((s, r) => s + (r.carRating || 0), 0) / totalReviews).toFixed(1)
    : '0.0'
  const avgOwnerRating = totalReviews > 0
    ? (reviews.reduce((s, r) => s + (r.ownerRating || 0), 0) / totalReviews).toFixed(1)
    : '0.0'

  const uniqueCars = Array.from(new Set(reviews.map(r => r.carName).filter(Boolean)))

  const filtered = reviews.filter(r => {
    if (carFilter && r.carName !== carFilter) return false
    if (starFilter && r.ownerRating !== parseInt(starFilter)) return false
    return true
  })

  // ===== TÍNH TOÁN PHÂN TRANG =====
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const currentReviews = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const renderStars = (n) => {
    const value = Math.round(n || 0)
    return (
      <span style={{ color: 'var(--dong)', fontFamily: 'var(--serif)', fontSize: '20px', letterSpacing: '2px' }}>
        {'★'.repeat(value)}{'☆'.repeat(5 - value)}
      </span>
    )
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 48px' }}>
      <div className="chapter-num" style={{ marginBottom: '24px' }}>Chương Chủ Xe — Đánh Giá</div>
      <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900, letterSpacing: '-2px', marginBottom: '16px' }}>
        Khách <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>nhận xét.</em>
      </h1>
      <p style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '18px', color: 'var(--muc-mo)', marginBottom: '40px' }}>
        Xem nhận xét của khách hàng về cỗ xe và dịch vụ của bạn.
      </p>

      {totalReviews > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '40px' }}>
          <StatCard label="Điểm chủ xe" value={`${avgOwnerRating}★`} hint={`/ 5.0 (${totalReviews} đánh giá)`} />
          <StatCard label="Điểm cỗ xe" value={`${avgCarRating}★`} hint={`/ 5.0 (${totalReviews} đánh giá)`} />
          <StatCard label="Cỗ xe được đánh giá" value={uniqueCars.length} hint="cỗ xe" />
        </div>
      )}

      {totalReviews > 0 && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '40px', flexWrap: 'wrap', alignItems: 'center', paddingBottom: '24px', borderBottom: '1px solid rgba(15,14,12,0.15)' }}>
          <select value={carFilter} onChange={e => setCarFilter(e.target.value)} style={{ padding: '8px 16px', background: 'var(--kem-dam)', border: '1px solid rgba(15,14,12,0.2)', fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '1px', cursor: 'pointer', outline: 'none' }}>
            <option value="">Tất cả xe ({uniqueCars.length})</option>
            {uniqueCars.map((c, i) => <option key={i} value={c}>{c}</option>)}
          </select>

          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { v: '', l: 'Tất cả' }, { v: '5', l: '5★' }, { v: '4', l: '4★' },
              { v: '3', l: '3★' }, { v: '2', l: '2★' }, { v: '1', l: '1★' },
            ].map(opt => (
              <button key={opt.v} onClick={() => setStarFilter(opt.v)} style={{
                padding: '6px 12px',
                background: starFilter === opt.v ? 'var(--muc)' : 'transparent',
                color: starFilter === opt.v ? 'var(--kem)' : 'var(--muc-mo)',
                border: `1px solid ${starFilter === opt.v ? 'var(--muc)' : 'rgba(15,14,12,0.2)'}`,
                fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1px', cursor: 'pointer'
              }}>
                {opt.l}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: 'center', fontFamily: 'var(--serif-2)', fontStyle: 'italic', padding: '40px', color: 'var(--muc-mo)' }}>Đang tải...</p>
      ) : reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <p style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '24px', color: 'var(--muc-mo)' }}>Chưa có đánh giá nào.</p>
          <p style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px', color: 'var(--muc-mo)', marginTop: '16px' }}>
            Khách hàng sẽ đánh giá sau khi chuyến đi hoàn tất
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <p style={{ textAlign: 'center', fontFamily: 'var(--serif-2)', fontStyle: 'italic', padding: '40px', color: 'var(--muc-mo)' }}>
          Không có đánh giá nào phù hợp với bộ lọc.
        </p>
      ) : (
        <>
          <div>
            {currentReviews.map(r => (
              <div key={r.id} style={{ padding: '24px 0', borderBottom: '1px solid rgba(15,14,12,0.12)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--dong)', color: 'var(--muc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '16px' }}>
                    {r.isAnonymous ? '?' : (r.customerName?.charAt(0)?.toUpperCase() || '?')}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: '18px', fontWeight: 700 }}>
                      {r.isAnonymous ? 'Khách ẩn danh' : (r.customerName || 'Khách')}
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1px', color: 'var(--muc-mo)' }}>
                      {formatDate(r.createdAt)}
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: '14px', color: 'var(--muc-mo)', fontStyle: 'italic' }}>
                      {r.carName || 'Cỗ xe'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '32px', marginBottom: '16px', paddingLeft: '52px' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muc-mo)', marginBottom: '4px' }}>Cỗ xe</div>
                    {renderStars(r.carRating)}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muc-mo)', marginBottom: '4px' }}>Bạn (chủ xe)</div>
                    {renderStars(r.ownerRating)}
                  </div>
                </div>

                {r.comment && (
                  <div style={{ paddingLeft: '52px', fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '17px', color: 'var(--muc)', lineHeight: 1.6, borderLeft: '2px solid var(--dong)', padding: '12px 0 12px 16px', marginLeft: '52px' }}>
                    "{r.comment}"
                  </div>
                )}

                {r.images && r.images.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', paddingLeft: '52px', marginTop: '12px', flexWrap: 'wrap' }}>
                    {r.images.map((img, idx) => (
                      <img key={idx} src={img} alt="review evidence" style={{ width: '80px', height: '80px', objectFit: 'cover', border: '1px solid rgba(15,14,12,0.15)' }} />
                    ))}
                  </div>
                )}

                {(r.ownerReply || r.owner_reply) ? (
                  <div style={{ marginLeft: '52px', marginTop: '14px', padding: '12px 16px', background: 'var(--kem-dam)', borderLeft: '3px solid var(--muc)' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muc-mo)', marginBottom: '4px' }}>
                      Phản hồi của bạn:
                    </div>
                    <div style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '15px', color: 'var(--muc)' }}>
                      "{r.ownerReply || r.owner_reply}"
                    </div>
                  </div>
                ) : (
                  <div style={{ marginLeft: '52px', marginTop: '14px' }}>
                    {replyingId === r.id ? (
                      <div style={{ background: 'var(--kem-dam)', padding: '16px', border: '1px solid rgba(15,14,12,0.2)' }}>
                        <textarea
                          rows={3}
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          placeholder="Viết phản hồi cho khách hàng..."
                          style={{ width: '100%', padding: '10px', fontFamily: 'var(--serif-2)', fontSize: '14px', border: '1px solid rgba(15,14,12,0.2)', background: 'var(--kem)', outline: 'none', resize: 'vertical' }}
                        />
                        {replyError && <div style={{ color: 'var(--do)', fontFamily: 'var(--mono)', fontSize: '11px', marginTop: '6px' }}>{replyError}</div>}
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                          <button
                            onClick={() => handleReplySubmit(r.id)}
                            disabled={replySubmitting || !replyText.trim()}
                            style={{ padding: '6px 16px', background: 'var(--muc)', color: 'var(--kem)', border: 'none', fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer' }}
                          >
                            {replySubmitting ? 'Đang gửi...' : 'Gửi phản hồi'}
                          </button>
                          <button
                            onClick={() => { setReplyingId(null); setReplyText(''); setReplyError(''); }}
                            style={{ padding: '6px 14px', background: 'transparent', border: '1px solid rgba(15,14,12,0.3)', fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer' }}
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setReplyingId(r.id); setReplyText(''); setReplyError(''); }}
                        style={{ padding: '4px 12px', background: 'transparent', border: '1px dashed var(--muc-mo)', color: 'var(--muc)', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer' }}
                      >
                        + Phản hồi đánh giá
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* PHÂN TRANG */}
          {totalPages > 1 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px', flexWrap: 'wrap' }}>
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={paginationBtnStyle(currentPage === 1)}>← Trước</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setCurrentPage(p)} style={paginationNumStyle(currentPage === p)}>{p}</button>
                ))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={paginationBtnStyle(currentPage === totalPages)}>Sau →</button>
              </div>
              <div style={{ textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muc-mo)', marginTop: '16px', marginBottom: '24px' }}>
                Trang {currentPage} / {totalPages} · Tổng {filtered.length} đánh giá
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

function StatCard({ label, value, hint }) {
  return (
    <div style={{ background: 'var(--kem-dam)', border: '1px solid rgba(15,14,12,0.15)', padding: '24px', textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muc-mo)', marginBottom: '12px' }}>{label}</div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: '36px', fontWeight: 900, letterSpacing: '-1px', color: 'var(--do)', marginBottom: '4px' }}>{value}</div>
      <div style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '13px', color: 'var(--muc-mo)' }}>{hint}</div>
    </div>
  )
}

function paginationBtnStyle(disabled) {
  return { padding: '8px 16px', background: 'transparent', border: '1px solid var(--muc)', color: disabled ? 'var(--muc-mo)' : 'var(--muc)', fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1 }
}

function paginationNumStyle(active) {
  return { padding: '8px 14px', background: active ? 'var(--muc)' : 'transparent', color: active ? 'var(--kem)' : 'var(--muc)', border: '1px solid var(--muc)', fontFamily: 'var(--mono)', fontSize: '11px', cursor: 'pointer', minWidth: '40px' }
}