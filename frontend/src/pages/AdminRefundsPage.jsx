import { useState, useEffect } from 'react'
import api from '../services/api'

export default function AdminRefundsPage() {
  const [refunds, setRefunds] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [msg, setMsg] = useState('')

  const fetchRefunds = async () => {
    setLoading(true)
    try {
      const params = filter ? { status: filter } : {}
      const res = await api.get('/admin/refunds', { params })
      setRefunds(res.data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRefunds() }, [filter])

  const handleApprove = async (id) => {
    if (!window.confirm(`Xác nhận hoàn tiền refund #${id}?`)) return
    try {
      await api.put(`/admin/refunds/${id}/approve`)
      setMsg(`Đã duyệt hoàn tiền #${id}`)
      fetchRefunds()
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleReject = async (id) => {
    const reason = window.prompt('Lý do từ chối:')
    if (!reason) return
    try {
      await api.put(`/admin/refunds/${id}/reject?reason=${encodeURIComponent(reason)}`)
      setMsg(`Đã từ chối refund #${id}`)
      fetchRefunds()
      setTimeout(() => setMsg(''), 3000)
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

      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
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