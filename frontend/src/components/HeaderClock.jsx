import { useState, useEffect } from 'react'

export default function HeaderClock() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (d) => {
    const h = String(d.getHours()).padStart(2, '0')
    const m = String(d.getMinutes()).padStart(2, '0')
    const s = String(d.getSeconds()).padStart(2, '0')
    return `${h}:${m}:${s}`
  }

  const formatDate = (d) => {
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  const getWeekday = (d) => {
    const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']
    return days[d.getDay()]
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '24px',
      fontFamily: 'var(--mono)',
      fontSize: '10px',
      letterSpacing: '2px',
      textTransform: 'uppercase',
      color: 'var(--muc-mo)'
    }}>
      {/* Đồng hồ realtime */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--do)' }}>
          <circle cx="12" cy="12" r="10"/>
          <path d="M 12 6 L 12 12 L 16 14"/>
        </svg>
        <span style={{ color: 'var(--muc)', fontFamily: 'var(--mono)', fontWeight: 500 }}>
          {formatTime(time)}
        </span>
        <span style={{ color: 'var(--dong)' }}>·</span>
        <span>{formatDate(time)}</span>
        <span style={{ color: 'var(--dong)' }}>·</span>
        <span style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', textTransform: 'none', letterSpacing: '0.5px' }}>
          {getWeekday(time)}
        </span>
      </div>

      {/* Hotline */}
      <a
        href="tel:1900xxxx"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--muc-mo)',
          transition: 'color 0.3s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--do)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muc-mo)'}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M 22 16.92 v 3 a 2 2 0 0 1 -2.18 2 a 19.79 19.79 0 0 1 -8.63 -3.07 a 19.5 19.5 0 0 1 -6 -6 a 19.79 19.79 0 0 1 -3.07 -8.67 A 2 2 0 0 1 4.11 2 h 3 a 2 2 0 0 1 2 1.72 c .12 .96 .37 1.9 .72 2.81 a 2 2 0 0 1 -.45 2.11 L 8.09 9.91 a 16 16 0 0 0 6 6 l 1.27 -1.27 a 2 2 0 0 1 2.11 -.45 c .91 .35 1.85 .6 2.81 .72 A 2 2 0 0 1 22 16.92 z"/>
        </svg>
        <span>1900-xxxx</span>
      </a>
    </div>
  )
}