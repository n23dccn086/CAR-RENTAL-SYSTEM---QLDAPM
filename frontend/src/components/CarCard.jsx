import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'

export default function CarCard({ car, index }) {
  const [hover, setHover] = useState(false)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const cardRef = useRef(null)

  const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price)

  const handleMouseMove = (e) => {
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: x * 8, y: -y * 8 })
  }

  const handleMouseLeave = () => {
    setHover(false)
    setTilt({ x: 0, y: 0 })
  }

  // Ảnh thật (nếu có) — backend trả về `imageUrls` (array string)
  const hasImage = car.imageUrls && car.imageUrls.length > 0
const imageUrl = hasImage ? car.imageUrls[0] : null

  // Icon xe theo loại
  const carIcons = { SEDAN: '🚗', SUV: '🚙', MPV: '🚐', HATCHBACK: '🚗' }
  const carIcon = carIcons[car.carType] || '🚗'

  return (
    <Link
      to={`/cars/${car.id}`}
      className="car-row"
      ref={cardRef}
      onMouseEnter={() => setHover(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
        transition: hover ? 'transform 0.1s ease-out' : 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
        gridTemplateColumns: '60px 220px minmax(0, 1fr) 200px 40px'  // ← FIX: cột chữ co giãn
      }}
    >
      <div className="car-num">{['I', 'II', 'III', 'IV', 'V'][index] || index + 1}</div>

      {/* ẢNH XE — Ảnh thật HOẶC icon đỏ */}
      <div style={{
        width: '200px',
        height: '120px',
        background: hover ? 'var(--kem)' : 'var(--kem-dam)',
        border: '1px solid rgba(15,14,12,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
        zIndex: 1,
        boxShadow: hover ? '0 12px 32px rgba(15,14,12,0.15)' : 'none'
      }}>
        {/* Ánh sáng sweep */}
        {hover && (
          <div style={{
            position: 'absolute',
            top: 0, left: '-100%',
            width: '50%', height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
            animation: 'lightSweep 1s ease-out',
            zIndex: 2
          }} />
        )}

        {/* Lưới nền khi hover */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(15,14,12,0.06) 1px, transparent 1px)',
          backgroundSize: '10px 10px',
          opacity: hover ? 1 : 0,
          transition: 'opacity 0.5s',
          zIndex: 0
        }} />

        {/* ẢNH THẬT hoặc ICON */}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${car.brand} ${car.model}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: hover ? 'scale(1.08)' : 'scale(1)',
              transition: 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
              position: 'relative',
              zIndex: 1
            }}
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        ) : null}

        {/* Icon xe đỏ (fallback) */}
        <div style={{
          display: imageUrl ? 'none' : 'flex',
          fontSize: '64px',
          position: 'relative',
          zIndex: 1,
          transform: hover ? 'translateX(8px) scale(1.1)' : 'translateX(0) scale(1)',
          transition: 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
          filter: hover ? 'drop-shadow(0 8px 16px rgba(139,44,44,0.4))' : 'none'
        }}>
          {carIcon}
        </div>
      </div>

      {/* THÔNG TIN — cột co giãn, không đè */}
      <div className="car-info" style={{
        minWidth: 0,
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1
      }}>
        <h3 className="car-title" style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {car.brand} {car.model} <em>— niên hiệu {car.year}</em>
        </h3>
        <div className="car-desc">
          <span>{car.carType || 'Sedan'}</span>
          <span className="dash">·</span>
          <span>{car.seats} tọa</span>
          <span className="dash">·</span>
          <span>{car.transmission === 'AUTOMATIC' ? 'Tự hành' : 'Số sàn'}</span>
        </div>

        {/* Tags khi hover */}
        {hover && (
          <div style={{
            display: 'flex',
            gap: '6px',
            marginTop: '12px',
            animation: 'fadeUp 0.4s ease-out'
          }}>
            <span style={{
              fontFamily: 'var(--mono)',
              fontSize: '9px',
              letterSpacing: '1px',
              padding: '3px 8px',
              background: 'var(--dong)',
              color: 'var(--muc)',
              textTransform: 'uppercase'
            }}>Bảo hiểm</span>
            <span style={{
              fontFamily: 'var(--mono)',
              fontSize: '9px',
              letterSpacing: '1px',
              padding: '3px 8px',
              border: '1px solid var(--muc)',
              color: 'var(--muc)',
              textTransform: 'uppercase'
            }}>Giao tận nơi</span>
          </div>
        )}
      </div>

      <div className="car-price-block">
        <div className="car-price-label">Khởi từ</div>
        <div className="car-price">{formatPrice(car.pricePerDay)}<span>đ/mỗi ngày</span></div>
      </div>

      <div className="car-arrow" style={{
        transform: hover ? 'translateX(8px)' : 'translateX(0)',
        opacity: hover ? 1 : 0.3,
        color: hover ? 'var(--do)' : 'var(--muc-mo)'
      }}>→</div>
    </Link>
  )
}