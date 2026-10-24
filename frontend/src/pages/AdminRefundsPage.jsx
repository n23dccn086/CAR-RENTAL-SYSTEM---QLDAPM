import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useDialog } from '../context/DialogContext'

export default function AdminRefundsPage() {
  const { confirm, prompt, alert: dialogAlert } = useDialog()
  const [refunds, setRefunds] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [msg, setMsg] = useState('')

  // Modal xem chi tiết
  const [selectedRefund, setSelectedRefund] = useState(null)
  const [detailBooking, setDetailBooking] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Phân trang
  const [currentPage, setCurrentPage] = useState(0)
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

  useEffect(() => {
    setCurrentPage(0)
  }, [filter])

  const showMessage = (msg) => {
    setMsg(msg)
    setTimeout(() => setMsg(''), 4000)
  }

  const openDetail = async (refund) => {
    setSelectedRefund(refund)
    setDetailBooking(null)
    setLoadingDetail(true)
    try {
      const res = await api.get(`/bookings/${refund.bookingId}`)
      setDetailBooking(res.data.data)
    } catch (err) {
      console.error('Lỗi tải chi tiết booking:', err)
    } finally {
      setLoadingDetail(false)
    }
  }

  const closeDetail = () => {
    setSelectedRefund(null)
    setDetailBooking(null)
  }

  const handleApprove = async (id) => {
    const ok = await confirm({
      title: `Duyệt hoàn tiền #${id}`,
      subtitle: "Phê duyệt tài chính",
      message: `Xác nhận duyệt hoàn tiền cho yêu cầu refund #${id}? Số tiền cọc sẽ được chuyển hoàn lại cho khách hàng.`,
      confirmText: "Xác nhận duyệt",
      variant: "success",
    })
    if (!ok) return
    try {
      await api.put(`/admin/refunds/${id}/approve`)
      showMessage(`Đã duyệt hoàn tiền #${id}`)
      if (selectedRefund?.id === id) {
        setSelectedRefund(prev => ({ ...prev, status: 'SUCCESS' }))
      }
      fetchRefunds()
    } catch (err) {
      dialogAlert({
        title: "Lỗi duyệt hoàn tiền",
        message: err.response?.data?.message || err.message,
        variant: "danger"
      })
    }
  }

  const handleReject = async (id) => {
    const reason = await prompt({
      title: `Không duyệt hoàn tiền #${id}`,
      subtitle: "Ghi chú không duyệt",
      message: "Vui lòng nhập lý do không duyệt hoàn tiền để gửi thông báo giải trình cho khách hàng và lưu trữ hồ sơ:",
      inputLabel: "Lý do không duyệt / từ chối *",
      placeholder: "Nhập lý do chi tiết (ví dụ: Không duyệt hoàn cọc do thời gian hủy vi phạm quy chế cọc, hủy sau giờ nhận xe...)",
      required: true,
      confirmText: "Xác nhận không duyệt",
      variant: "danger",
    })
    if (!reason) return
    try {
      await api.put(`/admin/refunds/${id}/reject?reason=${encodeURIComponent(reason)}`)
      showMessage(`Đã từ chối / không duyệt hoàn tiền #${id}`)
      if (selectedRefund?.id === id) {
        setSelectedRefund(prev => ({ ...prev, status: 'CANCELLED' }))
      }
      fetchRefunds()
    } catch (err) {
      dialogAlert({
        title: "Lỗi xử lý",
        message: err.response?.data?.message || err.message,
        variant: "danger"
      })
    }
  }

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN').format(p || 0)

  const formatDateTime = (d) => {
    if (!d) return '—'
    try {
      return new Date(d).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return d
    }
  }

  const statusColors = {
    PENDING: 'var(--dong)',
    SUCCESS: 'var(--xanh-reu)',
    CANCELLED: 'var(--do)',
  }

  const statusLabels = {
    PENDING: 'Chờ duyệt',
    SUCCESS: 'Đã hoàn',
    CANCELLED: 'Không duyệt',
  }

  const goToPage = (p) => {
    if (p >= 0 && p < totalPages) {
      setCurrentPage(p)
    }
  }

  // Phân tích ai hủy đơn
  const getCancelPartyInfo = (booking, refund) => {
    const reason = booking?.cancelReason || refund?.reason || ''
    const rLower = reason.toLowerCase()

    if (rLower.includes('chủ xe hủy') || rLower.startsWith('chủ xe')) {
      return {
        party: 'CHỦ XE HỦY ĐƠN',
        badgeColor: 'var(--do)',
        note: 'Trách nhiệm thuộc bên Chủ xe — Khách hàng được bảo đảm quyền lợi hoàn trả 100% tiền cọc.',
        isOwner: true
      }
    }

    if (rLower.includes('hệ thống tự động') || rLower.includes('quá hạn')) {
      return {
        party: 'HỆ THỐNG TỰ ĐỘNG HỦY',
        badgeColor: 'var(--muc-mo)',
        note: 'Đơn bị hủy tự động do hết hạn thanh toán cọc hoặc hết hạn duyệt đơn.',
        isSystem: true
      }
    }

    return {
      party: 'KHÁCH HÀNG HỦY ĐƠN',
      badgeColor: 'var(--dong)',
      note: 'Khách hàng chủ động hủy đơn — Đối chiếu mốc thời gian hủy so với giờ bắt đầu nhận xe theo quy chế hoàn cọc.',
      isCustomer: true
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

      {/* Tabs filter */}
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
                gridTemplateColumns: '70px 1fr 140px 130px 240px',
                gap: '20px',
                alignItems: 'center',
                padding: '20px 0',
                borderBottom: '1px solid rgba(15,14,12,0.12)'
              }}>
                <div style={{
                  fontFamily: 'var(--serif)',
                  fontSize: '22px',
                  fontWeight: 700,
                  color: 'var(--dong)'
                }}>
                  #{r.id}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontFamily: 'var(--serif)', fontSize: '18px', fontWeight: 700 }}>
                      Booking #{r.bookingId}
                    </span>
                    {r.reason && (r.reason.toLowerCase().includes('chủ xe') ? (
                      <span style={{
                        fontFamily: 'var(--mono)',
                        fontSize: '9px',
                        padding: '2px 6px',
                        background: 'rgba(139,44,44,0.1)',
                        color: 'var(--do)',
                        fontWeight: 700,
                        letterSpacing: '0.5px'
                      }}>
                        Chủ xe hủy
                      </span>
                    ) : (
                      <span style={{
                        fontFamily: 'var(--mono)',
                        fontSize: '9px',
                        padding: '2px 6px',
                        background: 'rgba(201,169,97,0.15)',
                        color: 'var(--dong)',
                        fontWeight: 700,
                        letterSpacing: '0.5px'
                      }}>
                        Khách hủy
                      </span>
                    ))}
                  </div>
                  <div style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '14px', color: 'var(--muc-mo)' }}>
                    {r.reason || 'Yêu cầu hoàn tiền'}
                  </div>
                </div>

                <div style={{ fontFamily: 'var(--mono)', fontSize: '18px', fontWeight: 600 }}>
                  {formatPrice(r.amount)}đ
                </div>

                <div style={{
                  padding: '4px 8px',
                  border: `1px solid ${statusColors[r.status] || 'var(--muc-mo)'}`,
                  color: statusColors[r.status] || 'var(--muc-mo)',
                  fontFamily: 'var(--mono)',
                  fontSize: '9px',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  textAlign: 'center'
                }}>
                  {statusLabels[r.status] || r.status}
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => openDetail(r)}
                    style={{
                      padding: '7px 12px',
                      background: 'transparent',
                      border: '1px solid var(--muc)',
                      color: 'var(--muc)',
                      fontFamily: 'var(--mono)',
                      fontSize: '10px',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Xem chi tiết
                  </button>

                  {r.status === 'PENDING' && (
                    <>
                      <button onClick={() => handleApprove(r.id)} style={btnStyle('var(--xanh-reu)')}>
                        Duyệt
                      </button>
                      <button onClick={() => handleReject(r.id)} style={btnStyle('var(--do)')}>
                        Không duyệt
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
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
          )}
        </>
      )}

      {/* ===== POPUP MODAL XEM CHI TIẾT HOÀN TIỀN ===== */}
      {selectedRefund && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,14,12,0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div style={{
            background: 'var(--kem)',
            border: '2px solid var(--muc)',
            width: '100%',
            maxWidth: '720px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '36px 40px',
            boxShadow: '0 25px 70px rgba(0,0,0,0.3)',
            position: 'relative'
          }}>
            {/* Header modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(15,14,12,0.15)', paddingBottom: '16px', marginBottom: '24px' }}>
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muc-mo)', marginBottom: '4px' }}>
                  Hồ sơ đối soát hoàn cọc
                </div>
                <h3 style={{ fontFamily: 'var(--serif)', fontSize: '26px', fontWeight: 900, margin: 0 }}>
                  Yêu cầu hoàn tiền #{selectedRefund.id}
                </h3>
                <div style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '14px', color: 'var(--muc-mo)', marginTop: '4px' }}>
                  Liên kết Đơn đặt xe #{selectedRefund.bookingId} · Trạng thái:{' '}
                  <span style={{ color: statusColors[selectedRefund.status], fontWeight: 700, fontStyle: 'normal' }}>
                    {statusLabels[selectedRefund.status] || selectedRefund.status}
                  </span>
                </div>
              </div>

              <button
                onClick={closeDetail}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '28px',
                  lineHeight: 1,
                  cursor: 'pointer',
                  color: 'var(--muc-mo)'
                }}
              >
                ×
              </button>
            </div>

            {loadingDetail ? (
              <p style={{ textAlign: 'center', fontFamily: 'var(--serif-2)', fontStyle: 'italic', padding: '40px' }}>
                Đang tải dữ liệu đơn hàng...
              </p>
            ) : detailBooking ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* 1. Bên nào hủy đơn & Nguyên do */}
                {(() => {
                  const partyInfo = getCancelPartyInfo(detailBooking, selectedRefund)
                  return (
                    <div style={{
                      background: 'rgba(15,14,12,0.03)',
                      border: `1px solid ${partyInfo.badgeColor}`,
                      padding: '16px 20px',
                      borderRadius: '0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{
                          fontFamily: 'var(--mono)',
                          fontSize: '11px',
                          letterSpacing: '1px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          background: partyInfo.badgeColor,
                          color: 'var(--kem)'
                        }}>
                          {partyInfo.party}
                        </span>
                        {detailBooking.cancelledAt && (
                          <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muc-mo)' }}>
                            Thời điểm hủy: {formatDateTime(detailBooking.cancelledAt)}
                          </span>
                        )}
                      </div>

                      <div style={{ fontFamily: 'var(--serif-2)', fontSize: '15px', color: 'var(--muc)', lineHeight: 1.5, marginTop: '6px' }}>
                        <strong>Lý do ghi nhận:</strong> "{detailBooking.cancelReason || selectedRefund.reason || 'Không có lý do cụ thể'}"
                      </div>

                      <div style={{ fontFamily: 'var(--serif-2)', fontSize: '13px', color: 'var(--muc-mo)', fontStyle: 'italic', marginTop: '8px', borderTop: '1px dashed rgba(15,14,12,0.15)', paddingTop: '6px' }}>
                        💡 {partyInfo.note}
                      </div>
                    </div>
                  )
                })()}

                {/* 2. Thông tin chuyến đi & Cỗ xe */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'var(--kem-dam)', padding: '16px 20px', border: '1px solid rgba(15,14,12,0.1)' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muc-mo)', marginBottom: '4px' }}>
                      Cỗ xe thuê
                    </div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: '16px', fontWeight: 700 }}>
                      {detailBooking.carName || `Xe #${detailBooking.carId}`}
                    </div>
                    {detailBooking.carPlate && (
                      <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muc-mo)' }}>
                        Biển số: {detailBooking.carPlate}
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muc-mo)', marginBottom: '4px' }}>
                      Lịch trình dự kiến
                    </div>
                    <div style={{ fontFamily: 'var(--serif-2)', fontSize: '14px' }}>
                      {formatDateTime(detailBooking.startDate)}
                    </div>
                    <div style={{ fontFamily: 'var(--serif-2)', fontSize: '14px', color: 'var(--muc-mo)' }}>
                      đến {formatDateTime(detailBooking.endDate)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muc-mo)', marginBottom: '4px' }}>
                      Khách hàng (Người nhận hoàn)
                    </div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: '15px', fontWeight: 700 }}>
                      {detailBooking.customerName || `Khách #${detailBooking.customerId}`}
                    </div>
                    {detailBooking.customerPhone && (
                      <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muc-mo)' }}>
                        SĐT: {detailBooking.customerPhone}
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muc-mo)', marginBottom: '4px' }}>
                      Chủ cỗ xe
                    </div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: '15px', fontWeight: 700 }}>
                      {detailBooking.ownerName || `Chủ xe #${detailBooking.ownerId}`}
                    </div>
                    {detailBooking.ownerPhone && (
                      <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muc-mo)' }}>
                        SĐT: {detailBooking.ownerPhone}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Đối chiếu tài chính hoàn tiền cọc */}
                <div style={{ border: '1px solid rgba(15,14,12,0.15)', padding: '16px 20px' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muc-mo)', marginBottom: '12px' }}>
                    Chi tiết tiền cọc & số tiền hoàn
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px', fontFamily: 'var(--serif-2)', marginBottom: '16px' }}>
                    <div>Tổng giá trị đơn: <strong>{formatPrice(detailBooking.totalPrice)}đ</strong></div>
                    <div>Tiền cọc đã thanh toán: <strong>{formatPrice(detailBooking.depositAmount)}đ</strong></div>
                    <div>Tỷ lệ cọc ban đầu: <strong>{detailBooking.depositPercent || 30}%</strong></div>
                    <div>Tỷ lệ hoàn tính toán: <strong>{detailBooking.refundPercent ?? 100}%</strong></div>
                  </div>

                  <div style={{
                    background: 'rgba(201,169,97,0.1)',
                    borderLeft: '4px solid var(--dong)',
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muc)' }}>
                        Số tiền hoàn cọc yêu cầu:
                      </div>
                      <div style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '12px', color: 'var(--muc-mo)' }}>
                        Cần admin đối soát duyệt chuyển hoàn
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: '26px', fontWeight: 900, color: 'var(--do)' }}>
                      {formatPrice(selectedRefund.amount)}đ
                    </div>
                  </div>

                  {selectedRefund.refundTransactionId && (
                    <div style={{ marginTop: '12px', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muc-mo)' }}>
                      Mã giao dịch hoàn tiền: <strong>{selectedRefund.refundTransactionId}</strong>
                    </div>
                  )}
                </div>

                {/* Nút hành động trong modal */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid rgba(15,14,12,0.15)' }}>
                  <Link
                    to={`/bookings/${selectedRefund.bookingId}`}
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: '11px',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      color: 'var(--muc)',
                      textDecoration: 'underline'
                    }}
                  >
                    Xem toàn bộ đơn #{selectedRefund.bookingId} →
                  </Link>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    {selectedRefund.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleApprove(selectedRefund.id)}
                          style={{
                            padding: '10px 20px',
                            background: 'var(--xanh-reu)',
                            border: 'none',
                            color: 'var(--kem)',
                            fontFamily: 'var(--mono)',
                            fontSize: '11px',
                            letterSpacing: '1.5px',
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                            fontWeight: 700
                          }}
                        >
                          ✓ Duyệt hoàn tiền
                        </button>
                        <button
                          onClick={() => handleReject(selectedRefund.id)}
                          style={{
                            padding: '10px 20px',
                            background: 'var(--do)',
                            border: 'none',
                            color: 'var(--kem)',
                            fontFamily: 'var(--mono)',
                            fontSize: '11px',
                            letterSpacing: '1.5px',
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                            fontWeight: 700
                          }}
                        >
                          ✕ Không duyệt
                        </button>
                      </>
                    )}
                    <button
                      onClick={closeDetail}
                      style={{
                        padding: '10px 18px',
                        background: 'transparent',
                        border: '1px solid rgba(15,14,12,0.3)',
                        color: 'var(--muc)',
                        fontFamily: 'var(--mono)',
                        fontSize: '11px',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        cursor: 'pointer'
                      }}
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px' }}>
                <p style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', color: 'var(--muc-mo)', marginBottom: '16px' }}>
                  Không tìm thấy chi tiết booking tương ứng.
                </p>
                <button onClick={closeDetail} style={{ padding: '8px 16px', background: 'var(--muc)', color: 'var(--kem)', border: 'none', cursor: 'pointer' }}>
                  Đóng
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function btnStyle(color) {
  return {
    padding: '7px 14px',
    background: 'transparent',
    border: `1px solid ${color}`,
    color: color,
    fontFamily: 'var(--mono)',
    fontSize: '10px',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    cursor: 'pointer',
    fontWeight: 600
  }
}

function paginationBtnStyle(disabled) {
  return {
    padding: '8px 16px',
    background: 'transparent',
    border: '1px solid rgba(15,14,12,0.2)',
    color: 'var(--muc)',
    fontFamily: 'var(--mono)',
    fontSize: '11px',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.3 : 1,
  }
}

function paginationNumStyle(active) {
  return {
    padding: '8px 14px',
    background: active ? 'var(--muc)' : 'transparent',
    color: active ? 'var(--kem)' : 'var(--muc)',
    border: `1px solid ${active ? 'var(--muc)' : 'rgba(15,14,12,0.2)'}`,
    fontFamily: 'var(--mono)',
    fontSize: '11px',
    cursor: 'pointer',
    fontWeight: active ? 700 : 400,
  }
}