import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FormInput from '../components/FormInput'
import { createCar } from '../services/carService'
import api from '../services/api'

export default function CreateCarPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    plateNumber: '', brand: '', model: '', year: 2024,
    color: '', seats: 5, transmission: 'AUTOMATIC',
    fuelType: 'GASOLINE', currentKm: 0,
    pricePerDay: 1000000, carType: 'SEDAN',
    rentalMode: 'BOTH', location: '', description: ''
  })
  const [images, setImages] = useState([])  // File[]
  const [previews, setPreviews] = useState([])  // URL preview
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.plateNumber || !form.brand || !form.model) {
      return setError('Vui lòng điền biển số, hãng, dòng xe')
    }

    setLoading(true)
    try {
      // 1. Tạo xe
      const res = await createCar({
        ...form,
        year: parseInt(form.year),
        seats: parseInt(form.seats),
        currentKm: parseInt(form.currentKm),
        pricePerDay: parseInt(form.pricePerDay),
      })
      const carId = res.data?.id

      // 2. Upload ảnh (nếu có)
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
      setError(err.response?.data?.message || 'Tạo xe thất bại')
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

          {/* Previews */}
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

          {/* Upload button */}
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
          <FormInput label="Biển số" name="plateNumber" value={form.plateNumber} onChange={handleChange} required />
          <FormInput label="Hãng xe" name="brand" value={form.brand} onChange={handleChange} required />
          <FormInput label="Dòng xe" name="model" value={form.model} onChange={handleChange} required />
          <FormInput label="Năm SX" name="year" type="number" value={form.year} onChange={handleChange} required />
          <FormInput label="Màu sắc" name="color" value={form.color} onChange={handleChange} />

          <div>
            <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--muc-mo)', marginBottom: '8px' }}>Loại xe</label>
            <select name="carType" value={form.carType} onChange={handleChange} style={{ width: '100%', padding: '14px 16px', background: 'var(--kem-dam)', border: '1px solid rgba(15,14,12,0.2)', fontFamily: 'var(--serif-2)', fontSize: '16px' }}>
              <option value="SEDAN">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="MPV">MPV</option>
              <option value="HATCHBACK">Hatchback</option>
            </select>
          </div>

          <FormInput label="Số chỗ" name="seats" type="number" value={form.seats} onChange={handleChange} required />
          <FormInput label="Số km hiện tại" name="currentKm" type="number" value={form.currentKm} onChange={handleChange} />
          <FormInput label="Giá thuê / ngày (VNĐ)" name="pricePerDay" type="number" value={form.pricePerDay} onChange={handleChange} required />
          <FormInput label="Địa điểm" name="location" value={form.location} onChange={handleChange} placeholder="TP.HCM" />

          <div>
            <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--muc-mo)', marginBottom: '8px' }}>Hộp số</label>
            <select name="transmission" value={form.transmission} onChange={handleChange} style={{ width: '100%', padding: '14px 16px', background: 'var(--kem-dam)', border: '1px solid rgba(15,14,12,0.2)', fontFamily: 'var(--serif-2)', fontSize: '16px' }}>
              <option value="AUTOMATIC">Tự động</option>
              <option value="MANUAL">Số sàn</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--muc-mo)', marginBottom: '8px' }}>Nhiên liệu</label>
            <select name="fuelType" value={form.fuelType} onChange={handleChange} style={{ width: '100%', padding: '14px 16px', background: 'var(--kem-dam)', border: '1px solid rgba(15,14,12,0.2)', fontFamily: 'var(--serif-2)', fontSize: '16px' }}>
              <option value="GASOLINE">Xăng</option>
              <option value="DIESEL">Dầu</option>
              <option value="ELECTRIC">Điện</option>
              <option value="HYBRID">Hybrid</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--muc-mo)', marginBottom: '8px' }}>Hình thức thuê</label>
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