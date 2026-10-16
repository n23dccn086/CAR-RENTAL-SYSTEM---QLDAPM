import { useState, useEffect } from 'react'
import SignatureCanvas from './SignatureCanvas'
import {
  createHandover,
  uploadImage,
} from '../services/handoverService'
import api from '../services/api'

/**
 * Modal tạo biên bản giao/nhận xe.
 *
 * Props:
 *  - open: bool
 *  - onClose: function
 *  - booking: booking object (cần id, carName, carPlate, startDate, endDate, status)
 *  - handoverType: 'PICKUP' | 'RETURN'
 *  - onSuccess: function (gọi sau khi tạo thành công)
 */
export default function HandoverFormModal({
  open,
  onClose,
  booking,
  handoverType,
  onSuccess,
}) {
  const [form, setForm] = useState({
    kmReading: '',
    fuelLevel: 80,
    exteriorNote: '',
    interiorNote: '',
    extraFees: 0,
    extraFeesNote: '',
    damages: '',
    actualReturnTime: '',
  })

  const [images, setImages] = useState([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [config, setConfig] = useState(null)
  const [pickupKm, setPickupKm] = useState(null)

  const isPickup = handoverType === 'PICKUP'

  useEffect(() => {
    if (open) {
      const nowStr = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
      setForm({
        kmReading: '',
        fuelLevel: 80,
        exteriorNote: '',
        interiorNote: '',
        extraFees: 0,
        extraFeesNote: '',
        damages: '',
        actualReturnTime: !isPickup ? nowStr : '',
      })
      setImages([])
      setError('')
    }
  }, [open, isPickup])

  // Load config & pickup km khi tạo biên bản trả xe
  useEffect(() => {
    if (!open || isPickup) return

    const keys = [
      'default_km_per_day',
      'km_overage_bracket_1_limit',
      'km_overage_bracket_1_price',
      'km_overage_bracket_2_limit',
      'km_overage_bracket_2_price',
      'km_overage_bracket_3_price',
      'late_fee_per_hour',
    ]
    Promise.all(
      keys.map(k =>
        api.get(`/admin/config/${k}`)
          .then(r => r.data.data?.configValue)
          .catch(() => null)
      )
    ).then(values => {
      const cfg = {}
      keys.forEach((k, i) => { cfg[k] = values[i] })
      setConfig(cfg)
    })

    if (booking?.id) {
      api.get(`/handovers/booking/${booking.id}`)
        .then(res => {
          const list = res.data.data || []
          const pickup = list.find(h => h.handoverType === 'PICKUP')
          if (pickup) setPickupKm(pickup.kmReading)
        })
        .catch(() => {})
    }
  }, [open, booking?.id, isPickup])

  if (!open || !booking) return null

  const title = isPickup ? 'Tạo biên bản giao xe' : 'Tạo biên bản nhận xe'
  const subtitle = `Đơn #${booking.id} · ${booking.carName || 'Xe'} ${booking.carPlate ? `(${booking.carPlate})` : ''}`

  // ===== TÍNH TOÁN DỰ KIẾN CHI PHÍ CHO BIÊN BẢN NHẬN XE =====
  let kmDriven = 0
  let kmAllowed = 0
  let kmOver = 0
  let kmOverageFee = 0
  const returnKm = parseInt(form.kmReading)

  if (pickupKm != null && !isNaN(returnKm) && returnKm > pickupKm && booking) {
    kmDriven = returnKm - pickupKm
    const start = new Date(booking.startDate)
    const end = new Date(booking.endDate)
    const hours = Math.max(0, (end - start) / (1000 * 60 * 60))
    const days = Math.max(1, Math.ceil(hours / 24))

    const kmPerDay = parseInt(config?.default_km_per_day) || 300
    kmAllowed = kmPerDay * days
    kmOver = Math.max(0, kmDriven - kmAllowed)

    if (kmOver > 0) {
      const limit1 = parseInt(config?.km_overage_bracket_1_limit) || 50
      const price1 = parseInt(config?.km_overage_bracket_1_price) || 5000
      const limit2 = parseInt(config?.km_overage_bracket_2_limit) || 100
      const price2 = parseInt(config?.km_overage_bracket_2_price) || 8000
      const price3 = parseInt(config?.km_overage_bracket_3_price) || 12000

      if (kmOver <= limit1) {
        kmOverageFee = kmOver * price1
      } else if (kmOver <= limit2) {
        kmOverageFee = (limit1 * price1) + ((kmOver - limit1) * price2)
      } else {
        kmOverageFee = (limit1 * price1) + ((limit2 - limit1) * price2) + ((kmOver - limit2) * price3)
      }
    }
  }

  // Tính phí phạt trễ hạn
  let lateMinutes = 0
  let lateFee = 0
  if (form.actualReturnTime && booking?.endDate) {
    const end = new Date(booking.endDate).getTime()
    const actual = new Date(form.actualReturnTime).getTime()
    const diffMs = actual - end
    if (diffMs > 0) {
      lateMinutes = Math.floor(diffMs / (1000 * 60))
      if (lateMinutes >= 15) {
        const start = new Date(booking.startDate).getTime()
        const totalDurationDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)))
        const pricePerDay = Number(booking.pricePerDay || (booking.totalPrice ? Math.round(booking.totalPrice / totalDurationDays) : 1000000))
        const feePerHour = parseInt(config?.late_fee_per_hour) || 100000

        if (lateMinutes < 120) {
          lateFee = feePerHour
        } else if (lateMinutes < 360) {
          lateFee = Math.round(pricePerDay / 2)
        } else if (lateMinutes < 720) {
          lateFee = pricePerDay
        } else {
          lateFee = Math.round(pricePerDay * 1.2)
        }
      }
    }
  }

  const extraFees = Number(form.extraFees) || 0
  const totalExtraFees = kmOverageFee + lateFee + extraFees
  const rentalPrice = Number(booking.totalPrice) || 0
  const depositAmount = Number(booking.depositAmount) || 0
  const remainingRental = Math.max(0, rentalPrice - depositAmount)
  const finalEstimatedToPay = remainingRental + totalExtraFees

  // ===== UPLOAD ẢNH =====
  const handleUploadImage = async (file) => {
    if (images.length >= 10) {
      alert('Tối đa 10 ảnh')
      return
    }

    setUploading(true)
    try {
      const res = await uploadImage(file)
      setImages([
        ...images,
        {
          url: res.data,
          imageType: 'OTHER',
          note: '',
        },
      ])
    } catch (err) {
      alert('Upload thất bại: ' + (err.response?.data?.message || err.message))
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = (index) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleUpdateImage = (index, field, value) => {
    const updated = [...images]
    updated[index][field] = value
    setImages(updated)
  }

  // ===== SUBMIT =====
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.kmReading && form.kmReading !== 0) {
      return setError('Vui lòng nhập số km')
    }
    const km = parseInt(form.kmReading)
    if (isNaN(km) || km < 0) {
      return setError('Số km không hợp lệ')
    }
    if (form.fuelLevel < 0 || form.fuelLevel > 100) {
      return setError('Mức xăng phải từ 0 đến 100')
    }

    setSubmitting(true)
    try {
      const payload = {
        bookingId: booking.id,
        handoverType,
        kmReading: km,
        fuelLevel: parseInt(form.fuelLevel),
        exteriorNote: form.exteriorNote?.trim() || null,
        interiorNote: form.interiorNote?.trim() || null,
        damages: form.damages?.trim() || null,
        extraFees: form.extraFees ? parseInt(form.extraFees) : 0,
        extraFeesNote: form.extraFeesNote?.trim() || null,
        actualReturnTime: form.actualReturnTime || null,
        images: images.map(img => ({
          imageUrl: img.url,
          imageType: img.imageType,
          note: img.note,
        })),
      }

      await createHandover(payload)

      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Tạo biên bản thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,14,12,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '20px',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--kem)',
          border: '1px solid var(--muc)',
          maxWidth: '720px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '48px',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
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
            marginBottom: '8px',
            paddingRight: '48px',
          }}
        >
          {title}.
        </h2>
        <p
          style={{
            fontFamily: 'var(--mono)',
            fontSize: '11px',
            letterSpacing: '2px',
            color: 'var(--muc-mo)',
            marginBottom: '32px',
          }}
        >
          {subtitle}
        </p>

        {error && (
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
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* ===== KM + FUEL ===== */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div>
              <label style={labelStyle}>Số km hiện tại *</label>
              <input
                type="number"
                value={form.kmReading}
                onChange={(e) => setForm({ ...form, kmReading: e.target.value })}
                placeholder="VD: 25000"
                min="0"
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Mức xăng ({form.fuelLevel}%)</label>
              <input
                type="range"
                value={form.fuelLevel}
                onChange={(e) => setForm({ ...form, fuelLevel: e.target.value })}
                min="0"
                max="100"
                step="5"
                style={{ width: '100%', marginTop: '12px' }}
              />
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: '11px',
                  color: 'var(--muc-mo)',
                  marginTop: '4px',
                  textAlign: 'center',
                }}
              >
                {form.fuelLevel}%
              </div>
            </div>
          </div>

          {/* ===== ★ UC-C13: PREVIEW PHÍ VƯỢT KM (chỉ RETURN) ===== */}
          {!isPickup && form.kmReading && (
            <KmOveragePreview
              booking={booking}
              returnKm={parseInt(form.kmReading)}
              config={config}
              pickupKm={pickupKm}
            />
          )}

          {/* ===== UC-C12: Thời gian trả thực tế (chỉ RETURN) ===== */}
          {!isPickup && (
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Thời gian trả xe thực tế *</label>
              <input
                type="datetime-local"
                value={form.actualReturnTime}
                onChange={(e) =>
                  setForm({ ...form, actualReturnTime: e.target.value })
                }
                style={inputStyle}
              />
              {lateFee > 0 ? (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    background: 'rgba(139,44,44,0.08)',
                    borderLeft: '3px solid var(--do)',
                    fontFamily: 'var(--serif-2)',
                    fontSize: '13px',
                    color: 'var(--do)',
                  }}
                >
                  ⚠️ Trả muộn {Math.floor(lateMinutes / 60)}h{lateMinutes % 60}p — Phí phạt trễ hạn dự kiến: <strong>+{new Intl.NumberFormat('vi-VN').format(lateFee)}đ</strong>
                </div>
              ) : (
                <div
                  style={{
                    fontFamily: 'var(--serif-2)',
                    fontStyle: 'italic',
                    fontSize: '12px',
                    color: 'var(--muc-mo)',
                    marginTop: '4px',
                  }}
                >
                  Nếu trả muộn sẽ tự động tính phí theo bảng giá
                </div>
              )}
            </div>
          )}

          {/* ===== NOTES ===== */}
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Tình trạng ngoại thất</label>
            <textarea
              value={form.exteriorNote}
              onChange={(e) => setForm({ ...form, exteriorNote: e.target.value })}
              rows={3}
              maxLength={500}
              placeholder="VD: Xe sạch, không xước..."
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Tình trạng nội thất</label>
            <textarea
              value={form.interiorNote}
              onChange={(e) => setForm({ ...form, interiorNote: e.target.value })}
              rows={3}
              maxLength={500}
              placeholder="VD: Ghế da sạch, điều hòa mát..."
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* ===== DAMAGES + EXTRA FEES (chỉ RETURN) ===== */}
          {!isPickup && (
            <>
              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Hư hỏng mới (nếu có)</label>
                <textarea
                  value={form.damages}
                  onChange={(e) => setForm({ ...form, damages: e.target.value })}
                  rows={3}
                  maxLength={500}
                  placeholder="VD: Xước cản trước bên phải ~10cm..."
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginBottom: '24px' }}>
                <div>
                  <label style={labelStyle}>Phí phát sinh khác (VNĐ)</label>
                  <input
                    type="number"
                    value={form.extraFees}
                    onChange={(e) => setForm({ ...form, extraFees: e.target.value })}
                    placeholder="0"
                    min="0"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Ghi chú phí</label>
                  <input
                    type="text"
                    value={form.extraFeesNote}
                    onChange={(e) => setForm({ ...form, extraFeesNote: e.target.value })}
                    placeholder="VD: Phí vệ sinh, phí xăng..."
                    maxLength={255}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Tóm tắt quyết toán tài chính dự kiến */}
              <div
                style={{
                  padding: '20px 24px',
                  background: 'var(--kem-dam)',
                  border: '2px solid var(--dong)',
                  marginBottom: '24px',
                  fontFamily: 'var(--mono)',
                  fontSize: '12px',
                  lineHeight: 1.9,
                }}
              >
                <div style={{ fontWeight: 'bold', color: 'var(--muc)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '13px' }}>
                  💡 Thông tin cọc & quyết toán đơn #{booking.id}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>• Giá thuê đơn:</span>
                  <strong>{new Intl.NumberFormat('vi-VN').format(rentalPrice)}đ</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--xanh-reu)', marginBottom: '4px' }}>
                  <span>• Khách đã cọc:</span>
                  <strong>- {new Intl.NumberFormat('vi-VN').format(depositAmount)}đ</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px dashed rgba(15,14,12,0.15)', marginBottom: '4px' }}>
                  <span>• Tiền thuê xe còn lại:</span>
                  <strong>{new Intl.NumberFormat('vi-VN').format(remainingRental)}đ</strong>
                </div>

                {kmOverageFee > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--do)', marginBottom: '4px' }}>
                    <span>• Phí vượt km ({kmOver?.toLocaleString('vi-VN')} km):</span>
                    <strong>+ {new Intl.NumberFormat('vi-VN').format(kmOverageFee)}đ</strong>
                  </div>
                )}

                {lateFee > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--do)', marginBottom: '4px' }}>
                    <span>• Phí trễ hạn ({Math.floor(lateMinutes / 60)}h{lateMinutes % 60}p):</span>
                    <strong>+ {new Intl.NumberFormat('vi-VN').format(lateFee)}đ</strong>
                  </div>
                )}

                {extraFees > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--dong)', marginBottom: '4px' }}>
                    <span>• Phí phát sinh khác{form.extraFeesNote ? ` (${form.extraFeesNote})` : ''}:</span>
                    <strong>+ {new Intl.NumberFormat('vi-VN').format(extraFees)}đ</strong>
                  </div>
                )}

                <div
                  style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '2px solid var(--do)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                  }}
                >
                  <span style={{ fontWeight: 'bold', fontSize: '12px', color: 'var(--do)', textTransform: 'uppercase' }}>
                    TỔNG TIỀN KHÁCH CẦN THANH TOÁN (DỰ KIẾN):
                  </span>
                  <span style={{ fontFamily: 'var(--serif)', fontSize: '26px', fontWeight: 900, color: 'var(--do)' }}>
                    {new Intl.NumberFormat('vi-VN').format(finalEstimatedToPay)}đ
                  </span>
                </div>
              </div>
            </>
          )}

          {/* ===== UPLOAD ẢNH ===== */}
          <div style={{ marginBottom: '32px' }}>
            <label style={labelStyle}>Ảnh xe (tối đa 10 ảnh)</label>

            {images.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: '12px',
                  marginBottom: '12px',
                }}
              >
                {images.map((img, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'relative',
                      aspectRatio: '4/3',
                      border: '1px solid var(--muc-mo)',
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={img.url}
                      alt={`Ảnh ${i + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(i)}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '24px',
                        height: '24px',
                        background: 'var(--do)',
                        color: 'var(--kem)',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                      }}
                    >
                      ✕
                    </button>
                    <select
                      value={img.imageType}
                      onChange={(e) => handleUpdateImage(i, 'imageType', e.target.value)}
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '4px',
                        background: 'rgba(15,14,12,0.8)',
                        color: 'var(--kem)',
                        border: 'none',
                        fontFamily: 'var(--mono)',
                        fontSize: '9px',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="DASHBOARD">Đồng hồ km</option>
                      <option value="FUEL">Xăng</option>
                      <option value="SCRATCH">Xước</option>
                      <option value="DENT">Móp</option>
                      <option value="INTERIOR">Nội thất</option>
                      <option value="OTHER">Khác</option>
                    </select>
                  </div>
                ))}
              </div>
            )}

            {images.length < 10 && (
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '24px',
                  border: '2px dashed rgba(15,14,12,0.3)',
                  background: 'var(--kem-dam)',
                  cursor: uploading ? 'wait' : 'pointer',
                  fontFamily: 'var(--serif-2)',
                  fontStyle: 'italic',
                  fontSize: '15px',
                  color: 'var(--muc-mo)',
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0]
                    if (file) handleUploadImage(file)
                    e.target.value = ''
                  }}
                  style={{ display: 'none' }}
                  disabled={uploading}
                />
                <span style={{ fontSize: '24px' }}>📷</span>
                <span>{uploading ? 'Đang upload...' : 'Chọn ảnh'}</span>
              </label>
            )}
          </div>

          {/* ===== SUBMIT ===== */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
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
              {submitting ? 'Đang tạo...' : 'Tạo biên bản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============================================================
// ★ UC-C13: COMPONENT PREVIEW PHÍ VƯỢT KM
// ============================================================
function KmOveragePreview({ booking, returnKm, config: parentConfig, pickupKm: parentPickupKm }) {
  const [config, setConfig] = useState(parentConfig || null)
  const [pickupKm, setPickupKm] = useState(parentPickupKm ?? null)

  useEffect(() => {
    if (parentConfig) setConfig(parentConfig)
  }, [parentConfig])

  useEffect(() => {
    if (parentPickupKm !== undefined) setPickupKm(parentPickupKm)
  }, [parentPickupKm])

  // Load config từ admin nếu chưa có từ props
  useEffect(() => {
    if (parentConfig) return
    const keys = [
      'default_km_per_day',
      'km_overage_bracket_1_limit',
      'km_overage_bracket_1_price',
      'km_overage_bracket_2_limit',
      'km_overage_bracket_2_price',
      'km_overage_bracket_3_price',
    ]
    Promise.all(
      keys.map(k =>
        api.get(`/admin/config/${k}`)
          .then(r => r.data.data?.configValue)
          .catch(() => null)
      )
    ).then(values => {
      const cfg = {}
      keys.forEach((k, i) => { cfg[k] = values[i] })
      setConfig(cfg)
    })
  }, [parentConfig])

  // Load km PICKUP của booking nếu chưa có từ props
  useEffect(() => {
    if (parentPickupKm !== undefined && parentPickupKm !== null) return
    api.get(`/handovers/booking/${booking.id}`)
      .then(res => {
        const list = res.data.data || []
        const pickup = list.find(h => h.handoverType === 'PICKUP')
        if (pickup) setPickupKm(pickup.kmReading)
      })
      .catch(() => {})
  }, [booking.id, parentPickupKm])

  if (!config || pickupKm == null || !returnKm) return null

  const kmDriven = returnKm - pickupKm
  if (kmDriven <= 0) {
    return (
      <div style={{
        marginBottom: '24px',
        padding: '12px 16px',
        background: 'rgba(139,44,44,0.08)',
        borderLeft: '3px solid var(--do)',
        fontFamily: 'var(--serif-2)',
        fontStyle: 'italic',
        fontSize: '14px',
        color: 'var(--do)',
      }}>
        ⚠️ Số km không hợp lệ (return &lt; pickup)
      </div>
    )
  }

  // Tính số ngày thuê
  const start = new Date(booking.startDate)
  const end = new Date(booking.endDate)
  const hours = (end - start) / (1000 * 60 * 60)
  const days = Math.max(1, Math.ceil(hours / 24))

  const kmPerDay = parseInt(config.default_km_per_day) || 300
  const kmAllowed = kmPerDay * days
  const kmOver = kmDriven - kmAllowed

  // Chưa vượt → hiển thị màu xanh
  if (kmOver <= 0) {
    return (
      <div style={{
        marginBottom: '24px',
        padding: '12px 16px',
        background: 'rgba(74,93,63,0.08)',
        borderLeft: '3px solid var(--xanh-reu)',
        fontFamily: 'var(--serif-2)',
        fontStyle: 'italic',
        fontSize: '14px',
      }}>
        ✓ Đã chạy <strong>{kmDriven.toLocaleString('vi-VN')} km</strong> / {kmAllowed.toLocaleString('vi-VN')} km — Chưa vượt định mức
      </div>
    )
  }

  // Vượt → tính phí
  const limit1 = parseInt(config.km_overage_bracket_1_limit) || 50
  const price1 = parseInt(config.km_overage_bracket_1_price) || 5000
  const limit2 = parseInt(config.km_overage_bracket_2_limit) || 100
  const price2 = parseInt(config.km_overage_bracket_2_price) || 8000
  const price3 = parseInt(config.km_overage_bracket_3_price) || 12000

  let fee = 0
  const breakdown = []

  if (kmOver <= limit1) {
    fee = kmOver * price1
    breakdown.push(`${kmOver} km × ${price1.toLocaleString('vi-VN')}đ = ${fee.toLocaleString('vi-VN')}đ`)
  } else if (kmOver <= limit2) {
    const f1 = limit1 * price1
    const f2 = (kmOver - limit1) * price2
    fee = f1 + f2
    breakdown.push(`Bậc 1: ${limit1} km × ${price1.toLocaleString('vi-VN')}đ = ${f1.toLocaleString('vi-VN')}đ`)
    breakdown.push(`Bậc 2: ${kmOver - limit1} km × ${price2.toLocaleString('vi-VN')}đ = ${f2.toLocaleString('vi-VN')}đ`)
  } else {
    const f1 = limit1 * price1
    const f2 = (limit2 - limit1) * price2
    const f3 = (kmOver - limit2) * price3
    fee = f1 + f2 + f3
    breakdown.push(`Bậc 1: ${limit1} km × ${price1.toLocaleString('vi-VN')}đ = ${f1.toLocaleString('vi-VN')}đ`)
    breakdown.push(`Bậc 2: ${limit2 - limit1} km × ${price2.toLocaleString('vi-VN')}đ = ${f2.toLocaleString('vi-VN')}đ`)
    breakdown.push(`Bậc 3: ${kmOver - limit2} km × ${price3.toLocaleString('vi-VN')}đ = ${f3.toLocaleString('vi-VN')}đ`)
  }

  return (
    <div style={{
      marginBottom: '24px',
      padding: '16px',
      background: 'rgba(139,44,44,0.08)',
      borderLeft: '4px solid var(--do)',
    }}>
      <div style={{
        fontFamily: 'var(--mono)',
        fontSize: '10px',
        letterSpacing: '2px',
        color: 'var(--do)',
        marginBottom: '10px',
        textTransform: 'uppercase',
      }}>
        ⚠️ Vượt định mức km
      </div>

      <div style={{
        fontFamily: 'var(--serif-2)',
        fontStyle: 'italic',
        fontSize: '14px',
        lineHeight: 1.6,
        marginBottom: '10px',
      }}>
        Đã chạy <strong>{kmDriven.toLocaleString('vi-VN')} km</strong>,
        định mức <strong>{kmAllowed.toLocaleString('vi-VN')} km</strong>
        {' '}({days} ngày × {kmPerDay} km/ngày).
        <br />
        Vượt <strong style={{ color: 'var(--do)' }}>{kmOver.toLocaleString('vi-VN')} km</strong>.
      </div>

      {breakdown.map((line, i) => (
        <div key={i} style={{
          fontFamily: 'var(--mono)',
          fontSize: '12px',
          color: 'var(--muc-mo)',
          marginBottom: '4px',
        }}>
          • {line}
        </div>
      ))}

      <div style={{
        marginTop: '12px',
        paddingTop: '12px',
        borderTop: '1px solid rgba(139,44,44,0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
      }}>
        <span style={{
          fontFamily: 'var(--mono)',
          fontSize: '11px',
          letterSpacing: '2px',
          textTransform: 'uppercase',
        }}>
          Phí vượt km
        </span>
        <span style={{
          fontFamily: 'var(--serif)',
          fontSize: '28px',
          fontWeight: 900,
          color: 'var(--do)',
        }}>
          +{fee.toLocaleString('vi-VN')}đ
        </span>
      </div>
    </div>
  )
}

// ===== STYLES =====
const labelStyle = {
  display: 'block',
  fontFamily: 'var(--mono)',
  fontSize: '10px',
  letterSpacing: '2px',
  textTransform: 'uppercase',
  color: 'var(--muc-mo)',
  marginBottom: '8px',
}

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  background: 'var(--kem-dam)',
  border: '1px solid rgba(15,14,12,0.2)',
  fontFamily: 'var(--serif-2)',
  fontSize: '16px',
  outline: 'none',
  boxSizing: 'border-box',
}