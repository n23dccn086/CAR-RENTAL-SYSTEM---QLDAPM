import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCarById } from '../services/carService'
import { createBooking } from '../services/bookingService'
import FormInput from '../components/FormInput'

export default function BookingPage() {
  const { carId } = useParams()
  const navigate = useNavigate()
  const [car, setCar] = useState(null)
  const [form, setForm] = useState({
    startDate: '', endDate: '', pickupAddress: '', rentalMode: 'SELF_DRIVE', note: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getCarById(carId).then(res => setCar(res.data)).catch(console.error)
  }, [carId])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const calcTotal = () => {
    if (!form.startDate || !form.endDate || !car) return 0
    const days = Math.max(1, Math.ceil((new Date(form.endDate) - new Date(form.startDate)) / (1000 * 60 * 60 * 24)))
    return days * (car.pricePerDay || 0)
  }

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN').format(p)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await createBooking({
        carId: parseInt(carId),
        startDate: form.startDate,
        endDate: form.endDate,
        pickupAddress: form.pickupAddress,
        rentalMode: form.rentalMode,
        customerNote: form.note,
      })
      const bookingId = res.data?.id
      navigate(`/payment/${bookingId}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Đặt xe thất bại')
    } finally {
      setLoading(false)
    }
  }

  const total = calcTotal()

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 48px' }}>
      <div className="chapter-num" style={{ marginBottom: '24px' }}>Chương Đặt Chỗ</div>
      <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 900, letterSpacing: '-2px', marginBottom: '48px' }}>
        Ghi <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>tên đặt chỗ.</em>
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '48px' }}>
        <form onSubmit={handleSubmit}>
          {error && <div style={{ background: 'rgba(139,44,44,0.1)', border: '1px solid var(--do)', padding: '12px 16px', marginBottom: '24px', color: 'var(--do)' }}>{error}</div>}
          <FormInput label="Ngày nhận xe" name="startDate" type="datetime-local" value={form.startDate} onChange={handleChange} required />
          <FormInput label="Ngày trả xe" name="endDate" type="datetime-local" value={form.endDate} onChange={handleChange} required />
          <FormInput label="Địa chỉ nhận xe" name="pickupAddress" value={form.pickupAddress} onChange={handleChange} placeholder="123 Nguyễn Huệ, Q1" required />

          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--muc-mo)', display: 'block', marginBottom: '8px' }}>Hình thức thuê</label>
            <select name="rentalMode" value={form.rentalMode} onChange={handleChange} style={{ width: '100%', padding: '14px 16px', background: 'var(--kem-dam)', border: '1px solid rgba(15,14,12,0.2)', fontFamily: 'var(--serif-2)', fontSize: '16px' }}>
              <option value="SELF_DRIVE">Tự lái</option>
              <option value="WITH_DRIVER">Có tài xế</option>
            </select>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--muc-mo)', display: 'block', marginBottom: '8px' }}>Ghi chú</label>
            <textarea name="note" value={form.note} onChange={handleChange} rows="3" style={{ width: '100%', padding: '14px 16px', background: 'var(--kem-dam)', border: '1px solid rgba(15,14,12,0.2)', fontFamily: 'var(--serif-2)', fontSize: '16px', resize: 'vertical' }} />
          </div>

          <button type="submit" className="btn-login" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '18px' }}>
            <span>{loading ? 'Đang xử lý...' : 'Xác nhận đặt xe'}</span>
          </button>
        </form>

        <div style={{ position: 'sticky', top: '120px', background: 'var(--kem-dam)', border: '1px solid var(--muc)', padding: '40px', height: 'fit-content' }}>
          <h3 style={{ fontFamily: 'var(--serif)', fontSize: '28px', fontWeight: 900, marginBottom: '24px' }}>Tạm tính</h3>
          {car && (
            <>
              <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid rgba(15,14,12,0.15)' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muc-mo)', marginBottom: '4px' }}>Cỗ xe</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '22px', fontWeight: 700 }}>{car.brand} {car.model}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontFamily: 'var(--serif-2)', fontSize: '16px' }}>
                <span>Giá thuê</span>
                <span style={{ fontFamily: 'var(--mono)' }}>{formatPrice(car.pricePerDay)}đ/ngày</span>
              </div>
              <div style={{ height: '1px', background: 'rgba(15,14,12,0.15)', margin: '24px 0' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase' }}>Tổng</span>
                <span style={{ fontFamily: 'var(--serif)', fontSize: '32px', fontWeight: 900, color: 'var(--do)' }}>{formatPrice(total)}<span style={{ fontSize: '14px', fontFamily: 'var(--mono)', fontWeight: 400, marginLeft: '4px' }}>đ</span></span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}