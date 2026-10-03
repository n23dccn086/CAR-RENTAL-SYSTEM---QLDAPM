import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import CarCard from '../components/CarCard'
import Reveal from '../components/Reveal'
import HeroCarArt from '../components/HeroCarArt'
import { getCars } from '../services/carService'

export default function HomePage() {
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const data = await getCars({ limit: 4 })
        setCars(data.data?.cars || data.data || [])
      } catch (err) {
        console.error('Lỗi tải xe:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCars()
  }, [])

  const fallbackCars = [
    { id: 1, brand: 'Toyota', model: 'Camry', year: 2023, seats: 5, transmission: 'AUTOMATIC', carType: 'Sedan', pricePerDay: 1200000 },
    { id: 2, brand: 'Ford', model: 'Everest', year: 2024, seats: 7, transmission: 'AUTOMATIC', carType: 'SUV', pricePerDay: 1800000 },
    { id: 3, brand: 'Kia', model: 'Carnival', year: 2024, seats: 7, transmission: 'AUTOMATIC', carType: 'MPV', pricePerDay: 2000000 },
    { id: 4, brand: 'Mazda', model: 'CX-5', year: 2024, seats: 5, transmission: 'AUTOMATIC', carType: 'SUV', pricePerDay: 1400000 },
  ]

  const displayCars = cars.length > 0 ? cars : fallbackCars

  return (
    <>
      <section className="hero">
        <div className="hero-bg-text">automobile</div>
        <div className="hero-grid">
          <div className="hero-left">
            <div className="chapter">Chương Khởi — Hành Trình</div>
            <h1>
              <span className="line"><span>Thuê xe</span></span>
              <span className="line"><span>tựa như</span></span>
              <span className="line"><span><em>thi nhân.</em></span></span>
            </h1>
            <div className="hero-meta">
              <div className="num-block"><span className="num">01</span></div>
              <p>Chẳng phải chỉ là chuyện thuê xe. Đây là hành trình được chăm chút cho từng bậc tao nhân — từ lúc chọn xe, đến khi chìa khóa trao tay.</p>
            </div>
          </div>

          {/* ============ HERO VISUAL — ĐÃ THAY ============ */}
          <div className="hero-visual">
            <div className="hero-frame" style={{ padding: 0 }}>
              <HeroCarArt />
            </div>
          </div>
          {/* ============================================ */}

        </div>
      </section>

      <div className="marquee-section">
        <div className="marquee-track">
          <span>Cỗ xe <em>tao nhân</em> <span className="star">✦</span> Đặt xe <em>ba mươi giây</em> <span className="star">✧</span> Giao xe <em>tận nơi</em> <span className="star">✦</span> Hầu chuyện <em>bốn mùa</em> <span className="star">✧</span></span>
          <span>Cỗ xe <em>tao nhân</em> <span className="star">✦</span> Đặt xe <em>ba mươi giây</em> <span className="star">✧</span> Giao xe <em>tận nơi</em> <span className="star">✦</span> Hầu chuyện <em>bốn mùa</em> <span className="star">✧</span></span>
        </div>
      </div>

      <Reveal>
        <div className="section-header">
          <div className="chapter-num">Chương Bộ Sưu Tập</div>
          <h2 className="section-title">Những <em>cỗ xe</em> tuyển chọn</h2>
          <div className="section-meta">Bốn tác phẩm<br/>được chăm chút</div>
        </div>
      </Reveal>

      <section className="collection">
        {loading ? (
          <p style={{ textAlign: 'center', padding: '40px', fontFamily: 'var(--serif-2)', fontStyle: 'italic' }}>Đang tải bộ sưu tập...</p>
        ) : (
          displayCars.slice(0, 4).map((car, i) => (
            <CarCard key={car.id} car={car} index={i} />
          ))
        )}
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <Link to="/search" className="btn-login" style={{ display: 'inline-flex', padding: '14px 32px' }}>
            <span>Xem toàn bộ bộ sưu tập</span>
          </Link>
        </div>
      </section>

      <section className="stats-section">
        <div className="stats-inner">
          <div className="stat-item"><div className="stat-num">1.200<span className="suffix">+</span></div><div className="stat-label">Chuyến xe mỗi tháng</div></div>
          <div className="stat-item"><div className="stat-num">48</div><div className="stat-label">Cỗ xe sẵn sàng</div></div>
          <div className="stat-item"><div className="stat-num">125</div><div className="stat-label">Bậc chủ xe đồng hành</div></div>
          <div className="stat-item"><div className="stat-num">4.9<span className="suffix">★</span></div><div className="stat-label">Lời khen trung bình</div></div>
        </div>
      </section>

      <section className="process-section">
        <div className="process-inner">
          <Reveal>
            <div className="process-header">
              <div className="chapter">Chương Nghi Thức — Ba Bước</div>
              <h2>Ba bước <em>giản đơn.</em></h2>
            </div>
          </Reveal>
          <div className="process-grid">
            <div className="process-step">
              <div className="step-num">Nghi thức thứ nhất</div>
              <h3 className="step-title">Chọn cỗ xe</h3>
              <p className="step-desc">Dạo qua bộ sưu tập. Mỗi cỗ xe mang một câu chuyện riêng, một tâm tình riêng.</p>
            </div>
            <div className="process-step">
              <div className="step-num">Nghi thức thứ hai</div>
              <h3 className="step-title">Ghi tên đặt chỗ</h3>
              <p className="step-desc">Chọn ngày giờ, gửi chút cọc giữ. Phiếu điện tử theo chân bạn về tận hộp thư.</p>
            </div>
            <div className="process-step">
              <div className="step-num">Nghi thức thứ ba</div>
              <h3 className="step-title">Lên đường</h3>
              <p className="step-desc">Nhận xe tại điểm hẹn hoặc giao tận cửa nhà. Ký tên, cầm chìa, lên đường.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="quote-section">
        <div className="quote-mark">"</div>
        <p className="quote-text">Chúng tôi chẳng cho thuê xe.<br/>Chúng tôi trao bạn <em>chìa khóa của những hành trình đáng nhớ.</em></p>
        <div className="quote-author">MAISON · MMXXVI</div>
      </section>
    </>
  )
}