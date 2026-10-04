import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import api from '../services/api'

export default function DriverAssignmentPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [assignment, setAssignment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!token) {
      setError('Token không hợp lệ. Vui lòng kiểm tra lại link.')
      setLoading(false)
      return
    }
    loadAssignment()
  }, [id, token])

  const loadAssignment = async () => {
    try {
      const res = await api.get(`/driver/assignments/${id}?token=${token}`)
      setAssignment(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Không tải được thông tin chuyến')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    setActionLoading(true)
    try {
      const res = await api.post(`/driver/assignments/${id}/accept?token=${token}`)
      setResult({ type: 'success', message: 'Bạn đã nhận chuyến thành công!' })
      setAssignment(res.data.data)
    } catch (err) {
      setResult({ type: 'error', message: err.response?.data?.message || 'Có lỗi xảy ra' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    const reason = window.prompt('Lý do từ chối (không bắt buộc):', 'Tôi bận')
    if (reason === null) return

    setActionLoading(true)
    try {
      const res = await api.post(`/driver/assignments/${id}/reject?token=${token}&reason=${encodeURIComponent(reason)}`)
      setResult({ type: 'warning', message: 'Bạn đã từ chối chuyến. Hệ thống sẽ tìm tài xế khác.' })
      setAssignment(res.data.data)
    } catch (err) {
      setResult({ type: 'error', message: err.response?.data?.message || 'Có lỗi xảy ra' })
    } finally {
      setActionLoading(false)
    }
  }

  const formatDateTime = (dt) => {
    if (!dt) return '-'
    return new Date(dt).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'var(--dong)',
      ACCEPTED: 'var(--xanh-reu)',
      REJECTED: 'var(--do)',
      EXPIRED: 'var(--muc-mo)',
      CANCELLED: 'var(--muc-mo)',
    }
    return colors[status] || 'var(--muc)'
  }

  const getStatusLabel = (status) => {
    const labels = {
      PENDING: 'Chờ xác nhận',
      ACCEPTED: 'Đã nhận chuyến',
      REJECTED: 'Đã từ chối',
      EXPIRED: 'Hết hạn',
      CANCELLED: 'Đã hủy',
    }
    return labels[status] || status
  }

  // ===== LOADING =====
  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 48px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '20px', color: 'var(--muc-mo)' }}>
          Đang tải thông tin chuyến...
        </p>
      </div>
    )
  }

  // ===== ERROR =====
  if (error) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 48px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: '96px', fontWeight: 900, color: 'var(--do)', marginBottom: '16px' }}>
          !
        </h1>
        <p style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '22px', color: 'var(--muc-mo)', marginBottom: '24px' }}>
          {error}
        </p>
      </div>
    )
  }

  // ===== MAIN =====
  const isPending = assignment?.status === 'PENDING'
  const isExpired = assignment?.deadlineAt && new Date(assignment.deadlineAt) < new Date()

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 48px' }}>
      <div className="chapter-num" style={{ marginBottom: '24px' }}>Chương Phân Công — Chuyến Xe</div>
      <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900, letterSpacing: '-2px', marginBottom: '12px' }}>
        Chuyến <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>được giao.</em>
      </h1>
      <p style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '18px', color: 'var(--muc-mo)', marginBottom: '40px' }}>
        Vui lòng xác nhận trong vòng <strong>{isPending && !isExpired ? 'thời gian còn lại' : 'thời hạn'}</strong>
      </p>

      {/* ===== RESULT MESSAGE ===== */}
      {result && (
        <div style={{
          padding: '20px 24px',
          marginBottom: '32px',
          background: result.type === 'success' ? 'rgba(74,93,63,0.1)' :
                      result.type === 'warning' ? 'rgba(201,169,97,0.15)' :
                      'rgba(139,44,44,0.1)',
          border: `1px solid ${
            result.type === 'success' ? 'var(--xanh-reu)' :
            result.type === 'warning' ? 'var(--dong)' :
            'var(--do)'
          }`,
          color: result.type === 'success' ? 'var(--xanh-reu)' :
                 result.type === 'warning' ? 'var(--dong)' :
                 'var(--do)',
          fontFamily: 'var(--serif-2)',
          fontStyle: 'italic',
          fontSize: '18px',
          textAlign: 'center'
        }}>
          {result.message}
        </div>
      )}

      {/* ===== STATUS ===== */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        background: 'var(--kem-dam)',
        border: '1px solid rgba(15,14,12,0.15)',
        marginBottom: '32px'
      }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muc-mo)' }}>
          Trạng thái
        </span>
        <span style={{
          padding: '6px 16px',
          border: `1px solid ${getStatusColor(assignment?.status)}`,
          color: getStatusColor(assignment?.status),
          fontFamily: 'var(--mono)',
          fontSize: '11px',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          fontWeight: 600
        }}>
          {getStatusLabel(assignment?.status)}
        </span>
      </div>

      {/* ===== BOOKING INFO ===== */}
      <div style={{ background: 'var(--kem-dam)', border: '1px solid var(--muc)', padding: '32px', marginBottom: '32px' }}>
        <h3 style={{ fontFamily: 'var(--serif)', fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>
          Thông tin chuyến
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          <InfoRow label="Mã đơn" value={`#${assignment?.bookingId}`} />
          <InfoRow label="Cỗ xe" value={assignment?.carName} />
          <InfoRow label="Biển số" value={assignment?.carPlate} />
          <InfoRow label="Khách hàng" value={assignment?.customerName} />
        </div>

        <div style={{ height: '1px', background: 'rgba(15,14,12,0.15)', margin: '24px 0' }}></div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          <InfoRow label="Nhận xe" value={formatDateTime(assignment?.startDate)} />
          <InfoRow label="Trả xe" value={formatDateTime(assignment?.endDate)} />
        </div>

        <InfoRow label="Địa điểm nhận" value={assignment?.pickupAddress} />

        <div style={{ height: '1px', background: 'rgba(15,14,12,0.15)', margin: '24px 0' }}></div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <InfoRow label="Hạn phản hồi" value={formatDateTime(assignment?.deadlineAt)} />
          <InfoRow label="Phản hồi lúc" value={assignment?.respondedAt ? formatDateTime(assignment.respondedAt) : '—'} />
        </div>
      </div>

      {/* ===== ACTION BUTTONS ===== */}
      {isPending && !isExpired && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <button
            onClick={handleReject}
            disabled={actionLoading}
            style={{
              padding: '20px',
              background: 'transparent',
              border: '2px solid var(--do)',
              color: 'var(--do)',
              fontFamily: 'var(--mono)',
              fontSize: '13px',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              fontWeight: 600,
              cursor: actionLoading ? 'wait' : 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--do)'; e.currentTarget.style.color = 'var(--kem)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--do)' }}
          >
            {actionLoading ? '...' : 'Từ chối'}
          </button>

          <button
            onClick={handleAccept}
            disabled={actionLoading}
            style={{
              padding: '20px',
              background: 'var(--muc)',
              border: '2px solid var(--muc)',
              color: 'var(--kem)',
              fontFamily: 'var(--mono)',
              fontSize: '13px',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              fontWeight: 600,
              cursor: actionLoading ? 'wait' : 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--xanh-reu)'; e.currentTarget.style.borderColor = 'var(--xanh-reu)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--muc)'; e.currentTarget.style.borderColor = 'var(--muc)' }}
          >
            {actionLoading ? '...' : 'Nhận chuyến'}
          </button>
        </div>
      )}

      {/* ===== EXPIRED / NOT PENDING ===== */}
      {(!isPending || isExpired) && !result && (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          background: 'var(--kem-dam)',
          border: '1px solid rgba(15,14,12,0.15)',
          fontFamily: 'var(--serif-2)',
          fontStyle: 'italic',
          color: 'var(--muc-mo)'
        }}>
          {isExpired && assignment?.status === 'PENDING'
            ? 'Chuyến đã hết hạn phản hồi.'
            : 'Chuyến này đã được xử lý.'}
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div>
      <div style={{
        fontFamily: 'var(--mono)',
        fontSize: '10px',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        color: 'var(--muc-mo)',
        marginBottom: '6px'
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--serif-2)',
        fontSize: '17px',
        color: 'var(--muc)',
        fontWeight: 500
      }}>
        {value || '—'}
      </div>
    </div>
  )
}