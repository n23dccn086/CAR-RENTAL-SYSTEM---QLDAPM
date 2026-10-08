import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getCarById } from '../services/carService'
import { createBooking } from '../services/bookingService'
import { useAuth } from '../hooks/useAuth'
import FormInput from '../components/FormInput'
import api from '../services/api'

export default function BookingPage() {
  const { carId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [car, setCar] = useState(null)
  const [drivers, setDrivers] = useState([])
  const [loadingDrivers, setLoadingDrivers] = useState(false)

  const [form, setForm] = useState({
    startDate: '',
    endDate: '',
    pickupAddress: '',
    rentalMode: 'SELF_DRIVE',
    driverId: '',
    note: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ★ MỚI: % cọc đọc từ config
  const [depositPercent, setDepositPercent] = useState(30)

  useEffect(() => {
    getCarById(carId).then(res => setCar(res.data)).catch(console.error)
  }, [carId])

  // ★ MỚI: Load % cọc từ public config
  useEffect(() => {
    api.get('/public/config/default_deposit_percent')
      .then(res => {
        const pct = parseInt(res.data.data)
        if (!isNaN(pct) && pct > 0) setDepositPercent(pct)
      })
      .catch(() => setDepositPercent(30))
  }, [])

  // Load drivers khi WITH_DRIVER
  useEffect(() => {
    if (form.rentalMode === 'WITH_DRIVER' && car?.ownerId) {
      setLoadingDrivers(true)
      api.get('/drivers/available')
        .then(res => {
          const allDrivers = res.data.data || []
          // Chỉ lấy driver thuộc cùng Owner với xe
          const sameOwnerDrivers = allDrivers.filter(d => d.ownerId === car.ownerId)
          setDrivers(sameOwnerDrivers)
        })
        .catch(err => {
          console.error('Failed to load drivers:', err)
          setDrivers([])
        })
        .finally(() => setLoadingDrivers(false))
    } else {
      setDrivers([])
      setForm(prev => ({ ...prev, driverId: '' }))
    }
  }, [form.rentalMode, car])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const calcTotal = () => {
    if (!form.startDate || !form.endDate || !car) return 0
    const days = Math.max(1, Math.ceil((new Date(form.endDate) - new Date(form.startDate)) / (1000 * 60 * 60 * 24)))
    return days * (car.pricePerDay || 0)
  }

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN').format(p)

  const needsVerification =
    form.rentalMode === 'SELF_DRIVE' &&
    user?.verificationStatus !== 'VERIFIED'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.startDate) return setError('Vui lòng chọn ngày nhận xe')
    if (!form.endDate) return setError('Vui lòng chọn ngày trả xe')

    const start = new Date(form.startDate)
    const end = new Date(form.endDate)
    const now = new Date()

    if (start <= now) return setError('Ngày nhận xe phải sau ngày hiện tại')
    if (end <= start) return setError('Ngày trả xe phải SAU ngày nhận xe')

    const hours = (end - start) / (1000 * 60 * 60)
    if (hours < 24) return setError('Thời gian thuê tối thiểu 1 ngày (24 giờ)')

    if (needsVerification) {
      return setError('Bạn cần xác thực GPLX/CCCD trước khi thuê xe tự lái. Vui lòng vào mục "Xác thực tài khoản".')
    }

    if (form.rentalMode === 'WITH_DRIVER' && !form.driverId) {
      return setError('Vui lòng chọn tài xế cho đơn thuê có tài xế.')
    }

    setLoading(true)
    try {
      const payload = {
        carId: parseInt(carId),
        startDate: form.startDate,
        endDate: form.endDate,
        pickupAddress: form.pickupAddress,
        rentalMode: form.rentalMode,
        customerNote: form.note,
      }
      if (form.rentalMode === 'WITH_DRIVER' && form.driverId) {
        payload.driverId = parseInt(form.driverId)
      }

      const res = await createBooking(payload)
      const bookingId = res.data?.id
      navigate(`/payment/${bookingId}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Đặt xe thất bại')
    } finally {
      setLoading(false)
    }
  }

  const total = calcTotal()
  const depositAmount = Math.round(total * depositPercent / 100)
  const noDriverAvailable = form.rentalMode === 'WITH_DRIVER' && !loadingDrivers && drivers.length === 0

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 48px' }}>
      <div className="chapter-num" style={{ marginBottom: '24px' }}>Chương Đặt Chỗ</div>
      <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 900, letterSpacing: '-2px', marginBottom: '48px' }}>
        Ghi <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>tên đặt chỗ.</em>
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '48px' }}>
        <form onSubmit={handleSubmit}>
          {needsVerification && (
            <div style={{
              padding: '16px 20px',
              background: 'rgba(139,44,44,0.1)',
              border: '1px solid var(--do)',
              borderLeft: '4px solid var(--do)',
              marginBottom: '24px',
              fontFamily: 'var(--serif-2)',
              fontStyle: 'italic',
              color: 'var(--do)',
            }}>
              ⚠️ Bạn cần <strong>xác thực GPLX/CCCD</strong> trước khi thuê xe tự lái.{' '}
              <Link to="/verification" style={{ color: 'var(--do)', textDecoration: 'underline' }}>
                Xác thực ngay →
              </Link>
            </div>
          )}

          {error && (
            <div style={{ background: 'rgba(139,44,44,0.1)', border: '1px solid var(--do)', padding: '12px 16px', marginBottom: '24px', color: 'var(--do)' }}>
              {error}
            </div>
          )}

          <FormInput
            label="Ngày nhận xe"
            name="startDate"
            type="datetime-local"
            value={form.startDate}
            onChange={handleChange}
            min={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)}
            required
          />
          <FormInput
            label="Ngày trả xe"
            name="endDate"
            type="datetime-local"
            value={form.endDate}
            onChange={handleChange}
            min={form.startDate || ''}
            required
          />
          <FormInput
            label="Địa chỉ nhận xe"
            name="pickupAddress"
            value={form.pickupAddress}
            onChange={handleChange}
            placeholder="123 Nguyễn Huệ, Q1"
            required
          />

          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--muc-mo)', display: 'block', marginBottom: '8px' }}>
              Hình thức thuê
            </label>
            <select
              name="rentalMode"
              value={form.rentalMode}
              onChange={handleChange}
              style={{ width: '100%', padding: '14px 16px', background: 'var(--kem-dam)', border: '1px solid rgba(15,14,12,0.2)', fontFamily: 'var(--serif-2)', fontSize: '16px' }}
            >
              <option value="SELF_DRIVE">Tự lái</option>
              <option value="WITH_DRIVER">Có tài xế</option>
            </select>
          </div>

          {/* ★ COMBOBOX CHỌN TÀI XẾ */}
          {form.rentalMode === 'WITH_DRIVER' && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--muc-mo)', display: 'block', marginBottom: '8px' }}>
                Chọn tài xế *
              </label>

              {loadingDrivers ? (
                <div style={{ padding: '14px', background: 'var(--kem-dam)', border: '1px solid rgba(15,14,12,0.2)', fontFamily: 'var(--serif-2)', fontStyle: 'italic', color: 'var(--muc-mo)' }}>
                  Đang tải danh sách tài xế...
                </div>
              ) : drivers.length === 0 ? (
                <div style={{ padding: '14px', background: 'rgba(139,44,44,0.05)', border: '1px solid var(--do)', fontFamily: 'var(--serif-2)', fontStyle: 'italic', color: 'var(--do)' }}>
                  ⚠️ Chủ xe hiện không có tài xế nào khả dụng. Vui lòng chọn hình thức Tự lái hoặc liên hệ chủ xe.
                </div>
              ) : (
                <select
                  name="driverId"
                  value={form.driverId}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '14px 16px', background: 'var(--kem-dam)', border: '1px solid rgba(15,14,12,0.2)', fontFamily: 'var(--serif-2)', fontSize: '16px' }}
                >
                  <option value="">-- Chọn tài xế --</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {d.rating?.toFixed(1) || '0.0'}★ — Đang hoạt động
                    </option>
                  ))}
                </select>
              )}

              {drivers.length > 0 && (
                <div style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '12px', color: 'var(--muc-mo)', marginTop: '6px' }}>
                  💡 Chỉ hiển thị tài xế đang hoạt động của chủ xe này.
                </div>
              )}
            </div>
          )}

          <div style={{ marginBottom: '32px' }}>
            <label style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--muc-mo)', display: 'block', marginBottom: '8px' }}>
              Ghi chú
            </label>
            <textarea
              name="note"
              value={form.note}
              onChange={handleChange}
              rows="3"
              style={{ width: '100%', padding: '14px 16px', background: 'var(--kem-dam)', border: '1px solid rgba(15,14,12,0.2)', fontFamily: 'var(--serif-2)', fontSize: '16px', resize: 'vertical' }}
            />
          </div>

          <button
            type="submit"
            className="btn-login"
            disabled={loading || needsVerification || noDriverAvailable}
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '18px',
              opacity: (needsVerification || noDriverAvailable) ? 0.5 : 1,
              cursor: (needsVerification || noDriverAvailable) ? 'not-allowed' : 'pointer'
            }}
          >
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

              {/* ★ MỚI: Tiền cọc */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontFamily: 'var(--serif-2)', fontSize: '16px' }}>
                <span>Tiền cọc ({depositPercent}%)</span>
                <span style={{ fontFamily: 'var(--mono)', color: 'var(--do)' }}>
                  {formatPrice(depositAmount)}đ
                </span>
              </div>

              <div style={{ height: '1px', background: 'rgba(15,14,12,0.15)', margin: '24px 0' }}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase' }}>Tổng</span>
                <span style={{ fontFamily: 'var(--serif)', fontSize: '32px', fontWeight: 900, color: 'var(--do)' }}>
                  {formatPrice(total)}<span style={{ fontSize: '14px', fontFamily: 'var(--mono)', fontWeight: 400, marginLeft: '4px' }}>đ</span>
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}