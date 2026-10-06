import { useState, useEffect } from 'react'
import {
  getAllWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
} from '../services/withdrawalService'

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('PENDING')
  const [message, setMessage] = useState('')

  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  const [rejectModal, setRejectModal] = useState(false)
  const [rejectingItem, setRejectingItem] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectSubmitting, setRejectSubmitting] = useState(false)
  const [rejectError, setRejectError] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getAllWithdrawals(filter || null)
      setWithdrawals(res.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filter])

  useEffect(() => {
    setCurrentPage(1)
  }, [filter])

  const handleApprove = async (item) => {
    const displayAmount = item.netAmount || item.amount
    const txId = window.prompt(
      `Duyệt yêu cầu rút #${item.id}?\n\n` +
      `Số tiền yêu cầu: ${formatPrice(item.amount)}đ\n` +
      `Phí rút: ${formatPrice(item.fee || 0)}đ\n` +
      `→ Chuyển khoản: ${formatPrice(displayAmount)}đ\n\n` +
      `Nhập mã giao dịch (không bắt buộc):`,
      'TXN_' + Date.now()
    )
    if (txId === null) return

    try {
      await approveWithdrawal(item.id, txId || null)
      setMessage(`✅ Đã duyệt yêu cầu #${item.id}`)
      fetchData()
      setTimeout(() => setMessage(''), 4000)
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message))
    }
  }

  const openRejectModal = (item) => {
    setRejectingItem(item)
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
      await rejectWithdrawal(rejectingItem.id, rejectReason.trim())
      setMessage(`✅ Đã từ chối yêu cầu #${rejectingItem.id}`)
      setRejectModal(false)
      fetchData()
      setTimeout(() => setMessage(''), 4000)
    } catch (err) {
      setRejectError(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setRejectSubmitting(false)
    }
  }

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN').format(p || 0)
  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—'

  const statusMap = {
    PENDING: { label: 'Chờ duyệt', color: 'var(--dong)' },
    APPROVED: { label: 'Đã duyệt', color: 'var(--xanh-ngoc)' },
    PROCESSING: { label: 'Đang xử lý', color: 'var(--xanh-ngoc)' },
    COMPLETED: { label: 'Đã chuyển', color: 'var(--xanh-reu)' },
    REJECTED: { label: 'Bị từ chối', color: 'var(--do)' },
  }

  const totalPages = Math.ceil(withdrawals.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const currentItems = withdrawals.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const pendingCount = withdrawals.filter((w) => w.status === 'PENDING').length

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '60px 48px' }}>
      <div className="chapter-num" style={{ marginBottom: '24px' }}>
        Chương Quản Trị — Duyệt Rút Tiền
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: '40px',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 'clamp(36px, 5vw, 56px)',
              fontWeight: 900,
              letterSpacing: '-2px',
              margin: 0,
            }}
          >
            Duyệt{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>rút tiền.</em>
          </h1>
          {pendingCount > 0 && (
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: '11px',
                letterSpacing: '2px',
                color: 'var(--do)',
                marginTop: '12px',
              }}
            >
              {pendingCount} YÊU CẦU ĐANG CHỜ
            </div>
          )}
        </div>
      </div>

      {message && (
        <div
          style={{
            background: 'rgba(74,93,63,0.1)',
            border: '1px solid var(--xanh-reu)',
            padding: '12px 16px',
            marginBottom: '24px',
            color: 'var(--xanh-reu)',
            fontFamily: 'var(--serif-2)',
            fontStyle: 'italic',
          }}
        >
          {message}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '40px',
          flexWrap: 'wrap',
        }}
      >
        {[
          { v: 'PENDING', l: 'Chờ duyệt' },
          { v: 'COMPLETED', l: 'Đã chuyển' },
          { v: 'REJECTED', l: 'Bị từ chối' },
          { v: '', l: 'Tất cả' },
        ].map((opt) => (
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
              cursor: 'pointer',
            }}
          >
            {opt.l}
          </button>
        ))}
      </div>

      {loading ? (
        <p
          style={{
            textAlign: 'center',
            fontFamily: 'var(--serif-2)',
            fontStyle: 'italic',
            padding: '40px',
          }}
        >
          Đang tải...
        </p>
      ) : withdrawals.length === 0 ? (
        <p
          style={{
            textAlign: 'center',
            fontFamily: 'var(--serif-2)',
            fontStyle: 'italic',
            padding: '40px',
            color: 'var(--muc-mo)',
          }}
        >
          Không có yêu cầu nào.
        </p>
      ) : (
        <>
          <div>
            {currentItems.map((w) => {
              const fee = w.fee || 0
              const netAmount = w.netAmount || w.amount
              const hasFee = fee > 0

              return (
                <div
                  key={w.id}
                  style={{
                    padding: '24px',
                    marginBottom: '16px',
                    background: 'var(--kem-dam)',
                    border: '1px solid rgba(15,14,12,0.15)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '16px',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontFamily: 'var(--mono)',
                          fontSize: '11px',
                          letterSpacing: '2px',
                          color: 'var(--muc-mo)',
                          marginBottom: '8px',
                        }}
                      >
                        Yêu cầu #{w.id} · Owner #{w.ownerId} · {formatDate(w.createdAt)}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--serif)',
                          fontSize: '36px',
                          fontWeight: 900,
                          color: 'var(--do)',
                          letterSpacing: '-1px',
                        }}
                      >
                        {formatPrice(w.amount)}đ
                      </div>
                      {hasFee && (
                        <div
                          style={{
                            fontFamily: 'var(--mono)',
                            fontSize: '11px',
                            letterSpacing: '1px',
                            color: 'var(--muc-mo)',
                            marginTop: '6px',
                          }}
                        >
                          Phí: {formatPrice(fee)}đ →{' '}
                          <strong style={{ color: 'var(--xanh-reu)' }}>
                            Chuyển khoản: {formatPrice(netAmount)}đ
                          </strong>
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        padding: '6px 14px',
                        border: `1px solid ${statusMap[w.status]?.color || 'var(--muc-mo)'}`,
                        color: statusMap[w.status]?.color || 'var(--muc-mo)',
                        fontFamily: 'var(--mono)',
                        fontSize: '10px',
                        letterSpacing: '2px',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {statusMap[w.status]?.label || w.status}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '16px',
                      padding: '16px',
                      background: 'var(--kem)',
                      borderLeft: '3px solid var(--dong)',
                      marginBottom: '16px',
                    }}
                  >
                    <InfoRow label="Ngân hàng" value={w.bankName} />
                    <InfoRow label="Số TK" value={w.bankAccount} />
                    <InfoRow label="Chủ TK" value={w.accountHolder} />
                  </div>

                  {w.status === 'COMPLETED' && (
                    <div
                      style={{
                        padding: '12px 16px',
                        background: 'rgba(74,93,63,0.08)',
                        borderLeft: '3px solid var(--xanh-reu)',
                        fontFamily: 'var(--mono)',
                        fontSize: '12px',
                        color: 'var(--xanh-reu)',
                        marginBottom: '16px',
                      }}
                    >
                      ✓ Đã duyệt lúc {formatDate(w.processedAt)}
                      {w.transactionId && ` · Mã GD: ${w.transactionId}`}
                      {hasFee && ` · Đã chuyển: ${formatPrice(netAmount)}đ`}
                    </div>
                  )}

                  {w.status === 'REJECTED' && (
                    <div
                      style={{
                        padding: '12px 16px',
                        background: 'rgba(139,44,44,0.1)',
                        borderLeft: '3px solid var(--do)',
                        fontFamily: 'var(--serif-2)',
                        fontStyle: 'italic',
                        fontSize: '14px',
                        color: 'var(--do)',
                        marginBottom: '16px',
                      }}
                    >
                      <strong>Lý do:</strong> {w.rejectReason || 'Không có'}
                    </div>
                  )}

                  {w.status === 'PENDING' && (
                    <div
                      style={{
                        display: 'flex',
                        gap: '12px',
                        justifyContent: 'flex-end',
                        paddingTop: '16px',
                        borderTop: '1px solid rgba(15,14,12,0.1)',
                      }}
                    >
                      <button
                        onClick={() => handleApprove(w)}
                        style={btnStyle('var(--xanh-reu)', 'var(--kem)')}
                      >
                        ✓ Duyệt & Chuyển {formatPrice(netAmount)}đ
                      </button>
                      <button
                        onClick={() => openRejectModal(w)}
                        style={btnStyle('var(--do)', 'var(--kem)')}
                      >
                        ✕ Từ chối
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {totalPages > 1 && (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '32px',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={paginationBtnStyle(currentPage === 1)}
                >
                  ← Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    style={paginationNumStyle(currentPage === p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={paginationBtnStyle(currentPage === totalPages)}
                >
                  Sau →
                </button>
              </div>
              <div
                style={{
                  textAlign: 'center',
                  fontFamily: 'var(--mono)',
                  fontSize: '11px',
                  color: 'var(--muc-mo)',
                  marginTop: '16px',
                  marginBottom: '24px',
                }}
              >
                Trang {currentPage} / {totalPages} · Tổng {withdrawals.length} yêu cầu
              </div>
            </>
          )}
        </>
      )}

      {rejectModal && rejectingItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,14,12,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px',
          }}
          onClick={() => setRejectModal(false)}
        >
          <div
            style={{
              background: 'var(--kem)',
              border: '1px solid var(--muc)',
              maxWidth: '500px',
              width: '100%',
              padding: '48px',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setRejectModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '40px',
                height: '40px',
                background: 'transparent',
                border: '1px solid var(--muc)',
                color: 'var(--muc)',
                fontFamily: 'var(--mono)',
                fontSize: '18px',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>

            <h2
              style={{
                fontFamily: 'var(--serif)',
                fontSize: '28px',
                fontWeight: 900,
                marginBottom: '8px',
                paddingRight: '48px',
              }}
            >
              Từ chối yêu cầu.
            </h2>
            <p
              style={{
                fontFamily: 'var(--mono)',
                fontSize: '11px',
                letterSpacing: '2px',
                color: 'var(--muc-mo)',
                marginBottom: '24px',
              }}
            >
              Yêu cầu #{rejectingItem.id} · Owner #{rejectingItem.ownerId}
            </p>

            {rejectError && (
              <div
                style={{
                  background: 'rgba(139,44,44,0.1)',
                  border: '1px solid var(--do)',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  color: 'var(--do)',
                  fontFamily: 'var(--serif-2)',
                  fontStyle: 'italic',
                }}
              >
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
                placeholder="VD: Số tài khoản không chính chủ..."
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'var(--kem-dam)',
                  border: '1px solid rgba(15,14,12,0.2)',
                  fontFamily: 'var(--serif-2)',
                  fontSize: '16px',
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <div
                style={{
                  textAlign: 'right',
                  fontFamily: 'var(--mono)',
                  fontSize: '10px',
                  color: 'var(--muc-mo)',
                  marginTop: '4px',
                }}
              >
                {rejectReason.length}/500
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setRejectModal(false)}
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
                    cursor: 'pointer',
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={rejectSubmitting}
                  style={{
                    flex: 2,
                    padding: '16px',
                    background: 'var(--do)',
                    border: 'none',
                    color: 'var(--kem)',
                    fontFamily: 'var(--mono)',
                    fontSize: '11px',
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    cursor: rejectSubmitting ? 'wait' : 'pointer',
                  }}
                >
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

function InfoRow({ label, value }) {
  return (
    <div>
      <div
        style={{
          fontFamily: 'var(--mono)',
          fontSize: '9px',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          color: 'var(--muc-mo)',
          marginBottom: '4px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--serif-2)',
          fontSize: '16px',
          color: 'var(--muc)',
          fontWeight: 500,
        }}
      >
        {value || '—'}
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
  marginBottom: '8px',
}

function btnStyle(bg, color) {
  return {
    padding: '10px 18px',
    background: bg,
    color,
    border: `1px solid ${bg}`,
    fontFamily: 'var(--mono)',
    fontSize: '10px',
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
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
    opacity: disabled ? 0.4 : 1,
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
    minWidth: '40px',
  }
}