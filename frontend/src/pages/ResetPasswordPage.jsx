import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import FormInput from '../components/FormInput'
import { resetPassword } from '../services/authService'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const phoneFromUrl = searchParams.get('phone') || ''

  const [form, setForm] = useState({
    phone: phoneFromUrl,
    otp: '',
    newPassword: '',
    confirm: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!/^[0-9]{6}$/.test(form.otp)) return setError('OTP phải 6 chữ số')
    if (form.newPassword.length < 8) return setError('Mật khẩu phải có ít nhất 8 ký tự')
    if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(form.newPassword)) {
      return setError('Mật khẩu phải có cả chữ và số')
    }
    if (form.newPassword !== form.confirm) return setError('Mật khẩu xác nhận không khớp')

    setLoading(true)
    try {
      await resetPassword(form.phone, form.otp, form.newPassword)
      setSuccess('Đổi mật khẩu thành công! Đang chuyển về trang đăng nhập...')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
      <div style={{ maxWidth: '440px', width: '100%', background: 'var(--kem-dam)', border: '1px solid var(--muc)', padding: '60px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div className="chapter" style={{ justifyContent: 'center' }}>Chương Đặt Lại Mật Khẩu</div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: '42px', fontWeight: 900, letterSpacing: '-1px' }}>
            Đặt lại <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>mật khẩu.</em>
          </h1>
        </div>

        <p style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '15px', color: 'var(--muc-mo)', marginBottom: '24px', textAlign: 'center' }}>
          Nhập mã OTP từ console backend + mật khẩu mới.
        </p>

        {error && (
          <div style={{ background: 'rgba(139,44,44,0.1)', border: '1px solid var(--do)', padding: '12px 16px', marginBottom: '24px', color: 'var(--do)', fontFamily: 'var(--serif-2)', fontStyle: 'italic' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ background: 'rgba(74,93,63,0.1)', border: '1px solid var(--xanh-reu)', padding: '12px 16px', marginBottom: '24px', color: 'var(--xanh-reu)', fontFamily: 'var(--serif-2)', fontStyle: 'italic' }}>
            {success}
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
            label="Mã OTP (6 số)"
            name="otp"
            value={form.otp}
            onChange={handleChange}
            placeholder="123456"
            required
          />
          <FormInput
            label="Mật khẩu mới"
            name="newPassword"
            type="password"
            value={form.newPassword}
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
            <span>{loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}</span>
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '32px', fontFamily: 'var(--serif-2)', fontStyle: 'italic', color: 'var(--muc-mo)' }}>
          <Link to="/forgot-password" style={{ color: 'var(--do)', borderBottom: '1px solid var(--do)' }}>
            Gửi lại OTP
          </Link>
        </div>
      </div>
    </div>
  )
}