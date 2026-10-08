import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getCarById } from '../services/carService'

export default function CarDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [car, setCar] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCar = async () => {
      try {
        const data = await getCarById(id)
        setCar(data.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchCar()
  }, [id])

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN').format(p || 0)

  // ★ Icon xe theo loại (fallback khi không có ảnh)
  const carIcons = {
    SEDAN: '🚗',
    SUV: '🚙',
    MPV: '🚐',
    HATCHBACK: '🚗',
    PICKUP: '🛻',
    VAN: '🚐',
    LUXURY: '🏎️',
  }

  if (loading) return <div style={{ padding: '120px 48px', textAlign: 'center', fontFamily: 'var(--serif-2)', fontStyle: 'italic' }}>Đang tải...</div>
  if (!car) return <div style={{ padding: '120px 48px', textAlign: 'center' }}><p>Không tìm thấy cỗ xe.</p><Link to="/search" style={{ color: 'var(--do)' }}>← Về bộ sưu tập</Link></div>

  // ★ Lấy ảnh đầu tiên nếu có
  const hasImage = car.imageUrls && car.imageUrls.length > 0
  const imageUrl = hasImage ? car.imageUrls[0] : null
  const carIcon = carIcons[car.carType] || '🚗'

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '60px 48px' }}>
      <Link to="/search" style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muc-mo)', display: 'inline-block', marginBottom: '40px' }}>
        ← Về bộ sưu tập
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '60px', alignItems: 'start' }}>
        <div>
          {/* ★ FIX: Hiện ẢNH THẬT nếu có, fallback icon nếu không */}
          <div style={{
            background: 'var(--kem-dam)',
            border: '1px solid rgba(15,14,12,0.15)',
            aspectRatio: '4/3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '160px',
            marginBottom: '24px',
            overflow: 'hidden',
            position: 'relative',
          }}>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={`${car.brand} ${car.model}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
                onError={(e) => {
                  // Nếu ảnh lỗi → ẩn img, hiện icon fallback
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'flex'
                }}
              />
            ) : null}

            {/* Fallback icon (hiện nếu không có ảnh HOẶC ảnh lỗi) */}
            <div style={{
              display: imageUrl ? 'none' : 'flex',
              position: imageUrl ? 'absolute' : 'relative',
              inset: 0,
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '160px',
            }}>
              {carIcon}
            </div>

            {/* Badge số ảnh (nếu có > 1 ảnh) */}
            {car.imageUrls && car.imageUrls.length > 1 && (
              <div style={{
                position: 'absolute',
                bottom: '16px',
                right: '16px',
                padding: '6px 12px',
                background: 'rgba(15,14,12,0.8)',
                color: 'var(--kem)',
                fontFamily: 'var(--mono)',
                fontSize: '11px',
                letterSpacing: '1px',
                zIndex: 2,
              }}>
                📷 {car.imageUrls.length}
              </div>
            )}
          </div>

          <div className="chapter-num" style={{ marginBottom: '20px' }}>Chi tiết</div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(36px, 4vw, 56px)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: '24px' }}>
            {car.brand} <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>{car.model}</em>
          </h1>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '40px', padding: '24px', background: 'var(--kem-dam)', border: '1px solid rgba(15,14,12,0.1)' }}>
            <div><span style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muc-mo)' }}>Năm SX</span><div style={{ fontFamily: 'var(--serif)', fontSize: '20px', fontWeight: 700 }}>{car.year}</div></div>
            <div><span style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muc-mo)' }}>Số chỗ</span><div style={{ fontFamily: 'var(--serif)', fontSize: '20px', fontWeight: 700 }}>{car.seats}</div></div>
            <div><span style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muc-mo)' }}>Hộp số</span><div style={{ fontFamily: 'var(--serif)', fontSize: '20px', fontWeight: 700 }}>{car.transmission === 'AUTOMATIC' ? 'Tự động' : 'Số sàn'}</div></div>
            <div><span style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muc-mo)' }}>Nhiên liệu</span><div style={{ fontFamily: 'var(--serif)', fontSize: '20px', fontWeight: 700 }}>{car.fuelType || 'Xăng'}</div></div>
          </div>

          <p style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '18px', lineHeight: 1.7, color: 'var(--muc-mo)' }}>
            {car.description || 'Cỗ xe được chăm chút tỉ mỉ, sẵn sàng cho mọi hành trình.'}
          </p>
        </div>

        <div style={{ position: 'sticky', top: '120px', background: 'var(--muc)', color: 'var(--kem)', padding: '40px', border: '1px solid var(--dong)' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--dong)', marginBottom: '12px' }}>Khởi từ</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '56px', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1, marginBottom: '8px' }}>
            {formatPrice(car.pricePerDay)}
            <span style={{ fontFamily: 'var(--mono)', fontSize: '14px', fontWeight: 400, marginLeft: '8px', color: 'var(--dong)' }}>đ/ngày</span>
          </div>
          <div style={{ height: '1px', background: 'rgba(201,169,97,0.3)', margin: '32px 0' }}></div>
          <button onClick={() => navigate(`/booking/${car.id}`)} className="btn-login" style={{ width: '100%', justifyContent: 'center', padding: '18px', background: 'var(--dong)', color: 'var(--muc)' }}>
            <span>Đặt cỗ xe này</span>
          </button>
        </div>
      </div>
    </div>
  )
}