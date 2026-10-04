import { useState, useEffect } from 'react'
import api from '../services/api'

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [message, setMessage] = useState('')

  // Modal xử lý
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDispute, setSelectedDispute] = useState(null)
  const [action, setAction] = useState('resolve')   // 'resolve' | 'escalate'
  const [form, setForm] = useState({
    resolution: '',
    resolvedAmount: '',
    reason: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  // ===== FETCH =====
  const fetchDisputes = async () => {
    setLoading(true)
    try {
      const params = filter ? { status: filter } : {}
      const res = await api.get('/admin/disputes', { params })
      setDisputes(res.data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDisputes()
  }, [filter])

  // ===== OPEN MODAL =====
  const openResolveModal = (dispute) => {
    setSelectedDispute(dispute)
    setAction('resolve')
    setForm({ resolution: '', resolvedAmount: '', reason: '' })
    setFormError('')
    setModalOpen(true)
  }

  const openEscalateModal = (dispute) => {
    setSelectedDispute(dispute)
    setAction('escalate')
    setForm({ resolution: '', resolvedAmount: '', reason: '' })
    setFormError('')
    setModalOpen(true)
  }

  // ===== SUBMIT =====
  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    if (action === 'resolve') {
      if (!form.resolution?.trim()) return setFormError('Vui lòng nhập kết quả giải quyết')
    } else {
      if (!form.reason?.trim()) return setFormError('Vui lòng nhập lý do chuyển cấp')
    }

    setSubmitting(true)
    try {
      if (action === 'resolve') {
        const params = new URLSearchParams()
        params.append('resolution', form.resolution.trim())
        if (form.resolvedAmount) params.append('resolvedAmount', form.resolvedAmount)

        await api.put(`/admin/disputes/${selectedDispute.id}/resolve?${params.toString()}`)
        setMessage(`Đã giải quyết tranh chấp ${selectedDispute.disputeCode}`)
      } else {
        await api.put(`/admin/disputes/${selectedDispute.id}/escalate?reason=${encodeURIComponent(form.reason.trim())}`)
        setMessage(`Đã chuyển cấp tranh chấp ${selectedDispute.disputeCode}`)
      }

      setModalOpen(false)
      fetchDisputes()
      setTimeout(() => setMessage(''), 5000)
    } catch (err) {
      setFormError(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setSubmitting(false)
    }
  }

  // ===== HELPERS =====
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

  // Stats
  const stats = {
    total: disputes.length,
    pending: disputes.filter(d => d.status === 'PENDING').length,
    resolved: disputes.filter(d => d.status === 'RESOLVED').length,
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '60px 48px' }}>
      <div className="chapter-num" style={{ marginBottom: '24px' }}>Chương Quản Trị — Tranh Chấp</div>
      <h1 style={{
        fontFamily: 'var(--serif)',
        fontSize: 'clamp(36px, 5vw, 56px)',
        fontWeight: 900,
        letterSpacing: '-2px',
        marginBottom: '16px'
      }}>
        Xử lý <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>tranh chấp.</em>
      </h1>
      <p style={{
        fontFamily: 'var(--serif-2)',
        fontStyle: 'italic',
        fontSize: '18px',
        color: 'var(--muc-mo)',
        marginBottom: '40px'
      }}>
        Phân xử công bằng cho khách thuê và chủ xe.
      </p>

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

      {/* STATS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '24px',
        marginBottom: '40px'
      }}>
        <StatCard label="Tổng tranh chấp" value={stats.total} />
        <StatCard label="Chờ xử lý" value={stats.pending} color="var(--do)" />
        <StatCard label="Đã giải quyết" value={stats.resolved} color="var(--xanh-reu)" />
      </div>

      {/* FILTER */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '40px', flexWrap: 'wrap' }}>
        {[
          { v: '', l: 'Tất cả' },
          { v: 'PENDING', l: 'Chờ xử lý' },
          { v: 'INVESTIGATING', l: 'Đang điều tra' },
          { v: 'RESOLVED', l: 'Đã giải quyết' },
          { v: 'ESCALATED', l: 'Đã chuyển cấp' },
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
            Không có tranh chấp nào.
          </p>
        </div>
      ) : (
        <div>
          {disputes.map(d => (
            <div
              key={d.id}
              style={{
                padding: '24px',
                marginBottom: '16px',
                background: 'var(--kem-dam)',
                border: '1px solid rgba(15,14,12,0.15)'
              }}
            >
              {/* Header */}
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
                    fontWeight: 700
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

              {/* Description */}
              <div style={{
                fontFamily: 'var(--serif-2)',
                fontStyle: 'italic',
                fontSize: '16px',
                color: 'var(--muc)',
                lineHeight: 1.6,
                marginBottom: '16px'
              }}>
                "{d.description}"
              </div>

              {/* Info */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px',
                marginBottom: '16px',
                padding: '16px',
                background: 'var(--kem)',
                border: '1px solid rgba(15,14,12,0.1)'
              }}>
                <InfoItem label="Người tạo" value={`User #${d.raisedBy}`} />
                <InfoItem label="Bị kiện" value={`User #${d.againstUser}`} />
                <InfoItem label="Yêu cầu" value={d.claimedAmount ? `${formatPrice(d.claimedAmount)}đ` : '—'} />
                <InfoItem label="Ngày tạo" value={formatDate(d.createdAt)} />
              </div>

              {/* Resolution (nếu có) */}
              {d.resolution && (
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(74,93,63,0.08)',
                  borderLeft: '3px solid var(--xanh-reu)',
                  marginBottom: '16px',
                  fontFamily: 'var(--serif-2)',
                  fontStyle: 'italic',
                  fontSize: '15px'
                }}>
                  <strong>Kết quả:</strong> {d.resolution}
                  {d.resolvedAmount > 0 && (
                    <div style={{ color: 'var(--xanh-reu)', marginTop: '8px' }}>
                      💰 Bồi thường: {formatPrice(d.resolvedAmount)}đ
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                {(d.status === 'PENDING' || d.status === 'INVESTIGATING') && (
                  <>
                    <button
                      onClick={() => openEscalateModal(d)}
                      style={{
                        padding: '8px 18px',
                        background: 'transparent',
                        border: '1px solid var(--do)',
                        color: 'var(--do)',
                        fontFamily: 'var(--mono)',
                        fontSize: '10px',
                        letterSpacing: '1.5px',
                        textTransform: 'uppercase',
                        cursor: 'pointer'
                      }}
                    >
                      ⬆ Chuyển cấp
                    </button>
                    <button
                      onClick={() => openResolveModal(d)}
                      style={{
                        padding: '8px 18px',
                        background: 'var(--xanh-reu)',
                        border: '1px solid var(--xanh-reu)',
                        color: 'var(--kem)',
                        fontFamily: 'var(--mono)',
                        fontSize: '10px',
                        letterSpacing: '1.5px',
                        textTransform: 'uppercase',
                        cursor: 'pointer'
                      }}
                    >
                      ✓ Giải quyết
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== MODAL ===== */}
      {modalOpen && selectedDispute && (
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
              fontSize: '28px',
              fontWeight: 900,
              marginBottom: '8px'
            }}>
              {action === 'resolve' ? 'Giải quyết' : 'Chuyển cấp'}{' '}
              <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>tranh chấp.</em>
            </h2>
            <p style={{
              fontFamily: 'var(--mono)',
              fontSize: '11px',
              letterSpacing: '2px',
              color: 'var(--muc-mo)',
              marginBottom: '24px'
            }}>
              {selectedDispute.disputeCode} · Đơn #{selectedDispute.bookingId}
            </p>

            {/* Thông tin tranh chấp */}
            <div style={{
              padding: '16px',
              background: 'var(--kem-dam)',
              marginBottom: '24px',
              fontFamily: 'var(--serif-2)',
              fontStyle: 'italic',
              fontSize: '15px',
              lineHeight: 1.6
            }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>{categoryMap[selectedDispute.category] || selectedDispute.category}</strong>
              </div>
              <div>"{selectedDispute.description}"</div>
              {selectedDispute.claimedAmount > 0 && (
                <div style={{ marginTop: '8px', color: 'var(--do)' }}>
                  💰 Yêu cầu: {formatPrice(selectedDispute.claimedAmount)}đ
                </div>
              )}
            </div>

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

            <form onSubmit={handleSubmit}>
              {action === 'resolve' ? (
                <>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={labelStyle}>Kết quả giải quyết *</label>
                    <textarea
                      value={form.resolution}
                      onChange={e => setForm({ ...form, resolution: e.target.value })}
                      rows="4"
                      maxLength={2000}
                      placeholder="Ví dụ: Chủ xe vi phạm, bồi thường cho khách..."
                      style={{ ...inputStyle, resize: 'vertical', fontFamily: 'var(--serif-2)' }}
                    />
                  </div>

                  <div style={{ marginBottom: '32px' }}>
                    <label style={labelStyle}>Số tiền bồi thường (VNĐ)</label>
                    <input
                      type="number"
                      value={form.resolvedAmount}
                      onChange={e => setForm({ ...form, resolvedAmount: e.target.value })}
                      placeholder="0"
                      min="0"
                      style={inputStyle}
                    />
                  </div>
                </>
              ) : (
                <div style={{ marginBottom: '32px' }}>
                  <label style={labelStyle}>Lý do chuyển cấp *</label>
                  <textarea
                    value={form.reason}
                    onChange={e => setForm({ ...form, reason: e.target.value })}
                    rows="4"
                    maxLength={500}
                    placeholder="Ví dụ: Tranh chấp phức tạp, cần cấp cao hơn xử lý..."
                    style={{ ...inputStyle, resize: 'vertical', fontFamily: 'var(--serif-2)' }}
                  />
                </div>
              )}

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
                    background: action === 'resolve' ? 'var(--xanh-reu)' : 'var(--do)',
                    border: `1px solid ${action === 'resolve' ? 'var(--xanh-reu)' : 'var(--do)'}`,
                    color: 'var(--kem)',
                    fontFamily: 'var(--mono)',
                    fontSize: '11px',
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    cursor: submitting ? 'wait' : 'pointer'
                  }}
                >
                  {submitting ? 'Đang xử lý...' : (action === 'resolve' ? 'Xác nhận giải quyết' : 'Xác nhận chuyển cấp')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ===== COMPONENTS =====
function StatCard({ label, value, color = 'var(--muc)' }) {
  return (
    <div style={{
      background: 'var(--kem-dam)',
      border: '1px solid rgba(15,14,12,0.15)',
      padding: '24px',
      textAlign: 'center'
    }}>
      <div style={{
        fontFamily: 'var(--mono)',
        fontSize: '10px',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        color: 'var(--muc-mo)',
        marginBottom: '8px'
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--serif)',
        fontSize: '36px',
        fontWeight: 900,
        color,
        lineHeight: 1
      }}>
        {value}
      </div>
    </div>
  )
}

function InfoItem({ label, value }) {
  return (
    <div>
      <div style={{
        fontFamily: 'var(--mono)',
        fontSize: '9px',
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        color: 'var(--muc-mo)',
        marginBottom: '4px'
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--serif-2)',
        fontSize: '15px',
        color: 'var(--muc)',
        fontWeight: 500
      }}>
        {value}
      </div>
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