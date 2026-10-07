import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import HandoverFormModal from '../components/HandoverFormModal'

export default function OwnerBookingsPage() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [assignments, setAssignments] = useState({})
  const [handovers, setHandovers] = useState({})
  const [message, setMessage] = useState('')

  const [handoverModal, setHandoverModal] = useState({
    open: false,
    booking: null,
    type: null,
  })

  const [cancelModal, setCancelModal] = useState(false)
  const [cancellingBooking, setCancellingBooking] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelSubmitting, setCancelSubmitting] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const res = await api.get('/bookings/owner')
      const data = res.data.data || []
      setBookings(data)

      const assignMap = {}
      const handoverMap = {}

      for (const b of data) {
        // Chỉ fetch assignment khi có driverId (khách đã chọn tài xế)
        if (b.driverId) {
          try {
            const aRes = await api.get(`/driver/assignments/booking/${b.id}`)
            const list = aRes.data.data || []
            if (list.length > 0) assignMap[b.id] = list[0]
          } catch (e) {}
        }

        try {
          const hRes = await api.get(`/handovers/booking/${b.id}`)
          const handoversList = hRes.data.data || []
          handoverMap[b.id] = {}
          handoversList.forEach(h => {
            handoverMap[b.id][h.handoverType] = h
          })
        } catch (e) {
          handoverMap[b.id] = {}
        }
      }

      setAssignments(assignMap)
      setHandovers(handoverMap)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBookings() }, [])
  useEffect(() => { setCurrentPage(1) }, [filter])

  const openHandoverModal = (booking, type) => {
    setHandoverModal({ open: true, booking, type })
  }

  const handleHandoverSuccess = () => {
    setMessage('Đã tạo biên bản thành công!')
    fetchBookings()
    setTimeout(() => setMessage(''), 5000)
  }

  const viewHandover = (handoverId) => {
    navigate(`/handover/${handoverId}`)
  }

  const openCancelModal = (booking) => {
    setCancellingBooking(booking)
    setCancelReason('')
    setCancelModal(true)
  }

  const handleOwnerCancel = async () => {
    if (!cancelReason.trim()) {
      alert('Vui lòng nhập lý do hủy và lời xin lỗi khách')
      return
    }
    setCancelSubmitting(true)
    try {
      await api.put(`/bookings/${cancellingBooking.id}/reject?reason=${encodeURIComponent(cancelReason.trim())}`)
      setMessage(`Đã hủy đơn #${cancellingBooking.id}. Hoàn 100% cọc cho khách.`)
      setCancelModal(false)
      fetchBookings()
      setTimeout(() => setMessage(''), 5000)
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message))
    } finally {
      setCancelSubmitting(false)
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
    PENDING: 'var(--dong)',
    ACCEPTED: 'var(--xanh-reu)',
    REJECTED: 'var(--do)',
    EXPIRED: 'var(--muc-mo)',
    CANCELLED: 'var(--muc-mo)',
  }

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN').format(p || 0)
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—'

  const filtered = filter === 'ALL' ? bookings : bookings.filter(b => b.status === filter)
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

              const bookingHandovers = handovers[b.id] || {}
              const pickupHandover = bookingHandovers.PICKUP
              const returnHandover = bookingHandovers.RETURN

              const canCreatePickup = b.status === 'APPROVED' && !pickupHandover
              const canCreateReturn = b.status === 'RENTED' && !returnHandover
              const canCancel = ['PENDING', 'PAID', 'APPROVED'].includes(b.status)

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

                    {b.totalExtraFees > 0 && (
                      <div style={{
                        marginTop: '8px', padding: '8px 12px',
                        background: 'rgba(139,44,44,0.08)',
                        borderLeft: '3px solid var(--do)',
                        fontFamily: 'var(--mono)', fontSize: '11px',
                        letterSpacing: '1px', color: 'var(--do)',
                      }}>
                        ⚠️ Phí phát sinh: {formatPrice(b.totalExtraFees)}đ
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

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {canCreatePickup && (
                      <button onClick={() => openHandoverModal(b, 'PICKUP')} style={{
                        padding: '10px 18px', background: 'var(--do)',
                        border: '1px solid var(--do)', color: 'var(--kem)',
                        fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1.5px',
                        textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap'
                      }}>
                        📝 Tạo biên bản giao xe
                      </button>
                    )}

                    {canCreateReturn && (
                      <button onClick={() => openHandoverModal(b, 'RETURN')} style={{
                        padding: '10px 18px', background: 'var(--do)',
                        border: '1px solid var(--do)', color: 'var(--kem)',
                        fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1.5px',
                        textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap'
                      }}>
                        📝 Tạo biên bản nhận xe
                      </button>
                    )}

                    {pickupHandover && (
                      <button onClick={() => viewHandover(pickupHandover.id)} style={{
                        padding: '10px 18px', background: 'transparent',
                        border: '1px solid var(--muc)', color: 'var(--muc)',
                        fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1.5px',
                        textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap'
                      }}>
                        👁 Biên bản giao xe
                      </button>
                    )}

                    {returnHandover && (
                      <button onClick={() => viewHandover(returnHandover.id)} style={{
                        padding: '10px 18px', background: 'transparent',
                        border: '1px solid var(--muc)', color: 'var(--muc)',
                        fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1.5px',
                        textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap'
                      }}>
                        👁 Biên bản nhận xe
                      </button>
                    )}

                    {/* Badge hiển thị tài xế mà Khách đã chọn */}
                    {b.driverId && (
                      <div style={{
                        padding: '10px 18px',
                        border: `1px solid ${assignmentStatusColors[assignment?.status] || 'var(--muc-mo)'}`,
                        color: assignmentStatusColors[assignment?.status] || 'var(--muc-mo)',
                        fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1px',
                        textTransform: 'uppercase', textAlign: 'center', whiteSpace: 'nowrap'
                      }}>
                        {assignment?.driverName || 'Tài xế'} · {assignment?.status || 'Chờ xác nhận'}
                      </div>
                    )}

                    {canCancel && (
                      <button onClick={() => openCancelModal(b)} style={{
                        padding: '10px 18px', background: 'transparent',
                        border: '1px solid var(--do)', color: 'var(--do)',
                        fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1.5px',
                        textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap'
                      }}>
                        ✕ Hủy đơn
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

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

      <HandoverFormModal
        open={handoverModal.open}
        booking={handoverModal.booking}
        handoverType={handoverModal.type}
        onClose={() => setHandoverModal({ open: false, booking: null, type: null })}
        onSuccess={handleHandoverSuccess}
      />

      {cancelModal && cancellingBooking && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,14,12,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }} onClick={() => setCancelModal(false)}>
          <div style={{
            background: 'var(--kem)', border: '1px solid var(--muc)',
            maxWidth: '520px', width: '100%', padding: '48px', position: 'relative'
          }} onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => setCancelModal(false)} style={{
              position: 'absolute', top: '16px', right: '16px',
              width: '40px', height: '40px', background: 'transparent',
              border: '1px solid var(--muc)', color: 'var(--muc)',
              fontFamily: 'var(--mono)', fontSize: '18px', cursor: 'pointer'
            }}>✕</button>

            <h2 style={{
              fontFamily: 'var(--serif)', fontSize: '28px', fontWeight: 900,
              marginBottom: '8px', paddingRight: '48px'
            }}>Hủy đơn hàng.</h2>
            <p style={{
              fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px',
              color: 'var(--muc-mo)', marginBottom: '24px'
            }}>
              Đơn #{cancellingBooking.id} · {cancellingBooking.carName}
            </p>

            <div style={{
              padding: '16px 20px', background: 'rgba(139,44,44,0.1)',
              border: '1px solid var(--do)', borderLeft: '4px solid var(--do)',
              marginBottom: '24px'
            }}>
              <div style={{
                fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '2px',
                color: 'var(--do)', marginBottom: '8px'
              }}>
                ⚠️ LƯU Ý QUAN TRỌNG
              </div>
              <div style={{
                fontFamily: 'var(--serif-2)', fontStyle: 'italic',
                fontSize: '15px', lineHeight: 1.6
              }}>
                Khi bạn hủy đơn này, hệ thống sẽ <strong>hoàn 100% tiền cọc</strong> lại cho khách
                ({new Intl.NumberFormat('vi-VN').format(cancellingBooking.depositAmount || 0)}đ).
                <br /><br />
                Hãy nhập lý do hủy và lời xin lỗi để gửi đến khách hàng.
              </div>
            </div>

            <label style={{
              display: 'block', fontFamily: 'var(--mono)', fontSize: '10px',
              letterSpacing: '3px', textTransform: 'uppercase',
              color: 'var(--muc-mo)', marginBottom: '8px'
            }}>
              Lý do hủy + Lời xin lỗi *
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={5}
              maxLength={500}
              placeholder="VD: Xin lỗi quý khách, xe của tôi gặp sự cố đột xuất..."
              style={{
                width: '100%', padding: '14px', background: 'var(--kem-dam)',
                border: '1px solid rgba(15,14,12,0.2)',
                fontFamily: 'var(--serif-2)', fontSize: '15px',
                resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                minHeight: '120px'
              }}
            />
            <div style={{
              textAlign: 'right', fontFamily: 'var(--mono)', fontSize: '10px',
              color: 'var(--muc-mo)', marginTop: '4px'
            }}>
              {cancelReason.length}/500
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button type="button" onClick={() => setCancelModal(false)} style={{
                flex: 1, padding: '16px', background: 'transparent',
                border: '1px solid var(--muc)', color: 'var(--muc)',
                fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px',
                textTransform: 'uppercase', cursor: 'pointer'
              }}>Đóng</button>
              <button type="button" onClick={handleOwnerCancel} disabled={cancelSubmitting} style={{
                flex: 2, padding: '16px', background: 'var(--do)',
                border: 'none', color: 'var(--kem)',
                fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px',
                textTransform: 'uppercase',
                cursor: cancelSubmitting ? 'wait' : 'pointer'
              }}>
                {cancelSubmitting ? 'Đang xử lý...' : 'Xác nhận hủy + Hoàn 100%'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function paginationBtnStyle(disabled) {
  return {
    padding: '8px 16px', background: 'transparent',
    border: '1px solid var(--muc)',
    color: disabled ? 'var(--muc-mo)' : 'var(--muc)',
    fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px',
    textTransform: 'uppercase',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1
  }
}

function paginationNumStyle(active) {
  return {
    padding: '8px 14px',
    background: active ? 'var(--muc)' : 'transparent',
    color: active ? 'var(--kem)' : 'var(--muc)',
    border: '1px solid var(--muc)',
    fontFamily: 'var(--mono)', fontSize: '11px',
    cursor: 'pointer', minWidth: '40px'
  }
}