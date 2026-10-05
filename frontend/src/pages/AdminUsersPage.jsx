import { useState, useEffect } from 'react'
import api from '../services/api'

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ role: '', status: '' })
  const [msg, setMsg] = useState('')

  // ===== PHÂN TRANG =====
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filter.role) params.role = filter.role
      if (filter.status) params.status = filter.status

      const [usersRes, statsRes] = await Promise.all([
        api.get('/admin/users', { params }),
        api.get('/admin/users/stats'),
      ])
      setUsers(usersRes.data.data || [])
      setStats(statsRes.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [filter])

  // Reset page khi filter đổi
  useEffect(() => {
    setCurrentPage(1)
  }, [filter])

  const handleAction = async (id, action) => {
    if (!window.confirm(`Xác nhận ${action} user #${id}?`)) return
    try {
      if (action === 'lock') await api.put(`/admin/users/${id}/lock`)
      if (action === 'unlock') await api.put(`/admin/users/${id}/unlock`)
      if (action === 'delete') await api.delete(`/admin/users/${id}`)
      setMsg(`Đã ${action} user #${id}`)
      fetchData()
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      setMsg('Lỗi: ' + (err.response?.data?.message || err.message))
    }
  }

  const roleColors = {
    CUSTOMER: '#4a5d3f',
    OWNER: '#c9a961',
    DRIVER: '#2a9d8f',
    ADMIN: '#8b2c2c',
  }

  // ===== TÍNH TOÁN PHÂN TRANG =====
  const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const currentUsers = users.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '60px 48px' }}>
      <div className="chapter-num" style={{ marginBottom: '24px' }}>Chương Quản Trị — Người Dùng</div>
      <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900, letterSpacing: '-2px', marginBottom: '40px' }}>
        Quản lý <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>người dùng.</em>
      </h1>

      {msg && (
        <div style={{ background: 'rgba(74,93,63,0.1)', border: '1px solid var(--xanh-reu)', padding: '12px 16px', marginBottom: '24px', color: 'var(--xanh-reu)', fontFamily: 'var(--serif-2)', fontStyle: 'italic' }}>
          {msg}
        </div>
      )}

      {/* STATS */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
          <StatCard label="Tổng user" value={stats.totalUsers} />
          <StatCard label="Khách hàng" value={stats.totalCustomers} color="#4a5d3f" />
          <StatCard label="Chủ xe" value={stats.totalOwners} color="#c9a961" />
          <StatCard label="Tài xế" value={stats.totalDrivers} color="#2a9d8f" />
        </div>
      )}

      {/* FILTER */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
        {['', 'CUSTOMER', 'OWNER', 'DRIVER', 'ADMIN'].map(r => (
          <button key={r} onClick={() => setFilter({ ...filter, role: r, status: '' })} style={{
            padding: '8px 16px',
            background: filter.role === r ? 'var(--muc)' : 'transparent',
            color: filter.role === r ? 'var(--kem)' : 'var(--muc)',
            border: `1px solid ${filter.role === r ? 'var(--muc)' : 'rgba(15,14,12,0.2)'}`,
            fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase',
            cursor: 'pointer'
          }}>
            {r === '' ? 'Tất cả' : r}
          </button>
        ))}
        {['PENDING', 'VERIFIED', 'REJECTED'].map(s => (
          <button key={s} onClick={() => setFilter({ ...filter, status: s, role: '' })} style={{
            padding: '8px 16px',
            background: filter.status === s ? 'var(--do)' : 'transparent',
            color: filter.status === s ? 'var(--kem)' : 'var(--do)',
            border: `1px solid var(--do)`,
            fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase',
            cursor: 'pointer'
          }}>
            {s}
          </button>
        ))}
      </div>

      {/* TABLE */}
      {loading ? (
        <p style={{ textAlign: 'center', fontFamily: 'var(--serif-2)', fontStyle: 'italic', padding: '40px' }}>Đang tải...</p>
      ) : users.length === 0 ? (
        <p style={{ textAlign: 'center', fontFamily: 'var(--serif-2)', fontStyle: 'italic', padding: '40px', color: 'var(--muc-mo)' }}>
          Không có user nào.
        </p>
      ) : (
        <>
          <div>
            {currentUsers.map(u => (
              <div key={u.id} style={{
                display: 'grid', gridTemplateColumns: '60px 1fr auto auto auto',
                gap: '24px', alignItems: 'center', padding: '20px 0',
                borderBottom: '1px solid rgba(15,14,12,0.12)'
              }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--dong)', color: 'var(--muc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '20px' }}>
                  {u.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: '18px', fontWeight: 700 }}>{u.name}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '1px', color: 'var(--muc-mo)' }}>
                    {u.phone} {u.email && `· ${u.email}`}
                  </div>
                </div>
                <div style={{ padding: '4px 10px', background: roleColors[u.role] || 'var(--muc-mo)', color: 'var(--kem)', fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '1px' }}>
                  {u.role}
                </div>
                <div style={{
                  padding: '4px 10px',
                  border: `1px solid ${u.verificationStatus === 'VERIFIED' ? 'var(--xanh-reu)' : u.verificationStatus === 'PENDING' ? 'var(--dong)' : 'var(--do)'}`,
                  color: u.verificationStatus === 'VERIFIED' ? 'var(--xanh-reu)' : u.verificationStatus === 'PENDING' ? 'var(--dong)' : 'var(--do)',
                  fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '1px'
                }}>
                  {u.verificationStatus}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {u.isActive ? (
                    <button onClick={() => handleAction(u.id, 'lock')} style={btnStyle('var(--do)')}>Khóa</button>
                  ) : (
                    <button onClick={() => handleAction(u.id, 'unlock')} style={btnStyle('var(--xanh-reu)')}>Mở</button>
                  )}
                  <button onClick={() => handleAction(u.id, 'delete')} style={btnStyle('var(--muc-mo)')}>Xóa</button>
                </div>
              </div>
            ))}
          </div>

          {/* PHÂN TRANG */}
          {totalPages > 1 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px', flexWrap: 'wrap' }}>
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={paginationBtnStyle(currentPage === 1)}>← Trước</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setCurrentPage(p)} style={paginationNumStyle(currentPage === p)}>{p}</button>
                ))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={paginationBtnStyle(currentPage === totalPages)}>Sau →</button>
              </div>
              <div style={{ textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muc-mo)', marginTop: '16px', marginBottom: '24px' }}>
                Trang {currentPage} / {totalPages} · Tổng {users.length} user
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

function StatCard({ label, value, color = 'var(--muc)' }) {
  return (
    <div style={{ background: 'var(--kem-dam)', border: '1px solid rgba(15,14,12,0.15)', padding: '20px' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muc-mo)', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: '32px', fontWeight: 900, color }}>{value}</div>
    </div>
  )
}

function btnStyle(color) {
  return { padding: '6px 14px', background: 'transparent', border: `1px solid ${color}`, color, fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.3s' }
}

function paginationBtnStyle(disabled) {
  return { padding: '8px 16px', background: 'transparent', border: '1px solid var(--muc)', color: disabled ? 'var(--muc-mo)' : 'var(--muc)', fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1 }
}

function paginationNumStyle(active) {
  return { padding: '8px 14px', background: active ? 'var(--muc)' : 'transparent', color: active ? 'var(--kem)' : 'var(--muc)', border: '1px solid var(--muc)', fontFamily: 'var(--mono)', fontSize: '11px', cursor: 'pointer', minWidth: '40px' }
}