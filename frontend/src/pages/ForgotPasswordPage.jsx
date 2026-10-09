import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import FormInput from '../components/FormInput'
import { forgotPassword } from '../services/authService'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!/^[0-9]{10,11}$/.test(phone)) {
      return setError('Số điện thoại phải 10-11 chữ số')
    }

    setLoading(true)
    try {
      await forgotPassword(phone)
      navigate(`/reset-password?phone=${encodeURIComponent(phone)}`)
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
          <div className="chapter" style={{ justifyContent: 'center' }}>Chương Quên Mật Khẩu</div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: '42px', fontWeight: 900, letterSpacing: '-1px' }}>
            Quên <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>mật khẩu.</em>
          </h1>
        </div>

        <p style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '15px', color: 'var(--muc-mo)', marginBottom: '24px', textAlign: 'center' }}>
          Nhập số điện thoại để nhận mã OTP qua SMS.
        </p>

        {error && (
          <div style={{ background: 'rgba(139,44,44,0.1)', border: '1px solid var(--do)', padding: '12px 16px', marginBottom: '24px', color: 'var(--do)', fontFamily: 'var(--serif-2)', fontStyle: 'italic' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <FormInput
            label="Số điện thoại"
            name="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0901234567"
            required
          />

          <button
            type="submit"
            className="btn-login"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '16px', marginTop: '12px' }}
          >
            <span>{loading ? 'Đang gửi...' : 'Gửi mã OTP'}</span>
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '32px', fontFamily: 'var(--serif-2)', fontStyle: 'italic', color: 'var(--muc-mo)' }}>
          Nhớ mật khẩu rồi?{' '}
          <Link to="/login" style={{ color: 'var(--do)', borderBottom: '1px solid var(--do)' }}>
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  )
}