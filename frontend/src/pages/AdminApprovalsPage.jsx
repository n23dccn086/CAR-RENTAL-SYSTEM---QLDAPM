import { useState, useEffect } from 'react'
import api from '../services/api'

export default function AdminApprovalsPage() {
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('PENDING')
  const [message, setMessage] = useState('')

  // ===== PHÂN TRANG =====
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  const fetchCars = async () => {
    setLoading(true)
    try {
      const res = await api.get('/cars')
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

  // Reset page khi filter đổi
  useEffect(() => {
    setCurrentPage(1)
  }, [filter])

  const handleApprove = async (car) => {
    if (!window.confirm(`Duyệt xe "${car.brand} ${car.model}" (${car.plate})?`)) return
    try {
      await api.put(`/cars/${car.id}/approve`)
      setMessage(`Đã duyệt xe ${car.plate}`)
      fetchCars()
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleReject = async (car) => {
    const reason = window.prompt('Lý do từ chối:')
    if (!reason) return
    try {
      await api.put(`/cars/${car.id}/reject?reason=${encodeURIComponent(reason)}`)
      setMessage(`Đã từ chối xe ${car.plate}`)
      fetchCars()
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message))
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
  }

  const filterOptions = [
    { v: 'ALL', l: 'Tất cả' },
    { v: 'PENDING', l: 'Chờ duyệt' },
    { v: 'AVAILABLE', l: 'Đã duyệt' },
    { v: 'INACTIVE', l: 'Từ chối' },
  ]

  const filtered = filter === 'ALL' ? cars : cars.filter(c => c.status === filter)

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN').format(p || 0)
  const pendingCount = cars.filter(c => c.status === 'PENDING').length

  // ===== TÍNH TOÁN PHÂN TRANG =====
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
              <div key={car.id} style={{
                display: 'grid', gridTemplateColumns: '80px 1fr auto auto',
                gap: '24px', alignItems: 'center', padding: '24px 0',
                borderBottom: '1px solid rgba(15,14,12,0.12)'
              }}>
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

                <div style={{ display: 'flex', gap: '8px' }}>
                  {car.status === 'PENDING' ? (
                    <>
                      <button onClick={() => handleApprove(car)} style={{ padding: '8px 16px', background: 'var(--xanh-reu)', border: '1px solid var(--xanh-reu)', color: 'var(--kem)', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap' }}>✓ Duyệt</button>
                      <button onClick={() => handleReject(car)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--do)', color: 'var(--do)', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap' }}>✕ Từ chối</button>
                    </>
                  ) : (
                    <div style={{ width: '180px' }} />
                  )}
                </div>
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
                Trang {currentPage} / {totalPages} · Tổng {filtered.length} xe
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