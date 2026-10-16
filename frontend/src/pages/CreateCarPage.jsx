import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import FormInput from '../components/FormInput'
import { createCar } from '../services/carService'
import api from '../services/api'

export default function CreateCarPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    plate: '',
    brand: '',
    model: '',
    year: 2024,
    color: '',
    seats: 5,
    transmission: 'AUTOMATIC',
    fuelType: 'GASOLINE',
    currentKm: 0,
    pricePerDay: 1000000,
    carType: 'SEDAN',
    rentalMode: 'BOTH',
    address: '',
    description: ''
  })

  // ★ CHỈ 1 ẢNH
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    const numberFields = ['year', 'seats', 'currentKm', 'pricePerDay']
    setForm({ ...form, [name]: numberFields.includes(name) ? (value === '' ? '' : Number(value)) : value })
  }

  // ★ CHỌN 1 ẢNH
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  // ★ XÓA ẢNH
  const removeImage = () => {
    setImage(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
  }

  const validate = () => {
    const errors = []
    if (!form.plate?.trim()) errors.push('Biển số không được để trống')
    else if (form.plate.length > 20) errors.push('Biển số không quá 20 ký tự')
    if (!form.brand?.trim()) errors.push('Hãng xe không được để trống')
    else if (form.brand.length > 50) errors.push('Hãng xe không quá 50 ký tự')
    if (!form.model?.trim()) errors.push('Dòng xe không được để trống')
    else if (form.model.length > 100) errors.push('Dòng xe không quá 100 ký tự')
    const year = Number(form.year)
    if (!form.year && form.year !== 0) errors.push('Năm SX không được để trống')
    else if (isNaN(year)) errors.push('Năm SX phải là số')
    else if (year < 1990 || year > 2100) errors.push('Năm SX phải từ 1990 đến 2100')
    const seats = Number(form.seats)
    if (!form.seats && form.seats !== 0) errors.push('Số chỗ không được để trống')
    else if (isNaN(seats)) errors.push('Số chỗ phải là số')
    else if (seats < 2 || seats > 30) errors.push('Số chỗ phải từ 2 đến 30')
    const price = Number(form.pricePerDay)
    if (!form.pricePerDay && form.pricePerDay !== 0) errors.push('Giá thuê không được để trống')
    else if (isNaN(price)) errors.push('Giá thuê phải là số')
    else if (price < 0) errors.push('Giá thuê không được âm')
    if (form.currentKm !== '' && form.currentKm !== undefined) {
      const km = Number(form.currentKm)
      if (isNaN(km)) errors.push('Số km phải là số')
      else if (km < 0) errors.push('Số km không được âm')
    }
    if (form.color && form.color.length > 30) errors.push('Màu sắc không quá 30 ký tự')
    if (form.address && form.address.length > 255) errors.push('Địa chỉ không quá 255 ký tự')
    return errors.length > 0 ? errors.join('. ') : null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      const res = await createCar({
        plate: form.plate.trim(),
        brand: form.brand.trim(),
        model: form.model.trim(),
        year: Number(form.year),
        seats: Number(form.seats),
        transmission: form.transmission,
        fuelType: form.fuelType,
        color: form.color?.trim() || null,
        currentKm: form.currentKm ? Number(form.currentKm) : 0,
        pricePerDay: Number(form.pricePerDay),
        carType: form.carType,
        rentalMode: form.rentalMode,
        address: form.address?.trim() || null,
        description: form.description?.trim() || null,
      })
      const carId = res.data?.id

      // ★ Upload 1 ảnh
      if (image && carId) {
        const formData = new FormData()
        formData.append('images', image)
        try {
          await api.post(`/cars/${carId}/images`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
        } catch (imgErr) {
          console.warn('Upload ảnh thất bại:', imgErr)
        }
      }

      navigate('/owner/cars')
    } catch (err) {
      const msg = err.response?.data?.message || 'Tạo xe thất bại'
      const details = err.response?.data?.data
      if (details && typeof details === 'object') {
        setError(Object.values(details).join('. '))
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 48px' }}>
      <Link
        to="/owner/cars"
        style={{
          fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px',
          textTransform: 'uppercase', color: 'var(--muc-mo)',
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          marginBottom: '24px', textDecoration: 'none',
        }}
      >
        ← Về quản lý xe
      </Link>

      <div className="chapter-num" style={{ marginBottom: '24px' }}>Chương Chủ Xe</div>
      <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900, letterSpacing: '-2px', marginBottom: '40px' }}>
        Thêm <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>cỗ xe mới.</em>
      </h1>

      {error && (
        <div style={{ background: 'rgba(139,44,44,0.1)', border: '1px solid var(--do)', padding: '12px 16px', marginBottom: '24px', color: 'var(--do)', fontFamily: 'var(--serif-2)', fontStyle: 'italic' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* ★ 1 ẢNH XE */}
        <div style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--muc-mo)', marginBottom: '12px' }}>
            Ảnh xe — không bắt buộc
          </label>

          {preview ? (
            <div style={{ position: 'relative', width: '280px', aspectRatio: '4/3', border: '1px solid rgba(15,14,12,0.2)', overflow: 'hidden' }}>
              <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button
                type="button"
                onClick={removeImage}
                style={{
                  position: 'absolute', top: '8px', right: '8px',
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: 'var(--do)', color: 'var(--kem)',
                  border: 'none', cursor: 'pointer', fontSize: '14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >×</button>
            </div>
          ) : (
            <label style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
              padding: '40px', width: '280px', aspectRatio: '4/3',
              border: '2px dashed rgba(15,14,12,0.2)',
              background: 'var(--kem-dam)',
              cursor: 'pointer',
              fontFamily: 'var(--serif-2)',
              fontStyle: 'italic',
              fontSize: '15px',
              color: 'var(--muc-mo)',
              flexDirection: 'column',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--dong)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(15,14,12,0.2)' }}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              <span style={{ fontSize: '32px' }}>📷</span>
              <span>Chọn 1 ảnh xe</span>
            </label>
          )}
        </div>

        {/* THÔNG TIN XE */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <FormInput label="Biển số" name="plate" value={form.plate} onChange={handleChange} required />
          <FormInput label="Hãng xe" name="brand" value={form.brand} onChange={handleChange} required />
          <FormInput label="Dòng xe" name="model" value={form.model} onChange={handleChange} required />
          <FormInput label="Năm SX" name="year" type="number" value={form.year} onChange={handleChange} required />
          <FormInput label="Màu sắc" name="color" value={form.color} onChange={handleChange} />

          <div>
            <label style={labelStyle}>Loại xe *</label>
            <select name="carType" value={form.carType} onChange={handleChange} style={inputStyle}>
              <option value="SEDAN">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="MPV">MPV</option>
              <option value="HATCHBACK">Hatchback</option>
              <option value="PICKUP">Bán tải</option>
              <option value="VAN">Van</option>
              <option value="LUXURY">Xe cao cấp</option>
            </select>
          </div>

          <FormInput label="Số chỗ" name="seats" type="number" value={form.seats} onChange={handleChange} required />
          <FormInput label="Số km hiện tại" name="currentKm" type="number" value={form.currentKm} onChange={handleChange} />
          <FormInput label="Giá thuê / ngày (VNĐ)" name="pricePerDay" type="number" value={form.pricePerDay} onChange={handleChange} required />
          <FormInput label="Địa chỉ" name="address" value={form.address} onChange={handleChange} placeholder="123 Nguyễn Huệ, Q1, TP.HCM" />

          <div>
            <label style={labelStyle}>Hộp số *</label>
            <select name="transmission" value={form.transmission} onChange={handleChange} style={inputStyle}>
              <option value="AUTOMATIC">Tự động</option>
              <option value="MANUAL">Số sàn</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Nhiên liệu *</label>
            <select name="fuelType" value={form.fuelType} onChange={handleChange} style={inputStyle}>
              <option value="GASOLINE">Xăng</option>
              <option value="DIESEL">Dầu</option>
              <option value="ELECTRIC">Điện</option>
              <option value="HYBRID">Hybrid</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <label style={labelStyle}>Mô tả</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows="4" style={{ width: '100%', padding: '14px 16px', background: 'var(--kem-dam)', border: '1px solid rgba(15,14,12,0.2)', fontFamily: 'var(--serif-2)', fontSize: '16px', resize: 'vertical' }} />
        </div>

        <button type="submit" className="btn-login" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '18px', marginTop: '32px' }}>
          <span>{loading ? 'Đang xử lý...' : 'Tạo cỗ xe'}</span>
        </button>
      </form>
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
  padding: '14px 16px',
  background: 'var(--kem-dam)',
  border: '1px solid rgba(15,14,12,0.2)',
  fontFamily: 'var(--serif-2)',
  fontSize: '16px',
}