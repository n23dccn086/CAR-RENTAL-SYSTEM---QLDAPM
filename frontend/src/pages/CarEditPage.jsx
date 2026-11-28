import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import FormInput from '../components/FormInput'
import { getCarById } from '../services/carService'
import api from '../services/api'

export default function CarEditPage() {
  const { id } = useParams()
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
    priceWeekend: '',
    carType: 'SEDAN',
    rentalMode: 'BOTH',
    address: '',
    description: ''
  })

  // ★ 1 ảnh hiện tại (từ DB)
  const [existingImage, setExistingImage] = useState(null)
  // ★ 1 ảnh mới chọn (thay thế)
  const [newImage, setNewImage] = useState(null)
  const [newPreview, setNewPreview] = useState(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // ★ Lịch chặn (bảo dưỡng / dùng riêng) — server từ chối đặt xe trùng các khoảng này
  const [blocks, setBlocks] = useState([])
  const [blockForm, setBlockForm] = useState({ startDate: '', endDate: '', reason: 'maintenance', note: '' })
  const [blockError, setBlockError] = useState('')
  const [blockSaving, setBlockSaving] = useState(false)

  const addBlock = async () => {
    setBlockError('')
    if (!blockForm.startDate || !blockForm.endDate) return setBlockError('Chọn ngày bắt đầu và ngày kết thúc')
    if (blockForm.endDate < blockForm.startDate) return setBlockError('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu')
    setBlockSaving(true)
    try {
      const res = await api.post(`/cars/${id}/blocked-dates`, {
        start_date: blockForm.startDate,
        end_date: blockForm.endDate,
        reason: blockForm.reason,
        note: blockForm.note?.trim() || null,
      })
      const b = res.data.data
      setBlocks(prev => [...prev, { id: b.id, start_date: b.startDate, end_date: b.endDate, reason: b.reason, note: b.note }])
      setBlockForm({ startDate: '', endDate: '', reason: 'maintenance', note: '' })
    } catch (err) {
      setBlockError(err.response?.data?.message || 'Không chặn được lịch')
    } finally {
      setBlockSaving(false)
    }
  }

  const removeBlock = async (blockId) => {
    setBlockError('')
    try {
      await api.delete(`/cars/${id}/blocked-dates/${blockId}`)
      setBlocks(prev => prev.filter(b => b.id !== blockId))
    } catch (err) {
      setBlockError(err.response?.data?.message || 'Không gỡ được lịch chặn')
    }
  }

  useEffect(() => {
    getCarById(id)
      .then(res => {
        const c = res.data
        setForm({
          plate: c.plate || '',
          brand: c.brand || '',
          model: c.model || '',
          year: c.year || 2024,
          color: c.color || '',
          seats: c.seats || 5,
          transmission: c.transmission || 'AUTOMATIC',
          fuelType: c.fuelType || 'GASOLINE',
          currentKm: c.currentKm || 0,
          pricePerDay: c.pricePerDay || 1000000,
          // API trả price_weekend = giá thường khi chưa cấu hình → chỉ hiện khi khác giá thường
          priceWeekend: c.priceWeekend && c.priceWeekend !== c.pricePerDay ? c.priceWeekend : '',
          carType: c.carType || 'SEDAN',
          rentalMode: c.rentalMode || 'BOTH',
          address: c.address || '',
          description: c.description || ''
        })
        setBlocks((c.blockedDates || c.blockedDatesList || []).filter(b => b.id != null))
        // Lấy ảnh đầu tiên nếu có
        if (c.imageUrls && c.imageUrls.length > 0) {
          setExistingImage(c.imageUrls[0])
        }
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Không tải được xe')
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleChange = (e) => {
    const { name, value } = e.target
    const numberFields = ['year', 'seats', 'currentKm', 'pricePerDay', 'priceWeekend']
    setForm({ ...form, [name]: numberFields.includes(name) ? (value === '' ? '' : Number(value)) : value })
  }

  // ★ CHỌN ẢNH MỚI
  const handleNewImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setNewImage(file)
    if (newPreview) URL.revokeObjectURL(newPreview)
    setNewPreview(URL.createObjectURL(file))
  }

  const removeNewImage = () => {
    setNewImage(null)
    if (newPreview) URL.revokeObjectURL(newPreview)
    setNewPreview(null)
  }

  // ★ XÓA ẢNH CŨ (khỏi DB luôn)
  const removeExistingImage = async () => {
    if (!window.confirm('Xóa ảnh này khỏi xe?')) return
    try {
      await api.delete(`/cars/${id}/images?imageUrl=${encodeURIComponent(existingImage)}`)
      setExistingImage(null)
    } catch (err) {
      alert('Lỗi xóa ảnh: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.plate?.trim()) return setError('Biển số không được để trống')
    if (!form.brand?.trim()) return setError('Hãng xe không được để trống')
    if (!form.model?.trim()) return setError('Dòng xe không được để trống')

    setSaving(true)
    try {
      // 1. Update info
      await api.put(`/cars/${id}`, {
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
        // 0 = bỏ giá cuối tuần (PricingService chỉ dùng giá cuối tuần khi > 0)
        priceWeekend: form.priceWeekend ? Number(form.priceWeekend) : 0,
        carType: form.carType,
        rentalMode: form.rentalMode,
        address: form.address?.trim() || null,
        description: form.description?.trim() || null,
      })

      // 2. Nếu có ảnh mới → xóa ảnh cũ + upload ảnh mới
      if (newImage) {
        // Xóa ảnh cũ nếu có
        if (existingImage) {
          try {
            await api.delete(`/cars/${id}/images?imageUrl=${encodeURIComponent(existingImage)}`)
          } catch (e) {
            console.warn('Xóa ảnh cũ thất bại:', e)
          }
        }
        // Upload ảnh mới
        const formData = new FormData()
        formData.append('images', newImage)
        await api.post(`/cars/${id}/images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }

      navigate('/owner/cars')
    } catch (err) {
      setError(err.response?.data?.message || 'Cập nhật thất bại')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '120px 48px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', color: 'var(--muc-mo)' }}>Đang tải...</p>
      </div>
    )
  }

  // Ảnh hiển thị: ưu tiên ảnh mới chọn, không thì ảnh cũ
  const displayImage = newPreview || existingImage

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
        Sửa <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>cỗ xe.</em>
      </h1>

      {error && (
        <div style={{ background: 'rgba(139,44,44,0.1)', border: '1px solid var(--do)', padding: '12px 16px', marginBottom: '24px', color: 'var(--do)', fontFamily: 'var(--serif-2)', fontStyle: 'italic' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* ★ 1 ẢNH XE */}
        <div style={{ marginBottom: '32px' }}>
          <label style={labelStyle}>Ảnh xe</label>

          {displayImage ? (
            <div style={{ position: 'relative', width: '280px', aspectRatio: '4/3', border: '1px solid rgba(15,14,12,0.2)', overflow: 'hidden' }}>
              <img src={displayImage} alt="Ảnh xe" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button
                type="button"
                onClick={newPreview ? removeNewImage : removeExistingImage}
                style={{
                  position: 'absolute', top: '8px', right: '8px',
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: 'var(--do)', color: 'var(--kem)',
                  border: 'none', cursor: 'pointer', fontSize: '14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >×</button>

              {/* Badge nếu là ảnh mới */}
              {newPreview && (
                <div style={{
                  position: 'absolute', bottom: '8px', left: '8px',
                  padding: '4px 10px', background: 'var(--do)', color: 'var(--kem)',
                  fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '1px',
                  textTransform: 'uppercase',
                }}>
                  Ảnh mới
                </div>
              )}
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
            }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleNewImageChange}
                style={{ display: 'none' }}
              />
              <span style={{ fontSize: '32px' }}>📷</span>
              <span>Chọn 1 ảnh xe</span>
            </label>
          )}

          {/* Nút đổi ảnh (nếu đang có ảnh) */}
          {displayImage && !newPreview && (
            <label style={{
              display: 'inline-block', marginTop: '12px',
              padding: '8px 16px', background: 'transparent',
              border: '1px solid var(--muc)', color: 'var(--muc)',
              fontFamily: 'var(--mono)', fontSize: '10px',
              letterSpacing: '1.5px', textTransform: 'uppercase',
              cursor: 'pointer',
            }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleNewImageChange}
                style={{ display: 'none' }}
              />
              🔄 Đổi ảnh khác
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

          <div>
            <label style={labelStyle}>Số chỗ *</label>
            {/* Phạm vi dự án: chỉ xe 4, 5, 7 chỗ (khớp validate backend CarRequest) */}
            <select name="seats" value={form.seats} onChange={handleChange} style={inputStyle} required>
              <option value="4">4 chỗ</option>
              <option value="5">5 chỗ</option>
              <option value="7">7 chỗ</option>
            </select>
          </div>
          <FormInput label="Số km hiện tại" name="currentKm" type="number" value={form.currentKm} onChange={handleChange} />
          <FormInput label="Giá thuê / ngày (VNĐ)" name="pricePerDay" type="number" value={form.pricePerDay} onChange={handleChange} required />
          <FormInput label="Giá cuối tuần T7/CN (VNĐ, tùy chọn)" name="priceWeekend" type="number" value={form.priceWeekend} onChange={handleChange} placeholder="Để trống = giá ngày thường" />
          <FormInput label="Địa chỉ" name="address" value={form.address} onChange={handleChange} />

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

        <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
          <Link
            to="/owner/cars"
            className="btn-login"
            style={{
              flex: 1, justifyContent: 'center', padding: '16px',
              background: 'transparent', border: '1px solid var(--muc)',
              color: 'var(--muc)', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center',
            }}
          >
            <span>Hủy</span>
          </Link>
          <button
            type="submit"
            className="btn-login"
            disabled={saving}
            style={{ flex: 2, justifyContent: 'center', padding: '16px' }}
          >
            <span>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
          </button>
        </div>
      </form>

      {/* ★ LỊCH CHẶN */}
      <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid rgba(15,14,12,0.15)' }}>
        <label style={labelStyle}>Chặn lịch xe (bảo dưỡng / dùng riêng)</label>
        <p style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', color: 'var(--muc-mo)', marginBottom: '16px' }}>
          Khách sẽ không đặt được xe trong các ngày này (tính cả ngày đầu và ngày cuối).
        </p>
        {blocks.length === 0 ? (
          <p style={{ fontFamily: 'var(--serif-2)', color: 'var(--muc-mo)', marginBottom: '16px' }}>Chưa có lịch chặn.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, marginBottom: '16px' }}>
            {blocks.map(b => (
              <li key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '10px 14px', background: 'var(--kem-dam)', border: '1px solid rgba(15,14,12,0.15)', marginBottom: '8px', fontFamily: 'var(--serif-2)' }}>
                <span>
                  <strong>{b.start_date}</strong> → <strong>{b.end_date}</strong>
                  {' · '}{b.reason === 'personal' ? 'Dùng riêng' : 'Bảo dưỡng'}
                  {b.note ? ` · ${b.note}` : ''}
                </span>
                <button type="button" onClick={() => removeBlock(b.id)} style={{ background: 'transparent', border: '1px solid var(--do)', color: 'var(--do)', padding: '6px 12px', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer' }}>
                  Gỡ chặn
                </button>
              </li>
            ))}
          </ul>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <input type="date" value={blockForm.startDate} onChange={e => setBlockForm({ ...blockForm, startDate: e.target.value })} style={inputStyle} aria-label="Ngày bắt đầu" />
          <input type="date" value={blockForm.endDate} onChange={e => setBlockForm({ ...blockForm, endDate: e.target.value })} style={inputStyle} aria-label="Ngày kết thúc" />
          <select value={blockForm.reason} onChange={e => setBlockForm({ ...blockForm, reason: e.target.value })} style={inputStyle}>
            <option value="maintenance">Bảo dưỡng</option>
            <option value="personal">Dùng riêng</option>
          </select>
        </div>
        <input type="text" placeholder="Ghi chú (tùy chọn)" value={blockForm.note} onChange={e => setBlockForm({ ...blockForm, note: e.target.value })} style={{ ...inputStyle, marginTop: '12px' }} />
        {blockError && <p style={{ color: 'var(--do)', fontFamily: 'var(--serif-2)', fontStyle: 'italic', marginTop: '8px' }}>{blockError}</p>}
        <button type="button" onClick={addBlock} disabled={blockSaving} className="btn-login" style={{ marginTop: '12px', justifyContent: 'center', padding: '12px 24px' }}>
          <span>{blockSaving ? 'Đang lưu...' : '+ Thêm lịch chặn'}</span>
        </button>
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

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  background: 'var(--kem-dam)',
  border: '1px solid rgba(15,14,12,0.2)',
  fontFamily: 'var(--serif-2)',
  fontSize: '16px',
}