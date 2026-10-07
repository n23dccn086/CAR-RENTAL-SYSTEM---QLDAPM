import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import FormInput from '../components/FormInput'
import { login } from '../services/authService'
import { useAuthStore } from '../stores/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [form, setForm] = useState({ phone: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const validate = () => {
    if (!form.phone) {
      return 'Vui lòng nhập số điện thoại'
    }
    if (!/^[0-9]{10,11}$/.test(form.phone)) {
      return 'Số điện thoại phải có 10-11 chữ số'
    }
    if (!form.password) {
      return 'Vui lòng nhập mật khẩu'
    }
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      const res = await login(form.phone, form.password)
      setAuth(res.data.accessToken, res.data.user)

      // ★ Redirect theo role
      const userRole = res.data.user?.role
      if (userRole === 'ADMIN') {
        navigate('/admin/dashboard')
      } else if (userRole === 'OWNER') {
        navigate('/owner/dashboard')
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Số điện thoại hoặc mật khẩu không đúng')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
      <div style={{ maxWidth: '440px', width: '100%', background: 'var(--kem-dam)', border: '1px solid var(--muc)', padding: '60px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div className="chapter" style={{ justifyContent: 'center' }}>Chương Đăng Nhập</div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: '42px', fontWeight: 900, letterSpacing: '-1px' }}>
            Chào <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>trở lại.</em>
          </h1>
        </div>

        {error && (
          <div style={{
            background: 'rgba(139,44,44,0.1)',
            border: '1px solid var(--do)',
            padding: '12px 16px',
            marginBottom: '24px',
            color: 'var(--do)',
            fontFamily: 'var(--serif-2)',
            fontStyle: 'italic'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <FormInput
            label="Số điện thoại"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="0901234567"
            required
          />
          <FormInput
            label="Mật khẩu"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
          />

          <button
            type="submit"
            className="btn-login"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '16px', marginTop: '12px' }}
          >
            <span>{loading ? 'Đang xử lý...' : 'Đăng nhập'}</span>
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '32px', fontFamily: 'var(--serif-2)', fontStyle: 'italic', color: 'var(--muc-mo)' }}>
          Chưa có tài khoản?{' '}
          <Link to="/register" style={{ color: 'var(--do)', borderBottom: '1px solid var(--do)' }}>
            Ghi tên ngay
          </Link>
        </div>
      </div>
    </div>
  )
}