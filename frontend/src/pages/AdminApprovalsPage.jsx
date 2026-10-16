import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import api from '../services/api'

export default function AdminApprovalsPage() {
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('PENDING')
  const [message, setMessage] = useState('')

  const [detailModal, setDetailModal] = useState(false)
  const [selectedCar, setSelectedCar] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  // Approve modal
  const [approveModal, setApproveModal] = useState(false)
  const [approvingCar, setApprovingCar] = useState(null)
  const [approveSubmitting, setApproveSubmitting] = useState(false)
  const [approveError, setApproveError] = useState('')

  // Reject modal
  const [rejectModal, setRejectModal] = useState(false)
  const [rejectingCar, setRejectingCar] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectSubmitting, setRejectSubmitting] = useState(false)
  const [rejectError, setRejectError] = useState('')

  const fetchCars = async () => {
    setLoading(true)
    try {
      const res = await api.get('/cars?status=ALL')
      setCars(res.data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCars()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [filter])

  const openDetail = async (car) => {
    setSelectedCar(car)
    setDetailModal(true)
    setDetailLoading(true)

    try {
      const res = await api.get(`/cars/${car.id}`)
      setSelectedCar(res.data.data || car)
    } catch (err) {
      console.error('Failed to load car detail:', err)
    } finally {
      setDetailLoading(false)
    }
  }

  const closeDetail = () => {
    setDetailModal(false)
    setSelectedCar(null)
  }

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && detailModal) closeDetail()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [detailModal])

  const openApproveModal = (car) => {
    setApprovingCar(car)
    setApproveError('')
    setApproveModal(true)
  }

  const handleApproveSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!approvingCar) return
    setApproveSubmitting(true)
    try {
      await api.put(`/cars/${approvingCar.id}/approve`)
      setMessage(`Đã duyệt xe ${approvingCar.plate}`)
      setApproveModal(false)
      setApprovingCar(null)
      closeDetail()
      fetchCars()
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setApproveError(err.response?.data?.message || err.message)
    } finally {
      setApproveSubmitting(false)
    }
  }

  const openRejectModal = (car) => {
    setRejectingCar(car)
    setRejectReason('')
    setRejectError('')
    setRejectModal(true)
  }

  const handleRejectSubmit = async (e) => {
    e.preventDefault()
    if (!rejectReason.trim()) {
      setRejectError('Vui lòng nhập lý do từ chối')
      return
    }
    setRejectSubmitting(true)
    try {
      await api.put(`/cars/${rejectingCar.id}/reject?reason=${encodeURIComponent(rejectReason.trim())}`)
      setMessage(`Đã từ chối xe ${rejectingCar.plate}`)
      setRejectModal(false)
      closeDetail()
      fetchCars()
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setRejectError(err.response?.data?.message || err.message)
    } finally {
      setRejectSubmitting(false)
    }
  }

  const statusMap = {
    PENDING: { label: 'Chờ duyệt', color: 'var(--dong)' },
    APPROVED: { label: 'Đã duyệt', color: 'var(--xanh-reu)' },
    AVAILABLE: { label: 'Sẵn sàng', color: 'var(--xanh-reu)' },
    RENTED: { label: 'Đang thuê', color: 'var(--xanh-ngoc)' },
    MAINTENANCE: { label: 'Bảo dưỡng', color: 'var(--tim)' },
    BROKEN: { label: 'Bị hỏng', color: 'var(--do)' },
    INACTIVE: { label: 'Ngừng HĐ', color: 'var(--muc-mo)' },
    REJECTED: { label: 'Bị từ chối', color: 'var(--do)' },
  }

  const filterOptions = [
    { v: 'ALL', l: 'Tất cả' },
    { v: 'PENDING', l: 'Chờ duyệt' },
    { v: 'AVAILABLE', l: 'Đã duyệt' },
    { v: 'REJECTED', l: 'Từ chối' },
  ]

  const filtered = filter === 'ALL' ? cars : cars.filter(c => c.status === filter)
  const formatPrice = (p) => new Intl.NumberFormat('vi-VN').format(p || 0)
  const pendingCount = cars.filter(c => c.status === 'PENDING').length

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const currentCars = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '60px 48px' }}>
      <div className="chapter-num" style={{ marginBottom: '24px' }}>Chương Quản Trị — Duyệt Xe</div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900, letterSpacing: '-2px', margin: 0 }}>
            Cỗ xe <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>chờ duyệt.</em>
          </h1>
          {pendingCount > 0 && (
            <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px', color: 'var(--do)', marginTop: '12px' }}>
              {pendingCount} XE ĐANG CHỜ
            </div>
          )}
        </div>
      </div>

      {message && (
        <div style={{ background: 'rgba(74,93,63,0.1)', border: '1px solid var(--xanh-reu)', padding: '12px 16px', marginBottom: '24px', color: 'var(--xanh-reu)', fontFamily: 'var(--serif-2)', fontStyle: 'italic' }}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', marginBottom: '40px', flexWrap: 'wrap' }}>
        {filterOptions.map(opt => (
          <button key={opt.v} onClick={() => setFilter(opt.v)} style={{
            padding: '8px 16px',
            background: filter === opt.v ? 'var(--muc)' : 'transparent',
            color: filter === opt.v ? 'var(--kem)' : 'var(--muc-mo)',
            border: `1px solid ${filter === opt.v ? 'var(--muc)' : 'rgba(15,14,12,0.2)'}`,
            fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '2px',
            textTransform: 'uppercase', cursor: 'pointer'
          }}>
            {opt.l}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', fontFamily: 'var(--serif-2)', fontStyle: 'italic', padding: '40px' }}>Đang tải...</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <p style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '24px', color: 'var(--muc-mo)' }}>Không có xe nào.</p>
        </div>
      ) : (
        <>
          <div>
            {currentCars.map(car => (
              <div
                key={car.id}
                onClick={() => openDetail(car)}
                style={{
                  display: 'grid', gridTemplateColumns: '80px 1fr auto auto',
                  gap: '24px', alignItems: 'center', padding: '24px 0',
                  borderBottom: '1px solid rgba(15,14,12,0.12)',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(15,14,12,0.03)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: '80px', height: '60px', background: 'var(--kem-dam)', border: '1px solid rgba(15,14,12,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>
                  {car.imageUrls && car.imageUrls.length > 0 ? (
                    <img src={car.imageUrls[0]} alt={car.plate} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : ('🚗')}
                </div>

                <div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>
                    {car.brand} {car.model} — {car.year}
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '1px', color: 'var(--muc-mo)', marginBottom: '6px' }}>
                    {car.plate} · {car.seats} chỗ · {car.transmission === 'AUTOMATIC' ? 'Tự động' : 'Số sàn'}
                  </div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: '16px', fontWeight: 700, color: 'var(--do)' }}>
                    {formatPrice(car.pricePerDay)}đ<span style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 400, color: 'var(--muc-mo)', marginLeft: '4px' }}>/ngày</span>
                  </div>
                </div>

                <div style={{
                  padding: '6px 14px',
                  border: `1px solid ${statusMap[car.status]?.color || 'var(--muc-mo)'}`,
                  color: statusMap[car.status]?.color || 'var(--muc-mo)',
                  fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '2px',
                  textTransform: 'uppercase', whiteSpace: 'nowrap'
                }}>
                  {statusMap[car.status]?.label || car.status}
                </div>

                <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                  {car.status === 'PENDING' ? (
                    <>
                      <button onClick={() => openApproveModal(car)} style={{ padding: '8px 16px', background: 'var(--xanh-reu)', border: '1px solid var(--xanh-reu)', color: 'var(--kem)', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap' }}>✓ Duyệt</button>
                      <button onClick={() => openRejectModal(car)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--do)', color: 'var(--do)', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap' }}>✕ Từ chối</button>
                    </>
                  ) : (
                    <div style={{ width: '180px' }} />
                  )}
                </div>
              </div>
            ))}
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
                Trang {currentPage} / {totalPages} · Tổng {filtered.length} xe
              </div>
            </>
          )}
        </>
      )}

      {detailModal && selectedCar && (
        <CarDetailModal
          car={selectedCar}
          loading={detailLoading}
          onClose={closeDetail}
          onApprove={openApproveModal}
          onReject={openRejectModal}
        />
      )}

      {/* ===== MODAL TỪ CHỐI XE ===== */}
      {rejectModal && rejectingCar && createPortal(
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,14,12,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100000, padding: '20px'
        }} onClick={() => setRejectModal(false)}>
          <div style={{
            background: 'var(--kem)', border: '1px solid var(--muc)',
            maxWidth: '520px', width: '100%', padding: '40px', position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setRejectModal(false)} style={{
              position: 'absolute', top: '16px', right: '16px',
              width: '36px', height: '36px', background: 'transparent',
              border: '1px solid var(--muc)', color: 'var(--muc)',
              fontFamily: 'var(--mono)', fontSize: '16px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>✕</button>

            <h2 style={{
              fontFamily: 'var(--serif)', fontSize: '28px', fontWeight: 900,
              marginBottom: '8px', paddingRight: '40px'
            }}>
              Từ chối cỗ xe.
            </h2>
            <p style={{
              fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px',
              color: 'var(--muc-mo)', marginBottom: '24px'
            }}>
              {rejectingCar.brand} {rejectingCar.model} · {rejectingCar.plate}
            </p>

            {rejectError && (
              <div style={{
                background: 'rgba(139,44,44,0.1)', border: '1px solid var(--do)',
                padding: '12px 16px', marginBottom: '20px',
                color: 'var(--do)', fontFamily: 'var(--serif-2)', fontStyle: 'italic'
              }}>
                {rejectError}
              </div>
            )}

            <form onSubmit={handleRejectSubmit}>
              <label style={{
                display: 'block', fontFamily: 'var(--mono)', fontSize: '10px',
                letterSpacing: '3px', textTransform: 'uppercase',
                color: 'var(--muc-mo)', marginBottom: '8px'
              }}>
                Lý do từ chối *
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                maxLength={500}
                placeholder="Nhập lý do chi tiết để chủ xe chỉnh sửa bổ sung..."
                required
                style={{
                  width: '100%', padding: '14px', background: 'var(--kem-dam)',
                  border: '1px solid rgba(15,14,12,0.2)', fontFamily: 'var(--serif-2)',
                  fontSize: '15px', resize: 'vertical', marginBottom: '24px', boxSizing: 'border-box'
                }}
              />

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setRejectModal(false)}
                  style={{
                    padding: '12px 20px', background: 'transparent',
                    border: '1px solid var(--muc)', color: 'var(--muc)',
                    fontFamily: 'var(--mono)', fontSize: '10px',
                    letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={rejectSubmitting}
                  style={{
                    padding: '12px 24px', background: 'var(--do)',
                    border: '1px solid var(--do)', color: 'var(--kem)',
                    fontFamily: 'var(--mono)', fontSize: '10px',
                    letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer'
                  }}
                >
                  {rejectSubmitting ? 'Đang gửi...' : 'Xác nhận từ chối'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.getElementById('modal-root') || document.body
      )}

      {/* ===== MODAL DUYỆT XE ===== */}
      {approveModal && approvingCar && createPortal(
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,14,12,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100000, padding: '20px'
        }} onClick={() => setApproveModal(false)}>
          <div style={{
            background: 'var(--kem)', border: '1px solid var(--muc)',
            maxWidth: '500px', width: '100%', padding: '40px', position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setApproveModal(false)} style={{
              position: 'absolute', top: '16px', right: '16px',
              width: '36px', height: '36px', background: 'transparent',
              border: '1px solid var(--muc)', color: 'var(--muc)',
              fontFamily: 'var(--mono)', fontSize: '16px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>✕</button>

            <h2 style={{
              fontFamily: 'var(--serif)', fontSize: '28px', fontWeight: 900,
              marginBottom: '8px', color: 'var(--xanh-reu)'
            }}>
              Phê duyệt cỗ xe.
            </h2>
            <p style={{
              fontFamily: 'var(--mono)', fontSize: '12px', letterSpacing: '2px',
              color: 'var(--muc-mo)', marginBottom: '20px'
            }}>
              {approvingCar.brand} {approvingCar.model} · {approvingCar.plate}
            </p>

            <p style={{ fontFamily: 'var(--serif-2)', fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
              Xác nhận duyệt cỗ xe này? Xe sẽ chuyển sang trạng thái <strong>Sẵn sàng (AVAILABLE)</strong> và hiển thị công khai trên bộ sưu tập để khách hàng có thể đặt chuyến.
            </p>

            {approveError && (
              <div style={{
                background: 'rgba(139,44,44,0.1)', border: '1px solid var(--do)',
                padding: '12px 16px', marginBottom: '20px',
                color: 'var(--do)', fontFamily: 'var(--serif-2)', fontStyle: 'italic'
              }}>
                {approveError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setApproveModal(false)}
                style={{
                  padding: '12px 20px', background: 'transparent',
                  border: '1px solid var(--muc)', color: 'var(--muc)',
                  fontFamily: 'var(--mono)', fontSize: '10px',
                  letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleApproveSubmit}
                disabled={approveSubmitting}
                style={{
                  padding: '12px 24px', background: 'var(--xanh-reu)',
                  border: '1px solid var(--xanh-reu)', color: 'var(--kem)',
                  fontFamily: 'var(--mono)', fontSize: '10px',
                  letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer'
                }}
              >
                {approveSubmitting ? 'Đang duyệt...' : '✓ Xác nhận duyệt'}
              </button>
            </div>
          </div>
        </div>,
        document.getElementById('modal-root') || document.body
      )}
    </div>
  )
}

// ============================================================
// MODAL CHI TIẾT XE — ADMIN
// ============================================================
function CarDetailModal({ car, loading, onClose, onApprove, onReject }) {
  const formatPrice = (p) => new Intl.NumberFormat("vi-VN").format(p || 0);
  const [activeImage, setActiveImage] = useState(0);

  const formatDateTime = (d) =>
    d
      ? new Date(d).toLocaleString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const statusMap = {
    PENDING: { label: "Chờ duyệt", color: "var(--dong)" },
    APPROVED: { label: "Đã duyệt", color: "var(--xanh-reu)" },
    AVAILABLE: { label: "Sẵn sàng", color: "var(--xanh-reu)" },
    RENTED: { label: "Đang thuê", color: "var(--xanh-ngoc)" },
    MAINTENANCE: { label: "Bảo dưỡng", color: "var(--tim)" },
    BROKEN: { label: "Bị hỏng", color: "var(--do)" },
    INACTIVE: { label: "Ngừng HĐ", color: "var(--muc-mo)" },
    REJECTED: { label: "Bị từ chối", color: "var(--do)" },
  };

  const images = car.imageUrls || [];
  const st = statusMap[car.status] || {
    label: car.status,
    color: "var(--muc-mo)",
  };

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,14,12,0.75)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        zIndex: 99999,
        padding: "20px",
        paddingTop: "80px",
        paddingBottom: "40px",
        overflowY: "auto",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--kem)",
          border: "1px solid var(--muc)",
          maxWidth: "900px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "48px",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            width: "40px",
            height: "40px",
            background: "transparent",
            border: "1px solid var(--muc)",
            color: "var(--muc)",
            fontFamily: "var(--mono)",
            fontSize: "18px",
            cursor: "pointer",
          }}
        >
          ✕
        </button>

        <div style={{ paddingRight: "56px", marginBottom: "24px" }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: "10px", letterSpacing: "3px", textTransform: "uppercase", color: "var(--muc-mo)", marginBottom: "8px" }}>
            Chi tiết xe #{car.id}
          </div>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 900, letterSpacing: "-1px", margin: 0, marginBottom: "8px" }}>
            {car.brand} {car.model} — {car.year}
          </h2>
          <div style={{ fontFamily: "var(--mono)", fontSize: "12px", letterSpacing: "1px", color: "var(--muc-mo)" }}>
            {car.plate}
          </div>
        </div>

        <div style={{ display: "inline-block", padding: "6px 16px", marginBottom: "24px", border: `1px solid ${st.color}`, color: st.color, fontFamily: "var(--mono)", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase" }}>
          {st.label}
        </div>

        {car.status === "REJECTED" && car.description && car.description.includes("[REJECT]") && (
          <div style={{ background: "rgba(139,44,44,0.08)", border: "1px solid var(--do)", padding: "16px", marginBottom: "24px", fontFamily: "var(--serif-2)", fontStyle: "italic", fontSize: "14px", color: "var(--do)" }}>
            ⚠️ <strong>Lý do từ chối:</strong>{" "}
            {car.description.split("[REJECT]").pop().trim()}
          </div>
        )}

        {images.length > 0 ? (
          <div style={{ marginBottom: "32px" }}>
            <div style={{ width: "100%", aspectRatio: "16/9", background: "var(--kem-dam)", border: "1px solid rgba(15,14,12,0.15)", overflow: "hidden", marginBottom: "8px" }}>
              <img src={images[activeImage]} alt={car.plate} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            {images.length > 1 && (
              <div style={{ display: "flex", gap: "8px", overflowX: "auto" }}>
                {images.map((url, i) => (
                  <div key={i} onClick={() => setActiveImage(i)} style={{ width: "80px", height: "60px", flexShrink: 0, cursor: "pointer", border: activeImage === i ? "2px solid var(--do)" : "1px solid rgba(15,14,12,0.15)", overflow: "hidden" }}>
                    <img src={url} alt={`${car.plate}-${i}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ width: "100%", height: "200px", background: "var(--kem-dam)", border: "1px dashed rgba(15,14,12,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "64px", marginBottom: "32px", color: "var(--muc-mo)" }}>
            🚗
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
          <div>
            <h3 style={sectionTitleStyle}>Thông tin cơ bản</h3>
            <InfoRow label="Biển số" value={car.plate} />
            <InfoRow label="Hãng xe" value={car.brand} />
            <InfoRow label="Dòng xe" value={car.model} />
            <InfoRow label="Năm SX" value={car.year} />
            <InfoRow label="Màu sắc" value={car.color || "—"} />
            <InfoRow label="Loại xe" value={CAR_TYPE_LABELS[car.carType] || car.carType} />
            <InfoRow label="Số chỗ" value={car.seats ? `${car.seats} chỗ` : "—"} />
            <InfoRow label="Số KM" value={car.currentKm != null ? `${formatPrice(car.currentKm)} km` : "—"} />
          </div>

          <div>
            <h3 style={sectionTitleStyle}>Giá & Địa chỉ</h3>
            <InfoRow label="Giá thuê/ngày" value={`${formatPrice(car.pricePerDay)}đ`} highlight />
            <InfoRow label="Địa chỉ" value={car.address || "—"} />
            <InfoRow label="Hộp số" value={TRANSMISSION_LABELS[car.transmission] || car.transmission} />
            <InfoRow label="Nhiên liệu" value={FUEL_LABELS[car.fuelType] || car.fuelType} />
          </div>
        </div>

        {car.description && !car.description.includes("[REJECT]") && (
          <div style={{ marginBottom: "32px" }}>
            <h3 style={sectionTitleStyle}>Mô tả</h3>
            <p style={{ fontFamily: "var(--serif-2)", fontSize: "15px", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {car.description}
            </p>
          </div>
        )}

        <div style={{ marginBottom: "32px" }}>
          <h3 style={sectionTitleStyle}>Đánh giá & Lượt thuê</h3>
          <InfoRow label="Đánh giá trung bình" value={`★ ${car.averageRating?.toFixed(1) || "5.0"} / 5.0`} highlight />
          <InfoRow label="Số lượng đánh giá" value={`${car.reviewCount || 0} lượt`} />
          <InfoRow label="Số chuyến đã hoàn tất" value={`🚗 ${car.rentalCount || 0} chuyến`} />
        </div>

        {(car.ownerName || car.ownerPhone) && (
          <div style={{ background: "var(--kem-dam)", border: "1px solid rgba(15,14,12,0.15)", padding: "20px", marginBottom: "32px" }}>
            <h3 style={{ ...sectionTitleStyle, marginTop: 0 }}>Chủ xe</h3>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {car.ownerAvatarUrl ? (
                <img src={car.ownerAvatarUrl} alt={car.ownerName} style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--dong)", color: "var(--muc)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--serif)", fontWeight: 700, fontSize: "20px" }}>
                  {car.ownerName?.charAt(0)?.toUpperCase() || "?"}
                </div>
              )}
              <div>
                <div style={{ fontFamily: "var(--serif)", fontSize: "18px", fontWeight: 700 }}>
                  {car.ownerName || "Chủ xe"}
                </div>
                {car.ownerPhone && (
                  <div style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--muc-mo)" }}>
                    {car.ownerPhone}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "32px" }}>
          <div style={{ padding: "16px", background: "var(--kem-dam)", border: "1px solid rgba(15,14,12,0.1)" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: "9px", letterSpacing: "2px", textTransform: "uppercase", color: "var(--muc-mo)", marginBottom: "6px" }}>
              Ngày tạo hồ sơ
            </div>
            <div style={{ fontFamily: "var(--serif-2)", fontSize: "15px" }}>
              {formatDateTime(car.createdAt)}
            </div>
          </div>
          <div style={{ padding: "16px", background: "var(--kem-dam)", border: "1px solid rgba(15,14,12,0.1)" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: "9px", letterSpacing: "2px", textTransform: "uppercase", color: "var(--muc-mo)", marginBottom: "6px" }}>
              Cập nhật lần cuối
            </div>
            <div style={{ fontFamily: "var(--serif-2)", fontSize: "15px" }}>
              {formatDateTime(car.updatedAt)}
            </div>
          </div>
        </div>

        {car.status === "PENDING" && (
          <div style={{ display: "flex", gap: "12px", marginTop: "32px", paddingTop: "24px", borderTop: "1px solid rgba(15,14,12,0.15)" }}>
            <button onClick={() => onReject(car)} style={{ flex: 1, padding: "16px", background: "transparent", border: "1px solid var(--do)", color: "var(--do)", fontFamily: "var(--mono)", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer" }}>
              ✕ Từ chối
            </button>
            <button onClick={() => onApprove(car)} style={{ flex: 2, padding: "16px", background: "var(--xanh-reu)", border: "1px solid var(--xanh-reu)", color: "var(--kem)", fontFamily: "var(--mono)", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer" }}>
              ✓ Duyệt xe
            </button>
          </div>
        )}
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  );
}

const TRANSMISSION_LABELS = {
  AUTOMATIC: "Tự động",
  MANUAL: "Số sàn",
};

const FUEL_LABELS = {
  GASOLINE: "Xăng",
  DIESEL: "Dầu",
  ELECTRIC: "Điện",
  HYBRID: "Hybrid",
};

const RENTAL_MODE_LABELS = {
  SELF_DRIVE: "Tự lái",
  WITH_DRIVER: "Có tài xế",
  BOTH: "Cả hai",
};

const CAR_TYPE_LABELS = {
  SEDAN: "Sedan",
  SUV: "SUV",
  MPV: "MPV",
  HATCHBACK: "Hatchback",
  PICKUP: "Bán tải",
  VAN: "Van",
  LUXURY: "Xe cao cấp",
};

function InfoRow({ label, value, highlight }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px dotted rgba(15,14,12,0.1)" }}>
      <span style={{ fontFamily: "var(--mono)", fontSize: "10px", letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--muc-mo)" }}>
        {label}
      </span>
      <span style={{ fontFamily: highlight ? "var(--serif)" : "var(--serif-2)", fontSize: highlight ? "16px" : "14px", fontWeight: highlight ? 700 : 400, color: highlight ? "var(--do)" : "var(--muc)", textAlign: "right", marginLeft: "16px", wordBreak: "break-word" }}>
        {value || "—"}
      </span>
    </div>
  );
}

const sectionTitleStyle = {
  fontFamily: "var(--mono)",
  fontSize: "10px",
  letterSpacing: "3px",
  textTransform: "uppercase",
  color: "var(--muc-mo)",
  marginBottom: "12px",
  marginTop: "0",
  paddingBottom: "8px",
  borderBottom: "1px solid rgba(15,14,12,0.15)",
};

function paginationBtnStyle(disabled) {
  return { padding: '8px 16px', background: 'transparent', border: '1px solid var(--muc)', color: disabled ? 'var(--muc-mo)' : 'var(--muc)', fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1 }
}

function paginationNumStyle(active) {
  return { padding: '8px 14px', background: active ? 'var(--muc)' : 'transparent', color: active ? 'var(--kem)' : 'var(--muc)', border: '1px solid var(--muc)', fontFamily: 'var(--mono)', fontSize: '11px', cursor: 'pointer', minWidth: '40px' }
}