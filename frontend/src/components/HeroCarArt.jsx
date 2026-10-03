import { useState, useEffect } from 'react'

export default function HeroCarArt() {
  const [hover, setHover] = useState(false)
  const [particles, setParticles] = useState([])

  // Tạo particles bay lơ lửng
  useEffect(() => {
    const arr = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 8 + 6,
      delay: Math.random() * 5,
    }))
    setParticles(arr)
  }, [])

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        cursor: 'pointer'
      }}
    >
      {/* BACKGROUND HERO CAR — ART */}
      <svg
        viewBox="0 0 500 400"
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          zIndex: 2
        }}
      >
        <defs>
          {/* Gradient cho xe */}
          <linearGradient id="heroCarBody" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#faf5eb" />
            <stop offset="50%" stopColor="#f0e8d8" />
            <stop offset="100%" stopColor="#d8c9a8" />
          </linearGradient>
          <linearGradient id="heroWindow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d4e4ee" />
            <stop offset="100%" stopColor="#5a7a8a" />
          </linearGradient>
          <radialGradient id="heroWheel" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#4a4845" />
            <stop offset="70%" stopColor="#1a1815" />
            <stop offset="100%" stopColor="#000" />
          </radialGradient>
          <radialGradient id="heroGlow" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#ffe8b0" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ffe8b0" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="heroLight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="50%" stopColor="rgba(255,232,176,0.6)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        {/* GRID NỀN — blueprint */}
        <g opacity={hover ? 0.15 : 0.08} style={{ transition: 'opacity 0.5s' }}>
          {Array.from({ length: 13 }).map((_, i) => (
            <line key={`v-${i}`} x1={i * 40} y1="0" x2={i * 40} y2="400" stroke="#0f0e0c" strokeWidth="0.3" strokeDasharray="2 6" />
          ))}
          {Array.from({ length: 11 }).map((_, i) => (
            <line key={`h-${i}`} x1="0" y1={i * 40} x2="500" y2={i * 40} stroke="#0f0e0c" strokeWidth="0.3" strokeDasharray="2 6" />
          ))}
        </g>

        {/* ĐƯỜNG CHẠY — moving road */}
        <line
          x1="40" y1="320" x2="460" y2="320"
          stroke="#0f0e0c"
          strokeWidth="1.5"
          strokeDasharray="20 15"
          opacity="0.5"
          style={{
            animation: 'roadMove 3s linear infinite'
          }}
        />

        {/* Mây trang trí */}
        <g opacity={hover ? 0.5 : 0.3} style={{ transition: 'opacity 0.5s' }}>
          <ellipse cx="100" cy="80" rx="40" ry="12" fill="var(--dong)" opacity="0.15" />
          <ellipse cx="120" cy="85" rx="30" ry="10" fill="var(--dong)" opacity="0.15" />
          <ellipse cx="380" cy="120" rx="50" ry="14" fill="var(--dong)" opacity="0.12" />
          <ellipse cx="400" cy="125" rx="35" ry="12" fill="var(--dong)" opacity="0.12" />
        </g>

        {/* MẶT TRỜI / ĐỒNG HỒ TRÒN */}
        <g opacity="0.6">
          <circle cx="420" cy="80" r="28" fill="none" stroke="var(--do)" strokeWidth="1" />
          <circle cx="420" cy="80" r="22" fill="none" stroke="var(--do)" strokeWidth="0.5" strokeDasharray="2 3" />
          <circle cx="420" cy="80" r="8" fill="var(--do)" opacity="0.3" />
          {/* Tia */}
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i * 45) * Math.PI / 180
            return (
              <line
                key={i}
                x1={420 + 32 * Math.cos(a)}
                y1={80 + 32 * Math.sin(a)}
                x2={420 + 40 * Math.cos(a)}
                y2={80 + 40 * Math.sin(a)}
                stroke="var(--do)"
                strokeWidth="1"
                opacity="0.5"
              />
            )
          })}
        </g>

        {/* BỤI VÀNG BAY */}
        {particles.map(p => (
          <circle
            key={p.id}
            cx={p.x * 5}
            cy={p.y * 4}
            r={p.size}
            fill="var(--dong)"
            opacity="0.4"
            style={{
              animation: `particleFloat ${p.duration}s ease-in-out ${p.delay}s infinite alternate`
            }}
          />
        ))}

        {/* BÓNG XE */}
        <ellipse
          cx="250"
          cy="335"
          rx="160"
          ry="8"
          fill="#0f0e0c"
          opacity={hover ? 0.2 : 0.12}
          style={{ transition: 'opacity 0.5s' }}
        />

        {/* ============ XE Ô TÔ ============ */}
        <g
          style={{
            transform: hover ? 'translateX(8px) translateY(-4px)' : 'translateX(0) translateY(0)',
            transition: 'transform 0.8s cubic-bezier(0.23, 1, 0.32, 1)'
          }}
        >
          {/* Ánh sáng đèn pha chiếu ra */}
          {hover && (
            <>
              <ellipse cx="480" cy="270" rx="80" ry="30" fill="url(#heroGlow)" style={{ animation: 'glowPulse 1.5s ease-in-out infinite' }} />
              <polygon points="420,260 500,240 500,300 420,280" fill="url(#heroLight)" opacity="0.5" />
            </>
          )}

          {/* Thân xe */}
          <path
            d="M 100 310
               Q 100 285, 120 280
               L 160 275
               L 180 230
               Q 190 215, 210 215
               L 300 215
               Q 320 215, 330 230
               L 360 275
               L 400 280
               Q 420 285, 420 310
               L 420 320
               Q 420 330, 410 330
               L 110 330
               Q 100 330, 100 320 Z"
            fill="url(#heroCarBody)"
            stroke="#0f0e0c"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Cửa sổ trước */}
          <path
            d="M 175 275 L 185 230 L 250 230 L 250 275 Z"
            fill="url(#heroWindow)"
            stroke="#0f0e0c"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Cửa sổ sau */}
          <path
            d="M 255 275 L 255 230 L 300 230 L 330 260 L 340 275 Z"
            fill="url(#heroWindow)"
            stroke="#0f0e0c"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Đường chia cửa sổ */}
          <line x1="252" y1="230" x2="252" y2="275" stroke="#0f0e0c" strokeWidth="1.5" />

          {/* Đèn pha trước */}
          <ellipse cx="415" cy="295" rx="6" ry="5" fill={hover ? '#fff2c8' : '#f5e6b8'} stroke="#0f0e0c" strokeWidth="1" style={{ animation: hover ? 'headlight 0.8s ease-in-out infinite' : 'none' }} />

          {/* Đèn sau */}
          <ellipse cx="108" cy="295" rx="4" ry="4" fill="#c94a3a" stroke="#0f0e0c" strokeWidth="1" />

          {/* Tay nắm cửa */}
          <rect x="270" y="288" width="14" height="2" fill="#0f0e0c" opacity="0.5" rx="1" />
          <rect x="220" y="288" width="14" height="2" fill="#0f0e0c" opacity="0.5" rx="1" />

          {/* Gương chiếu hậu */}
          <ellipse cx="175" cy="260" rx="8" ry="4" fill="#0f0e0c" />

          {/* Nắp bình xăng */}
          <circle cx="390" cy="290" r="4" fill="none" stroke="#0f0e0c" strokeWidth="1" />

          {/* Lốp trước */}
          <g style={{ transformOrigin: '170px 330px', animation: 'wheelSpin 3s linear infinite' }}>
            <circle cx="170" cy="330" r="28" fill="url(#heroWheel)" />
            <circle cx="170" cy="330" r="24" fill="none" stroke="#3a3835" strokeWidth="1" />
            <circle cx="170" cy="330" r="18" fill="#c9a961" />
            <circle cx="170" cy="330" r="18" fill="none" stroke="#0f0e0c" strokeWidth="1.5" />
            {/* 5 nan */}
            {[0, 72, 144, 216, 288].map((deg, i) => {
              const a = (deg - 90) * Math.PI / 180
              return <line key={i} x1="170" y1="330" x2={170 + 16 * Math.cos(a)} y2={330 + 16 * Math.sin(a)} stroke="#0f0e0c" strokeWidth="2" strokeLinecap="round" />
            })}
            <circle cx="170" cy="330" r="6" fill="#0f0e0c" />
            <circle cx="170" cy="330" r="2" fill="#c9a961" />
          </g>

          {/* Lốp sau */}
          <g style={{ transformOrigin: '360px 330px', animation: 'wheelSpin 3s linear infinite' }}>
            <circle cx="360" cy="330" r="28" fill="url(#heroWheel)" />
            <circle cx="360" cy="330" r="24" fill="none" stroke="#3a3835" strokeWidth="1" />
            <circle cx="360" cy="330" r="18" fill="#c9a961" />
            <circle cx="360" cy="330" r="18" fill="none" stroke="#0f0e0c" strokeWidth="1.5" />
            {[0, 72, 144, 216, 288].map((deg, i) => {
              const a = (deg - 90) * Math.PI / 180
              return <line key={i} x1="360" y1="330" x2={360 + 16 * Math.cos(a)} y2={330 + 16 * Math.sin(a)} stroke="#0f0e0c" strokeWidth="2" strokeLinecap="round" />
            })}
            <circle cx="360" cy="330" r="6" fill="#0f0e0c" />
            <circle cx="360" cy="330" r="2" fill="#c9a961" />
          </g>

          {/* Khói xe */}
          <g opacity="0.6">
            <circle cx="95" cy="300" r="6" fill="#a8a8a8" style={{ animation: 'smokeRise 2s ease-out infinite' }} />
            <circle cx="85" cy="295" r="8" fill="#a8a8a8" style={{ animation: 'smokeRise 2s ease-out 0.5s infinite' }} />
            <circle cx="75" cy="290" r="10" fill="#a8a8a8" style={{ animation: 'smokeRise 2s ease-out 1s infinite' }} />
          </g>
        </g>

        {/* ============ TRANG TRÍ ============ */}
        {/* Chim bay */}
        <g opacity="0.4" style={{ animation: 'birdFly 6s ease-in-out infinite' }}>
          <path d="M 60 60 Q 65 55, 70 60 Q 75 55, 80 60" fill="none" stroke="#0f0e0c" strokeWidth="1.2" />
          <path d="M 90 80 Q 95 75, 100 80 Q 105 75, 110 80" fill="none" stroke="#0f0e0c" strokeWidth="1.2" />
        </g>

        {/* Cây bên đường */}
        <g opacity="0.3">
          <line x1="60" y1="320" x2="60" y2="290" stroke="#4a5d3f" strokeWidth="2" />
          <circle cx="60" cy="285" r="10" fill="#4a5d3f" opacity="0.5" />
          <circle cx="55" cy="282" r="8" fill="#4a5d3f" opacity="0.5" />
          <circle cx="65" cy="282" r="8" fill="#4a5d3f" opacity="0.5" />
        </g>

        {/* Cột mốc */}
        <g opacity="0.5">
          <line x1="440" y1="320" x2="440" y2="290" stroke="#0f0e0c" strokeWidth="1.5" />
          <rect x="432" y="285" width="16" height="8" fill="#8b2c2c" />
          <text x="440" y="291" textAnchor="middle" fontFamily="Playfair Display, serif" fontSize="5" fill="#f5f0e6" fontStyle="italic">KM</text>
        </g>
      </svg>

      {/* ÁNH SÁNG SWEEP KHI HOVER */}
      {hover && (
        <div style={{
          position: 'absolute',
          top: 0, left: '-100%',
          width: '60%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,232,176,0.4), transparent)',
          animation: 'lightSweep 1.5s ease-out',
          pointerEvents: 'none',
          zIndex: 3
        }} />
      )}

      {/* SỐ LA MÃ Ở GÓC */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '24px',
        fontFamily: 'var(--serif)',
        fontSize: '72px',
        fontStyle: 'italic',
        fontWeight: 900,
        color: 'var(--dong)',
        opacity: hover ? 0.7 : 0.3,
        lineHeight: 1,
        zIndex: 4,
        transition: 'opacity 0.5s'
      }}>
        I
      </div>

      {/* CAPTION DỌC */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '-4px',
        fontFamily: 'var(--mono)',
        fontSize: '9px',
        letterSpacing: '3px',
        textTransform: 'uppercase',
        color: 'var(--muc-mo)',
        writingMode: 'vertical-rl',
        transform: 'rotate(180deg)',
        zIndex: 4
      }}>
        Fig. I — Sedan Class
      </div>

      {/* DẤU NIÊM PHONG — seal */}
      <svg
        style={{
          position: 'absolute',
          top: '20px',
          right: '24px',
          width: '60px',
          height: '60px',
          color: 'var(--do)',
          animation: 'sealRotate 30s linear infinite',
          opacity: 0.5,
          zIndex: 4
        }}
        viewBox="0 0 60 60"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="30" cy="30" r="26" />
        <circle cx="30" cy="30" r="20" strokeDasharray="3 3" />
        <text x="30" y="34" textAnchor="middle" fontFamily="Playfair Display, serif" fontSize="14" fill="currentColor" stroke="none" fontStyle="italic" fontWeight="700">M</text>
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i * 45) * Math.PI / 180
          return <circle key={i} cx={30 + 26 * Math.cos(a)} cy={30 + 26 * Math.sin(a)} r="1.5" fill="currentColor" />
        })}
      </svg>
    </div>
  )
}