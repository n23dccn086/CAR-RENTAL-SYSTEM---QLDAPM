import { useRef, useState, useEffect } from 'react'

/**
 * Component canvas vẽ chữ ký bằng chuột/cảm ứng.
 * Props:
 *  - onChange(base64DataUrl): callback khi chữ ký thay đổi
 *  - width, height: kích thước canvas
 *  - penColor: màu bút
 */
export default function SignatureCanvas({
  onChange,
  width = 600,
  height = 200,
  penColor = '#0f0e0c',
}) {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const lastPoint = useRef(null)

  // ===== INIT CANVAS =====
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Set canvas resolution cao (retina)
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.strokeStyle = penColor
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Nền trắng để khi export ra PNG không bị trong suốt
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
  }, [width, height, penColor])

  // ===== LẤY TỌA ĐỘ =====
  const getPoint = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }

  // ===== BẮT ĐẦU VẼ =====
  const startDrawing = (e) => {
    e.preventDefault()
    setIsDrawing(true)
    lastPoint.current = getPoint(e)
  }

  // ===== ĐANG VẼ =====
  const draw = (e) => {
    if (!isDrawing) return
    e.preventDefault()

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const currentPoint = getPoint(e)

    ctx.beginPath()
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y)
    ctx.lineTo(currentPoint.x, currentPoint.y)
    ctx.stroke()

    lastPoint.current = currentPoint
    setHasSignature(true)
  }

  // ===== KẾT THÚC VẼ =====
  const stopDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    lastPoint.current = null

    // Trigger onChange với base64
    const canvas = canvasRef.current
    if (canvas && onChange) {
      const dataUrl = canvas.toDataURL('image/png')
      onChange(dataUrl)
    }
  }

  // ===== XÓA =====
  const clear = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    setHasSignature(false)
    if (onChange) onChange(null)
  }

  return (
    <div style={{ display: 'inline-block' }}>
      <div
        style={{
          border: '2px dashed var(--muc-mo)',
          background: '#fff',
          position: 'relative',
          touchAction: 'none',
          cursor: 'crosshair',
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ display: 'block', touchAction: 'none' }}
        />

        {!hasSignature && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              fontFamily: 'var(--serif-2)',
              fontStyle: 'italic',
              fontSize: '16px',
              color: 'var(--muc-mo)',
              opacity: 0.5,
            }}
          >
            Ký tên vào đây
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '8px',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--mono)',
            fontSize: '10px',
            letterSpacing: '1px',
            color: 'var(--muc-mo)',
            textTransform: 'uppercase',
          }}
        >
          {hasSignature ? '✓ Đã ký' : 'Vẽ chữ ký bằng chuột / ngón tay'}
        </div>

        <button
          type="button"
          onClick={clear}
          style={{
            padding: '6px 14px',
            background: 'transparent',
            border: '1px solid var(--do)',
            color: 'var(--do)',
            fontFamily: 'var(--mono)',
            fontSize: '10px',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          ✕ Xóa
        </button>
      </div>
    </div>
  )
}