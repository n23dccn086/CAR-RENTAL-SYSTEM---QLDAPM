import { useState, useEffect } from 'react'
import { getAllConfigs, getPendingApprovals } from '../services/bookingService'

export default function AdminDashboard() {
  const [configs, setConfigs] = useState([])
  const [stats, setStats] = useState({
    totalRevenue: 450000000,
    totalTransactions: 312,
    cancelRate: 4.2,
    csat: 4.6,
    pendingApprovals: 15,
  })

  useEffect(() => {
    getAllConfigs().then(res => setConfigs(res.data || [])).catch(() => {})
  }, [])

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN').format(p || 0)

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '60px 48px' }}>
      <div className="chapter-num" style={{ marginBottom: '24px' }}>Chương Quản Trị</div>
      <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900, letterSpacing: '-2px', marginBottom: '48px' }}>
        Tổng <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>quan.</em>
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '60px' }}>
        {[
          { label: 'Doanh thu sàn', value: formatPrice(stats.totalRevenue) + 'đ' },
          { label: 'Giao dịch', value: stats.totalTransactions },
          { label: 'Tỷ lệ hủy', value: stats.cancelRate + '%' },
          { label: 'CSAT', value: stats.csat + '★' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--kem-dam)', border: '1px solid rgba(15,14,12,0.15)', padding: '28px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muc-mo)', marginBottom: '12px' }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '32px', fontWeight: 900, letterSpacing: '-1px' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* PENDING */}
      <div style={{ background: 'var(--do)', color: 'var(--kem)', padding: '24px 32px', marginBottom: '60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: '22px', fontWeight: 700 }}>
          Có <em style={{ fontStyle: 'italic' }}>{stats.pendingApprovals}</em> hồ sơ đang chờ duyệt
        </div>
        <button className="btn-login" style={{ background: 'var(--kem)', color: 'var(--do)', padding: '12px 24px' }}>
          <span>Duyệt ngay</span>
        </button>
      </div>

      {/* CONFIG */}
      <h2 style={{ fontFamily: 'var(--serif)', fontSize: '36px', fontWeight: 900, marginBottom: '24px' }}>Cấu hình nền tảng</h2>
      {configs.length === 0 ? (
        <p style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', color: 'var(--muc-mo)' }}>Chưa có cấu hình.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {configs.map(c => (
            <div key={c.id} style={{ background: 'var(--kem-dam)', padding: '20px', border: '1px solid rgba(15,14,12,0.1)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px', color: 'var(--muc-mo)', marginBottom: '6px' }}>{c.configKey}</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '22px', fontWeight: 700 }}>{c.configValue}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}