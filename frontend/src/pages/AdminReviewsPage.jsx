import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useDialog } from '../context/DialogContext'

export default function AdminReviewsPage() {
  const { confirm, alert: dialogAlert } = useDialog()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [starFilter, setStarFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [msg, setMsg] = useState('')

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const res = await api.get('/reviews/all')
      setReviews(res.data.data || [])
    } catch (err) {
      console.error(err)
      setReviews([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [starFilter, search])

  const showMessage = (text) => {
    setMsg(text)
    setTimeout(() => setMsg(''), 4000)
  }

  const handleDelete = async (review) => {
    const ok = await confirm({
      title: `Xóa đánh giá #${review.id}`,
      subtitle: 'Quản lý kiểm duyệt',
      message: `Bạn có chắc chắn muốn xóa đánh giá của ${review.reviewerName || review.customerName || 'khách hàng'} cho xe "${review.carName || 'cỗ xe'}"? Hành động này không thể hoàn tác.`,
      confirmText: 'Xác nhận xóa',
      variant: 'danger'
    })
    if (!ok) return

    try {
      await api.delete(`/reviews/${review.id}`)
      showMessage(`Đã xóa đánh giá #${review.id}`)
      setReviews(prev => prev.filter(r => r.id !== review.id))
    } catch (err) {
      dialogAlert({
        title: 'Lỗi xóa đánh giá',
        message: err.response?.data?.message || err.message,
        variant: 'danger'
      })
    }
  }

  // Thống kê
  const total = reviews.length
  const avgCar = total > 0
    ? (reviews.reduce((acc, r) => acc + (r.carRating || r.car_rating || 0), 0) / total).toFixed(1)
    : 0
  const avgOwner = total > 0
    ? (reviews.reduce((acc, r) => acc + (r.ownerRating || r.owner_rating || 0), 0) / total).toFixed(1)
    : 0
  const count5Star = reviews.filter(r => (r.carRating || r.car_rating) === 5).length

  // Filter
  const filtered = reviews.filter(r => {
    const carRating = r.carRating || r.car_rating || 0
    if (starFilter !== 'ALL' && carRating !== Number(starFilter)) return false

    if (search.trim()) {
      const q = search.toLowerCase()
      const car = (r.carName || r.car_name || '').toLowerCase()
      const reviewer = (r.reviewerName || r.customerName || '').toLowerCase()
      const owner = (r.ownerName || r.owner_name || '').toLowerCase()
      const comment = (r.comment || '').toLowerCase()
      return car.includes(q) || reviewer.includes(q) || owner.includes(q) || comment.includes(q)
    }
    return true
  })

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const currentReviews = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const renderStars = (count) => {
    return '★'.repeat(count || 0) + '☆'.repeat(Math.max(0, 5 - (count || 0)))
  }

  const formatDate = (d) => {
    if (!d) return ''
    try {
      return new Date(d).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return d
    }
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '60px 48px' }}>
      <div className="chapter-num" style={{ marginBottom: '24px' }}>
        Chương Quản Trị — Đánh Giá
      </div>

      <h1 style={{
        fontFamily: 'var(--serif)',
        fontSize: 'clamp(36px, 5vw, 56px)',
        fontWeight: 900,
        letterSpacing: '-2px',
        marginBottom: '40px'
      }}>
        Toàn bộ <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>đánh giá.</em>
      </h1>

      {msg && (
        <div style={{
          background: 'rgba(74,93,63,0.1)',
          border: '1px solid var(--xanh-reu)',
          padding: '12px 16px',
          marginBottom: '24px',
          color: 'var(--xanh-reu)',
          fontFamily: 'var(--serif-2)',
          fontStyle: 'italic'
        }}>
          {msg}
        </div>
      )}

      {/* Thống kê cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px',
        marginBottom: '40px'
      }}>
        <div style={{ background: 'var(--kem)', border: '1px solid rgba(15,14,12,0.15)', padding: '24px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muc-mo)', marginBottom: '8px' }}>
            Tổng số đánh giá
          </div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '36px', fontWeight: 900 }}>
            {total}
          </div>
        </div>
        <div style={{ background: 'var(--kem)', border: '1px solid rgba(15,14,12,0.15)', padding: '24px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muc-mo)', marginBottom: '8px' }}>
            CSAT Cỗ xe (TB)
          </div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '36px', fontWeight: 900, color: 'var(--dong)' }}>
            {avgCar}★
          </div>
        </div>
        <div style={{ background: 'var(--kem)', border: '1px solid rgba(15,14,12,0.15)', padding: '24px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muc-mo)', marginBottom: '8px' }}>
            CSAT Chủ xe (TB)
          </div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '36px', fontWeight: 900, color: 'var(--dong)' }}>
            {avgOwner}★
          </div>
        </div>
        <div style={{ background: 'var(--kem)', border: '1px solid rgba(15,14,12,0.15)', padding: '24px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muc-mo)', marginBottom: '8px' }}>
            Đánh giá tuyệt hảo (5★)
          </div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '36px', fontWeight: 900, color: 'var(--xanh-reu)' }}>
            {count5Star}
          </div>
        </div>
      </div>

      {/* Bộ lọc & Tìm kiếm */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['ALL', '5', '4', '3', '2', '1'].map(st => (
            <button
              key={st}
              onClick={() => setStarFilter(st)}
              style={{
                padding: '8px 16px',
                background: starFilter === st ? 'var(--muc)' : 'transparent',
                color: starFilter === st ? 'var(--kem)' : 'var(--muc)',
                border: `1px solid ${starFilter === st ? 'var(--muc)' : 'rgba(15,14,12,0.2)'}`,
                fontFamily: 'var(--mono)',
                fontSize: '11px',
                letterSpacing: '1px',
                cursor: 'pointer'
              }}
            >
              {st === 'ALL' ? 'Tất cả sao' : `${st}★`}
            </button>
          ))}
        </div>

        <div>
          <input
            type="text"
            placeholder="Tìm theo xe, khách hàng, nội dung..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '10px 16px',
              border: '1px solid rgba(15,14,12,0.2)',
              background: 'var(--kem)',
              fontFamily: 'var(--serif-2)',
              fontSize: '14px',
              minWidth: '320px',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Danh sách đánh giá */}
      {loading ? (
        <p style={{ textAlign: 'center', fontFamily: 'var(--serif-2)', fontStyle: 'italic', padding: '60px' }}>
          Đang tải dữ liệu đánh giá...
        </p>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px',
          background: 'var(--kem)',
          border: '1px dashed rgba(15,14,12,0.2)'
        }}>
          <p style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', color: 'var(--muc-mo)' }}>
            Không tìm thấy đánh giá nào phù hợp.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {currentReviews.map(r => {
            const carRating = r.carRating || r.car_rating || 0
            const ownerRating = r.ownerRating || r.owner_rating || 0
            const driverRating = r.driverRating || r.driver_rating || null
            const carName = r.carName || r.car_name || `Xe #${r.carId || r.car_id}`
            const reviewerName = r.reviewerName || r.customerName || (r.isAnonymous ? 'Khách ẩn danh' : 'Khách hàng')
            const ownerName = r.ownerName || r.owner_name || (r.ownerId ? `Chủ xe #${r.ownerId}` : '—')

            return (
              <div
                key={r.id}
                style={{
                  background: 'var(--kem)',
                  border: '1px solid rgba(15,14,12,0.12)',
                  padding: '24px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  boxShadow: '0 2px 8px rgba(15,14,12,0.03)'
                }}
              >
                {/* Header card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                      <span style={{ fontFamily: 'var(--serif)', fontSize: '18px', fontWeight: 700 }}>
                        {reviewerName}
                      </span>
                      {r.isAnonymous && (
                        <span style={{
                          fontFamily: 'var(--mono)',
                          fontSize: '10px',
                          padding: '2px 6px',
                          background: 'rgba(15,14,12,0.08)',
                          color: 'var(--muc-mo)'
                        }}>
                          Ẩn danh
                        </span>
                      )}
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muc-mo)' }}>
                        · {formatDate(r.createdAt || r.created_at)}
                      </span>
                    </div>

                    <div style={{ fontFamily: 'var(--serif-2)', fontSize: '14px', color: 'var(--muc-mo)' }}>
                      Cỗ xe: {' '}
                      {r.carId ? (
                        <Link to={`/cars/${r.carId}`} style={{ color: 'var(--muc)', fontWeight: 600, textDecoration: 'underline' }}>
                          {carName}
                        </Link>
                      ) : (
                        <strong style={{ color: 'var(--muc)' }}>{carName}</strong>
                      )}
                      {' · '}Chủ xe: <strong style={{ color: 'var(--muc)' }}>{ownerName}</strong>
                      {r.bookingId && (
                        <>
                          {' · '}Đơn: {' '}
                          <Link to={`/bookings/${r.bookingId}`} style={{ color: 'var(--do)', textDecoration: 'underline' }}>
                            #{r.bookingId}
                          </Link>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      onClick={() => handleDelete(r)}
                      style={{
                        padding: '6px 14px',
                        background: 'transparent',
                        border: '1px solid var(--do)',
                        color: 'var(--do)',
                        fontFamily: 'var(--mono)',
                        fontSize: '10px',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        cursor: 'pointer'
                      }}
                    >
                      Xóa đánh giá
                    </button>
                  </div>
                </div>

                {/* Rating badges */}
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muc-mo)' }}>
                      Cỗ xe:
                    </span>
                    <span style={{ color: 'var(--dong)', fontSize: '16px', letterSpacing: '2px' }}>
                      {renderStars(carRating)}
                    </span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', fontWeight: 700 }}>
                      {carRating}/5
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muc-mo)' }}>
                      Chủ xe:
                    </span>
                    <span style={{ color: 'var(--dong)', fontSize: '16px', letterSpacing: '2px' }}>
                      {renderStars(ownerRating)}
                    </span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', fontWeight: 700 }}>
                      {ownerRating}/5
                    </span>
                  </div>

                  {driverRating && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muc-mo)' }}>
                        Tài xế:
                      </span>
                      <span style={{ color: 'var(--dong)', fontSize: '16px', letterSpacing: '2px' }}>
                        {renderStars(driverRating)}
                      </span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', fontWeight: 700 }}>
                        {driverRating}/5
                      </span>
                    </div>
                  )}
                </div>

                {/* Comment */}
                {r.comment && (
                  <div style={{
                    fontFamily: 'var(--serif-2)',
                    fontSize: '15px',
                    lineHeight: 1.6,
                    color: 'var(--muc)',
                    background: 'rgba(15,14,12,0.03)',
                    padding: '12px 16px',
                    borderLeft: '3px solid var(--dong)'
                  }}>
                    "{r.comment}"
                  </div>
                )}

                {/* Images */}
                {r.images && r.images.length > 0 && (
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {r.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt="Ảnh review"
                        style={{
                          width: '80px',
                          height: '80px',
                          objectFit: 'cover',
                          border: '1px solid rgba(15,14,12,0.1)'
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Owner Reply */}
                {(r.ownerReply || r.owner_reply) && (
                  <div style={{
                    marginTop: '4px',
                    padding: '12px 16px',
                    background: 'rgba(74,93,63,0.06)',
                    borderLeft: '3px solid var(--xanh-reu)',
                    fontFamily: 'var(--serif-2)',
                    fontSize: '14px',
                    color: 'var(--xanh-reu)',
                    fontStyle: 'italic'
                  }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px', fontStyle: 'normal', fontWeight: 700 }}>
                      Phản hồi từ chủ xe {r.repliedAt || r.replied_at ? `(${formatDate(r.repliedAt || r.replied_at)})` : ''}:
                    </div>
                    "{r.ownerReply || r.owner_reply}"
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Phân trang */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '40px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid rgba(15,14,12,0.2)',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage === 1 ? 0.4 : 1,
              fontFamily: 'var(--mono)',
              fontSize: '11px'
            }}
          >
            ← Trước
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setCurrentPage(p)}
              style={{
                padding: '8px 14px',
                background: currentPage === p ? 'var(--muc)' : 'transparent',
                color: currentPage === p ? 'var(--kem)' : 'var(--muc)',
                border: '1px solid rgba(15,14,12,0.2)',
                cursor: 'pointer',
                fontFamily: 'var(--mono)',
                fontSize: '11px',
                fontWeight: currentPage === p ? 700 : 400
              }}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid rgba(15,14,12,0.2)',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage === totalPages ? 0.4 : 1,
              fontFamily: 'var(--mono)',
              fontSize: '11px'
            }}
          >
            Sau →
          </button>
        </div>
      )}
    </div>
  )
}
