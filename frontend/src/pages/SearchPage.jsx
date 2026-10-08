import { useState, useEffect } from 'react'
import CarCard from '../components/CarCard'
import { searchCars } from '../services/carService'

const SEAT_OPTIONS = [4, 5, 7]

// ★ 7 loại xe cố định
const CAR_TYPE_OPTIONS = [
  { value: 'SEDAN', label: 'Sedan' },
  { value: 'SUV', label: 'SUV' },
  { value: 'MPV', label: 'MPV' },
  { value: 'HATCHBACK', label: 'Hatchback' },
  { value: 'PICKUP', label: 'Bán tải' },
  { value: 'VAN', label: 'Van' },
  { value: 'LUXURY', label: 'Xe cao cấp' },
]

export default function SearchPage() {
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  const [location, setLocation] = useState('')
  const [seats, setSeats] = useState([])
  const [carType, setCarType] = useState('')
  const [sort, setSort] = useState('pricePerDay,asc')
  const [page, setPage] = useState(0)
  const SIZE = 20

  const [debouncedLocation, setDebouncedLocation] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedLocation(location), 400)
    return () => clearTimeout(timer)
  }, [location])

  useEffect(() => {
    const fetchCars = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (debouncedLocation.trim()) params.append('location', debouncedLocation.trim())
        seats.forEach(s => params.append('seats', s))
        if (carType) params.append('carType', carType)
        params.append('sort', sort)
        params.append('page', page)
        params.append('size', SIZE)

        const data = await searchCars(params)
        const pageData = data.data || {}
        setCars(pageData.content || [])
        setTotalPages(pageData.totalPages || 0)
        setTotalElements(pageData.totalElements || 0)
      } catch (err) {
        console.error('Search failed:', err)
        setCars([])
        setTotalPages(0)
        setTotalElements(0)
      } finally {
        setLoading(false)
      }
    }
    fetchCars()
  }, [debouncedLocation, seats, carType, sort, page])

  useEffect(() => {
    setPage(0)
  }, [debouncedLocation, seats, carType, sort])

  const toggleSeat = (seat) => {
    setSeats(prev =>
      prev.includes(seat) ? prev.filter(s => s !== seat) : [...prev, seat]
    )
  }

  const clearFilters = () => {
    setLocation('')
    setSeats([])
    setCarType('')
    setSort('pricePerDay,asc')
    setPage(0)
  }

  const hasActiveFilters = location || seats.length > 0 || carType

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '60px 48px' }}>
      <div className="chapter-num" style={{ marginBottom: '24px' }}>Chương Bộ Sưu Tập</div>
      <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: 900, letterSpacing: '-2px', marginBottom: '40px' }}>
        Dạo <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>bộ sưu tập.</em>
      </h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.5fr 1.5fr 1.5fr 1fr auto',
        gap: '20px',
        marginBottom: '32px',
        padding: '24px',
        background: 'var(--kem-dam)',
        border: '1px solid rgba(15,14,12,0.15)',
        alignItems: 'start',
      }}>
        {/* Địa điểm — text input */}
        <div>
          <label style={labelStyle}>Địa điểm</label>
          <input
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="TP.HCM, Hà Nội..."
            style={inputStyle}
          />
        </div>

        {/* Số chỗ — checkbox */}
        <div>
          <label style={labelStyle}>Số chỗ</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingTop: '10px' }}>
            {SEAT_OPTIONS.map(s => (
              <label key={s} style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={seats.includes(s)}
                  onChange={() => toggleSeat(s)}
                  style={{ cursor: 'pointer' }}
                />
                {s} chỗ
              </label>
            ))}
          </div>
        </div>

        {/* ★ Mẫu xe — DROPDOWN thay vì text input */}
        <div>
          <label style={labelStyle}>Mẫu xe</label>
          <select
            value={carType}
            onChange={e => setCarType(e.target.value)}
            style={inputStyle}
          >
            <option value="">Tất cả</option>
            {CAR_TYPE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div>
          <label style={labelStyle}>Sắp xếp</label>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            style={inputStyle}
          >
            <option value="pricePerDay,asc">Giá thấp → cao</option>
            <option value="pricePerDay,desc">Giá cao → thấp</option>
            <option value="year,desc">Năm mới nhất</option>
            <option value="brand,asc">Hãng A → Z</option>
          </select>
        </div>

        {/* Clear */}
        <div style={{ paddingTop: '22px' }}>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                padding: '12px 16px',
                background: 'transparent',
                border: '1px solid var(--do)',
                color: 'var(--do)',
                fontFamily: 'var(--mono)',
                fontSize: '10px',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              ✕ Xóa lọc
            </button>
          )}
        </div>
      </div>

      {!loading && totalElements > 0 && (
        <div style={{
          fontFamily: 'var(--mono)',
          fontSize: '11px',
          letterSpacing: '2px',
          color: 'var(--muc-mo)',
          marginBottom: '24px',
        }}>
          TÌM THẤY {totalElements} CỖ XE
          {hasActiveFilters && ' (ĐÃ LỌC)'}
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: 'center', fontFamily: 'var(--serif-2)', fontStyle: 'italic', padding: '40px' }}>
          Đang tải...
        </p>
      ) : cars.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <p style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '24px', color: 'var(--muc-mo)' }}>
            Không tìm thấy cỗ xe phù hợp.
          </p>
          <p style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muc-mo)', marginTop: '16px' }}>
            Thử nới lỏng bộ lọc
          </p>
        </div>
      ) : (
        <>
          <section className="collection" style={{ padding: 0 }}>
            {cars.map((car, i) => (
              <CarCard key={car.id} car={car} index={i + page * SIZE} />
            ))}
          </section>

          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '48px',
              flexWrap: 'wrap',
            }}>
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                style={paginationBtnStyle(page === 0)}
              >
                ← Trước
              </button>

              {Array.from({ length: totalPages }, (_, i) => i).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={paginationNumStyle(page === p)}
                >
                  {p + 1}
                </button>
              ))}

              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                style={paginationBtnStyle(page === totalPages - 1)}
              >
                Sau →
              </button>
            </div>
          )}

          {totalPages > 1 && (
            <div style={{
              textAlign: 'center',
              fontFamily: 'var(--mono)',
              fontSize: '11px',
              color: 'var(--muc-mo)',
              marginTop: '16px',
            }}>
              Trang {page + 1} / {totalPages}
            </div>
          )}
        </>
      )}
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
  padding: '12px',
  background: 'var(--kem)',
  border: '1px solid rgba(15,14,12,0.2)',
  fontFamily: 'var(--serif-2)',
  fontSize: '16px',
  outline: 'none',
  boxSizing: 'border-box',
}

const checkboxLabelStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 10px',
  background: 'var(--kem)',
  border: '1px solid rgba(15,14,12,0.15)',
  fontFamily: 'var(--serif-2)',
  fontSize: '14px',
  cursor: 'pointer',
}

function paginationBtnStyle(disabled) {
  return {
    padding: '10px 20px',
    background: 'transparent',
    border: '1px solid var(--muc)',
    color: disabled ? 'var(--muc-mo)' : 'var(--muc)',
    fontFamily: 'var(--mono)',
    fontSize: '11px',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
  }
}

function paginationNumStyle(active) {
  return {
    padding: '10px 16px',
    background: active ? 'var(--muc)' : 'transparent',
    color: active ? 'var(--kem)' : 'var(--muc)',
    border: '1px solid var(--muc)',
    fontFamily: 'var(--mono)',
    fontSize: '11px',
    cursor: 'pointer',
    minWidth: '44px',
  }
}