import { useState, useEffect } from 'react'
import api from '../services/api'

export default function AdminRefundsPage() {
  const [refunds, setRefunds] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [msg, setMsg] = useState('')

  // ★ PHÂN TRANG
  const [currentPage, setCurrentPage] = useState(0)   // ← bắt đầu từ 0 (khớp backend)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const PAGE_SIZE = 10

  const fetchRefunds = async () => {
    setLoading(true)
    try {
      const params = {
        page: currentPage,
        size: PAGE_SIZE,
      }
      if (filter) params.status = filter

      const res = await api.get('/admin/refunds', { params })
      const pageData = res.data.data || {}
      setRefunds(pageData.content || [])
      setTotalPages(pageData.totalPages || 0)
      setTotalElements(pageData.totalElements || 0)
    } catch (err) {
      console.error(err)
      setRefunds([])
      setTotalPages(0)
      setTotalElements(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRefunds()
  }, [filter, currentPage])

  // Reset page khi filter đổi
  useEffect(() => {
    setCurrentPage(0)
  }, [filter])

  const showMessage = (msg) => {
    setMsg(msg)
    setTimeout(() => setMsg(''), 4000)
  }

  const handleApprove = async (id) => {
    if (!window.confirm(`Xác nhận hoàn tiền refund #${id}?`)) return
    try {
      await api.put(`/admin/refunds/${id}/approve`)
      showMessage(`Đã duyệt hoàn tiền #${id}`)
      fetchRefunds()
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleReject = async (id) => {
    const reason = window.prompt('Lý do từ chối:')
    if (!reason) return
    try {
      await api.put(`/admin/refunds/${id}/reject?reason=${encodeURIComponent(reason)}`)
      showMessage(`Đã từ chối refund #${id}`)
      fetchRefunds()
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message))
    }
  }

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN').format(p || 0)

  const statusColors = {
    PENDING: 'var(--dong)',
    SUCCESS: 'var(--xanh-reu)',
    CANCELLED: 'var(--do)',
  }

  const goToPage = (p) => {
    if (p >= 0 && p < totalPages) {
      setCurrentPage(p)
    }
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '60px 48px' }}>
      <div className="chapter-num" style={{ marginBottom: '24px' }}>Chương Quản Trị — Hoàn Tiền</div>
      <h1 style={{
        fontFamily: 'var(--serif)',
        fontSize: 'clamp(36px, 5vw, 56px)',
        fontWeight: 900,
        letterSpacing: '-2px',
        marginBottom: '40px'
      }}>
        Yêu cầu <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>hoàn tiền.</em>
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

      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
        {[
          { v: '', l: 'Tất cả' },
          { v: 'PENDING', l: 'Chờ duyệt' },
          { v: 'SUCCESS', l: 'Đã hoàn' },
          { v: 'CANCELLED', l: 'Đã từ chối' },
        ].map(opt => (
          <button
            key={opt.v}
            onClick={() => setFilter(opt.v)}
            style={{
              padding: '8px 16px',
              background: filter === opt.v ? 'var(--muc)' : 'transparent',
              color: filter === opt.v ? 'var(--kem)' : 'var(--muc)',
              border: `1px solid ${filter === opt.v ? 'var(--muc)' : 'rgba(15,14,12,0.2)'}`,
              fontFamily: 'var(--mono)',
              fontSize: '10px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              cursor: 'pointer'
            }}
          >
            {opt.l}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', fontFamily: 'var(--serif-2)', fontStyle: 'italic', padding: '40px' }}>
          Đang tải...
        </p>
      ) : refunds.length === 0 ? (
        <p style={{ textAlign: 'center', fontFamily: 'var(--serif-2)', fontStyle: 'italic', padding: '40px', color: 'var(--muc-mo)' }}>
          Không có yêu cầu hoàn tiền nào.
        </p>
      ) : (
        <>
          <div>
            {refunds.map(r => (
              <div key={r.id} style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr 150px 150px 200px',
                gap: '24px',
                alignItems: 'center',
                padding: '20px 0',
                borderBottom: '1px solid rgba(15,14,12,0.12)'
              }}>
                <div style={{
                  fontFamily: 'var(--serif)',
                  fontSize: '24px',
                  fontWeight: 700,
                  color: 'var(--dong)'
                }}>
                  #{r.id}
                </div>

                <div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
                    Booking #{r.bookingId}
                  </div>
                  <div style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '14px', color: 'var(--muc-mo)' }}>
                    {r.reason}
                  </div>
                </div>

                <div style={{ fontFamily: 'var(--mono)', fontSize: '18px', fontWeight: 500 }}>
                  {formatPrice(r.amount)}đ
                </div>

                <div style={{
                  padding: '4px 10px',
                  border: `1px solid ${statusColors[r.status] || 'var(--muc-mo)'}`,
                  color: statusColors[r.status] || 'var(--muc-mo)',
                  fontFamily: 'var(--mono)',
                  fontSize: '9px',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  textAlign: 'center'
                }}>
                  {r.status}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {r.status === 'PENDING' && (
                    <>
                      <button onClick={() => handleApprove(r.id)} style={btnStyle('var(--xanh-reu)')}>
                        Duyệt
                      </button>
                      <button onClick={() => handleReject(r.id)} style={btnStyle('var(--do)')}>
                        Từ chối
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ★ PHÂN TRANG */}
          {totalPages > 1 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 0}
                  style={paginationBtnStyle(currentPage === 0)}
                >
                  ← Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i).map(p => (
                  <button key={p} onClick={() => goToPage(p)} style={paginationNumStyle(currentPage === p)}>
                    {p + 1}
                  </button>
                ))}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages - 1}
                  style={paginationBtnStyle(currentPage === totalPages - 1)}
                >
                  Sau →
                </button>
              </div>
              <div style={{ textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muc-mo)', marginTop: '16px', marginBottom: '24px' }}>
                Trang {currentPage + 1} / {totalPages} · Tổng {totalElements} yêu cầu
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

function btnStyle(color) {
  return {
    padding: '6px 14px',
    background: 'transparent',
    border: `1px solid ${color}`,
    color,
    fontFamily: 'var(--mono)',
    fontSize: '10px',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    cursor: 'pointer',
  }
}

function paginationBtnStyle(disabled) {
  return {
    padding: '8px 16px',
    background: 'transparent',
    border: '1px solid var(--muc)',
    color: disabled ? 'var(--muc-mo)' : 'var(--muc)',
    fontFamily: 'var(--mono)',
    fontSize: '11px',
    letterSpacing: '2px',
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
    fontFamily: 'var(--mono)',
    fontSize: '11px',
    cursor: 'pointer',
    minWidth: '40px'
  }
}