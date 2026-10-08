import { useState, useEffect } from 'react'
import api from '../services/api'

const STATUS_MAP = {
  PENDING:  { label: 'Chờ duyệt',      color: 'var(--dong)' },
  ACTIVE:   { label: 'Đang hoạt động', color: 'var(--xanh-reu)' },
  BUSY:     { label: 'Đang chạy chuyến', color: 'var(--xanh-ngoc)' },
  INACTIVE: { label: 'Tạm nghỉ',       color: 'var(--muc-mo)' },
  REJECTED: { label: 'Bị từ chối',     color: 'var(--do)' },
}

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('PENDING')
  const [message, setMessage] = useState('')

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  // Reject modal
  const [rejectModal, setRejectModal] = useState(false)
  const [rejectingDriver, setRejectingDriver] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectSubmitting, setRejectSubmitting] = useState(false)
  const [rejectError, setRejectError] = useState('')

  const fetchDrivers = async () => {
    setLoading(true)
    try {
      const params = filter ? { status: filter } : {}
      const res = await api.get('/admin/drivers', { params })
      setDrivers(res.data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDrivers()
  }, [filter])

  useEffect(() => {
    setCurrentPage(1)
  }, [filter])

  const showMessage = (msg) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 4000)
  }

  const handleApprove = async (driver) => {
    if (!window.confirm(`Duyệt tài xế "${driver.name}" (${driver.phone})?`)) return
    try {
      await api.put(`/admin/drivers/${driver.id}/approve`)
      showMessage(`✅ Đã duyệt tài xế ${driver.name}`)
      fetchDrivers()
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message))
    }
  }

  const openRejectModal = (driver) => {
    setRejectingDriver(driver)
    setRejectReason('')
    setRejectError('')
    setRejectModal(true)
  }

  const handleRejectSubmit = async (e) => {
    e.preventDefault()
    setRejectError('')

    if (!rejectReason.trim()) {
      return setRejectError('Vui lòng nhập lý do từ chối')
    }

    setRejectSubmitting(true)
    try {
      await api.put(
        `/admin/drivers/${rejectingDriver.id}/reject?reason=${encodeURIComponent(rejectReason.trim())}`
      )
      showMessage(`✅ Đã từ chối tài xế ${rejectingDriver.name}`)
      setRejectModal(false)
      fetchDrivers()
    } catch (err) {
      setRejectError(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setRejectSubmitting(false)
    }
  }

  // Phân trang
  const totalPages = Math.ceil(drivers.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const currentDrivers = drivers.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const pendingCount = drivers.filter(d => d.status === 'PENDING').length

  const formatDate = (d) =>
    d ? new Date(d).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }) : '—'

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '60px 48px' }}>
      <div className="chapter-num" style={{ marginBottom: '24px' }}>Chương Quản Trị — Duyệt Tài Xế</div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900, letterSpacing: '-2px', margin: 0 }}>
            Tài xế <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>chờ duyệt.</em>
          </h1>
          {pendingCount > 0 && (
            <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px', color: 'var(--do)', marginTop: '12px' }}>
              {pendingCount} TÀI XẾ ĐANG CHỜ
            </div>
          )}
        </div>
      </div>

      {message && (
        <div style={{ background: 'rgba(74,93,63,0.1)', border: '1px solid var(--xanh-reu)', padding: '12px 16px', marginBottom: '24px', color: 'var(--xanh-reu)', fontFamily: 'var(--serif-2)', fontStyle: 'italic' }}>
          {message}
        </div>
      )}

      {/* Filter */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '40px', flexWrap: 'wrap' }}>
        {[
          { v: 'PENDING',  l: 'Chờ duyệt' },
          { v: 'ACTIVE',   l: 'Đang hoạt động' },
          { v: 'REJECTED', l: 'Bị từ chối' },
          { v: '',         l: 'Tất cả' },
        ].map(opt => (
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
      ) : drivers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <p style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '24px', color: 'var(--muc-mo)' }}>Không có tài xế nào.</p>
        </div>
      ) : (
        <>
          <div>
            {currentDrivers.map(d => {
              const st = STATUS_MAP[d.status] || { label: d.status, color: 'var(--muc-mo)' }

              return (
                <div key={d.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 1fr auto auto auto',
                  gap: '24px', alignItems: 'center', padding: '24px 0',
                  borderBottom: '1px solid rgba(15,14,12,0.12)'
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%',
                    background: 'var(--dong)', color: 'var(--muc)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '20px'
                  }}>
                    {d.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>

                  {/* Info */}
                  <div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>
                      {d.name}
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '1px', color: 'var(--muc-mo)' }}>
                      {d.phone} · GPLX: {d.licenseNumber} ({d.licenseClass})
                    </div>
                    {d.email && (
                      <div style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '13px', color: 'var(--muc-mo)', marginTop: '4px' }}>
                        {d.email} · {d.experienceYears || 0} năm kinh nghiệm
                      </div>
                    )}
                  </div>

                  {/* Rating */}
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '14px', color: 'var(--muc-mo)', textAlign: 'right' }}>
                    {d.rating?.toFixed(1) || '0.0'}★
                  </div>

                  {/* Status */}
                  <div style={{
                    padding: '6px 14px',
                    border: `1px solid ${st.color}`,
                    color: st.color,
                    fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '2px',
                    textTransform: 'uppercase', textAlign: 'center', whiteSpace: 'nowrap'
                  }}>
                    {st.label}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {d.status === 'PENDING' ? (
                      <>
                        <button onClick={() => handleApprove(d)} style={btnStyle('var(--xanh-reu)')}>
                          ✓ Duyệt
                        </button>
                        <button onClick={() => openRejectModal(d)} style={btnStyle('var(--do)')}>
                          ✕ Từ chối
                        </button>
                      </>
                    ) : (
                      <div style={{ width: '180px' }} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
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
                Trang {currentPage} / {totalPages} · Tổng {drivers.length} tài xế
              </div>
            </>
          )}
        </>
      )}

      {/* Reject Modal */}
      {rejectModal && rejectingDriver && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,14,12,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }} onClick={() => setRejectModal(false)}>
          <div style={{
            background: 'var(--kem)', border: '1px solid var(--muc)',
            maxWidth: '500px', width: '100%', padding: '48px', position: 'relative'
          }} onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => setRejectModal(false)} style={{
              position: 'absolute', top: '16px', right: '16px',
              width: '40px', height: '40px', background: 'transparent',
              border: '1px solid var(--muc)', color: 'var(--muc)',
              fontFamily: 'var(--mono)', fontSize: '18px', cursor: 'pointer'
            }}>✕</button>

            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '28px', fontWeight: 900, marginBottom: '8px', paddingRight: '48px' }}>
              Từ chối tài xế.
            </h2>
            <p style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px', color: 'var(--muc-mo)', marginBottom: '24px' }}>
              {rejectingDriver.name} · {rejectingDriver.phone}
            </p>

            {rejectError && (
              <div style={{ background: 'rgba(139,44,44,0.1)', border: '1px solid var(--do)', padding: '12px 16px', marginBottom: '20px', color: 'var(--do)', fontFamily: 'var(--serif-2)', fontStyle: 'italic' }}>
                {rejectError}
              </div>
            )}

            <form onSubmit={handleRejectSubmit}>
              <label style={labelStyle}>Lý do từ chối *</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                maxLength={500}
                placeholder="VD: GPLX không hợp lệ, hạng bằng không đúng..."
                style={{
                  width: '100%', padding: '14px', background: 'var(--kem-dam)',
                  border: '1px solid rgba(15,14,12,0.2)',
                  fontFamily: 'var(--serif-2)', fontSize: '16px',
                  resize: 'vertical', outline: 'none', boxSizing: 'border-box'
                }}
              />
              <div style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muc-mo)', marginTop: '4px' }}>
                {rejectReason.length}/500
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={() => setRejectModal(false)} style={{
                  flex: 1, padding: '16px', background: 'transparent',
                  border: '1px solid var(--muc)', color: 'var(--muc)',
                  fontFamily: 'var(--mono)', fontSize: '11px',
                  letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer'
                }}>Hủy</button>
                <button type="submit" disabled={rejectSubmitting} style={{
                  flex: 2, padding: '16px', background: 'var(--do)',
                  border: 'none', color: 'var(--kem)',
                  fontFamily: 'var(--mono)', fontSize: '11px',
                  letterSpacing: '2px', textTransform: 'uppercase',
                  cursor: rejectSubmitting ? 'wait' : 'pointer'
                }}>
                  {rejectSubmitting ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// Styles
const labelStyle = {
  display: 'block', fontFamily: 'var(--mono)', fontSize: '10px',
  letterSpacing: '3px', textTransform: 'uppercase',
  color: 'var(--muc-mo)', marginBottom: '8px'
}

function btnStyle(color) {
  return {
    padding: '8px 16px', background: 'transparent',
    border: `1px solid ${color}`, color,
    fontFamily: 'var(--mono)', fontSize: '10px',
    letterSpacing: '1.5px', textTransform: 'uppercase',
    cursor: 'pointer', whiteSpace: 'nowrap'
  }
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