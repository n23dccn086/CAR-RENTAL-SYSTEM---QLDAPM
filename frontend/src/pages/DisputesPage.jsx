import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

export default function DisputesPage() {
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [message, setMessage] = useState('')

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [bookings, setBookings] = useState([])
  const [form, setForm] = useState({
    bookingId: '',
    category: 'damage',
    description: '',
    claimedAmount: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  // ===== FETCH =====
  const fetchDisputes = async () => {
    setLoading(true)
    try {
      const res = await api.get('/disputes/my')
      setDisputes(res.data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings/my')
      const list = res.data.data || []
      // Chỉ lấy booking COMPLETED hoặc RENTED
      const eligible = list.filter(b => ['COMPLETED', 'RENTED', 'RETURNED'].includes(b.status))
      setBookings(eligible)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchDisputes()
  }, [filter])

  // ===== OPEN MODAL =====
  const openCreateModal = async () => {
    setForm({
      bookingId: '',
      category: 'damage',
      description: '',
      claimedAmount: '',
    })
    setFormError('')
    await fetchBookings()
    setModalOpen(true)
  }

  // ===== SUBMIT =====
  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    if (!form.bookingId) return setFormError('Vui lòng chọn đơn hàng')
    if (!form.description?.trim()) return setFormError('Vui lòng mô tả vấn đề')
    if (form.description.length > 2000) return setFormError('Mô tả không quá 2000 ký tự')

    setSubmitting(true)
    try {
      const payload = {
        bookingId: parseInt(form.bookingId),
        category: form.category,
        description: form.description.trim(),
      }
      if (form.claimedAmount) {
        payload.claimedAmount = parseInt(form.claimedAmount)
      }

      await api.post('/disputes', payload)
      setMessage('Gửi tranh chấp thành công! Chúng tôi sẽ xử lý trong 24-48h.')
      setModalOpen(false)
      fetchDisputes()
      setTimeout(() => setMessage(''), 5000)
    } catch (err) {
      setFormError(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setSubmitting(false)
    }
  }

  // ===== STATUS =====
  const statusMap = {
    PENDING: { label: 'Chờ xử lý', color: 'var(--dong)' },
    INVESTIGATING: { label: 'Đang điều tra', color: 'var(--tim)' },
    WAITING_EVIDENCE: { label: 'Chờ bằng chứng', color: 'var(--do)' },
    RESOLVED: { label: 'Đã giải quyết', color: 'var(--xanh-reu)' },
    ESCALATED: { label: 'Đã chuyển cấp', color: 'var(--do)' },
    CLOSED: { label: 'Đã đóng', color: 'var(--muc-mo)' },
  }

  const categoryMap = {
    damage: 'Hư hỏng xe',
    late_return: 'Trả xe muộn',
    overage_km: 'Vượt km',
    no_show: 'Không nhận xe',
    payment: 'Thanh toán',
    behavior: 'Thái độ',
    other: 'Khác',
  }

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN').format(p || 0)
  const formatDate = (d) => d ? new Date(d).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }) : '—'

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 48px' }}>
      <div className="chapter-num" style={{ marginBottom: '24px' }}>Chương Tranh Chấp</div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: '40px'
      }}>
        <h1 style={{
          fontFamily: 'var(--serif)',
          fontSize: 'clamp(36px, 5vw, 56px)',
          fontWeight: 900,
          letterSpacing: '-2px',
          margin: 0
        }}>
          Tranh <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>chấp.</em>
        </h1>
        <button
          onClick={openCreateModal}
          style={{
            padding: '14px 28px',
            background: 'var(--do)',
            color: 'var(--kem)',
            border: 'none',
            fontFamily: 'var(--mono)',
            fontSize: '11px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            cursor: 'pointer'
          }}
        >
          + Tạo tranh chấp
        </button>
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
      <div style={{ display: 'flex', gap: '12px', marginBottom: '40px', flexWrap: 'wrap' }}>
        {[
          { v: '', l: 'Tất cả' },
          { v: 'PENDING', l: 'Chờ xử lý' },
          { v: 'INVESTIGATING', l: 'Đang điều tra' },
          { v: 'RESOLVED', l: 'Đã giải quyết' },
          { v: 'CLOSED', l: 'Đã đóng' },
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
      </div>

      {/* LIST */}
      {loading ? (
        <p style={{ textAlign: 'center', fontFamily: 'var(--serif-2)', fontStyle: 'italic', padding: '40px' }}>
          Đang tải...
        </p>
      ) : disputes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <p style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '24px', color: 'var(--muc-mo)' }}>
            Chưa có tranh chấp nào.
          </p>
          <p style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px', color: 'var(--muc-mo)', marginTop: '16px' }}>
            Bấm "+ Tạo tranh chấp" nếu bạn gặp vấn đề
          </p>
        </div>
      ) : (
        <div>
          {disputes.map(d => (
            <div
              key={d.id}
              style={{
                padding: '24px 0',
                borderBottom: '1px solid rgba(15,14,12,0.12)'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '16px'
              }}>
                <div>
                  <div style={{
                    fontFamily: 'var(--mono)',
                    fontSize: '11px',
                    letterSpacing: '2px',
                    color: 'var(--muc-mo)',
                    marginBottom: '8px'
                  }}>
                    {d.disputeCode} · Đơn #{d.bookingId}
                  </div>
                  <div style={{
                    fontFamily: 'var(--serif)',
                    fontSize: '22px',
                    fontWeight: 700,
                    marginBottom: '8px'
                  }}>
                    {categoryMap[d.category] || d.category}
                  </div>
                </div>
                <div style={{
                  padding: '6px 14px',
                  border: `1px solid ${statusMap[d.status]?.color || 'var(--muc-mo)'}`,
                  color: statusMap[d.status]?.color || 'var(--muc-mo)',
                  fontFamily: 'var(--mono)',
                  fontSize: '10px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap'
                }}>
                  {statusMap[d.status]?.label || d.status}
                </div>
              </div>

              <div style={{
                fontFamily: 'var(--serif-2)',
                fontStyle: 'italic',
                fontSize: '16px',
                color: 'var(--muc)',
                lineHeight: 1.7,
                marginBottom: '12px'
              }}>
                "{d.description}"
              </div>

              <div style={{
                display: 'flex',
                gap: '24px',
                fontFamily: 'var(--mono)',
                fontSize: '11px',
                letterSpacing: '1px',
                color: 'var(--muc-mo)'
              }}>
                <span>📅 {formatDate(d.createdAt)}</span>
                {d.claimedAmount > 0 && (
                  <span>💰 Yêu cầu: {formatPrice(d.claimedAmount)}đ</span>
                )}
                {d.resolvedAmount > 0 && (
                  <span style={{ color: 'var(--xanh-reu)' }}>
                    ✓ Bồi thường: {formatPrice(d.resolvedAmount)}đ
                  </span>
                )}
              </div>

              {d.resolution && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px 16px',
                  background: 'rgba(74,93,63,0.08)',
                  borderLeft: '3px solid var(--xanh-reu)',
                  fontFamily: 'var(--serif-2)',
                  fontStyle: 'italic',
                  fontSize: '15px',
                  color: 'var(--muc)'
                }}>
                  <strong>Kết quả:</strong> {d.resolution}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ===== MODAL ===== */}
      {modalOpen && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15,14,12,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px', overflowY: 'auto'
        }}>
          <div style={{
            background: 'var(--kem)',
            border: '1px solid var(--muc)',
            maxWidth: '600px', width: '100%',
            maxHeight: '90vh', overflowY: 'auto',
            padding: '48px'
          }}>
            <h2 style={{
              fontFamily: 'var(--serif)',
              fontSize: '32px',
              fontWeight: 900,
              marginBottom: '32px'
            }}>
              Tạo <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>tranh chấp.</em>
            </h2>

            {formError && (
              <div style={{
                background: 'rgba(139,44,44,0.1)',
                border: '1px solid var(--do)',
                padding: '12px 16px',
                marginBottom: '24px',
                color: 'var(--do)',
                fontFamily: 'var(--serif-2)',
                fontStyle: 'italic'
              }}>
                {formError}
              </div>
            )}

            {bookings.length === 0 ? (
              <div style={{
                padding: '24px',
                background: 'rgba(201,169,97,0.1)',
                border: '1px solid var(--dong)',
                fontFamily: 'var(--serif-2)',
                fontStyle: 'italic',
                color: 'var(--muc)',
                textAlign: 'center'
              }}>
                Bạn chưa có đơn hàng nào đủ điều kiện để tạo tranh chấp.
                <br />
                <span style={{ fontSize: '13px', color: 'var(--muc-mo)' }}>
                  (Chỉ có thể tranh chấp đơn đã hoàn tất / đang thuê / đã trả xe)
                </span>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>Đơn hàng *</label>
                  <select
                    value={form.bookingId}
                    onChange={e => setForm({ ...form, bookingId: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="">-- Chọn đơn hàng --</option>
                    {bookings.map(b => (
                      <option key={b.id} value={b.id}>
                        #{b.id} — {b.carName || 'Xe'} ({b.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>Danh mục *</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="damage">Hư hỏng xe</option>
                    <option value="late_return">Trả xe muộn</option>
                    <option value="overage_km">Vượt km</option>
                    <option value="no_show">Không nhận xe</option>
                    <option value="payment">Thanh toán</option>
                    <option value="behavior">Thái độ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>Mô tả chi tiết *</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    rows="5"
                    maxLength={2000}
                    placeholder="Mô tả vấn đề bạn gặp phải..."
                    style={{
                      ...inputStyle,
                      resize: 'vertical',
                      fontFamily: 'var(--serif-2)'
                    }}
                  />
                  <div style={{
                    textAlign: 'right',
                    fontFamily: 'var(--mono)',
                    fontSize: '10px',
                    color: 'var(--muc-mo)',
                    marginTop: '4px'
                  }}>
                    {form.description.length}/2000
                  </div>
                </div>

                <div style={{ marginBottom: '32px' }}>
                  <label style={labelStyle}>Số tiền yêu cầu bồi thường (VNĐ)</label>
                  <input
                    type="number"
                    value={form.claimedAmount}
                    onChange={e => setForm({ ...form, claimedAmount: e.target.value })}
                    placeholder="0"
                    min="0"
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    style={{
                      flex: 1,
                      padding: '16px',
                      background: 'transparent',
                      border: '1px solid var(--muc)',
                      color: 'var(--muc)',
                      fontFamily: 'var(--mono)',
                      fontSize: '11px',
                      letterSpacing: '2px',
                      textTransform: 'uppercase',
                      cursor: 'pointer'
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      flex: 2,
                      padding: '16px',
                      background: 'var(--do)',
                      border: '1px solid var(--do)',
                      color: 'var(--kem)',
                      fontFamily: 'var(--mono)',
                      fontSize: '11px',
                      letterSpacing: '2px',
                      textTransform: 'uppercase',
                      cursor: submitting ? 'wait' : 'pointer'
                    }}
                  >
                    {submitting ? 'Đang gửi...' : 'Gửi tranh chấp'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontFamily: 'var(--mono)',
  fontSize: '10px',
  letterSpacing: '3px',
  textTransform: 'uppercase',
  color: 'var(--muc-mo)',
  marginBottom: '8px'
}

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  background: 'var(--kem-dam)',
  border: '1px solid rgba(15,14,12,0.2)',
  fontFamily: 'var(--serif-2)',
  fontSize: '16px',
  outline: 'none',
  boxSizing: 'border-box'
}