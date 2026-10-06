import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  createWithdrawal,
  getMyWithdrawals,
  getBalanceInfo,
} from '../services/withdrawalService'

export default function OwnerWithdrawalsPage() {
  const [balanceInfo, setBalanceInfo] = useState(null)
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })

  // ===== MODAL TẠO =====
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    amount: '',
    bankName: '',
    bankAccount: '',
    accountHolder: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  // ===== PHÂN TRANG =====
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  // ===== FETCH =====
  const fetchData = async () => {
    setLoading(true)
    try {
      const [balanceRes, listRes] = await Promise.all([
        getBalanceInfo(),
        getMyWithdrawals(),
      ])
      setBalanceInfo(balanceRes.data)
      setWithdrawals(listRes.data || [])
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: 'Không tải được dữ liệu' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [filter])

  // ===== SUBMIT =====
  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    // Validate
    const amount = parseInt(form.amount)
    if (!amount || amount < 100000) {
      return setFormError('Số tiền rút tối thiểu 100.000đ')
    }
    if (balanceInfo && amount > balanceInfo.availableBalance) {
      return setFormError(`Số dư không đủ. Hiện có: ${formatPrice(balanceInfo.availableBalance)}đ`)
    }
    if (!form.bankName.trim()) return setFormError('Vui lòng nhập tên ngân hàng')
    if (!form.bankAccount.trim()) return setFormError('Vui lòng nhập số tài khoản')
    if (!form.accountHolder.trim()) return setFormError('Vui lòng nhập tên chủ tài khoản')

    setSubmitting(true)
    try {
      await createWithdrawal({
        amount,
        bankName: form.bankName.trim(),
        bankAccount: form.bankAccount.trim(),
        accountHolder: form.accountHolder.trim().toUpperCase(),
      })
      setMessage({ type: 'success', text: 'Đã gửi yêu cầu rút tiền thành công!' })
      setModalOpen(false)
      fetchData()
      setTimeout(() => setMessage({ type: '', text: '' }), 5000)
    } catch (err) {
      setFormError(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setSubmitting(false)
    }
  }

  const openModal = () => {
    setForm({
      amount: '',
      bankName: '',
      bankAccount: '',
      accountHolder: '',
    })
    setFormError('')
    setModalOpen(true)
  }

  // ===== UTILS =====
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
    COMPLETED: { label: 'Đã chuyển khoản', color: 'var(--xanh-reu)' },
    REJECTED: { label: 'Bị từ chối', color: 'var(--do)' },
  }

  const filtered = filter
    ? withdrawals.filter((w) => w.status === filter)
    : withdrawals

  // ===== PHÂN TRANG =====
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const currentItems = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 48px' }}>
      <Link
        to="/owner/dashboard"
        style={{
          fontFamily: 'var(--mono)',
          fontSize: '11px',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: 'var(--muc-mo)',
          display: 'inline-block',
          marginBottom: '24px',
        }}
      >
        ← Về doanh thu
      </Link>

      <div className="chapter-num" style={{ marginBottom: '24px' }}>
        Chương Chủ Xe — Rút Tiền
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: '40px',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--serif)',
            fontSize: 'clamp(36px, 5vw, 56px)',
            fontWeight: 900,
            letterSpacing: '-2px',
            margin: 0,
          }}
        >
          Rút <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>tiền.</em>
        </h1>
        <button
          onClick={openModal}
          disabled={!balanceInfo || balanceInfo.availableBalance < 100000}
          style={{
            padding: '14px 28px',
            background: 'var(--do)',
            color: 'var(--kem)',
            border: 'none',
            fontFamily: 'var(--mono)',
            fontSize: '11px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            cursor: !balanceInfo || balanceInfo.availableBalance < 100000 ? 'not-allowed' : 'pointer',
            opacity: !balanceInfo || balanceInfo.availableBalance < 100000 ? 0.5 : 1,
          }}
        >
          + Yêu cầu rút tiền
        </button>
      </div>

      {message.text && (
        <div
          style={{
            background:
              message.type === 'success'
                ? 'rgba(74,93,63,0.1)'
                : 'rgba(139,44,44,0.1)',
            border: `1px solid ${message.type === 'success' ? 'var(--xanh-reu)' : 'var(--do)'}`,
            padding: '12px 16px',
            marginBottom: '24px',
            color: message.type === 'success' ? 'var(--xanh-reu)' : 'var(--do)',
            fontFamily: 'var(--serif-2)',
            fontStyle: 'italic',
          }}
        >
          {message.text}
        </div>
      )}

      {/* ===== BALANCE INFO ===== */}
      {balanceInfo && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px',
            marginBottom: '40px',
          }}
        >
          <StatCard
            label="Tổng thu nhập"
            value={`${formatPrice(balanceInfo.totalIncome)}đ`}
          />
          <StatCard
            label="Đang chờ rút"
            value={`${formatPrice(balanceInfo.pendingWithdrawal)}đ`}
            color="var(--dong)"
          />
          <StatCard
            label="Số dư khả dụng"
            value={`${formatPrice(balanceInfo.availableBalance)}đ`}
            color="var(--xanh-reu)"
          />
        </div>
      )}

      {/* ===== FILTER ===== */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
        {[
          { v: '', l: 'Tất cả' },
          { v: 'PENDING', l: 'Chờ duyệt' },
          { v: 'COMPLETED', l: 'Đã chuyển' },
          { v: 'REJECTED', l: 'Bị từ chối' },
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

      {/* ===== LIST ===== */}
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
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <p
            style={{
              fontFamily: 'var(--serif-2)',
              fontStyle: 'italic',
              fontSize: '24px',
              color: 'var(--muc-mo)',
            }}
          >
            Chưa có yêu cầu rút tiền nào.
          </p>
        </div>
      ) : (
        <>
          <div>
            {currentItems.map((w) => (
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
                      Yêu cầu #{w.id} · {formatDate(w.createdAt)}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--serif)',
                        fontSize: '32px',
                        fontWeight: 900,
                        color: 'var(--do)',
                        letterSpacing: '-1px',
                      }}
                    >
                      {formatPrice(w.amount)}đ
                    </div>
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
                  }}
                >
                  <InfoRow label="Ngân hàng" value={w.bankName} />
                  <InfoRow label="Số TK" value={w.bankAccount} />
                  <InfoRow label="Chủ TK" value={w.accountHolder} />
                </div>

                {w.status === 'COMPLETED' && w.transactionId && (
                  <div
                    style={{
                      marginTop: '12px',
                      fontFamily: 'var(--mono)',
                      fontSize: '11px',
                      color: 'var(--xanh-reu)',
                    }}
                  >
                    ✓ Mã giao dịch: {w.transactionId}
                  </div>
                )}

                {w.status === 'REJECTED' && w.rejectReason && (
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '12px 16px',
                      background: 'rgba(139,44,44,0.1)',
                      borderLeft: '3px solid var(--do)',
                      fontFamily: 'var(--serif-2)',
                      fontStyle: 'italic',
                      fontSize: '14px',
                      color: 'var(--do)',
                    }}
                  >
                    <strong>Lý do từ chối:</strong> {w.rejectReason}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* PHÂN TRANG */}
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
                Trang {currentPage} / {totalPages} · Tổng {filtered.length} yêu cầu
              </div>
            </>
          )}
        </>
      )}

      {/* ===== MODAL TẠO ===== */}
      {modalOpen && (
        <Modal title="Yêu cầu rút tiền." onClose={() => setModalOpen(false)}>
          {formError && <ErrorAlert message={formError} />}

          {balanceInfo && (
            <div
              style={{
                padding: '16px',
                background: 'rgba(74,93,63,0.08)',
                borderLeft: '3px solid var(--xanh-reu)',
                marginBottom: '24px',
                fontFamily: 'var(--serif-2)',
                fontStyle: 'italic',
              }}
            >
              Số dư khả dụng:{' '}
              <strong style={{ color: 'var(--xanh-reu)' }}>
                {formatPrice(balanceInfo.availableBalance)}đ
              </strong>
              <br />
              <span style={{ fontSize: '14px', color: 'var(--muc-mo)' }}>
                Số tiền rút tối thiểu: 100.000đ
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <FormInput
              label="Số tiền rút (VNĐ) *"
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="100000"
              min="100000"
              step="1000"
            />

            <FormInput
              label="Tên ngân hàng *"
              value={form.bankName}
              onChange={(e) => setForm({ ...form, bankName: e.target.value })}
              placeholder="Vietcombank, Techcombank, BIDV..."
            />

            <FormInput
              label="Số tài khoản *"
              value={form.bankAccount}
              onChange={(e) => setForm({ ...form, bankAccount: e.target.value })}
              placeholder="1234567890"
            />

            <FormInput
              label="Tên chủ tài khoản *"
              value={form.accountHolder}
              onChange={(e) => setForm({ ...form, accountHolder: e.target.value })}
              placeholder="NGUYEN VAN A"
            />

            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(201,169,97,0.1)',
                borderLeft: '3px solid var(--dong)',
                marginBottom: '24px',
                fontFamily: 'var(--serif-2)',
                fontStyle: 'italic',
                fontSize: '13px',
                color: 'var(--muc-mo)',
              }}
            >
              ⚠️ Vui lòng kiểm tra kỹ thông tin tài khoản. Hệ thống không chịu
              trách nhiệm nếu thông tin sai.
            </div>

            <ModalActions
              onCancel={() => setModalOpen(false)}
              submitLabel={submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
              submitting={submitting}
            />
          </form>
        </Modal>
      )}
    </div>
  )
}

