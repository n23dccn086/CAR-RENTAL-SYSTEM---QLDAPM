import { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'

export default function OwnerReviewsPage() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [carFilter, setCarFilter] = useState('')
  const [starFilter, setStarFilter] = useState('')

  useEffect(() => {
    fetchReviews()
  }, [user])

  const fetchReviews = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const res = await api.get(`/reviews/owner/${user.id}`)
      setReviews(res.data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (d) => {
    if (!d) return ''
    return new Date(d).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  // ===== STATS =====
  const totalReviews = reviews.length
  const avgCarRating = totalReviews > 0
    ? (reviews.reduce((s, r) => s + (r.carRating || 0), 0) / totalReviews).toFixed(1)
    : '0.0'
  const avgOwnerRating = totalReviews > 0
    ? (reviews.reduce((s, r) => s + (r.ownerRating || 0), 0) / totalReviews).toFixed(1)
    : '0.0'

  // Unique cars
  const uniqueCars = Array.from(new Set(reviews.map(r => r.carName).filter(Boolean)))

  // Filter
  const filtered = reviews.filter(r => {
    if (carFilter && r.carName !== carFilter) return false
    if (starFilter && r.ownerRating !== parseInt(starFilter)) return false
    return true
  })

  // ===== STAR RENDER =====
  const renderStars = (n) => {
    const value = Math.round(n || 0)
    return (
      <span style={{ color: 'var(--dong)', fontFamily: 'var(--serif)', fontSize: '20px', letterSpacing: '2px' }}>
        {'★'.repeat(value)}{'☆'.repeat(5 - value)}
      </span>
    )
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 48px' }}>
      <div className="chapter-num" style={{ marginBottom: '24px' }}>Chương Chủ Xe — Đánh Giá</div>
      <h1 style={{
        fontFamily: 'var(--serif)',
        fontSize: 'clamp(36px, 5vw, 56px)',
        fontWeight: 900,
        letterSpacing: '-2px',
        marginBottom: '16px'
      }}>
        Khách <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>nhận xét.</em>
      </h1>
      <p style={{
        fontFamily: 'var(--serif-2)',
        fontStyle: 'italic',
        fontSize: '18px',
        color: 'var(--muc-mo)',
        marginBottom: '40px'
      }}>
        Xem nhận xét của khách hàng về cỗ xe và dịch vụ của bạn.
      </p>

      {/* ===== STATS ===== */}
      {totalReviews > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px',
          marginBottom: '40px'
        }}>
          <StatCard
            label="Điểm chủ xe"
            value={`${avgOwnerRating}★`}
            hint={`/ 5.0 (${totalReviews} đánh giá)`}
          />
          <StatCard
            label="Điểm cỗ xe"
            value={`${avgCarRating}★`}
            hint={`/ 5.0 (${totalReviews} đánh giá)`}
          />
          <StatCard
            label="Cỗ xe được đánh giá"
            value={uniqueCars.length}
            hint="cỗ xe"
          />
        </div>
      )}

      {/* ===== FILTER ===== */}
      {totalReviews > 0 && (
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '40px',
          flexWrap: 'wrap',
          alignItems: 'center',
          paddingBottom: '24px',
          borderBottom: '1px solid rgba(15,14,12,0.15)'
        }}>
          {/* Car filter */}
          <select
            value={carFilter}
            onChange={e => setCarFilter(e.target.value)}
            style={{
              padding: '8px 16px',
              background: 'var(--kem-dam)',
              border: '1px solid rgba(15,14,12,0.2)',
              fontFamily: 'var(--mono)',
              fontSize: '11px',
              letterSpacing: '1px',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="">Tất cả xe ({uniqueCars.length})</option>
            {uniqueCars.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>

          {/* Star filter */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { v: '', l: 'Tất cả' },
              { v: '5', l: '5★' },
              { v: '4', l: '4★' },
              { v: '3', l: '3★' },
              { v: '2', l: '2★' },
              { v: '1', l: '1★' },
            ].map(opt => (
              <button
                key={opt.v}
                onClick={() => setStarFilter(opt.v)}
                style={{
                  padding: '6px 12px',
                  background: starFilter === opt.v ? 'var(--muc)' : 'transparent',
                  color: starFilter === opt.v ? 'var(--kem)' : 'var(--muc-mo)',
                  border: `1px solid ${starFilter === opt.v ? 'var(--muc)' : 'rgba(15,14,12,0.2)'}`,
                  fontFamily: 'var(--mono)',
                  fontSize: '10px',
                  letterSpacing: '1px',
                  cursor: 'pointer'
                }}
              >
                {opt.l}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== LIST ===== */}
      {loading ? (
        <p style={{
          textAlign: 'center',
          fontFamily: 'var(--serif-2)',
          fontStyle: 'italic',
          padding: '40px',
          color: 'var(--muc-mo)'
        }}>
          Đang tải...
        </p>
      ) : reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <p style={{
            fontFamily: 'var(--serif-2)',
            fontStyle: 'italic',
            fontSize: '24px',
            color: 'var(--muc-mo)'
          }}>
            Chưa có đánh giá nào.
          </p>
          <p style={{
            fontFamily: 'var(--mono)',
            fontSize: '11px',
            letterSpacing: '2px',
            color: 'var(--muc-mo)',
            marginTop: '16px'
          }}>
            Khách hàng sẽ đánh giá sau khi chuyến đi hoàn tất
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <p style={{
          textAlign: 'center',
          fontFamily: 'var(--serif-2)',
          fontStyle: 'italic',
          padding: '40px',
          color: 'var(--muc-mo)'
        }}>
          Không có đánh giá nào phù hợp với bộ lọc.
        </p>
      ) : (
        <div>
          {filtered.map(r => (
            <div
              key={r.id}
              style={{
                padding: '24px 0',
                borderBottom: '1px solid rgba(15,14,12,0.12)'
              }}
            >
              {/* HEADER: Avatar + Name + Date */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: 'var(--dong)', color: 'var(--muc)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '16px'
                }}>
                  {r.isAnonymous ? '?' : (r.customerName?.charAt(0)?.toUpperCase() || '?')}
                </div>
                <div>
                  <div style={{
                    fontFamily: 'var(--serif)',
                    fontSize: '18px',
                    fontWeight: 700
                  }}>
                    {r.isAnonymous ? 'Khách ẩn danh' : (r.customerName || 'Khách')}
                  </div>
                  <div style={{
                    fontFamily: 'var(--mono)',
                    fontSize: '10px',
                    letterSpacing: '1px',
                    color: 'var(--muc-mo)'
                  }}>
                    {formatDate(r.createdAt)}
                  </div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{
                    fontFamily: 'var(--serif)',
                    fontSize: '14px',
                    color: 'var(--muc-mo)',
                    fontStyle: 'italic'
                  }}>
                    {r.carName || 'Cỗ xe'}
                  </div>
                </div>
              </div>

              {/* RATINGS */}
              <div style={{
                display: 'flex',
                gap: '32px',
                marginBottom: '16px',
                paddingLeft: '52px'
              }}>
                <div>
                  <div style={{
                    fontFamily: 'var(--mono)',
                    fontSize: '9px',
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    color: 'var(--muc-mo)',
                    marginBottom: '4px'
                  }}>
                    Cỗ xe
                  </div>
                  {renderStars(r.carRating)}
                </div>
                <div>
                  <div style={{
                    fontFamily: 'var(--mono)',
                    fontSize: '9px',
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    color: 'var(--muc-mo)',
                    marginBottom: '4px'
                  }}>
                    Bạn (chủ xe)
                  </div>
                  {renderStars(r.ownerRating)}
                </div>
              </div>

              {/* COMMENT */}
              {r.comment && (
                <div style={{
                  paddingLeft: '52px',
                  fontFamily: 'var(--serif-2)',
                  fontStyle: 'italic',
                  fontSize: '17px',
                  color: 'var(--muc)',
                  lineHeight: 1.6,
                  borderLeft: '2px solid var(--dong)',
                  padding: '12px 0 12px 16px',
                  marginLeft: '52px'
                }}>
                  "{r.comment}"
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, hint }) {
  return (
    <div style={{
      background: 'var(--kem-dam)',
      border: '1px solid rgba(15,14,12,0.15)',
      padding: '24px',
      textAlign: 'center'
    }}>
      <div style={{
        fontFamily: 'var(--mono)',
        fontSize: '10px',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        color: 'var(--muc-mo)',
        marginBottom: '12px'
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--serif)',
        fontSize: '36px',
        fontWeight: 900,
        letterSpacing: '-1px',
        color: 'var(--do)',
        marginBottom: '4px'
      }}>
        {value}
      </div>
      <div style={{
        fontFamily: 'var(--serif-2)',
        fontStyle: 'italic',
        fontSize: '13px',
        color: 'var(--muc-mo)'
      }}>
        {hint}
      </div>
    </div>
  )
}