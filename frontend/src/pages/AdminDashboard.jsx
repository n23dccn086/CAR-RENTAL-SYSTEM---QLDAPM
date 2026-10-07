import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/dashboard/stats')
      setStats(res.data.data)
    } catch (err) {
      console.error('Failed to load stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN').format(p || 0)

  if (loading) {
    return (
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '60px 48px' }}>
        <p style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', padding: '40px', textAlign: 'center' }}>
          Đang tải số liệu...
        </p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '60px 48px' }}>
      <div className="chapter-num" style={{ marginBottom: '24px' }}>Chương Quản Trị</div>
      <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900, letterSpacing: '-2px', marginBottom: '48px' }}>
        Tổng <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>quan.</em>
      </h1>

      {/* 5 thẻ số liệu */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px', marginBottom: '48px' }}>
        <StatCard
          label="Doanh thu sàn"
          value={`${formatPrice(stats?.totalRevenue)}đ`}
          hint="Tổng doanh thu đơn hoàn tất (chưa trích hoa hồng)"
        />
        <StatCard
          label={`Nền tảng thực nhận (${stats?.commissionRate}%)`}
          value={`${formatPrice(stats?.platformRevenue)}đ`}
          color="var(--do)"
          hint="% hoa hồng × Doanh thu sàn"
        />
        <StatCard
          label="Tỉ lệ hủy"
          value={`${stats?.cancelRate}%`}
          color="var(--xanh-reu)"
          hint={`${stats?.cancelledBookings}/${stats?.totalBookings} đơn bị hủy`}
        />
        <StatCard
          label="CSAT tổng"
          value={`${stats?.csat}★`}
          hint={`Xe ${stats?.csatCar}★ · Chủ xe ${stats?.csatOwner}★ (${stats?.totalReviews} đánh giá)`}
        />
        <StatCard
          label="Tổng đơn"
          value={stats?.totalBookings}
          hint={`${stats?.completedBookings} hoàn tất`}
        />
      </div>

      {/* 3 thẻ CSAT chi tiết */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '48px' }}>
        <StatCard
          label="CSAT — Cỗ xe"
          value={`${stats?.csatCar}★`}
          hint="AVG(carRating) = Tổng carRating / Số review"
        />
        <StatCard
          label="CSAT — Chủ xe"
          value={`${stats?.csatOwner}★`}
          hint="AVG(ownerRating) = Tổng ownerRating / Số review"
        />
        <StatCard
          label="CSAT — Tổng"
          value={`${stats?.csat}★`}
          color="var(--do)"
          hint="(CSAT_xe + CSAT_chủ_xe) / 2"
        />
      </div>

      {/* Pending */}
      {stats?.pendingCars > 0 && (
        <div style={{ background: 'var(--do)', color: 'var(--kem)', padding: '24px 32px', marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '22px', fontWeight: 700 }}>
            Có <em style={{ fontStyle: 'italic' }}>{stats.pendingCars}</em> hồ sơ xe đang chờ duyệt
          </div>
          <Link to="/admin/approvals" className="btn-login" style={{ background: 'var(--kem)', color: 'var(--do)', padding: '12px 24px', textDecoration: 'none', display: 'inline-flex' }}>
            <span>Duyệt ngay</span>
          </Link>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, hint, color = 'var(--muc)' }) {
  return (
    <div style={{ background: 'var(--kem-dam)', border: '1px solid rgba(15,14,12,0.15)', padding: '24px' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muc-mo)', marginBottom: '12px' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: '28px', fontWeight: 900, letterSpacing: '-1px', color, lineHeight: 1 }}>
        {value}
      </div>
      {hint && (
        <div style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '12px', color: 'var(--muc-mo)', marginTop: '8px' }}>
          {hint}
        </div>
      )}
    </div>
  )
}