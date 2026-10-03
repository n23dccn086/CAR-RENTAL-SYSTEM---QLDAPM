import { useState, useEffect } from 'react'
import CarCard from '../components/CarCard'
import { getCars } from '../services/carService'

export default function SearchPage() {
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ location: '', seats: '', carType: '' })

  useEffect(() => {
    const fetchCars = async () => {
      setLoading(true)
      try {
        const params = {}
        if (filters.location) params.location = filters.location
        if (filters.seats) params.seats = filters.seats
        if (filters.carType) params.carType = filters.carType
        const data = await getCars(params)
        setCars(data.data?.cars || data.data || [])
      } catch (err) {
        console.error(err)
        setCars([])
      } finally {
        setLoading(false)
      }
    }
    fetchCars()
  }, [filters])

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '60px 48px' }}>
      <div className="chapter-num" style={{ marginBottom: '24px' }}>Chương Bộ Sưu Tập</div>
      <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: 900, letterSpacing: '-2px', marginBottom: '40px' }}>
        Dạo <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>bộ sưu tập.</em>
      </h1>

      {/* FILTER */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '60px', padding: '32px', background: 'var(--kem-dam)', border: '1px solid rgba(15,14,12,0.15)' }}>
        <div>
          <label style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--muc-mo)', display: 'block', marginBottom: '8px' }}>Địa điểm</label>
          <input value={filters.location} onChange={e => setFilters({ ...filters, location: e.target.value })} placeholder="TP.HCM, Hà Nội..." style={{ width: '100%', padding: '12px', background: 'var(--kem)', border: '1px solid rgba(15,14,12,0.2)', fontFamily: 'var(--serif-2)', fontSize: '16px' }} />
        </div>
        <div>
          <label style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--muc-mo)', display: 'block', marginBottom: '8px' }}>Số chỗ</label>
          <select value={filters.seats} onChange={e => setFilters({ ...filters, seats: e.target.value })} style={{ width: '100%', padding: '12px', background: 'var(--kem)', border: '1px solid rgba(15,14,12,0.2)', fontFamily: 'var(--serif-2)', fontSize: '16px' }}>
            <option value="">Tất cả</option>
            <option value="4">4 chỗ</option>
            <option value="5">5 chỗ</option>
            <option value="7">7 chỗ</option>
          </select>
        </div>
        <div>
          <label style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--muc-mo)', display: 'block', marginBottom: '8px' }}>Loại xe</label>
          <select value={filters.carType} onChange={e => setFilters({ ...filters, carType: e.target.value })} style={{ width: '100%', padding: '12px', background: 'var(--kem)', border: '1px solid rgba(15,14,12,0.2)', fontFamily: 'var(--serif-2)', fontSize: '16px' }}>
            <option value="">Tất cả</option>
            <option value="SEDAN">Sedan</option>
            <option value="SUV">SUV</option>
            <option value="MPV">MPV</option>
          </select>
        </div>
      </div>

      {/* RESULTS */}
      {loading ? (
        <p style={{ textAlign: 'center', fontFamily: 'var(--serif-2)', fontStyle: 'italic', padding: '40px' }}>Đang tải...</p>
      ) : cars.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <p style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '24px', color: 'var(--muc-mo)' }}>Không tìm thấy cỗ xe phù hợp.</p>
          <p style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muc-mo)', marginTop: '16px' }}>Thử nới lỏng bộ lọc</p>
        </div>
      ) : (
        <section className="collection" style={{ padding: 0 }}>
          {cars.map((car, i) => (
            <CarCard key={car.id} car={car} index={i} />
          ))}
        </section>
      )}
    </div>
  )
}