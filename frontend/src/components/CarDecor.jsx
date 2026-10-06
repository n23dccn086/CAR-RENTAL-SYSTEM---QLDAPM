import { useEffect, useState } from 'react'

export default function CarDecor() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1, overflow: 'hidden' }}>
      {/* Bánh răng quay góc trái dưới */}
      <svg
        style={{
          position: 'absolute',
          bottom: '10%', left: '3%',
          width: '80px', height: '80px',
          opacity: 0.15,
          animation: 'wheelSpin 20s linear infinite',
          transform: `translateY(${-scrollY * 0.1}px)`
        }}
        viewBox="0 0 100 100"
      >
        <circle cx="50" cy="50" r="40" fill="none" stroke="var(--dong)" strokeWidth="2" />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * 30) * Math.PI / 180
          return <line key={i} x1={50 + 38 * Math.cos(a)} y1={50 + 38 * Math.sin(a)} x2={50 + 48 * Math.cos(a)} y2={50 + 48 * Math.sin(a)} stroke="var(--dong)" strokeWidth="3" />
        })}
        <circle cx="50" cy="50" r="18" fill="none" stroke="var(--dong)" strokeWidth="2" />
        <circle cx="50" cy="50" r="8" fill="var(--dong)" opacity="0.5" />
      </svg>

      {/* Đồng hồ tốc độ góc phải */}
      <svg
        style={{
          position: 'absolute',
          top: '40%', right: '2%',
          width: '100px', height: '100px',
          opacity: 0.12,
          transform: `translateY(${scrollY * 0.08}px)`
        }}
        viewBox="0 0 100 100"
      >
        <circle cx="50" cy="50" r="45" fill="none" stroke="var(--do)" strokeWidth="1.5" />
        {Array.from({ length: 11 }).map((_, i) => {
          const a = (-90 + i * 18) * Math.PI / 180
          return (
            <line
              key={i}
              x1={50 + 38 * Math.cos(a)} y1={50 + 38 * Math.sin(a)}
              x2={50 + 44 * Math.cos(a)} y2={50 + 44 * Math.sin(a)}
              stroke="var(--do)" strokeWidth={i % 5 === 0 ? 2 : 1}
            />
          )
        })}
        <line x1="50" y1="50" x2={50 + 30 * Math.cos(-45 * Math.PI / 180)} y2={50 + 30 * Math.sin(-45 * Math.PI / 180)} stroke="var(--do)" strokeWidth="2" style={{ animation: 'needleSweep 3s ease-in-out infinite alternate', transformOrigin: '50px 50px' }} />
        <circle cx="50" cy="50" r="4" fill="var(--do)" />
      </svg>

      {/* Vô lăng góc trái trên */}
      <svg
        style={{
          position: 'absolute',
          top: '20%', left: '2%',
          width: '70px', height: '70px',
          opacity: 0.1,
          animation: 'rotateSlow 40s linear infinite reverse'
        }}
        viewBox="0 0 100 100"
      >
        <circle cx="50" cy="50" r="45" fill="none" stroke="var(--muc)" strokeWidth="3" />
        <circle cx="50" cy="50" r="35" fill="none" stroke="var(--muc)" strokeWidth="2" />
        <line x1="50" y1="50" x2="50" y2="5" stroke="var(--muc)" strokeWidth="3" />
        <line x1="50" y1="50" x2="5" y2="50" stroke="var(--muc)" strokeWidth="3" />
        <line x1="50" y1="50" x2="95" y2="50" stroke="var(--muc)" strokeWidth="3" />
        <circle cx="50" cy="50" r="8" fill="var(--muc)" />
      </svg>

             {/* Xe hơi chạy ngang dưới — PHẢI → TRÁI */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: 0,
        animation: 'carDrive 25s linear infinite',
        animationDirection: 'reverse',
        fontSize: '32px',
        opacity: 0.15,
        zIndex: 0
      }}>
        🚗🚙🚕
      </div>
    </div>
  )
}