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

  // Load drivers khi WITH_DRIVER & tự động random tài xế rảnh lịch
  useEffect(() => {
    if (form.rentalMode === 'WITH_DRIVER' && car?.ownerId) {
      setLoadingDrivers(true)
      const hasDates = form.startDate && form.endDate && new Date(form.startDate) < new Date(form.endDate)
      const params = {
        ownerId: car.ownerId,
        ...(hasDates ? { startDate: form.startDate, endDate: form.endDate } : {})
      }

      api.get('/drivers/available', { params })
        .then(res => {
          const freeDrivers = res.data.data || []
          setDrivers(freeDrivers)

          // Tự động chọn ngẫu nhiên tài xế chưa có lịch làm việc
          if (freeDrivers.length > 0) {
            setForm(prev => {
              const currentValid = freeDrivers.some(d => String(d.id) === String(prev.driverId))
              if (!currentValid || !prev.driverId) {
                const randomIdx = Math.floor(Math.random() * freeDrivers.length)
                return { ...prev, driverId: String(freeDrivers[randomIdx].id) }
              }
              return prev
            })
          } else {
            setForm(prev => ({ ...prev, driverId: '' }))
          }
        })
        .catch(err => {
          console.error('Failed to load drivers:', err)
          setDrivers([])
          setForm(prev => ({ ...prev, driverId: '' }))
        })
        .finally(() => setLoadingDrivers(false))
    } else {
      setDrivers([])
      setForm(prev => ({ ...prev, driverId: '' }))
    }
  }, [form.rentalMode, car?.ownerId, form.startDate, form.endDate])

  const handleRandomizeDriver = () => {
    if (drivers.length <= 1) return
    const currentId = String(form.driverId)
    const otherDrivers = drivers.filter(d => String(d.id) !== currentId)
    const pool = otherDrivers.length > 0 ? otherDrivers : drivers
    const randomPick = pool[Math.floor(Math.random() * pool.length)]
    setForm(prev => ({ ...prev, driverId: String(randomPick.id) }))
  }

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
  const noDriverAvailable =
    form.rentalMode === 'WITH_DRIVER' &&
    !loadingDrivers &&
    form.startDate &&
    form.endDate &&
    drivers.length === 0
  const isCarUnavailable = car && car.status !== 'AVAILABLE'
  const selectedDriver = drivers.find(d => String(d.id) === String(form.driverId))

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 48px' }}>
      <div className="chapter-num" style={{ marginBottom: '24px' }}>Chương Đặt Chỗ</div>
      <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 900, letterSpacing: '-2px', marginBottom: '48px' }}>
        Ghi <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>tên đặt chỗ.</em>
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '48px' }}>
        <form onSubmit={handleSubmit}>
          {isCarUnavailable && (
            <div style={{
              padding: '16px 20px',
              background: 'rgba(139,44,44,0.1)',
              border: '1px solid var(--do)',
              borderLeft: '4px solid var(--do)',
              marginBottom: '24px',
              fontFamily: 'var(--serif-2)',
              color: 'var(--do)',
            }}>
              <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '6px' }}>
                ⚠️ Cỗ xe này hiện đã được đặt hoặc không khả dụng!
              </div>
              <div style={{ fontSize: '14px', color: 'var(--muc)', marginBottom: '12px' }}>
                Cỗ xe đã có khách đặt trước hoặc đang trong hành trình thuê. Quý khách vui lòng quay lại bộ sưu tập để chọn cỗ xe khác.
              </div>
              <Link to="/search" style={{
                display: 'inline-flex',
                padding: '8px 16px',
                background: 'var(--muc)',
                color: 'var(--kem)',
                fontFamily: 'var(--mono)',
                fontSize: '10px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                textDecoration: 'none'
              }}>
                ← Về bộ sưu tập chọn xe khác
              </Link>
            </div>
          )}
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

          {/* ★ KHỐI TỰ ĐỘNG CHỌN TÀI XẾ RẢNH LỊCH */}
          {form.rentalMode === 'WITH_DRIVER' && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--muc-mo)', display: 'block', marginBottom: '8px' }}>
                Tài xế phục vụ chuyến đi *
              </label>

              {!form.startDate || !form.endDate ? (
                <div style={{
                  padding: '16px 20px',
                  background: 'var(--kem-dam)',
                  border: '1px dashed var(--muc)',
                  fontFamily: 'var(--serif-2)',
                  color: 'var(--muc)',
                  lineHeight: 1.6
                }}>
                  <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                    📅 Vui lòng chọn Ngày nhận xe và Ngày trả xe ở trên
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--muc-mo)' }}>
                    Hệ thống sẽ tự động rà soát lịch làm việc và chọn ngẫu nhiên một tài xế <strong>chưa có lịch làm việc (rảnh lịch)</strong> cho quý khách.
                  </div>
                </div>
              ) : loadingDrivers ? (
                <div style={{
                  padding: '24px',
                  background: 'var(--kem-dam)',
                  border: '1px solid rgba(15,14,12,0.2)',
                  textAlign: 'center',
                  fontFamily: 'var(--serif-2)',
                  fontStyle: 'italic',
                  color: 'var(--muc-mo)'
                }}>
                  🔄 Đang kiểm tra lịch làm việc của tài xế...
                </div>
              ) : drivers.length === 0 ? (
                <div style={{
                  padding: '20px',
                  background: 'rgba(139,44,44,0.08)',
                  border: '1px solid var(--do)',
                  borderLeft: '4px solid var(--do)',
                  fontFamily: 'var(--serif-2)',
                  color: 'var(--do)'
                }}>
                  <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '8px' }}>
                    ⚠️ Không có tài xế nào rảnh trong khoảng thời gian này!
                  </div>
                  <div style={{ fontSize: '14px', marginBottom: '16px', color: 'var(--muc)' }}>
                    Tất cả tài xế của chủ xe đều đã có lịch làm việc từ <strong>{new Date(form.startDate).toLocaleString('vi-VN')}</strong> đến <strong>{new Date(form.endDate).toLocaleString('vi-VN')}</strong>. Quý khách vui lòng chọn khoảng thời gian khác hoặc chuyển sang hình thức <strong>Tự lái</strong>.
                  </div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, rentalMode: 'SELF_DRIVE', driverId: '' }))}
                      style={{
                        padding: '10px 16px',
                        background: 'var(--muc)',
                        color: 'var(--kem)',
                        border: 'none',
                        fontFamily: 'var(--mono)',
                        fontSize: '11px',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        cursor: 'pointer'
                      }}
                    >
                      🔄 Chuyển sang Tự lái
                    </button>
                    <Link
                      to="/cars"
                      style={{
                        padding: '10px 16px',
                        background: 'transparent',
                        color: 'var(--muc)',
                        border: '1px solid var(--muc)',
                        fontFamily: 'var(--mono)',
                        fontSize: '11px',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center'
                      }}
                    >
                      🚗 Chọn xe khác →
                    </Link>
                  </div>
                </div>
              ) : selectedDriver ? (
                <div style={{
                  background: 'var(--kem-dam)',
                  border: '2px solid var(--muc)',
                  padding: '20px',
                  position: 'relative'
                }}>
                  {/* Header Badge */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '8px',
                    marginBottom: '16px',
                    paddingBottom: '12px',
                    borderBottom: '1px dashed rgba(15,14,12,0.2)'
                  }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      background: 'rgba(40, 116, 68, 0.12)',
                      border: '1px solid #287444',
                      borderRadius: '3px',
                      fontFamily: 'var(--mono)',
                      fontSize: '11px',
                      color: '#287444',
                      fontWeight: 700,
                      letterSpacing: '0.5px'
                    }}>
                      <span>🤖 HỆ THỐNG ĐÃ TỰ ĐỘNG CHỌN TÀI XẾ</span>
                    </div>
                    <span style={{
                      fontFamily: 'var(--mono)',
                      fontSize: '11px',
                      color: '#287444',
                      fontWeight: 600
                    }}>
                      ● Rảnh lịch ({drivers.length} tài xế khả dụng)
                    </span>
                  </div>

                  {/* Driver Info */}
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      background: 'var(--muc)',
                      color: 'var(--kem)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                      fontWeight: 700,
                      flexShrink: 0,
                      border: '2px solid var(--kem)'
                    }}>
                      {selectedDriver.avatarUrl ? (
                        <img
                          src={selectedDriver.avatarUrl}
                          alt={selectedDriver.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                      ) : (
                        selectedDriver.name ? selectedDriver.name.charAt(0).toUpperCase() : 'TX'
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                        <h4 style={{
                          fontFamily: 'var(--serif)',
                          fontSize: '20px',
                          fontWeight: 900,
                          margin: 0,
                          color: 'var(--muc)'
                        }}>
                          {selectedDriver.name}
                        </h4>
                        <span style={{
                          fontFamily: 'var(--mono)',
                          fontSize: '11px',
                          background: 'rgba(224, 159, 62, 0.2)',
                          color: '#b87704',
                          padding: '2px 8px',
                          borderRadius: '2px',
                          fontWeight: 700
                        }}>
                          ★ {selectedDriver.rating ? Number(selectedDriver.rating).toFixed(1) : '5.0'} ({selectedDriver.totalTrips || 0} chuyến)
                        </span>
                      </div>

                      <div style={{
                        display: 'flex',
                        gap: '14px',
                        flexWrap: 'wrap',
                        marginTop: '6px',
                        fontFamily: 'var(--serif-2)',
                        fontSize: '13px',
                        color: 'var(--muc-mo)'
                      }}>
                        <span>⏱ Kinh nghiệm: <strong>{selectedDriver.experienceYears || 0} năm</strong></span>
                        <span>🪪 GPLX: <strong>Hạng {selectedDriver.licenseClass || 'B2'}</strong></span>
                        <span>📞 Hotline: <strong>{selectedDriver.phone}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Verification Note */}
                  <div style={{
                    marginTop: '14px',
                    padding: '8px 12px',
                    background: 'rgba(40, 116, 68, 0.05)',
                    borderLeft: '3px solid #287444',
                    fontFamily: 'var(--serif-2)',
                    fontSize: '12px',
                    color: '#287444'
                  }}>
                    ✓ Đã kiểm tra lịch làm việc: Tài xế hoàn toàn rảnh trong suốt khung giờ chuyến đi của quý khách.
                  </div>

                  {/* Action Row */}
                  <div style={{
                    marginTop: '16px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    paddingTop: '12px',
                    borderTop: '1px dashed rgba(15,14,12,0.2)'
                  }}>
                    <button
                      type="button"
                      onClick={handleRandomizeDriver}
                      disabled={drivers.length <= 1}
                      title={drivers.length <= 1 ? 'Chỉ có 1 tài xế rảnh lịch' : 'Chọn ngẫu nhiên tài xế rảnh khác'}
                      style={{
                        padding: '9px 16px',
                        background: drivers.length > 1 ? 'var(--muc)' : 'rgba(15,14,12,0.3)',
                        color: 'var(--kem)',
                        border: 'none',
                        fontFamily: 'var(--mono)',
                        fontSize: '11px',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        cursor: drivers.length > 1 ? 'pointer' : 'not-allowed',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span>🎲 Đổi ngẫu nhiên tài xế khác</span>
                    </button>

                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <select
                        name="driverId"
                        value={form.driverId}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'var(--kem)',
                          border: '1px solid rgba(15,14,12,0.3)',
                          fontFamily: 'var(--serif-2)',
                          fontSize: '13px'
                        }}
                      >
                        {drivers.map(d => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.rating ? Number(d.rating).toFixed(1) : '5.0'}★ — {d.experienceYears || 0} năm KN)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ) : null}
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
            disabled={loading || needsVerification || noDriverAvailable || isCarUnavailable}
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '18px',
              opacity: (needsVerification || noDriverAvailable || isCarUnavailable) ? 0.5 : 1,
              cursor: (needsVerification || noDriverAvailable || isCarUnavailable) ? 'not-allowed' : 'pointer'
            }}
          >
            <span>
              {isCarUnavailable ? 'Hết xe / Đã được đặt' :
               noDriverAvailable ? 'Tài xế đã kín lịch làm việc' :
               loading ? 'Đang xử lý...' : 'Xác nhận đặt xe'}
            </span>
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