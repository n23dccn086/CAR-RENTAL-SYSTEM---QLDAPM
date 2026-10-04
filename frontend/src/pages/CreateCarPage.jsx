import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FormInput from '../components/FormInput'
import { createCar } from '../services/carService'
import api from '../services/api'

export default function CreateCarPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    plate: '',            // ← SỬA: plateNumber → plate
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
    address: '',          // ← SỬA: location → address
    description: ''
  })
  const [images, setImages] = useState([])
  const [previews, setPreviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    // Convert number fields
    const numberFields = ['year', 'seats', 'currentKm', 'pricePerDay']
    setForm({ ...form, [name]: numberFields.includes(name) ? (value === '' ? '' : Number(value)) : value })
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length + images.length > 10) {
      setError('Tối đa 10 ảnh')
      return
    }
    setImages([...images, ...files])
    const newPreviews = files.map(f => URL.createObjectURL(f))
    setPreviews([...previews, ...newPreviews])
  }

  const removeImage = (i) => {
    setImages(images.filter((_, idx) => idx !== i))
    setPreviews(previews.filter((_, idx) => idx !== i))
  }

  // ===== VALIDATE =====
  const validate = () => {
    const errors = []

    // Required strings
    if (!form.plate?.trim()) errors.push('Biển số không được để trống')
    else if (form.plate.length > 20) errors.push('Biển số không quá 20 ký tự')

    if (!form.brand?.trim()) errors.push('Hãng xe không được để trống')
    else if (form.brand.length > 50) errors.push('Hãng xe không quá 50 ký tự')

    if (!form.model?.trim()) errors.push('Dòng xe không được để trống')
    else if (form.model.length > 100) errors.push('Dòng xe không quá 100 ký tự')

    // Year
    const year = Number(form.year)
    if (!form.year && form.year !== 0) errors.push('Năm SX không được để trống')
    else if (isNaN(year)) errors.push('Năm SX phải là số')
    else if (year < 1990 || year > 2100) errors.push('Năm SX phải từ 1990 đến 2100')

    // Seats
    const seats = Number(form.seats)
    if (!form.seats && form.seats !== 0) errors.push('Số chỗ không được để trống')
    else if (isNaN(seats)) errors.push('Số chỗ phải là số')
    else if (seats < 2 || seats > 30) errors.push('Số chỗ phải từ 2 đến 30')

    // Price
    const price = Number(form.pricePerDay)
    if (!form.pricePerDay && form.pricePerDay !== 0) errors.push('Giá thuê không được để trống')
    else if (isNaN(price)) errors.push('Giá thuê phải là số')
    else if (price < 0) errors.push('Giá thuê không được âm')

    // Current km (optional)
    if (form.currentKm !== '' && form.currentKm !== undefined) {
      const km = Number(form.currentKm)
      if (isNaN(km)) errors.push('Số km phải là số')
      else if (km < 0) errors.push('Số km không được âm')
    }

    // Color
    if (form.color && form.color.length > 30) errors.push('Màu sắc không quá 30 ký tự')

    // Address
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
      // ===== GỬI ĐÚNG FIELD NAME BACKEND MONG ĐỢI =====
      const res = await createCar({
        plate: form.plate.trim(),                    // ← SỬA
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
        address: form.address?.trim() || null,       // ← SỬA
        description: form.description?.trim() || null,
      })
      const carId = res.data?.id

      // Upload ảnh
      if (images.length > 0 && carId) {
        const formData = new FormData()
        images.forEach(img => formData.append('images', img))
        try {
          await api.post(`/cars/${carId}/images`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
        } catch (imgErr) {
          console.warn('Upload ảnh thất bại:', imgErr)
        }
      }

      navigate('/owner/dashboard')
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
        {/* ẢNH XE */}
        <div style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--muc-mo)', marginBottom: '12px' }}>
            Ảnh xe (tối đa 10 ảnh) — không bắt buộc
          </label>

          {previews.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '16px' }}>
              {previews.map((url, i) => (
                <div key={i} style={{ position: 'relative', aspectRatio: '1', border: '1px solid rgba(15,14,12,0.2)', overflow: 'hidden' }}>
                  <img src={url} alt={`Ảnh ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    style={{
                      position: 'absolute', top: '4px', right: '4px',
                      width: '22px', height: '22px', borderRadius: '50%',
                      background: 'var(--do)', color: 'var(--kem)',
                      border: 'none', cursor: 'pointer', fontSize: '12px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >×</button>
                </div>
              ))}
            </div>
          )}

          <label style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
            padding: '32px',
            border: '2px dashed rgba(15,14,12,0.2)',
            background: 'var(--kem-dam)',
            cursor: 'pointer',
            fontFamily: 'var(--serif-2)',
            fontStyle: 'italic',
            fontSize: '15px',
            color: 'var(--muc-mo)',
            transition: 'all 0.3s'
          }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--dong)'; e.currentTarget.style.background = 'var(--kem)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(15,14,12,0.2)'; e.currentTarget.style.background = 'var(--kem-dam)' }}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
            <span style={{ fontSize: '24px' }}>📷</span>
            <span>Chọn ảnh từ máy — nếu không chọn, hệ thống dùng icon mặc định</span>
          </label>
        </div>

        {/* THÔNG TIN XE */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <FormInput label="Biển số" name="plate" value={form.plate} onChange={handleChange} required />
          <FormInput label="Hãng xe" name="brand" value={form.brand} onChange={handleChange} required />
          <FormInput label="Dòng xe" name="model" value={form.model} onChange={handleChange} required />
          <FormInput label="Năm SX" name="year" type="number" value={form.year} onChange={handleChange} required />
          <FormInput label="Màu sắc" name="color" value={form.color} onChange={handleChange} />

          <div>
            <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--muc-mo)', marginBottom: '8px' }}>Loại xe *</label>
            <select name="carType" value={form.carType} onChange={handleChange} style={{ width: '100%', padding: '14px 16px', background: 'var(--kem-dam)', border: '1px solid rgba(15,14,12,0.2)', fontFamily: 'var(--serif-2)', fontSize: '16px' }}>
              <option value="SEDAN">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="MPV">MPV</option>
              <option value="HATCHBACK">Hatchback</option>
              <option value="PICKUP">Bán tải</option>
            </select>
          </div>

          <FormInput label="Số chỗ" name="seats" type="number" value={form.seats} onChange={handleChange} required />
          <FormInput label="Số km hiện tại" name="currentKm" type="number" value={form.currentKm} onChange={handleChange} />
          <FormInput label="Giá thuê / ngày (VNĐ)" name="pricePerDay" type="number" value={form.pricePerDay} onChange={handleChange} required />
          <FormInput label="Địa chỉ" name="address" value={form.address} onChange={handleChange} placeholder="123 Nguyễn Huệ, Q1, TP.HCM" />

          <div>
            <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--muc-mo)', marginBottom: '8px' }}>Hộp số *</label>
            <select name="transmission" value={form.transmission} onChange={handleChange} style={{ width: '100%', padding: '14px 16px', background: 'var(--kem-dam)', border: '1px solid rgba(15,14,12,0.2)', fontFamily: 'var(--serif-2)', fontSize: '16px' }}>
              <option value="AUTOMATIC">Tự động</option>
              <option value="MANUAL">Số sàn</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--muc-mo)', marginBottom: '8px' }}>Nhiên liệu *</label>
            <select name="fuelType" value={form.fuelType} onChange={handleChange} style={{ width: '100%', padding: '14px 16px', background: 'var(--kem-dam)', border: '1px solid rgba(15,14,12,0.2)', fontFamily: 'var(--serif-2)', fontSize: '16px' }}>
              <option value="GASOLINE">Xăng</option>
              <option value="DIESEL">Dầu</option>
              <option value="ELECTRIC">Điện</option>
              <option value="HYBRID">Hybrid</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--muc-mo)', marginBottom: '8px' }}>Hình thức thuê *</label>
            <select name="rentalMode" value={form.rentalMode} onChange={handleChange} style={{ width: '100%', padding: '14px 16px', background: 'var(--kem-dam)', border: '1px solid rgba(15,14,12,0.2)', fontFamily: 'var(--serif-2)', fontSize: '16px' }}>
              <option value="BOTH">Cả hai</option>
              <option value="SELF_DRIVE">Tự lái</option>
              <option value="WITH_DRIVER">Có tài xế</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--muc-mo)', marginBottom: '8px' }}>Mô tả</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows="4" style={{ width: '100%', padding: '14px 16px', background: 'var(--kem-dam)', border: '1px solid rgba(15,14,12,0.2)', fontFamily: 'var(--serif-2)', fontSize: '16px', resize: 'vertical' }} />
        </div>

        <button type="submit" className="btn-login" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '18px', marginTop: '32px' }}>
          <span>{loading ? 'Đang xử lý...' : 'Tạo cỗ xe'}</span>
        </button>
      </form>
    </div>
  )
}