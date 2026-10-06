import { useState, useEffect } from 'react'
import SignatureCanvas from './SignatureCanvas'
import {
  createHandover,
  uploadImage,
} from '../services/handoverService'

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
  // ===== STATE FORM =====
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

  const [images, setImages] = useState([])       // [{url, imageType, note}]
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // ===== RESET KHI MỞ =====
  useEffect(() => {
    if (open) {
      setForm({
        kmReading: '',
        fuelLevel: 80,
        exteriorNote: '',
        interiorNote: '',
        extraFees: 0,
        extraFeesNote: '',
        damages: '',
        actualReturnTime: '',
      })
      setImages([])
      setError('')
    }
  }, [open])

  if (!open || !booking) return null

  const isPickup = handoverType === 'PICKUP'
  const title = isPickup ? 'Tạo biên bản giao xe' : 'Tạo biên bản nhận xe'
  const subtitle = `Đơn #${booking.id} · ${booking.carName || 'Xe'} ${booking.carPlate ? `(${booking.carPlate})` : ''}`

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

    // Validate
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

          {/* ===== DAMAGES (chỉ RETURN) ===== */}
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
                  <label style={labelStyle}>Phí phát sinh (VNĐ)</label>
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