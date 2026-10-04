import { useState, useEffect } from 'react'
import api from '../services/api'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [message, setMessage] = useState('')

  // ===== FETCH =====
  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filter) params.type = filter
      if (unreadOnly) params.unreadOnly = true

      const res = await api.get('/notifications', { params })
      setNotifications(res.data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count')
      setUnreadCount(res.data.data || 0)
    } catch (err) {
      // ignore
    }
  }

  useEffect(() => {
    fetchNotifications()
    fetchUnreadCount()
  }, [filter, unreadOnly])

  // ===== ACTIONS =====
  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`)
      fetchNotifications()
      fetchUnreadCount()
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!window.confirm('Đánh dấu tất cả đã đọc?')) return
    try {
      await api.put('/notifications/read-all')
      setMessage('Đã đánh dấu tất cả đã đọc')
      fetchNotifications()
      fetchUnreadCount()
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa thông báo này?')) return
    try {
      await api.delete(`/notifications/${id}`)
      fetchNotifications()
      fetchUnreadCount()
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message))
    }
  }

  // ===== HELPERS =====
  const typeMap = {
    BOOKING_NEW: { label: 'Đơn mới', color: 'var(--dong)' },
    BOOKING_APPROVED: { label: 'Đơn duyệt', color: 'var(--xanh-reu)' },
    BOOKING_REJECTED: { label: 'Đơn từ chối', color: 'var(--do)' },
    BOOKING_CANCELLED: { label: 'Đơn hủy', color: 'var(--do)' },
    PAYMENT_SUCCESS: { label: 'Thanh toán', color: 'var(--xanh-reu)' },
    PAYMENT_FAILED: { label: 'TT thất bại', color: 'var(--do)' },
    REFUND_SUCCESS: { label: 'Hoàn tiền', color: 'var(--dong)' },
    CAR_APPROVED: { label: 'Xe duyệt', color: 'var(--xanh-reu)' },
    CAR_REJECTED: { label: 'Xe từ chối', color: 'var(--do)' },
    REVIEW_NEW: { label: 'Đánh giá', color: 'var(--tim)' },
    SYSTEM: { label: 'Hệ thống', color: 'var(--muc-mo)' },
  }

  const formatDateTime = (dt) => {
    if (!dt) return ''
    return new Date(dt).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '60px 48px' }}>
      <div className="chapter-num" style={{ marginBottom: '24px' }}>Chương Thông Báo</div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: '40px'
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--serif)',
            fontSize: 'clamp(36px, 5vw, 56px)',
            fontWeight: 900,
            letterSpacing: '-2px',
            margin: 0
          }}>
            Tin <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>nhắn.</em>
          </h1>
          {unreadCount > 0 && (
            <div style={{
              fontFamily: 'var(--mono)',
              fontSize: '11px',
              letterSpacing: '2px',
              color: 'var(--do)',
              marginTop: '12px'
            }}>
              {unreadCount} CHƯA ĐỌC
            </div>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: '1px solid var(--muc)',
              color: 'var(--muc)',
              fontFamily: 'var(--mono)',
              fontSize: '10px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              cursor: 'pointer'
            }}
          >
            Đọc tất cả
          </button>
        )}
      </div>

      {message && (
        <div style={{
          background: 'rgba(74,93,63,0.1)',
          border: '1px solid var(--xanh-reu)',
          padding: '12px 16px',
          marginBottom: '24px',
          color: 'var(--xanh-reu)',
          fontFamily: 'var(--serif-2)',
          fontStyle: 'italic'
        }}>
          {message}
        </div>
      )}

      {/* FILTER */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '40px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {[
          { v: '', l: 'Tất cả' },
          { v: 'BOOKING_NEW', l: 'Đơn mới' },
          { v: 'BOOKING_APPROVED', l: 'Đã duyệt' },
          { v: 'PAYMENT_SUCCESS', l: 'Thanh toán' },
          { v: 'REFUND_SUCCESS', l: 'Hoàn tiền' },
          { v: 'SYSTEM', l: 'Hệ thống' },
        ].map(opt => (
          <button
            key={opt.v}
            onClick={() => setFilter(opt.v)}
            style={{
              padding: '8px 16px',
              background: filter === opt.v ? 'var(--muc)' : 'transparent',
              color: filter === opt.v ? 'var(--kem)' : 'var(--muc-mo)',
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

        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: 'var(--mono)',
          fontSize: '10px',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          cursor: 'pointer',
          marginLeft: 'auto'
        }}>
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={e => setUnreadOnly(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          Chỉ chưa đọc
        </label>
      </div>

      {/* LIST */}
      {loading ? (
        <p style={{ textAlign: 'center', fontFamily: 'var(--serif-2)', fontStyle: 'italic', padding: '40px' }}>
          Đang tải...
        </p>
      ) : notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <p style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '24px', color: 'var(--muc-mo)' }}>
            Không có thông báo nào.
          </p>
        </div>
      ) : (
        <div>
          {notifications.map(n => (
            <div
              key={n.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '120px 1fr auto',
                gap: '24px',
                alignItems: 'center',
                padding: '24px 0',
                borderBottom: '1px solid rgba(15,14,12,0.12)',
                background: n.isRead ? 'transparent' : 'rgba(201,169,97,0.05)',
                opacity: n.isRead ? 0.7 : 1,
                paddingLeft: n.isRead ? '0' : '16px',
                paddingRight: n.isRead ? '0' : '16px',
                transition: 'all 0.3s'
              }}
            >
              {/* TYPE + UNREAD DOT */}
              <div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 12px',
                  border: `1px solid ${typeMap[n.type]?.color || 'var(--muc-mo)'}`,
                  color: typeMap[n.type]?.color || 'var(--muc-mo)',
                  fontFamily: 'var(--mono)',
                  fontSize: '9px',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase'
                }}>
                  {!n.isRead && (
                    <span style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'var(--do)'
                    }}></span>
                  )}
                  {typeMap[n.type]?.label || n.type}
                </div>
              </div>

              {/* CONTENT */}
              <div>
                <div style={{
                  fontFamily: 'var(--serif)',
                  fontSize: '18px',
                  fontWeight: 700,
                  marginBottom: '6px',
                  color: 'var(--muc)'
                }}>
                  {n.title}
                </div>
                <div style={{
                  fontFamily: 'var(--serif-2)',
                  fontStyle: 'italic',
                  fontSize: '15px',
                  color: 'var(--muc-mo)',
                  marginBottom: '6px',
                  lineHeight: 1.5
                }}>
                  {n.content}
                </div>
                <div style={{
                  fontFamily: 'var(--mono)',
                  fontSize: '10px',
                  letterSpacing: '1px',
                  color: 'var(--muc-mo)'
                }}>
                  {formatDateTime(n.createdAt)}
                </div>
              </div>

              {/* ACTIONS */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {!n.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(n.id)}
                    title="Đánh dấu đã đọc"
                    style={btnStyle('var(--xanh-reu)')}
                  >
                    ✓ Đọc
                  </button>
                )}
                <button
                  onClick={() => handleDelete(n.id)}
                  title="Xóa"
                  style={btnStyle('var(--do)')}
                >
                  ✕
                </button>
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
    padding: '6px 12px',
    background: 'transparent',
    border: `1px solid ${color}`,
    color,
    fontFamily: 'var(--mono)',
    fontSize: '10px',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  }
}