import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import SignatureCanvas from '../components/SignatureCanvas'
import {
  getHandoverById,
  signHandover,
  uploadSignature,
} from '../services/handoverService'
import { getBookingById } from '../services/bookingService'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'

export default function HandoverPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [handover, setHandover] = useState(null)
  const [booking, setBooking] = useState(null)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [signatureData, setSignatureData] = useState(null)
  const [signing, setSigning] = useState(false)
  const [signError, setSignError] = useState('')
  const [msg, setMsg] = useState('')

  // ===== ĐIỀU HƯỚNG NÚT "VỀ" THEO ROLE =====
  const getBackInfo = () => {
    if (user?.role === 'OWNER') {
      return { path: '/owner/bookings', label: 'Về đơn hàng' }
    }
    if (user?.role === 'ADMIN') {
      return { path: '/admin/dashboard', label: 'Về quản trị' }
    }
    return { path: '/my-bookings', label: 'Về chuyến đi' }
  }

  const backInfo = getBackInfo()

  // ===== LOAD =====
  useEffect(() => {
    loadHandover()
  }, [id])

  const loadHandover = async () => {
    setLoading(true)
    try {
      const res = await getHandoverById(id)
      const data = res.data
      setHandover(data)

      if (data?.bookingId) {
        try {
          const [bRes, pRes] = await Promise.all([
            getBookingById(data.bookingId).catch(() => null),
            api.get(`/payments/booking/${data.bookingId}`).catch(() => null),
          ])
          const bData = bRes?.data?.data || bRes?.data || bRes
          if (bData && (bData.id || bData.status)) setBooking(bData)
          if (pRes?.data?.data) setPayments(pRes.data.data)
        } catch (e) {
          console.warn("Could not load booking or payment details", e)
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không tải được biên bản')
    } finally {
      setLoading(false)
    }
  }

  // ===== KÝ =====
  const handleSign = async (role) => {
    if (isCancelled) {
      setSignError('Đơn hàng này đã bị hủy. Biên bản bàn giao đã bị vô hiệu hóa hoàn toàn.')
      return
    }

    if (!signatureData) {
      setSignError('Vui lòng vẽ chữ ký trước')
      return
    }

    setSigning(true)
    setSignError('')

    try {
      const res = await fetch(signatureData)
      const blob = await res.blob()
      const file = new File([blob], `signature-${Date.now()}.png`, { type: 'image/png' })

      const uploadRes = await uploadSignature(file)
      const signatureUrl = uploadRes.data

      await signHandover(id, role, signatureUrl)

      setMsg('✅ Ký biên bản thành công! Đang chuyển hướng...')
      setSignatureData(null)

      setTimeout(() => {
        const isOwnerRole = user?.role === 'OWNER' || role === 'OWNER'
        const targetPath = isOwnerRole
          ? '/owner/bookings'
          : (user?.role === 'ADMIN' ? '/admin/dashboard' : '/my-bookings')
        navigate(targetPath)
      }, 1200)
    } catch (err) {
      setSignError(err.response?.data?.message || 'Ký thất bại')
      setSigning(false)
    }
  }

  // ===== UTILS =====
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

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN').format(p || 0)

  // ===== LOADING =====
  if (loading) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '120px 48px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', color: 'var(--muc-mo)' }}>
          Đang tải biên bản...
        </p>
      </div>
    )
  }

  // ===== ERROR =====
  if (error || !handover) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '120px 48px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: '96px', fontWeight: 900, color: 'var(--do)' }}>
          !
        </h1>
        <p style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '22px', color: 'var(--muc-mo)' }}>
          {error || 'Không tìm thấy biên bản'}
        </p>
        <Link
          to={backInfo.path}
          style={{
            display: 'inline-block',
            marginTop: '24px',
            color: 'var(--do)',
            borderBottom: '1px solid var(--do)',
          }}
        >
          ← {backInfo.label}
        </Link>
      </div>
    )
  }

  const isPickup = handover.handoverType === 'PICKUP'
  const title = isPickup ? 'Biên bản giao xe' : 'Biên bản nhận xe'
  const hasOwnerSigned = !!handover.ownerSignature
  const hasCustomerSigned = !!handover.customerSignature
  const isCancelled =
    handover.status === 'CANCELLED' ||
    handover.bookingStatus === 'CANCELLED' ||
    booking?.status === 'CANCELLED'
  const isCompleted = !isCancelled && hasOwnerSigned && hasCustomerSigned

  const isOwner = handover.isOwner ?? (handover.ownerId != null && user?.id === handover.ownerId)
  const isCustomer = handover.isCustomer ?? (handover.customerId != null && user?.id === handover.customerId)
  const canUserSign = !isCancelled && ((isOwner && !hasOwnerSigned) || (isCustomer && !hasCustomerSigned))

  // ===== TÍNH TOÁN BẢNG QUYẾT TOÁN THANH TOÁN (RETURN) =====
  const lateFee = Number(handover.lateFee || handover.late_fee || 0)
  const kmOverageFee = Number(handover.kmOverageFee || handover.overage_km_fee || 0)
  const extraFees = Number(handover.extraFees || handover.extra_fees || 0)
  const totalExtraFees = Number(handover.totalExtraFees || handover.total_extra_fees) || (lateFee + kmOverageFee + extraFees)

  const depositAmount = Number(
    handover.depositAmount ??
    handover.deposit_amount ??
    booking?.depositAmount ??
    0
  )

  const rawTotal = Number(booking?.totalPrice || handover.rentalPrice || handover.rental_price || 0)
  const baseRentalPrice = (handover.status === 'SIGNED' && totalExtraFees > 0)
    ? Math.max(0, rawTotal - totalExtraFees)
    : (Number(handover.rentalPrice || handover.rental_price) || rawTotal)

  const remainingBaseRental = Number(handover.remainingRentalPrice || handover.remaining_rental_price) || Math.max(0, baseRentalPrice - depositAmount)

  const finalAmountToPay = Number(handover.finalAmountToPay || handover.final_amount_to_pay) || (remainingBaseRental + totalExtraFees)

  const isPaidRemaining =
    booking?.status === 'COMPLETED' ||
    handover.bookingStatus === 'COMPLETED' ||
    (booking?.status !== 'PENDING' && booking?.status !== 'APPROVED' && booking?.status !== 'RENTED' && booking?.remainingAmount === 0 && Number(booking?.totalPrice || 0) > 0) ||
    payments.some(
      (p) =>
        (p.paymentType === 'REMAINING' || p.payment_type === 'REMAINING') &&
        (p.status === 'SUCCESS' || p.status === 'PAID')
    )

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 48px' }}>
      <Link
        to={backInfo.path}
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
        ← {backInfo.label}
      </Link>

      <div className="chapter-num" style={{ marginBottom: '24px' }}>
        Chương Biên Bản — {isPickup ? 'Giao Xe' : 'Nhận Xe'}
      </div>
      <h1
        style={{
          fontFamily: 'var(--serif)',
          fontSize: 'clamp(36px, 5vw, 56px)',
          fontWeight: 900,
          letterSpacing: '-2px',
          marginBottom: '16px',
        }}
      >
        {title.split(' ')[0]}{' '}
        <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>
          {title.split(' ').slice(1).join(' ')}
        </em>
      </h1>
      <p
        style={{
          fontFamily: 'var(--mono)',
          fontSize: '11px',
          letterSpacing: '2px',
          color: 'var(--muc-mo)',
          marginBottom: '40px',
        }}
      >
        Đơn #{handover.bookingId} · {isCancelled ? 'ĐÃ HỦY (VÔ HIỆU HÓA)' : handover.status}
      </p>

      {isCancelled && (
        <div
          style={{
            background: 'rgba(139,44,44,0.1)',
            border: '2px solid var(--do)',
            padding: '24px',
            marginBottom: '32px',
            color: 'var(--do)',
          }}
        >
          <div style={{ fontFamily: 'var(--serif)', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
            🚫 ĐƠN HÀNG ĐÃ BỊ HỦY — BIÊN BẢN BÀN GIAO ĐÃ VÔ HIỆU HÓA
          </div>
          <div style={{ fontFamily: 'var(--serif-2)', fontSize: '15px', color: 'var(--muc)', lineHeight: 1.6 }}>
            Đơn hàng #{booking?.id || handover.bookingId} đã ở trạng thái <strong>ĐÃ HỦY</strong>.
            {booking?.cancelReason && <span> (Lý do: <em>{booking.cancelReason}</em>). </span>}
            Biên bản này không còn giá trị pháp lý và tất cả các thao tác ký xác nhận đã bị hệ thống khóa hoàn toàn.
          </div>
        </div>
      )}

      {msg && (
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
          {msg}
        </div>
      )}

      {/* ===== INFO CARD ===== */}
      <div
        style={{
          background: 'var(--kem-dam)',
          border: '1px solid var(--muc)',
          padding: '32px',
          marginBottom: '32px',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          <InfoRow label="Số km" value={`${handover.kmReading?.toLocaleString('vi-VN') || '—'} km`} />
          <InfoRow label="Mức xăng" value={`${handover.fuelLevel ?? '—'}%`} />
        </div>

        {/* SO SÁNH KM KHI RETURN */}
        {!isPickup && handover.kmDriven != null && (
          <div
            style={{
              padding: '16px',
              background: 'rgba(74,93,63,0.08)',
              borderLeft: '3px solid var(--xanh-reu)',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: '10px',
                letterSpacing: '2px',
                color: 'var(--xanh-reu)',
                marginBottom: '6px',
              }}
            >
              📊 SO SÁNH VỚI LÚC GIAO XE
            </div>
            <div
              style={{
                fontFamily: 'var(--serif-2)',
                fontStyle: 'italic',
                fontSize: '16px',
                lineHeight: 1.7,
              }}
            >
              Km lúc giao: <strong>{handover.pickupKmReading?.toLocaleString('vi-VN')}</strong> km
              <br />
              Km lúc nhận: <strong>{handover.kmReading?.toLocaleString('vi-VN')}</strong> km
              <br />
              Đã chạy: <strong style={{ color: 'var(--xanh-reu)', fontSize: '20px' }}>{handover.kmDriven?.toLocaleString('vi-VN')} km</strong>
            </div>
          </div>
        )}

        {/* UC-C12: PHÍ VƯỢT GIỜ */}
        {!isPickup && handover.lateFee > 0 && (
          <div
            style={{
              padding: '16px',
              background: 'rgba(139,44,44,0.1)',
              borderLeft: '3px solid var(--do)',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: '10px',
                letterSpacing: '2px',
                color: 'var(--do)',
                marginBottom: '8px',
              }}
            >
              ⏰ PHÍ TRẢ XE MUỘN
            </div>
            <div
              style={{
                fontFamily: 'var(--serif-2)',
                fontStyle: 'italic',
                fontSize: '16px',
                lineHeight: 1.7,
                marginBottom: '8px',
              }}
            >
              Trả muộn:{' '}
              <strong>
                {Math.floor(handover.lateMinutes / 60)}h
                {String(handover.lateMinutes % 60).padStart(2, '0')}p
              </strong>
              {handover.actualReturnTime && (
                <>
                  {' '}— Thời gian thực tế:{' '}
                  <strong>{formatDate(handover.actualReturnTime)}</strong>
                </>
              )}
            </div>
            <div
              style={{
                fontFamily: 'var(--serif)',
                fontSize: '28px',
                fontWeight: 900,
                color: 'var(--do)',
              }}
            >
              + {formatPrice(handover.lateFee)}đ
            </div>
          </div>
        )}

        {/* ★ UC-C13: PHÍ VƯỢT KM */}
        {!isPickup && handover.kmOverageFee > 0 && (
          <div
            style={{
              padding: '16px',
              background: 'rgba(139,44,44,0.08)',
              borderLeft: '3px solid var(--do)',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: '10px',
                letterSpacing: '2px',
                color: 'var(--do)',
                marginBottom: '8px',
              }}
            >
              🛣️ PHÍ VƯỢT KM
            </div>

            <div
              style={{
                fontFamily: 'var(--serif-2)',
                fontStyle: 'italic',
                fontSize: '16px',
                lineHeight: 1.7,
                marginBottom: '8px',
              }}
            >
              Đã chạy: <strong>{handover.kmDriven?.toLocaleString('vi-VN')} km</strong>
              <br />
              Định mức: <strong>{handover.kmAllowed?.toLocaleString('vi-VN')} km</strong>
              <br />
              Vượt: <strong style={{ color: 'var(--do)', fontSize: '20px' }}>
                {handover.kmOverage?.toLocaleString('vi-VN')} km
              </strong>
            </div>

            {handover.kmOverageBreakdown && (
              <div
                style={{
                  padding: '12px',
                  background: 'var(--kem)',
                  fontFamily: 'var(--mono)',
                  fontSize: '11px',
                  lineHeight: 1.7,
                  whiteSpace: 'pre-line',
                  marginBottom: '12px',
                }}
              >
                {handover.kmOverageBreakdown}
              </div>
            )}

            <div
              style={{
                fontFamily: 'var(--serif)',
                fontSize: '28px',
                fontWeight: 900,
                color: 'var(--do)',
              }}
            >
              + {formatPrice(handover.kmOverageFee)}đ
            </div>
          </div>
        )}

        {handover.exteriorNote && (
          <div style={{ marginBottom: '16px' }}>
            <div style={labelSmall}>Ngoại thất</div>
            <div style={textValue}>"{handover.exteriorNote}"</div>
          </div>
        )}

        {handover.interiorNote && (
          <div style={{ marginBottom: '16px' }}>
            <div style={labelSmall}>Nội thất</div>
            <div style={textValue}>"{handover.interiorNote}"</div>
          </div>
        )}

        {handover.damages && (
          <div style={{ marginBottom: '16px' }}>
            <div style={labelSmall}>Hư hỏng mới</div>
            <div style={{ ...textValue, color: 'var(--do)' }}>"{handover.damages}"</div>
          </div>
        )}

        {handover.extraFees > 0 && (
          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(201,169,97,0.15)',
              borderLeft: '3px solid var(--dong)',
              marginTop: '16px',
            }}
          >
            <div style={labelSmall}>Phí phát sinh khác</div>
            <div
              style={{
                fontFamily: 'var(--serif)',
                fontSize: '22px',
                fontWeight: 700,
                color: 'var(--dong)',
              }}
            >
              {formatPrice(handover.extraFees)}đ
              {handover.extraFeesNote && (
                <span
                  style={{
                    fontFamily: 'var(--serif-2)',
                    fontStyle: 'italic',
                    fontSize: '14px',
                    fontWeight: 400,
                    marginLeft: '12px',
                    color: 'var(--muc-mo)',
                  }}
                >
                  — {handover.extraFeesNote}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===== BẢNG TÍNH QUYẾT TOÁN TỔNG TIỀN (CHỈ HIỂN THỊ KHI TRẢ XE / RETURN) ===== */}
      {!isPickup && (
        <div
          style={{
            background: 'var(--kem-dam)',
            border: '2px solid var(--muc)',
            padding: '32px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '1px solid rgba(15,14,12,0.15)',
              paddingBottom: '16px',
              marginBottom: '24px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: '11px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  color: 'var(--do)',
                  marginBottom: '4px',
                  fontWeight: 'bold',
                }}
              >
                BẢNG QUYẾT TOÁN THANH TOÁN KHI TRẢ XE
              </div>
              <h3
                style={{
                  fontFamily: 'var(--serif)',
                  fontSize: '24px',
                  fontWeight: 900,
                  margin: 0,
                  color: 'var(--muc)',
                }}
              >
                Tổng hợp chi phí chuyến đi
              </h3>
            </div>
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: '11px',
                letterSpacing: '1px',
                color: 'var(--muc-mo)',
                padding: '6px 12px',
                background: 'var(--kem)',
                border: '1px solid rgba(15,14,12,0.1)',
              }}
            >
              Đơn #{handover.bookingId}
            </div>
          </div>

          {/* Chi tiết từng mục tính tiền */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
            {/* 1. Tiền thuê xe gốc */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontFamily: 'var(--serif)', fontSize: '16px', fontWeight: 600 }}>
                  1. Giá thuê xe gốc (theo đơn)
                </span>
                <div style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '13px', color: 'var(--muc-mo)' }}>
                  Tổng tiền thuê cơ bản của chuyến đi
                </div>
              </div>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '16px', fontWeight: 600 }}>
                {formatPrice(baseRentalPrice)}đ
              </span>
            </div>

            {/* 2. Tiền cọc đã thanh toán */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontFamily: 'var(--serif)', fontSize: '16px', fontWeight: 600, color: 'var(--xanh-reu)' }}>
                  2. Tiền cọc đã thanh toán (trừ đi)
                </span>
                <div style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '13px', color: 'var(--muc-mo)' }}>
                  Đã thanh toán trước lúc nhận xe
                </div>
              </div>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '16px', fontWeight: 700, color: 'var(--xanh-reu)' }}>
                - {formatPrice(depositAmount)}đ
              </span>
            </div>

            {/* 3. Tiền thuê còn lại */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 16px',
                background: 'rgba(15,14,12,0.03)',
                borderLeft: '3px solid var(--muc-mo)',
              }}
            >
              <span style={{ fontFamily: 'var(--serif)', fontSize: '15px', fontWeight: 600 }}>
                → Tiền thuê xe còn lại chưa thanh toán
              </span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '15px', fontWeight: 600 }}>
                {formatPrice(remainingBaseRental)}đ
              </span>
            </div>

            {/* 4. Các phụ phí phát sinh */}
            <div style={{ marginTop: '8px', paddingTop: '16px', borderTop: '1px dashed rgba(15,14,12,0.15)' }}>
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: '11px',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  color: 'var(--muc-mo)',
                  marginBottom: '12px',
                }}
              >
                Các khoản phụ phí phát sinh:
              </div>

              {/* Phí trễ hạn */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontFamily: 'var(--serif)', fontSize: '15px' }}>
                  • Phí trả xe trễ hạn {handover.lateMinutes > 0 ? `(${Math.floor(handover.lateMinutes / 60)}h${handover.lateMinutes % 60}p)` : ''}
                </span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '15px', color: lateFee > 0 ? 'var(--do)' : 'var(--muc-mo)' }}>
                  {lateFee > 0 ? `+ ${formatPrice(lateFee)}đ` : '0đ'}
                </span>
              </div>

              {/* Phí vượt km */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontFamily: 'var(--serif)', fontSize: '15px' }}>
                  • Phí vượt quá giới hạn km {handover.kmOverage > 0 ? `(vượt ${handover.kmOverage?.toLocaleString('vi-VN')} km)` : ''}
                </span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '15px', color: kmOverageFee > 0 ? 'var(--do)' : 'var(--muc-mo)' }}>
                  {kmOverageFee > 0 ? `+ ${formatPrice(kmOverageFee)}đ` : '0đ'}
                </span>
              </div>

              {/* Phí khác */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontFamily: 'var(--serif)', fontSize: '15px' }}>
                  • Phụ phí phát sinh khác {handover.extraFeesNote ? `(${handover.extraFeesNote})` : ''}
                </span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '15px', color: extraFees > 0 ? 'var(--do)' : 'var(--muc-mo)' }}>
                  {extraFees > 0 ? `+ ${formatPrice(extraFees)}đ` : '0đ'}
                </span>
              </div>

              {/* Tổng phụ phí */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 16px',
                  background: totalExtraFees > 0 ? 'rgba(139,44,44,0.06)' : 'rgba(15,14,12,0.03)',
                  borderLeft: `3px solid ${totalExtraFees > 0 ? 'var(--do)' : 'var(--muc-mo)'}`,
                  marginTop: '8px',
                }}
              >
                <span style={{ fontFamily: 'var(--serif)', fontSize: '15px', fontWeight: 600, color: totalExtraFees > 0 ? 'var(--do)' : 'var(--muc)' }}>
                  → Tổng phụ phí phát sinh
                </span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '15px', fontWeight: 700, color: totalExtraFees > 0 ? 'var(--do)' : 'var(--muc)' }}>
                  + {formatPrice(totalExtraFees)}đ
                </span>
              </div>
            </div>
          </div>

          {/* Hộp tổng kết nổi bật */}
          <div
            style={{
              padding: '24px',
              background: 'var(--kem)',
              border: '2px solid var(--do)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              boxShadow: '0 4px 20px rgba(139,44,44,0.15)',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: '11px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  color: 'var(--do)',
                  fontWeight: 800,
                  marginBottom: '4px',
                }}
              >
                TỔNG TIỀN KHÁCH CẦN PHẢI TRẢ
              </div>
              <div
                style={{
                  fontFamily: 'var(--serif-2)',
                  fontStyle: 'italic',
                  fontSize: '14px',
                  color: 'var(--muc-mo)',
                }}
              >
                (Tiền thuê còn lại sau khi trừ cọc + Phụ phí trễ hạn + Phí vượt km + Phí khác)
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontFamily: 'var(--serif)',
                  fontSize: 'clamp(28px, 4vw, 38px)',
                  fontWeight: 900,
                  color: 'var(--do)',
                  lineHeight: 1,
                }}
              >
                {formatPrice(finalAmountToPay)}đ
              </div>
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: '10px',
                  letterSpacing: '1px',
                  color: isPaidRemaining ? 'var(--xanh-reu)' : 'var(--muc-mo)',
                  marginTop: '6px',
                  textTransform: 'uppercase',
                  fontWeight: isPaidRemaining ? 700 : 400,
                }}
              >
                {isPaidRemaining
                  ? '✓ Đã hoàn tất thanh toán'
                  : finalAmountToPay === 0
                  ? 'Đã thanh toán đủ'
                  : 'Số tiền quyết toán khi trả xe'}
              </div>
            </div>
          </div>

          {/* Trạng thái thanh toán hoặc Nút điều hướng thanh toán nốt */}
          {isPaidRemaining ? (
            <div
              style={{
                marginTop: '20px',
                padding: '14px 20px',
                background: 'rgba(74,93,63,0.1)',
                border: '1px solid var(--xanh-reu)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '8px',
                fontFamily: 'var(--mono)',
                fontSize: '12px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                color: 'var(--xanh-reu)',
                fontWeight: 'bold',
              }}
            >
              <span>✓ Khách đã thanh toán hoàn tất quyết toán chuyến đi</span>
            </div>
          ) : (
            handover.status === 'SIGNED' && finalAmountToPay > 0 && isCustomer && (
              <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <Link
                  to={`/payment-final/${handover.bookingId}`}
                  style={{
                    display: 'inline-block',
                    padding: '14px 28px',
                    background: 'var(--do)',
                    color: 'var(--kem)',
                    textDecoration: 'none',
                    fontFamily: 'var(--mono)',
                    fontSize: '11px',
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 12px rgba(139,44,44,0.25)',
                  }}
                >
                  💰 Đi đến thanh toán nốt ({formatPrice(finalAmountToPay)}đ) →
                </Link>
              </div>
            )
          )}
        </div>
      )}

      {/* ===== ẢNH ===== */}
      {handover.images && handover.images.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3
            style={{
              fontFamily: 'var(--serif)',
              fontSize: '20px',
              fontWeight: 700,
              marginBottom: '16px',
            }}
          >
            📎 Ảnh ({handover.images.length})
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '12px',
            }}
          >
            {handover.images.map((img) => (
              <a
                key={img.id}
                href={img.imageUrl}
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    aspectRatio: '4/3',
                    border: '1px solid var(--muc-mo)',
                    background: `url(${img.imageUrl}) center/cover`,
                  }}
                />
                <div
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: '9px',
                    letterSpacing: '1px',
                    textAlign: 'center',
                    color: 'var(--muc-mo)',
                    marginTop: '4px',
                    textTransform: 'uppercase',
                  }}
                >
                  {img.imageType}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ===== CHỮ KÝ 2 BÊN ===== */}
      <div style={{ marginBottom: '32px' }}>
        <h3
          style={{
            fontFamily: 'var(--serif)',
            fontSize: '20px',
            fontWeight: 700,
            marginBottom: '16px',
          }}
        >
          Chữ ký xác nhận
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div
            style={{
              padding: '20px',
              background: 'var(--kem-dam)',
              border: `2px solid ${hasOwnerSigned ? 'var(--xanh-reu)' : 'var(--muc-mo)'}`,
              textAlign: 'center',
            }}
          >
            <div style={labelSmall}>CHỦ XE</div>
            {hasOwnerSigned ? (
              <>
                <img
                  src={handover.ownerSignature}
                  alt="Chữ ký chủ xe"
                  style={{ maxWidth: '100%', maxHeight: '100px', margin: '12px 0' }}
                />
                <div
                  style={{
                    fontFamily: 'var(--serif-2)',
                    fontStyle: 'italic',
                    fontSize: '13px',
                    color: 'var(--xanh-reu)',
                  }}
                >
                  ✓ Đã ký {formatDate(handover.ownerSignedAt)}
                </div>
              </>
            ) : (
              <div
                style={{
                  fontFamily: 'var(--serif-2)',
                  fontStyle: 'italic',
                  fontSize: '16px',
                  color: 'var(--muc-mo)',
                  padding: '30px 0',
                }}
              >
                ⏳ Chưa ký
              </div>
            )}
          </div>

          <div
            style={{
              padding: '20px',
              background: 'var(--kem-dam)',
              border: `2px solid ${hasCustomerSigned ? 'var(--xanh-reu)' : 'var(--muc-mo)'}`,
              textAlign: 'center',
            }}
          >
            <div style={labelSmall}>KHÁCH THUÊ</div>
            {hasCustomerSigned ? (
              <>
                <img
                  src={handover.customerSignature}
                  alt="Chữ ký khách"
                  style={{ maxWidth: '100%', maxHeight: '100px', margin: '12px 0' }}
                />
                <div
                  style={{
                    fontFamily: 'var(--serif-2)',
                    fontStyle: 'italic',
                    fontSize: '13px',
                    color: 'var(--xanh-reu)',
                  }}
                >
                  ✓ Đã ký {formatDate(handover.customerSignedAt)}
                </div>
              </>
            ) : (
              <div
                style={{
                  fontFamily: 'var(--serif-2)',
                  fontStyle: 'italic',
                  fontSize: '16px',
                  color: 'var(--muc-mo)',
                  padding: '30px 0',
                }}
              >
                ⏳ Chưa ký
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== SIGN FORM ===== */}
      {!isCompleted && !isCancelled && (
        <div
          style={{
            padding: '32px',
            background: 'var(--kem-dam)',
            border: '2px solid var(--do)',
            marginBottom: '32px',
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--serif)',
              fontSize: '22px',
              fontWeight: 700,
              marginBottom: '8px',
            }}
          >
            ✍️ Ký xác nhận
          </h3>
          <p
            style={{
              fontFamily: 'var(--serif-2)',
              fontStyle: 'italic',
              fontSize: '15px',
              color: 'var(--muc-mo)',
              marginBottom: '20px',
            }}
          >
            Vẽ chữ ký của bạn vào ô bên dưới, sau đó chọn vai trò và bấm "Ký xác nhận".
          </p>

          <SignatureCanvas
            onChange={setSignatureData}
            width={700}
            height={200}
          />

          {signError && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px 16px',
                background: 'rgba(139,44,44,0.1)',
                border: '1px solid var(--do)',
                color: 'var(--do)',
                fontFamily: 'var(--serif-2)',
                fontStyle: 'italic',
              }}
            >
              {signError}
            </div>
          )}

          <div style={{ marginTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {isOwner && !hasOwnerSigned && (
              <button
                type="button"
                onClick={() => handleSign('OWNER')}
                disabled={signing || !signatureData}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '16px',
                  background: 'var(--xanh-reu)',
                  color: 'var(--kem)',
                  border: '1px solid var(--xanh-reu)',
                  fontFamily: 'var(--mono)',
                  fontSize: '11px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  cursor: signing || !signatureData ? 'not-allowed' : 'pointer',
                  opacity: signing || !signatureData ? 0.5 : 1,
                }}
              >
                {signing ? 'Đang ký...' : '✍️ Ký với vai trò CHỦ XE'}
              </button>
            )}

            {isCustomer && !hasCustomerSigned && (
              <button
                type="button"
                onClick={() => handleSign('CUSTOMER')}
                disabled={signing || !signatureData}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '16px',
                  background: 'var(--muc)',
                  color: 'var(--kem)',
                  border: '1px solid var(--muc)',
                  fontFamily: 'var(--mono)',
                  fontSize: '11px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  cursor: signing || !signatureData ? 'not-allowed' : 'pointer',
                  opacity: signing || !signatureData ? 0.5 : 1,
                }}
              >
                {signing ? 'Đang ký...' : '✍️ Ký với vai trò KHÁCH THUÊ'}
              </button>
            )}

            {!canUserSign && (
              <div style={{
                width: '100%',
                padding: '16px',
                background: 'var(--kem-dam)',
                border: '1px solid rgba(15,14,12,0.15)',
                textAlign: 'center',
                fontFamily: 'var(--serif-2)',
                fontStyle: 'italic',
                color: 'var(--muc-mo)'
              }}>
                Chỉ chủ xe và khách thuê của chuyến đi này mới có quyền ký biên bản.
              </div>
            )}
          </div>
        </div>
      )}

      {isCancelled && (
        <div
          style={{
            padding: '32px',
            background: 'rgba(15,14,12,0.04)',
            border: '2px dashed var(--muc-mo)',
            marginBottom: '32px',
            textAlign: 'center',
            fontFamily: 'var(--serif-2)',
            color: 'var(--muc-mo)',
          }}
        >
          <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px', color: 'var(--do)' }}>
            🔒 Biên bản bàn giao đã bị vô hiệu hóa
          </div>
          <div style={{ fontStyle: 'italic', fontSize: '15px' }}>
            Do đơn hàng đã ở trạng thái ĐÃ HỦY, hệ thống đã khóa toàn bộ chức năng ký và cập nhật biên bản này.
          </div>
        </div>
      )}

      {/* ===== ĐÃ HOÀN TẤT ===== */}
      {isCompleted && (
        <div
          style={{
            padding: '32px',
            background: 'rgba(74,93,63,0.08)',
            border: '2px solid var(--xanh-reu)',
            textAlign: 'center',
            marginBottom: '32px',
          }}
        >
          <div style={{ fontSize: '56px', marginBottom: '12px' }}>✅</div>
          <h3
            style={{
              fontFamily: 'var(--serif)',
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--xanh-reu)',
              marginBottom: '8px',
            }}
          >
            Biên bản đã hoàn tất
          </h3>
          <p
            style={{
              fontFamily: 'var(--serif-2)',
              fontStyle: 'italic',
              fontSize: '16px',
              color: 'var(--muc-mo)',
            }}
          >
            Cả 2 bên đã ký xác nhận. Trạng thái đơn đã được cập nhật.
          </p>
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
          fontFamily: 'var(--serif)',
          fontSize: '22px',
          fontWeight: 700,
          color: 'var(--muc)',
        }}
      >
        {value}
      </div>
    </div>
  )
}

const labelSmall = {
  fontFamily: 'var(--mono)',
  fontSize: '10px',
  letterSpacing: '2px',
  textTransform: 'uppercase',
  color: 'var(--muc-mo)',
  marginBottom: '6px',
}

const textValue = {
  fontFamily: 'var(--serif-2)',
  fontStyle: 'italic',
  fontSize: '16px',
  color: 'var(--muc)',
  lineHeight: 1.6,
}