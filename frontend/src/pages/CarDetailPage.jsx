import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getCarById } from '../services/carService'
import api from '../services/api'

export default function CarDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [car, setCar] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reviewsData, setReviewsData] = useState({ reviews: [], summary: null })
  const [loadingReviews, setLoadingReviews] = useState(true)

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

    const fetchReviews = async () => {
      setLoadingReviews(true)
      try {
        const res = await api.get(`/reviews/cars/${id}`)
        const payload = res.data.data || {}
        setReviewsData({
          reviews: payload.reviews || [],
          summary: payload.summary || null
        })
      } catch (err) {
        console.error('Failed to load reviews:', err)
      } finally {
        setLoadingReviews(false)
      }
    }

    fetchCar()
    fetchReviews()
  }, [id])

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN').format(p || 0)

  // Icon xe theo loại (fallback khi không có ảnh)
  const carIcons = {
    SEDAN: '🚗',
    SUV: '🚙',
    MPV: '🚐',
    HATCHBACK: '🚗',
    PICKUP: '🛻',
    VAN: '🚐',
    LUXURY: '🏎️',
  }

  const renderStars = (count) => {
    return '★'.repeat(count || 0) + '☆'.repeat(Math.max(0, 5 - (count || 0)))
  }

  const formatDate = (d) => {
    if (!d) return ''
    try {
      return new Date(d).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return d
    }
  }

  if (loading) return <div style={{ padding: '120px 48px', textAlign: 'center', fontFamily: 'var(--serif-2)', fontStyle: 'italic' }}>Đang tải...</div>
  if (!car) return <div style={{ padding: '120px 48px', textAlign: 'center' }}><p>Không tìm thấy cỗ xe.</p><Link to="/search" style={{ color: 'var(--do)' }}>← Về bộ sưu tập</Link></div>

  const hasImage = car.imageUrls && car.imageUrls.length > 0
  const imageUrl = hasImage ? car.imageUrls[0] : null
  const carIcon = carIcons[car.carType] || '🚗'

  const { reviews, summary } = reviewsData
  const totalReviews = summary?.total ?? reviews.length
  const avgRating = summary?.avgRating ?? car.averageRating ?? 0

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '60px 48px' }}>
      <Link to="/search" style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muc-mo)', display: 'inline-block', marginBottom: '40px' }}>
        ← Về bộ sưu tập
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '60px', alignItems: 'start', marginBottom: '80px' }}>
        <div>
          {/* Ảnh thật hoặc icon fallback */}
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
                  e.target.style.display = 'none'
                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'
                }}
              />
            ) : null}

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
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(36px, 4vw, 56px)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: '16px' }}>
            {car.brand} <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>{car.model}</em>
          </h1>

          {/* Rating tag */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
            <span style={{ color: 'var(--dong)', fontSize: '20px', letterSpacing: '2px' }}>
              {renderStars(Math.round(avgRating || 5))}
            </span>
            <span style={{ fontFamily: 'var(--serif)', fontSize: '18px', fontWeight: 700 }}>
              {avgRating ? `${avgRating} / 5` : 'Chưa có điểm'}
            </span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--muc-mo)', letterSpacing: '1px' }}>
              ({totalReviews} lượt đánh giá)
            </span>
            {car.ownerName && (
              <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--muc-mo)', borderLeft: '1px solid rgba(15,14,12,0.2)', paddingLeft: '14px' }}>
                Chủ xe: <strong style={{ color: 'var(--muc)' }}>{car.ownerName}</strong>
              </span>
            )}
          </div>

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

        {/* Sticky booking card */}
        <div style={{ position: 'sticky', top: '120px', background: 'var(--muc)', color: 'var(--kem)', padding: '40px', border: '1px solid var(--dong)' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--dong)', marginBottom: '12px' }}>Khởi từ</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '56px', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1, marginBottom: '8px' }}>
            {formatPrice(car.pricePerDay)}
            <span style={{ fontFamily: 'var(--mono)', fontSize: '14px', fontWeight: 400, marginLeft: '8px', color: 'var(--dong)' }}>đ/ngày</span>
          </div>
          <div style={{ height: '1px', background: 'rgba(201,169,97,0.3)', margin: '32px 0' }}></div>
          {car.status === 'AVAILABLE' ? (
            <button onClick={() => navigate(`/booking/${car.id}`)} className="btn-login" style={{ width: '100%', justifyContent: 'center', padding: '18px', background: 'var(--dong)', color: 'var(--muc)' }}>
              <span>Đặt cỗ xe này</span>
            </button>
          ) : (
            <div>
              <div style={{
                background: 'rgba(139,44,44,0.2)',
                border: '1px solid var(--do)',
                color: 'var(--kem)',
                padding: '14px',
                fontFamily: 'var(--serif-2)',
                fontSize: '14px',
                lineHeight: 1.5,
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                🔒 Cỗ xe hiện <strong>{car.status === 'RENTED' ? 'đã có người đặt / đang cho thuê' : 'tạm không khả dụng'}</strong>.
              </div>
              <button disabled style={{ width: '100%', padding: '18px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.15)', fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', cursor: 'not-allowed' }}>
                Hết xe
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ===== MỤC ĐÁNH GIÁ CÔNG KHAI (XE & CHỦ XE) ===== */}
      <div style={{ borderTop: '2px solid var(--muc)', paddingTop: '60px' }}>
        <div className="chapter-num" style={{ marginBottom: '16px' }}>Chương Đánh Giá</div>
        <h2 style={{
          fontFamily: 'var(--serif)',
          fontSize: 'clamp(28px, 4vw, 42px)',
          fontWeight: 900,
          letterSpacing: '-1px',
          marginBottom: '32px'
        }}>
          Đánh giá từ <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>khách hàng.</em>
        </h2>

        {/* Khung tổng kết điểm CSAT */}
        <div style={{
          background: 'var(--kem-dam)',
          border: '1px solid rgba(15,14,12,0.15)',
          padding: '36px',
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
          gap: '40px',
          alignItems: 'center',
          marginBottom: '48px'
        }}>
          <div style={{ textAlign: 'center', borderRight: '1px solid rgba(15,14,12,0.15)', paddingRight: '36px' }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '64px', fontWeight: 900, lineHeight: 1, color: 'var(--do)' }}>
              {avgRating || '5.0'}
            </div>
            <div style={{ color: 'var(--dong)', fontSize: '24px', letterSpacing: '4px', margin: '12px 0' }}>
              {renderStars(Math.round(avgRating || 5))}
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', letterSpacing: '1px', color: 'var(--muc-mo)' }}>
              Dựa trên {totalReviews} lượt đánh giá
            </div>
          </div>

          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muc-mo)', marginBottom: '16px' }}>
              Phân bố điểm đánh giá
            </div>
            {[5, 4, 3, 2, 1].map(star => {
              const count = summary ? (summary[`star${star}`] || 0) : reviews.filter(r => (r.carRating || r.car_rating) === star).length
              const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0
              return (
                <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', width: '32px' }}>{star}★</span>
                  <div style={{ flex: 1, height: '8px', background: 'rgba(15,14,12,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--dong)', transition: 'width 0.4s ease' }} />
                  </div>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muc-mo)', width: '40px', textAlign: 'right' }}>
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Danh sách các review */}
        {loadingReviews ? (
          <p style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', textAlign: 'center', padding: '40px' }}>
            Đang tải đánh giá...
          </p>
        ) : reviews.length === 0 ? (
          <div style={{
            padding: '48px',
            textAlign: 'center',
            background: 'var(--kem)',
            border: '1px dashed rgba(15,14,12,0.2)'
          }}>
            <p style={{ fontFamily: 'var(--serif)', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
              Chưa có đánh giá nào cho cỗ xe này
            </p>
            <p style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', color: 'var(--muc-mo)' }}>
              Hãy là người đầu tiên đặt xe và trải nghiệm cung đường tuyệt vời này!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {reviews.map(r => {
              const carRating = r.carRating || r.car_rating || 5
              const ownerRating = r.ownerRating || r.owner_rating || 5
              const driverRating = r.driverRating || r.driver_rating || null
              const reviewerName = r.reviewerName || r.customerName || (r.isAnonymous ? 'Khách ẩn danh' : 'Khách hàng')

              return (
                <div
                  key={r.id}
                  style={{
                    background: 'var(--kem)',
                    border: '1px solid rgba(15,14,12,0.12)',
                    padding: '28px 32px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                        <span style={{ fontFamily: 'var(--serif)', fontSize: '18px', fontWeight: 700 }}>
                          {reviewerName}
                        </span>
                        {r.isAnonymous && (
                          <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', padding: '2px 6px', background: 'rgba(15,14,12,0.08)', color: 'var(--muc-mo)' }}>
                            Ẩn danh
                          </span>
                        )}
                        <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muc-mo)' }}>
                          · {formatDate(r.createdAt || r.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Star ratings */}
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muc-mo)' }}>
                          Cỗ xe:
                        </span>
                        <span style={{ color: 'var(--dong)', fontSize: '15px' }}>
                          {renderStars(carRating)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muc-mo)' }}>
                          Chủ xe:
                        </span>
                        <span style={{ color: 'var(--dong)', fontSize: '15px' }}>
                          {renderStars(ownerRating)}
                        </span>
                      </div>
                      {driverRating && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muc-mo)' }}>
                            Tài xế:
                          </span>
                          <span style={{ color: 'var(--dong)', fontSize: '15px' }}>
                            {renderStars(driverRating)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Comment */}
                  {r.comment && (
                    <div style={{ fontFamily: 'var(--serif-2)', fontSize: '16px', lineHeight: 1.6, color: 'var(--muc)' }}>
                      "{r.comment}"
                    </div>
                  )}

                  {/* Images */}
                  {r.images && r.images.length > 0 && (
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {r.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt="Ảnh đánh giá"
                          style={{
                            width: '100px',
                            height: '80px',
                            objectFit: 'cover',
                            border: '1px solid rgba(15,14,12,0.1)'
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Chủ xe phản hồi */}
                  {(r.ownerReply || r.owner_reply) && (
                    <div style={{
                      marginTop: '8px',
                      padding: '16px 20px',
                      background: 'rgba(74,93,63,0.06)',
                      borderLeft: '3px solid var(--xanh-reu)',
                      fontFamily: 'var(--serif-2)',
                      fontSize: '14px',
                      color: 'var(--xanh-reu)',
                      fontStyle: 'italic'
                    }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px', fontStyle: 'normal', fontWeight: 700 }}>
                        Chủ xe phản hồi {r.repliedAt || r.replied_at ? `(${formatDate(r.repliedAt || r.replied_at)})` : ''}:
                      </div>
                      "{r.ownerReply || r.owner_reply}"
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}