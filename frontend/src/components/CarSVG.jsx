export default function CarSVG({ type = 'SEDAN', color = '#8b2c2c', hover = false }) {
  const bodyColor = color
  const darkColor = '#0f0e0c'
  const windowColor = '#a8c5d6'
  const wheelColor = '#2a2825'
  const rimColor = '#c9a961'

  // Chiều cao khác nhau tùy loại xe
  const heights = {
    SEDAN: { roofY: 45, bodyY: 70, wheelY: 105 },
    SUV: { roofY: 30, bodyY: 60, wheelY: 105 },
    MPV: { roofY: 25, bodyY: 55, wheelY: 105 },
    HATCHBACK: { roofY: 50, bodyY: 75, wheelY: 105 },
  }
  const h = heights[type] || heights.SEDAN

  return (
    <svg
      viewBox="0 0 300 140"
      style={{
        width: '100%',
        maxWidth: '280px',
        height: 'auto',
        transform: hover ? 'translateX(4px)' : 'translateX(0)',
        transition: 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)'
      }}
    >
      <defs>
        <linearGradient id={`bodyGrad-${type}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={bodyColor} stopOpacity="1" />
          <stop offset="100%" stopColor={bodyColor} stopOpacity="0.75" />
        </linearGradient>
        <linearGradient id={`windowGrad-${type}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d4e4ee" />
          <stop offset="100%" stopColor="#7fa3b8" />
        </linearGradient>
        <radialGradient id={`wheelGrad-${type}`}>
          <stop offset="0%" stopColor="#4a4845" />
          <stop offset="100%" stopColor="#0f0e0c" />
        </radialGradient>
      </defs>

      {/* Đường chạy */}
      <line
        x1="10" y1={h.wheelY + 18} x2="290" y2={h.wheelY + 18}
        stroke={darkColor}
        strokeWidth="1"
        strokeDasharray={hover ? '0' : '4 4'}
        style={{ transition: 'stroke-dasharray 0.5s' }}
        opacity="0.4"
      />

      {/* Bóng xe dưới */}
      <ellipse cx="150" cy={h.wheelY + 20} rx="120" ry="4" fill={darkColor} opacity="0.15" />

      {/* THÂN XE — body */}
      <path
        d={`M 40 ${h.bodyY}
            Q 40 ${h.bodyY - 15}, 60 ${h.bodyY - 15}
            L 90 ${h.bodyY - 15}
            Q 110 ${h.roofY}, 140 ${h.roofY - 5}
            L 200 ${h.roofY - 5}
            Q 230 ${h.roofY}, 250 ${h.bodyY - 15}
            L 270 ${h.bodyY - 15}
            Q 285 ${h.bodyY - 15}, 285 ${h.bodyY}
            L 285 ${h.wheelY - 5}
            Q 285 ${h.wheelY + 5}, 275 ${h.wheelY + 5}
            L 25 ${h.wheelY + 5}
            Q 15 ${h.wheelY + 5}, 15 ${h.wheelY - 5}
            Z`}
        fill={`url(#bodyGrad-${type})`}
        stroke={darkColor}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Cửa sổ trước */}
      <path
        d={`M 100 ${h.bodyY - 12}
            L 115 ${h.roofY + 5}
            L 140 ${h.roofY + 5}
            L 140 ${h.bodyY - 12} Z`}
        fill={`url(#windowGrad-${type})`}
        stroke={darkColor}
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* Cửa sổ sau */}
      <path
        d={`M 145 ${h.bodyY - 12}
            L 145 ${h.roofY + 5}
            L 195 ${h.roofY + 5}
            L 215 ${h.bodyY - 12} Z`}
        fill={`url(#windowGrad-${type})`}
        stroke={darkColor}
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* Đường chia cửa */}
      <line x1="142" y1={h.roofY + 5} x2="142" y2={h.bodyY - 12} stroke={darkColor} strokeWidth="0.8" />

      {/* Tay nắm cửa */}
      <rect x="155" y={h.bodyY - 3} width="12" height="2" fill={darkColor} opacity="0.6" />
      <rect x="120" y={h.bodyY - 3} width="12" height="2" fill={darkColor} opacity="0.6" />

      {/* Đèn trước */}
      <ellipse cx="278" cy={h.bodyY + 5} rx="6" ry="4" fill="#ffe8b0" stroke={darkColor} strokeWidth="1" />
      {/* Đèn sau */}
      <ellipse cx="20" cy={h.bodyY + 5} rx="4" ry="3" fill="#c94a3a" stroke={darkColor} strokeWidth="1" />

      {/* Gương */}
      <ellipse cx="105" cy={h.bodyY - 18} rx="5" ry="3" fill={darkColor} />

      {/* BÁNH TRƯỚC */}
      <g style={{
        transformOrigin: '80px ' + h.wheelY + 'px',
        animation: hover ? 'wheelSpin 1s linear infinite' : 'wheelSpin 8s linear infinite'
      }}>
        <circle cx="80" cy={h.wheelY} r="18" fill={`url(#wheelGrad-${type})`} />
        <circle cx="80" cy={h.wheelY} r="14" fill="none" stroke="#3a3835" strokeWidth="0.5" />
        <circle cx="80" cy={h.wheelY} r="10" fill={rimColor} />
        <circle cx="80" cy={h.wheelY} r="10" fill="none" stroke={darkColor} strokeWidth="0.8" />
        {/* 5 nan */}
        {[0, 72, 144, 216, 288].map((deg, i) => {
          const a = (deg - 90) * Math.PI / 180
          return <line key={i} x1="80" y1={h.wheelY} x2={80 + 9 * Math.cos(a)} y2={h.wheelY + 9 * Math.sin(a)} stroke={darkColor} strokeWidth="1" />
        })}
        <circle cx="80" cy={h.wheelY} r="3" fill={darkColor} />
      </g>

      {/* BÁNH SAU */}
      <g style={{
        transformOrigin: '220px ' + h.wheelY + 'px',
        animation: hover ? 'wheelSpin 1s linear infinite' : 'wheelSpin 8s linear infinite'
      }}>
        <circle cx="220" cy={h.wheelY} r="18" fill={`url(#wheelGrad-${type})`} />
        <circle cx="220" cy={h.wheelY} r="14" fill="none" stroke="#3a3835" strokeWidth="0.5" />
        <circle cx="220" cy={h.wheelY} r="10" fill={rimColor} />
        <circle cx="220" cy={h.wheelY} r="10" fill="none" stroke={darkColor} strokeWidth="0.8" />
        {[0, 72, 144, 216, 288].map((deg, i) => {
          const a = (deg - 90) * Math.PI / 180
          return <line key={i} x1="220" y1={h.wheelY} x2={220 + 9 * Math.cos(a)} y2={h.wheelY + 9 * Math.sin(a)} stroke={darkColor} strokeWidth="1" />
        })}
        <circle cx="220" cy={h.wheelY} r="3" fill={darkColor} />
      </g>

      {/* Khói xe khi hover */}
      {hover && (
        <g opacity="0.5">
          <circle cx="15" cy={h.bodyY + 5} r="3" fill="#a8a8a8" style={{ animation: 'smokeRise 1.5s ease-out infinite' }} />
          <circle cx="10" cy={h.bodyY + 5} r="4" fill="#a8a8a8" style={{ animation: 'smokeRise 1.5s ease-out 0.3s infinite' }} />
          <circle cx="5" cy={h.bodyY + 5} r="5" fill="#a8a8a8" style={{ animation: 'smokeRise 1.5s ease-out 0.6s infinite' }} />
        </g>
      )}
    </svg>
  )
}