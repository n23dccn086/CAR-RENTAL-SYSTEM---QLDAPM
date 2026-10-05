import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

export default function OwnerBookingsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [assignments, setAssignments] = useState({})
  const [message, setMessage] = useState('')

  // ===== PHÂN TRANG =====
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const res = await api.get('/bookings/owner')
      const data = res.data.data || []
      setBookings(data)

      const assignMap = {}
      for (const b of data) {
        if (b.rentalMode !== 'SELF_DRIVE') {
          try {
            const aRes = await api.get(`/driver/assignments/booking/${b.id}`)
            const list = aRes.data.data || []
            if (list.length > 0) assignMap[b.id] = list[0]
          } catch (e) {}
        }
      }
      setAssignments(assignMap)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBookings() }, [])

  // Reset page khi filter đổi
  useEffect(() => {
    setCurrentPage(1)
  }, [filter])

  const triggerAutoAssign = async (bookingId) => {
    if (!window.confirm(`Gán tài xế tự động cho đơn #${bookingId}?`)) return
    try {
      const res = await api.post(`/driver/assignments/booking/${bookingId}/auto-assign`)
      setMessage(`Đã gán tài xế cho đơn #${bookingId}`)
      fetchBookings()
      setTimeout(() => setMessage(''), 5000)
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message))
    }
  }

  const statusMap = {
    PENDING: { label: 'Chờ thanh toán', color: 'var(--do)' },
    PAID: { label: 'Đã cọc', color: 'var(--dong)' },
    APPROVED: { label: 'Đã duyệt', color: 'var(--xanh-reu)' },
    RENTED: { label: 'Đang thuê', color: 'var(--xanh-ngoc)' },
    RETURNED: { label: 'Đã trả xe', color: 'var(--tim)' },
    COMPLETED: { label: 'Hoàn tất', color: 'var(--muc-mo)' },
    CANCELLED: { label: 'Đã hủy', color: 'var(--do)' },
  }

  const assignmentStatusColors = {
    PENDING: 'var(--dong)', ACCEPTED: 'var(--xanh-reu)',
    REJECTED: 'var(--do)', EXPIRED: 'var(--muc-mo)', CANCELLED: 'var(--muc-mo)',
  }

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN').format(p || 0)
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—'

  const filtered = filter === 'ALL' ? bookings : bookings.filter(b => b.status === filter)

  // ===== TÍNH TOÁN PHÂN TRANG =====
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const currentBookings = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '60px 48px' }}>
      <div className="chapter-num" style={{ marginBottom: '24px' }}>Chương Chủ Xe — Đơn Hàng</div>
      <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900, letterSpacing: '-2px', marginBottom: '40px' }}>
        Đơn <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>của tôi.</em>
      </h1>

      {message && (
        <div style={{ background: 'rgba(74,93,63,0.1)', border: '1px solid var(--xanh-reu)', padding: '12px 16px', marginBottom: '24px', color: 'var(--xanh-reu)', fontFamily: 'var(--serif-2)', fontStyle: 'italic' }}>
          {message}
        </div>
      )}

      {/* FILTER */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '40px', flexWrap: 'wrap' }}>
        {['ALL', 'PENDING', 'PAID', 'APPROVED', 'RENTED', 'RETURNED', 'COMPLETED', 'CANCELLED'].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '8px 16px',
            background: filter === s ? 'var(--muc)' : 'transparent',
            color: filter === s ? 'var(--kem)' : 'var(--muc-mo)',
            border: `1px solid ${filter === s ? 'var(--muc)' : 'rgba(15,14,12,0.2)'}`,
            fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '2px',
            textTransform: 'uppercase', cursor: 'pointer'
          }}>
            {s === 'ALL' ? 'Tất cả' : statusMap[s]?.label || s}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', fontFamily: 'var(--serif-2)', fontStyle: 'italic', padding: '40px' }}>
          Đang tải...
        </p>
      ) : filtered.length === 0 ? (
        <p style={{ textAlign: 'center', fontFamily: 'var(--serif-2)', fontStyle: 'italic', padding: '40px', color: 'var(--muc-mo)' }}>
          Không có đơn nào.
        </p>
      ) : (
        <>
          <div>
            {currentBookings.map(b => {
              const assignment = assignments[b.id]
              const needsDriver = b.rentalMode !== 'SELF_DRIVE' && !b.driverId

              return (
                <div key={b.id} style={{
                  display: 'grid', gridTemplateColumns: '1fr auto auto auto',
                  gap: '24px', alignItems: 'center', padding: '24px 0',
                  borderBottom: '1px solid rgba(15,14,12,0.12)'
                }}>
                  <Link to={`/bookings/${b.id}`} style={{ color: 'inherit' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px', color: 'var(--muc-mo)', marginBottom: '8px' }}>
                      #{b.id}
                    </div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>
                      {b.carName || 'Cỗ xe'} {b.carPlate && `— ${b.carPlate}`}
                    </div>
                    <div style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', color: 'var(--muc-mo)' }}>
                      {formatDate(b.startDate)} → {formatDate(b.endDate)} · Khách: {b.customerName || 'Khách'}
                    </div>
                    {b.rentalMode !== 'SELF_DRIVE' && (
                      <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1px', color: 'var(--dong)', marginTop: '6px' }}>
                        🚙 CÓ TÀI XẾ
                      </div>
                    )}
                  </Link>

                  <div style={{ fontFamily: 'var(--mono)', fontSize: '20px', fontWeight: 500 }}>
                    {formatPrice(b.totalPrice)}đ
                  </div>

                  <div style={{
                    padding: '6px 14px',
                    border: `1px solid ${statusMap[b.status]?.color || 'var(--muc-mo)'}`,
                    color: statusMap[b.status]?.color || 'var(--muc-mo)',
                    fontFamily: 'var(--mono)', fontSize: '10px',
                    letterSpacing: '2px', textTransform: 'uppercase', textAlign: 'center'
                  }}>
                    {statusMap[b.status]?.label || b.status}
                  </div>

                  {needsDriver ? (
                    <button onClick={() => triggerAutoAssign(b.id)} style={{
                      padding: '10px 18px', background: 'transparent',
                      border: '1px solid var(--xanh-reu)', color: 'var(--xanh-reu)',
                      fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '2px',
                      textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap'
                    }}>
                      ⚡ Gán tài xế
                    </button>
                  ) : b.driverId ? (
                    <div style={{
                      padding: '10px 18px',
                      border: `1px solid ${assignmentStatusColors[assignment?.status] || 'var(--muc-mo)'}`,
                      color: assignmentStatusColors[assignment?.status] || 'var(--muc-mo)',
                      fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1px',
                      textTransform: 'uppercase', textAlign: 'center', whiteSpace: 'nowrap'
                    }}>
                      {assignment?.driverName || 'Tài xế'} · {assignment?.status || 'OK'}
                    </div>
                  ) : (
                    <div style={{ width: '120px' }} />
                  )}
                </div>
              )
            })}
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
                Trang {currentPage} / {totalPages} · Tổng {filtered.length} đơn
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

function paginationBtnStyle(disabled) {
  return { padding: '8px 16px', background: 'transparent', border: '1px solid var(--muc)', color: disabled ? 'var(--muc-mo)' : 'var(--muc)', fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1 }
}

function paginationNumStyle(active) {
  return { padding: '8px 14px', background: active ? 'var(--muc)' : 'transparent', color: active ? 'var(--kem)' : 'var(--muc)', border: '1px solid var(--muc)', fontFamily: 'var(--mono)', fontSize: '11px', cursor: 'pointer', minWidth: '40px' }
}