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

  // ===== MODAL XEM HỒ SƠ =====
  const [profileModal, setProfileModal] = useState(false)
  const [profileUser, setProfileUser] = useState(null)
  const [profileDocs, setProfileDocs] = useState([])
  const [profileLoading, setProfileLoading] = useState(false)

  // ===== MODAL TỪ CHỐI =====
  const [rejectModal, setRejectModal] = useState(false)
  const [rejectingUser, setRejectingUser] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectSubmitting, setRejectSubmitting] = useState(false)
  const [rejectError, setRejectError] = useState('')

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

  // ===== XEM HỒ SƠ =====
  const handleViewProfile = async (user) => {
    setProfileUser(user)
    setProfileModal(true)
    setProfileLoading(true)
    setProfileDocs([])
    try {
      const res = await api.get(`/admin/users/${user.id}/verification`)
      const docs = res.data.data?.documents || []
      setProfileDocs(docs)
    } catch (err) {
      setProfileDocs([])
    } finally {
      setProfileLoading(false)
    }
  }

  // ===== DUYỆT =====
  const handleApprove = async (user) => {
    if (!window.confirm(`Duyệt hồ sơ xác thực cho "${user.name}"?`)) return
    try {
      await api.put(`/admin/users/${user.id}/verify`)
      setMsg(`Đã duyệt xác thực cho ${user.name}`)
      fetchData()
      setProfileModal(false)
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message))
    }
  }

  // ===== MỞ MODAL TỪ CHỐI =====
  const openRejectModal = (user) => {
    setRejectingUser(user)
    setRejectReason('')
    setRejectError('')
    setRejectModal(true)
  }

  // ===== SUBMIT TỪ CHỐI =====
  const handleRejectSubmit = async (e) => {
    e.preventDefault()
    setRejectError('')
    if (!rejectReason.trim()) {
      return setRejectError('Vui lòng nhập lý do từ chối')
    }

    setRejectSubmitting(true)
    try {
      await api.put(
        `/admin/users/${rejectingUser.id}/reject-verification?reason=${encodeURIComponent(rejectReason.trim())}`
      )
      setMsg(`Đã từ chối xác thực của ${rejectingUser.name}`)
      setRejectModal(false)
      setProfileModal(false)
      fetchData()
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      setRejectError(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setRejectSubmitting(false)
    }
  }

  const roleColors = {
    CUSTOMER: '#4a5d3f',
    OWNER: '#c9a961',
    DRIVER: '#2a9d8f',
    ADMIN: '#8b2c2c',
  }

  const statusColors = {
    VERIFIED: 'var(--xanh-reu)',
    PENDING: 'var(--dong)',
    REJECTED: 'var(--do)',
    UNVERIFIED: 'var(--muc-mo)',
  }

  const statusLabels = {
    VERIFIED: 'Đã xác thực',
    PENDING: 'Chờ duyệt',
    REJECTED: 'Bị từ chối',
    UNVERIFIED: 'Chưa xác thực',
  }

  const docTypeLabels = {
    GPLX_FRONT: 'GPLX — Mặt trước',
    GPLX_BACK: 'GPLX — Mặt sau',
    CCCD_FRONT: 'CCCD — Mặt trước',
    CCCD_BACK: 'CCCD — Mặt sau',
    SELFIE: 'Ảnh chân dung (selfie)',
  }

  const formatDateTime = (dt) => {
    if (!dt) return '—'
    return new Date(dt).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
          <StatCard label="Tổng user" value={stats.totalUsers} />
          <StatCard label="Khách hàng" value={stats.totalCustomers} color="#4a5d3f" />
          <StatCard label="Chủ xe" value={stats.totalOwners} color="#c9a961" />
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
            {statusLabels[s] || s}
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
            {currentUsers.map(u => {
              const isAdmin = u.role === 'ADMIN'
              const isPending = u.verificationStatus === 'PENDING'
              const canVerify = !isAdmin && isPending

              return (
                <div key={u.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '60px minmax(0, 1fr) auto auto auto',
                  gap: '24px', alignItems: 'center', padding: '20px 0',
                  borderBottom: '1px solid rgba(15,14,12,0.12)'
                }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%',
                    background: 'var(--dong)', color: 'var(--muc)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '20px'
                  }}>
                    {u.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: '18px', fontWeight: 700 }}>
                      {u.name}
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '1px', color: 'var(--muc-mo)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.phone} {u.email && `· ${u.email}`}
                    </div>
                    {u.rejectionReason && (
                      <div style={{
                        fontFamily: 'var(--serif-2)', fontStyle: 'italic',
                        fontSize: '12px', color: 'var(--do)', marginTop: '4px'
                      }}>
                        Lý do từ chối: {u.rejectionReason}
                      </div>
                    )}
                  </div>

                  {/* ROLE */}
                  <div style={{
                    padding: '4px 10px', background: roleColors[u.role] || 'var(--muc-mo)',
                    color: 'var(--kem)', fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '1px'
                  }}>
                    {u.role}
                  </div>

                  {/* VERIFICATION STATUS — ẨN với ADMIN */}
                  {!isAdmin ? (
                    <div style={{
                      padding: '4px 10px',
                      border: `1px solid ${statusColors[u.verificationStatus] || 'var(--muc-mo)'}`,
                      color: statusColors[u.verificationStatus] || 'var(--muc-mo)',
                      fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '1px',
                      whiteSpace: 'nowrap'
                    }}>
                      {statusLabels[u.verificationStatus] || u.verificationStatus}
                    </div>
                  ) : (
                    <div style={{
                      padding: '4px 10px',
                      fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--muc-mo)',
                      whiteSpace: 'nowrap'
                    }}>
                      —
                    </div>
                  )}

                  {/* ACTIONS */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {canVerify && (
                      <>
                        <button onClick={() => handleViewProfile(u)} style={btnStyle('var(--muc)')}>
                          👁 Hồ sơ
                        </button>
                        <button onClick={() => handleApprove(u)} style={btnStyle('var(--xanh-reu)')}>
                          ✓ Duyệt
                        </button>
                        <button onClick={() => openRejectModal(u)} style={btnStyle('var(--do)')}>
                          ✕ Từ chối
                        </button>
                      </>
                    )}

                    {u.isActive ? (
                      <button onClick={() => handleAction(u.id, 'lock')} style={btnStyle('var(--do)')}>
                        Khóa
                      </button>
                    ) : (
                      <button onClick={() => handleAction(u.id, 'unlock')} style={btnStyle('var(--xanh-reu)')}>
                        Mở
                      </button>
                    )}

                    <button onClick={() => handleAction(u.id, 'delete')} style={btnStyle('var(--muc-mo)')}>
                      Xóa
                    </button>
                  </div>
                </div>
              )
            })}
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

      {/* ===== MODAL XEM HỒ SƠ ===== */}
      {profileModal && profileUser && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,14,12,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px', overflowY: 'auto'
        }} onClick={() => setProfileModal(false)}>
          <div style={{
            background: 'var(--kem)', border: '1px solid var(--muc)',
            maxWidth: '900px', width: '100%', maxHeight: '90vh',
            overflowY: 'auto', padding: '48px', position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setProfileModal(false)} style={{
              position: 'absolute', top: '16px', right: '16px',
              width: '40px', height: '40px', background: 'transparent',
              border: '1px solid var(--muc)', color: 'var(--muc)',
              fontFamily: 'var(--mono)', fontSize: '18px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>✕</button>

            <h2 style={{
              fontFamily: 'var(--serif)', fontSize: '32px', fontWeight: 900,
              marginBottom: '8px', paddingRight: '48px'
            }}>
              Hồ sơ xác thực.
            </h2>
            <p style={{
              fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px',
              color: 'var(--muc-mo)', marginBottom: '24px'
            }}>
              {profileUser.name} · {profileUser.phone}
            </p>

            {/* THÔNG TIN CÁ NHÂN */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: '16px', marginBottom: '32px',
              padding: '20px', background: 'var(--kem-dam)',
              border: '1px solid rgba(15,14,12,0.15)'
            }}>
              <InfoRow label="Email" value={profileUser.email || '—'} />
              <InfoRow label="Vai trò" value={profileUser.role} />
              <InfoRow label="Địa chỉ" value={profileUser.address || '—'} />
              <InfoRow label="Ngày sinh" value={profileUser.dateOfBirth || '—'} />
              <InfoRow label="Trạng thái" value={statusLabels[profileUser.verificationStatus] || profileUser.verificationStatus} />
              <InfoRow label="Ngày tạo" value={formatDateTime(profileUser.createdAt)} />
            </div>

            {/* 5 ẢNH */}
            <h3 style={{
              fontFamily: 'var(--serif)', fontSize: '20px', fontWeight: 700,
              marginBottom: '16px'
            }}>
              Ảnh giấy tờ ({profileDocs.length}/5)
            </h3>

            {profileLoading ? (
              <p style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', color: 'var(--muc-mo)' }}>
                Đang tải hồ sơ...
              </p>
            ) : profileDocs.length === 0 ? (
              <p style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', color: 'var(--muc-mo)' }}>
                Chưa có ảnh nào được upload.
              </p>
            ) : (
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '16px', marginBottom: '32px'
              }}>
                {profileDocs.map(doc => (
                  <a key={doc.id} href={doc.documentUrl} target="_blank" rel="noreferrer"
                    style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{
                      aspectRatio: '4/3', border: '1px solid rgba(15,14,12,0.2)',
                      background: `url(${doc.documentUrl}) center/cover`,
                      marginBottom: '8px', overflow: 'hidden'
                    }} />
                    <div style={{
                      fontFamily: 'var(--mono)', fontSize: '10px',
                      letterSpacing: '1px', color: 'var(--muc-mo)',
                      textAlign: 'center'
                    }}>
                      {docTypeLabels[doc.documentType] || doc.documentType}
                    </div>
                  </a>
                ))}
              </div>
            )}

            {/* ACTIONS */}
            {profileUser.verificationStatus === 'PENDING' && (
              <div style={{
                display: 'flex', gap: '12px',
                paddingTop: '24px', borderTop: '1px solid rgba(15,14,12,0.15)'
              }}>
                <button onClick={() => handleApprove(profileUser)} style={{
                  flex: 1, padding: '16px', background: 'var(--xanh-reu)',
                  border: 'none', color: 'var(--kem)',
                  fontFamily: 'var(--mono)', fontSize: '11px',
                  letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer'
                }}>
                  ✓ Duyệt hồ sơ
                </button>
                <button onClick={() => openRejectModal(profileUser)} style={{
                  flex: 1, padding: '16px', background: 'var(--do)',
                  border: 'none', color: 'var(--kem)',
                  fontFamily: 'var(--mono)', fontSize: '11px',
                  letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer'
                }}>
                  ✕ Từ chối
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== MODAL TỪ CHỐI ===== */}
      {rejectModal && rejectingUser && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,14,12,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1100, padding: '20px'
        }} onClick={() => setRejectModal(false)}>
          <div style={{
            background: 'var(--kem)', border: '1px solid var(--muc)',
            maxWidth: '500px', width: '100%', padding: '48px', position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setRejectModal(false)} style={{
              position: 'absolute', top: '16px', right: '16px',
              width: '40px', height: '40px', background: 'transparent',
              border: '1px solid var(--muc)', color: 'var(--muc)',
              fontFamily: 'var(--mono)', fontSize: '18px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>✕</button>

            <h2 style={{
              fontFamily: 'var(--serif)', fontSize: '28px', fontWeight: 900,
              marginBottom: '8px', paddingRight: '48px'
            }}>
              Từ chối hồ sơ.
            </h2>
            <p style={{
              fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px',
              color: 'var(--muc-mo)', marginBottom: '24px'
            }}>
              {rejectingUser.name} · {rejectingUser.phone}
            </p>

            {rejectError && (
              <div style={{
                background: 'rgba(139,44,44,0.1)', border: '1px solid var(--do)',
                padding: '12px 16px', marginBottom: '20px',
                color: 'var(--do)', fontFamily: 'var(--serif-2)', fontStyle: 'italic'
              }}>
                {rejectError}
              </div>
            )}

            <form onSubmit={handleRejectSubmit}>
              <label style={{
                display: 'block', fontFamily: 'var(--mono)', fontSize: '10px',
                letterSpacing: '3px', textTransform: 'uppercase',
                color: 'var(--muc-mo)', marginBottom: '8px'
              }}>
                Lý do từ chối *
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                maxLength={500}
                placeholder="Ví dụ: Ảnh GPLX bị mờ, không đọc được số..."
                style={{
                  width: '100%', padding: '14px', background: 'var(--kem-dam)',
                  border: '1px solid rgba(15,14,12,0.2)',
                  fontFamily: 'var(--serif-2)', fontSize: '16px',
                  resize: 'vertical', outline: 'none', boxSizing: 'border-box'
                }}
              />
              <div style={{
                textAlign: 'right', fontFamily: 'var(--mono)',
                fontSize: '10px', color: 'var(--muc-mo)', marginTop: '4px'
              }}>
                {rejectReason.length}/500
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={() => setRejectModal(false)} style={{
                  flex: 1, padding: '16px', background: 'transparent',
                  border: '1px solid var(--muc)', color: 'var(--muc)',
                  fontFamily: 'var(--mono)', fontSize: '11px',
                  letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer'
                }}>
                  Hủy
                </button>
                <button type="submit" disabled={rejectSubmitting} style={{
                  flex: 2, padding: '16px', background: 'var(--do)',
                  border: 'none', color: 'var(--kem)',
                  fontFamily: 'var(--mono)', fontSize: '11px',
                  letterSpacing: '2px', textTransform: 'uppercase',
                  cursor: rejectSubmitting ? 'wait' : 'pointer'
                }}>
                  {rejectSubmitting ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                </button>
              </div>
            </form>
          </div>
        </div>
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

function InfoRow({ label, value }) {
  return (
    <div>
      <div style={{
        fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '1.5px',
        textTransform: 'uppercase', color: 'var(--muc-mo)', marginBottom: '4px'
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--serif-2)', fontSize: '16px', color: 'var(--muc)'
      }}>
        {value || '—'}
      </div>
    </div>
  )
}

function btnStyle(color) {
  return {
    padding: '6px 12px', background: 'transparent',
    border: `1px solid ${color}`, color,
    fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1px',
    textTransform: 'uppercase', cursor: 'pointer',
    transition: 'all 0.3s', whiteSpace: 'nowrap'
  }
}

function paginationBtnStyle(disabled) {
  return {
    padding: '8px 16px', background: 'transparent',
    border: '1px solid var(--muc)',
    color: disabled ? 'var(--muc-mo)' : 'var(--muc)',
    fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px',
    textTransform: 'uppercase',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1
  }
}

function paginationNumStyle(active) {
  return {
    padding: '8px 14px',
    background: active ? 'var(--muc)' : 'transparent',
    color: active ? 'var(--kem)' : 'var(--muc)',
    border: '1px solid var(--muc)',
    fontFamily: 'var(--mono)', fontSize: '11px',
    cursor: 'pointer', minWidth: '40px'
  }
}