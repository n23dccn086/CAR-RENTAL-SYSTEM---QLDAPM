import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import FormInput from '../components/FormInput'
import { register } from '../services/authService'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const validate = () => {
    if (!form.name || form.name.trim().length < 2) {
      return 'Họ tên phải có ít nhất 2 ký tự'
    }
    if (!form.phone) {
      return 'Vui lòng nhập số điện thoại'
    }
    if (!/^[0-9]{10,11}$/.test(form.phone)) {
      return 'Số điện thoại phải có 10-11 chữ số'
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return 'Email không đúng định dạng'
    }
    if (!form.password) {
      return 'Vui lòng nhập mật khẩu'
    }
    if (form.password.length < 8) {
      return 'Mật khẩu phải có ít nhất 8 ký tự'
    }
    if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(form.password)) {
      return 'Mật khẩu phải có cả chữ và số'
    }
    if (form.password !== form.confirm) {
      return 'Mật khẩu xác nhận không khớp'
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
      const res = await register({
        name: form.name,
        phone: form.phone,
        email: form.email || null,
        password: form.password,
      })
      localStorage.setItem('token', res.data?.token || '')
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
      <div style={{ maxWidth: '480px', width: '100%', background: 'var(--kem-dam)', border: '1px solid var(--muc)', padding: '60px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div className="chapter" style={{ justifyContent: 'center' }}>Chương Khai Sinh</div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: '42px', fontWeight: 900, letterSpacing: '-1px' }}>
            Ghi <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>tên.</em>
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
            label="Họ tên"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Nguyễn Văn A"
            required
          />
          <FormInput
            label="Số điện thoại"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="0901234567"
            required
          />
          <FormInput
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="email@example.com"
          />
          <FormInput
            label="Mật khẩu"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Ít nhất 8 ký tự, có chữ và số"
            required
          />
          <FormInput
            label="Xác nhận mật khẩu"
            name="confirm"
            type="password"
            value={form.confirm}
            onChange={handleChange}
            placeholder="Nhập lại mật khẩu"
            required
          />

          <button
            type="submit"
            className="btn-login"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '16px', marginTop: '12px' }}
          >
            <span>{loading ? 'Đang xử lý...' : 'Đăng ký'}</span>
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '32px', fontFamily: 'var(--serif-2)', fontStyle: 'italic', color: 'var(--muc-mo)' }}>
          Đã có tài khoản?{' '}
          <Link to="/login" style={{ color: 'var(--do)', borderBottom: '1px solid var(--do)' }}>
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  )
}