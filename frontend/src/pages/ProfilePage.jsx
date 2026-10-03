import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import FormInput from '../components/FormInput'
import { useAuth } from '../hooks/useAuth'
import { getCurrentUser, updateProfile, changePassword } from '../services/authService'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, updateUser, isLoggedIn } = useAuth()
  const [tab, setTab] = useState('info')
  const [info, setInfo] = useState({ name: '', phone: '', email: '', address: '', dateOfBirth: '' })
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login')
      return
    }
    getCurrentUser().then(res => {
      const u = res.data
      setInfo({
        name: u.name || '',
        phone: u.phone || '',
        email: u.email || '',
        address: u.address || '',
        dateOfBirth: u.dateOfBirth || '',
      })
    }).catch(() => {
      if (user) {
        setInfo({
          name: user.name || '',
          phone: user.phone || '',
          email: user.email || '',
          address: user.address || '',
          dateOfBirth: user.dateOfBirth || '',
        })
      }
    })
  }, [])

  const showMsg = (type, text) => {
    setMsg({ type, text })
    setTimeout(() => setMsg({ type: '', text: '' }), 4000)
  }

  const handleInfoSubmit = async (e) => {
    e.preventDefault()
    setMsg({ type: '', text: '' })

    if (!info.name || info.name.trim().length < 2) {
      return showMsg('error', 'Họ tên phải có ít nhất 2 ký tự')
    }
    if (info.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.email)) {
      return showMsg('error', 'Email không đúng định dạng')
    }

    setLoading(true)
    try {
      const res = await updateProfile({
        name: info.name,
        email: info.email || null,
        address: info.address || null,
        dateOfBirth: info.dateOfBirth || null,
      })
      updateUser({ ...user, ...info })
      showMsg('success', 'Cập nhật hồ sơ thành công')
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Cập nhật thất bại')
    } finally {
      setLoading(false)
    }
  }

  const handlePwdSubmit = async (e) => {
    e.preventDefault()
    setMsg({ type: '', text: '' })

    if (!pwd.currentPassword) return showMsg('error', 'Vui lòng nhập mật khẩu hiện tại')
    if (pwd.newPassword.length < 8) return showMsg('error', 'Mật khẩu mới phải có ít nhất 8 ký tự')
    if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(pwd.newPassword)) {
      return showMsg('error', 'Mật khẩu mới phải có cả chữ và số')
    }
    if (pwd.newPassword !== pwd.confirmPassword) {
      return showMsg('error', 'Mật khẩu xác nhận không khớp')
    }

    setLoading(true)
    try {
      await changePassword(pwd.currentPassword, pwd.newPassword)
      showMsg('success', 'Đổi mật khẩu thành công')
      setPwd({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Đổi mật khẩu thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 48px' }}>
      <div className="chapter-num" style={{ marginBottom: '24px' }}>Chương Hồ Sơ</div>
      <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900, letterSpacing: '-2px', marginBottom: '40px' }}>
        Trang <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>cá nhân.</em>
      </h1>

      {/* AVATAR */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '40px', padding: '24px', background: 'var(--kem-dam)', border: '1px solid rgba(15,14,12,0.15)' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'var(--dong)', color: 'var(--muc)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--serif)', fontWeight: 900, fontSize: '36px'
        }}>
          {info.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '24px', fontWeight: 700 }}>{info.name || 'Chưa đặt tên'}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', letterSpacing: '1px', color: 'var(--muc-mo)', marginTop: '4px' }}>{info.phone}</div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', borderBottom: '1px solid rgba(15,14,12,0.15)' }}>
        {[
          { id: 'info', label: 'Thông tin cá nhân' },
          { id: 'password', label: 'Đổi mật khẩu' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '12px 20px',
            background: 'transparent',
            border: 'none',
            borderBottom: tab === t.id ? '2px solid var(--do)' : '2px solid transparent',
            fontFamily: 'var(--mono)',
            fontSize: '11px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: tab === t.id ? 'var(--do)' : 'var(--muc-mo)',
            cursor: 'pointer',
            marginBottom: '-1px'
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* MESSAGE */}
      {msg.text && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '24px',
          background: msg.type === 'success' ? 'rgba(74,93,63,0.1)' : 'rgba(139,44,44,0.1)',
          border: `1px solid ${msg.type === 'success' ? 'var(--xanh-reu)' : 'var(--do)'}`,
          color: msg.type === 'success' ? 'var(--xanh-reu)' : 'var(--do)',
          fontFamily: 'var(--serif-2)',
          fontStyle: 'italic'
        }}>
          {msg.text}
        </div>
      )}

      {/* TAB INFO */}
      {tab === 'info' && (
        <form onSubmit={handleInfoSubmit}>
          <FormInput label="Họ tên" name="name" value={info.name} onChange={e => setInfo({ ...info, name: e.target.value })} required />
          <FormInput label="Số điện thoại (không đổi được)" name="phone" value={info.phone} onChange={() => {}} />
          <FormInput label="Email" name="email" type="email" value={info.email} onChange={e => setInfo({ ...info, email: e.target.value })} />
          <FormInput label="Địa chỉ" name="address" value={info.address} onChange={e => setInfo({ ...info, address: e.target.value })} />
          <FormInput label="Ngày sinh" name="dateOfBirth" type="date" value={info.dateOfBirth} onChange={e => setInfo({ ...info, dateOfBirth: e.target.value })} />

          <button type="submit" className="btn-login" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '16px', marginTop: '12px' }}>
            <span>{loading ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
          </button>
        </form>
      )}

      {/* TAB PASSWORD */}
      {tab === 'password' && (
        <form onSubmit={handlePwdSubmit}>
          <FormInput label="Mật khẩu hiện tại" name="currentPassword" type="password" value={pwd.currentPassword} onChange={e => setPwd({ ...pwd, currentPassword: e.target.value })} required />
          <FormInput label="Mật khẩu mới" name="newPassword" type="password" value={pwd.newPassword} onChange={e => setPwd({ ...pwd, newPassword: e.target.value })} required />
          <FormInput label="Xác nhận mật khẩu mới" name="confirmPassword" type="password" value={pwd.confirmPassword} onChange={e => setPwd({ ...pwd, confirmPassword: e.target.value })} required />

          <button type="submit" className="btn-login" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '16px', marginTop: '12px' }}>
            <span>{loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}</span>
          </button>
        </form>
      )}
    </div>
  )
}