// ===== COMPONENTS =====
function StatCard({ label, value, color = 'var(--muc)' }) {
  return (
    <div
      style={{
        background: 'var(--kem-dam)',
        border: '1px solid rgba(15,14,12,0.15)',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--mono)',
          fontSize: '10px',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: 'var(--muc-mo)',
          marginBottom: '12px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--serif)',
          fontSize: '28px',
          fontWeight: 900,
          color,
          letterSpacing: '-1px',
        }}
      >
        {value}
      </div>
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

function Modal({ title, onClose, children }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,14,12,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--kem)',
          border: '1px solid var(--muc)',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '48px',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>
        <h2
          style={{
            fontFamily: 'var(--serif)',
            fontSize: '32px',
            fontWeight: 900,
            marginBottom: '32px',
            paddingRight: '48px',
          }}
        >
          {title}
        </h2>
        {children}
      </div>
    </div>
  )
}

function ErrorAlert({ message }) {
  return (
    <div
      style={{
        background: 'rgba(139,44,44,0.1)',
        border: '1px solid var(--do)',
        padding: '12px 16px',
        marginBottom: '24px',
        color: 'var(--do)',
        fontFamily: 'var(--serif-2)',
        fontStyle: 'italic',
      }}
    >
      {message}
    </div>
  )
}

function FormInput({ label, ...props }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={labelStyle}>{label}</label>
      <input {...props} style={inputStyle} />
    </div>
  )
}

function ModalActions({ onCancel, submitLabel, submitting }) {
  return (
    <div style={{ display: 'flex', gap: '12px' }}>
      <button
        type="button"
        onClick={onCancel}
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
          cursor: submitting ? 'wait' : 'pointer',
        }}
      >
        {submitLabel}
      </button>
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

const inputStyle = {
  width: '100%',
  padding: '14px',
  background: 'var(--kem-dam)',
  border: '1px solid rgba(15,14,12,0.2)',
  fontFamily: 'var(--serif-2)',
  fontSize: '16px',
  outline: 'none',
  boxSizing: 'border-box',
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