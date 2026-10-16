import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import api from '../services/api'

const STATUS_MAP = {
  PENDING:  { label: 'Chờ duyệt',       color: 'var(--dong)' },
  ACTIVE:   { label: 'Đang hoạt động',  color: 'var(--xanh-reu)' },
  BUSY:     { label: 'Đang chạy chuyến', color: 'var(--xanh-ngoc)' },
  INACTIVE: { label: 'Đã khóa',         color: 'var(--do)' },
  REJECTED: { label: 'Bị từ chối',      color: 'var(--do)' },
}

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('PENDING')
  const [message, setMessage] = useState('')

  const [detailModal, setDetailModal] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const PAGE_SIZE = 10

  const [rejectModal, setRejectModal] = useState(false)
  const [rejectingDriver, setRejectingDriver] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectSubmitting, setRejectSubmitting] = useState(false)
  const [rejectError, setRejectError] = useState('')

  const fetchDrivers = async () => {
    setLoading(true)
    try {
      const params = { page: currentPage, size: PAGE_SIZE }
      if (filter) params.status = filter

      const res = await api.get('/admin/drivers', { params })
      const pageData = res.data.data || {}
      setDrivers(pageData.content || [])
      setTotalPages(pageData.totalPages || 0)
      setTotalElements(pageData.totalElements || 0)
    } catch (err) {
      console.error(err)
      setDrivers([])
      setTotalPages(0)
      setTotalElements(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDrivers()
  }, [filter, currentPage])

  useEffect(() => {
    setCurrentPage(0)
  }, [filter])

  const showMessage = (msg) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 4000)
  }

  const openDetail = async (driver) => {
    setSelectedDriver(driver)
    setDetailModal(true)
    setDetailLoading(true)

    try {
      const res = await api.get(`/drivers/${driver.id}`)
      setSelectedDriver(res.data.data || driver)
    } catch (err) {
      console.error('Failed to load driver detail:', err)
    } finally {
      setDetailLoading(false)
    }
  }

  const closeDetail = () => {
    setDetailModal(false)
    setSelectedDriver(null)
  }

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && detailModal) closeDetail()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [detailModal])

  const handleApprove = async (driver) => {
    if (!window.confirm(`Duyệt tài xế "${driver.name}" (${driver.phone})?`)) return
    try {
      await api.put(`/admin/drivers/${driver.id}/approve`)
      showMessage(`✅ Đã duyệt tài xế ${driver.name}`)
      closeDetail()
      fetchDrivers()
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleLockDriver = async (driver) => {
    if (!window.confirm(`Khóa tài xế "${driver.name}" (${driver.phone})?`)) return
    try {
      await api.put(`/admin/drivers/${driver.id}/lock`)
      showMessage(`✅ Đã khóa tài xế ${driver.name}`)
      closeDetail()
      fetchDrivers()
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleUnlockDriver = async (driver) => {
    if (!window.confirm(`Mở khóa tài xế "${driver.name}" (${driver.phone})?`)) return
    try {
      await api.put(`/admin/drivers/${driver.id}/unlock`)
      showMessage(`✅ Đã mở khóa tài xế ${driver.name}`)
      closeDetail()
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
      setDetailModal(false)
      setSelectedDriver(null)
      fetchDrivers()
    } catch (err) {
      setRejectError(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setRejectSubmitting(false)
    }
  }

  const pendingCount = drivers.filter(d => d.status === 'PENDING').length

  const goToPage = (p) => {
    if (p >= 0 && p < totalPages) {
      setCurrentPage(p)
    }
  }

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

      <div style={{ display: 'flex', gap: '12px', marginBottom: '40px', flexWrap: 'wrap' }}>
        {[
          { v: 'PENDING',  l: 'Chờ duyệt' },
          { v: 'ACTIVE',   l: 'Đang hoạt động' },
          { v: 'INACTIVE', l: 'Đã khóa' },
          { v: 'REJECTED', l: 'Bị từ chối' },
          { v: '',         l: 'Tất cả' },
        ].map(opt => (
          <button key={opt.v} onClick={() => setFilter(opt.v)} style={{
            padding: '8px 16px',
            background: filter === opt.v ? 'var(--muc)' : 'transparent',
            color: filter === opt.v ? 'var(--kem)' : 'var(--muc-mo)',
            border: `1px solid ${filter === opt.v ? 'var(--muc)' : 'var(--border-2)'}`,
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
            {drivers.map(d => {
              const st = STATUS_MAP[d.status] || { label: d.status, color: 'var(--muc-mo)' }

              return (
                <div
                  key={d.id}
                  onClick={() => openDetail(d)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 1fr auto auto auto',
                    gap: '24px', alignItems: 'center', padding: '24px 0',
                    borderBottom: '1px solid var(--border-1)',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(15,14,12,0.03)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: '48px', height: '48px', flexShrink: 0 }}>
                    {d.avatarUrl ? (
                      <img
                        src={d.avatarUrl}
                        alt={d.name}
                        style={{
                          width: '48px', height: '48px', borderRadius: '50%',
                          objectFit: 'cover', border: '2px solid var(--dong)',
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none'
                          if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    <div
                      style={{
                        width: '48px', height: '48px', borderRadius: '50%',
                        background: 'var(--dong)', color: 'var(--muc)',
                        display: d.avatarUrl ? 'none' : 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '20px',
                      }}
                    >
                      {d.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  </div>

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

                  <div style={{ fontFamily: 'var(--mono)', fontSize: '14px', color: 'var(--muc-mo)', textAlign: 'right' }}>
                    {d.rating?.toFixed(1) || '0.0'}★
                  </div>

                  <div style={{
                    padding: '6px 14px',
                    border: `1px solid ${st.color}`,
                    color: st.color,
                    fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '2px',
                    textTransform: 'uppercase', textAlign: 'center', whiteSpace: 'nowrap'
                  }}>
                    {st.label}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                    {d.status === 'PENDING' ? (
                      <>
                        <button onClick={() => handleApprove(d)} style={btnStyle('var(--xanh-reu)')}>
                          ✓ Duyệt
                        </button>
                        <button onClick={() => openRejectModal(d)} style={btnStyle('var(--do)')}>
                          ✕ Từ chối
                        </button>
                      </>
                    ) : d.status === 'ACTIVE' ? (
                      <button onClick={() => handleLockDriver(d)} style={btnStyle('var(--do)')}>
                        Khóa
                      </button>
                    ) : d.status === 'INACTIVE' ? (
                      <button onClick={() => handleUnlockDriver(d)} style={btnStyle('var(--xanh-reu)')}>
                        Mở khóa
                      </button>
                    ) : (
                      <div style={{ width: '180px' }} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {totalPages > 1 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px', flexWrap: 'wrap' }}>
                <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 0} style={paginationBtnStyle(currentPage === 0)}>← Trước</button>
                {Array.from({ length: totalPages }, (_, i) => i).map(p => (
                  <button key={p} onClick={() => goToPage(p)} style={paginationNumStyle(currentPage === p)}>{p + 1}</button>
                ))}
                <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages - 1} style={paginationBtnStyle(currentPage === totalPages - 1)}>Sau →</button>
              </div>
              <div style={{ textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muc-mo)', marginTop: '16px', marginBottom: '24px' }}>
                Trang {currentPage + 1} / {totalPages} · Tổng {totalElements} tài xế
              </div>
            </>
          )}
        </>
      )}

      {detailModal && selectedDriver && (
        <DriverDetailModal
          driver={selectedDriver}
          loading={detailLoading}
          onClose={closeDetail}
          onApprove={handleApprove}
          onReject={() => {
            setDetailModal(false)
            openRejectModal(selectedDriver)
          }}
          onLock={handleLockDriver}
          onUnlock={handleUnlockDriver}
        />
      )}

      {rejectModal && rejectingDriver && createPortal(
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,14,12,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, padding: '20px'
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
                  border: '1px solid var(--border-3)',
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
        </div>,
        document.getElementById('modal-root') || document.body
      )}
    </div>
  )
}

// ============================================================
// MODAL CHI TIẾT TÀI XẾ
// ============================================================
function DriverDetailModal({ driver, loading, onClose, onApprove, onReject, onLock, onUnlock }) {
  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

  const formatDateTime = (d) =>
    d ? new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

  const statusMap = {
    PENDING:  { label: 'Chờ duyệt',       color: 'var(--dong)' },
    ACTIVE:   { label: 'Đang hoạt động',  color: 'var(--xanh-reu)' },
    BUSY:     { label: 'Đang chạy chuyến', color: 'var(--xanh-ngoc)' },
    INACTIVE: { label: 'Tạm nghỉ',        color: 'var(--muc-mo)' },
    REJECTED: { label: 'Bị từ chối',      color: 'var(--do)' },
  }

  const st = statusMap[driver.status] || { label: driver.status, color: 'var(--muc-mo)' }

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,14,12,0.75)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        zIndex: 99999, padding: '20px', paddingTop: '80px', paddingBottom: '40px',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--kem)', border: '1px solid var(--muc)',
          maxWidth: '800px', width: '100%', maxHeight: '90vh',
          overflowY: 'auto', padding: '48px', position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            width: '40px', height: '40px', background: 'transparent',
            border: '1px solid var(--muc)', color: 'var(--muc)',
            fontFamily: 'var(--mono)', fontSize: '18px', cursor: 'pointer'
          }}
        >✕</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', paddingRight: '56px' }}>
          {driver.avatarUrl ? (
            <img
              src={driver.avatarUrl}
              alt={driver.name}
              style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--dong)', flexShrink: 0 }}
              onError={(e) => {
                e.target.style.display = 'none'
                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'
              }}
            />
          ) : null}
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%', background: 'var(--dong)',
            color: 'var(--muc)', display: driver.avatarUrl ? 'none' : 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '32px', flexShrink: 0
          }}>
            {driver.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--muc-mo)', marginBottom: '4px' }}>
              Chi tiết tài xế #{driver.id}
            </div>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 900, letterSpacing: '-1px', margin: 0 }}>
              {driver.name}
            </h2>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', letterSpacing: '1px', color: 'var(--muc-mo)', marginTop: '4px' }}>
              {driver.phone}
            </div>
          </div>
        </div>

        <div style={{
          display: 'inline-block', padding: '6px 16px', marginBottom: '24px',
          border: `1px solid ${st.color}`, color: st.color,
          fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase'
        }}>
          {st.label}
        </div>

        {driver.status === 'REJECTED' && driver.rejectionReason && (
          <div style={{
            background: 'rgba(139,44,44,0.08)',
            border: '1px solid var(--do)',
            padding: '16px',
            marginBottom: '24px',
            fontFamily: 'var(--serif-2)',
            fontStyle: 'italic',
            fontSize: '14px',
            color: 'var(--do)',
          }}>
            ⚠️ <strong>Lý do từ chối:</strong> {driver.rejectionReason}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          <div>
            <h3 style={sectionTitleStyle}>Thông tin cá nhân</h3>
            <InfoRow label="Họ tên" value={driver.name} />
            <InfoRow label="SĐT" value={driver.phone} highlight />
            <InfoRow label="Email" value={driver.email || '—'} />
            <InfoRow label="CCCD" value={driver.cccd || '—'} />
            <InfoRow label="Ngày sinh" value={formatDate(driver.dateOfBirth)} />
            <InfoRow label="Địa chỉ" value={driver.address || '—'} />
          </div>

          <div>
            <h3 style={sectionTitleStyle}>Bằng lái & Kinh nghiệm</h3>
            <InfoRow label="Số GPLX" value={driver.licenseNumber} highlight />
            <InfoRow label="Hạng GPLX" value={driver.licenseClass} />
            <InfoRow label="Ngày hết hạn" value={formatDate(driver.licenseExpiry)} />
            <InfoRow label="Kinh nghiệm" value={driver.experienceYears ? `${driver.experienceYears} năm` : '—'} />
            <InfoRow label="Đánh giá" value={`★ ${driver.rating?.toFixed(1) || '0.0'}`} />
            <InfoRow label="Tổng chuyến" value={driver.totalTrips || 0} />
          </div>
        </div>

        {(driver.ownerName || driver.ownerPhone) && (
          <div
            style={{
              background: 'var(--kem-dam)',
              border: '1px solid rgba(15,14,12,0.15)',
              padding: '20px',
              marginBottom: '24px',
            }}
          >
            <h3 style={{ ...sectionTitleStyle, marginTop: 0 }}>Chủ xe</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {driver.ownerAvatarUrl ? (
                <img
                  src={driver.ownerAvatarUrl}
                  alt={driver.ownerName}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'var(--dong)',
                    color: 'var(--muc)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--serif)',
                    fontWeight: 700,
                    fontSize: '20px',
                  }}
                >
                  {driver.ownerName?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              <div>
                <div
                  style={{
                    fontFamily: 'var(--serif)',
                    fontSize: '18px',
                    fontWeight: 700,
                  }}
                >
                  {driver.ownerName || 'Chủ xe'}
                </div>
                {driver.ownerPhone && (
                  <div
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: '12px',
                      color: 'var(--muc-mo)',
                    }}
                  >
                    {driver.ownerPhone}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
          <div style={{ padding: '12px 16px', background: 'var(--kem-dam)', border: '1px solid rgba(15,14,12,0.1)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muc-mo)', marginBottom: '4px' }}>
              Ngày tạo hồ sơ
            </div>
            <div style={{ fontFamily: 'var(--serif-2)', fontSize: '14px' }}>
              {formatDateTime(driver.createdAt)}
            </div>
          </div>
          <div style={{ padding: '12px 16px', background: 'var(--kem-dam)', border: '1px solid rgba(15,14,12,0.1)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muc-mo)', marginBottom: '4px' }}>
              Cập nhật lần cuối
            </div>
            <div style={{ fontFamily: 'var(--serif-2)', fontSize: '14px' }}>
              {formatDateTime(driver.updatedAt)}
            </div>
          </div>
        </div>

        {driver.status === 'PENDING' && (
          <div style={{ display: 'flex', gap: '12px', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(15,14,12,0.15)' }}>
            <button
              onClick={onReject}
              style={{
                flex: 1, padding: '16px', background: 'transparent',
                border: '1px solid var(--do)', color: 'var(--do)',
                fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px',
                textTransform: 'uppercase', cursor: 'pointer'
              }}
            >
              ✕ Từ chối
            </button>
            <button
              onClick={() => onApprove(driver)}
              style={{
                flex: 2, padding: '16px', background: 'var(--xanh-reu)',
                border: '1px solid var(--xanh-reu)', color: 'var(--kem)',
                fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px',
                textTransform: 'uppercase', cursor: 'pointer'
              }}
            >
              ✓ Duyệt tài xế
            </button>
          </div>
        )}

        {driver.status === 'ACTIVE' && onLock && (
          <div style={{ display: 'flex', gap: '12px', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(15,14,12,0.15)' }}>
            <button
              onClick={() => {
                onClose()
                onLock(driver)
              }}
              style={{
                flex: 1, padding: '16px', background: 'transparent',
                border: '1px solid var(--do)', color: 'var(--do)',
                fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px',
                textTransform: 'uppercase', cursor: 'pointer'
              }}
            >
              🔒 Khóa tài xế
            </button>
          </div>
        )}

        {driver.status === 'INACTIVE' && onUnlock && (
          <div style={{ display: 'flex', gap: '12px', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(15,14,12,0.15)' }}>
            <button
              onClick={() => {
                onClose()
                onUnlock(driver)
              }}
              style={{
                flex: 1, padding: '16px', background: 'var(--xanh-reu)',
                border: '1px solid var(--xanh-reu)', color: 'var(--kem)',
                fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px',
                textTransform: 'uppercase', cursor: 'pointer'
              }}
            >
              🔓 Mở khóa tài xế
            </button>
          </div>
        )}
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  )
}

function InfoRow({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dotted rgba(15,14,12,0.1)' }}>
      <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muc-mo)' }}>
        {label}
      </span>
      <span style={{
        fontFamily: highlight ? 'var(--serif)' : 'var(--serif-2)',
        fontSize: highlight ? '16px' : '14px',
        fontWeight: highlight ? 700 : 400,
        color: highlight ? 'var(--do)' : 'var(--muc)',
        textAlign: 'right', marginLeft: '16px', wordBreak: 'break-word'
      }}>
        {value || '—'}
      </span>
    </div>
  )
}

const sectionTitleStyle = {
  fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '3px',
  textTransform: 'uppercase', color: 'var(--muc-mo)',
  marginBottom: '12px', marginTop: '0', paddingBottom: '8px',
  borderBottom: '1px solid rgba(15,14,12,0.15)'
}

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