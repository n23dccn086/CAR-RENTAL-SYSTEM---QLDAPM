import { useState } from 'react'

export default function FormInput({
  label, type = 'text', value, onChange,
  placeholder, required = false, name
}) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const actualType = isPassword ? (showPassword ? 'text' : 'password') : type

  return (
    <div style={{ marginBottom: '24px' }}>
      {label && (
        <label style={{
          display: 'block',
          fontFamily: 'var(--mono)',
          fontSize: '10px',
          letterSpacing: '3px',
          textTransform: 'uppercase',
          color: 'var(--muc-mo)',
          marginBottom: '8px'
        }}>
          {label} {required && <span style={{ color: 'var(--do)' }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <input
          type={actualType}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          style={{
            width: '100%',
            padding: isPassword ? '14px 48px 14px 16px' : '14px 16px',
            background: 'var(--kem-dam)',
            border: '1px solid rgba(15,14,12,0.2)',
            fontFamily: 'var(--serif-2)',
            fontSize: '16px',
            color: 'var(--muc)',
            outline: 'none',
            transition: 'border-color 0.3s'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--dong)'}
          onBlur={(e) => e.target.style.borderColor = 'rgba(15,14,12,0.2)'}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: showPassword ? 'var(--do)' : 'var(--muc-mo)',
              transition: 'color 0.3s'
            }}
          >
            {showPassword ? (
              // Mắt mở
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M 1 12 Q 5 4, 12 4 Q 19 4, 23 12 Q 19 20, 12 20 Q 5 20, 1 12 Z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            ) : (
              // Mắt gạch
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M 1 12 Q 5 4, 12 4 Q 19 4, 23 12 Q 19 20, 12 20 Q 5 20, 1 12 Z"/>
                <circle cx="12" cy="12" r="3"/>
                <line x1="3" y1="3" x2="21" y2="21"/>
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  )
}