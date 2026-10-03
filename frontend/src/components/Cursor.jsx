import { useEffect, useRef } from 'react'

export default function Cursor() {
  const dotRef = useRef(null)
  const ringRef = useRef(null)

  useEffect(() => {
    const dot = dotRef.current
    const ring = ringRef.current
    let mouseX = 0, mouseY = 0, dotX = 0, dotY = 0, ringX = 0, ringY = 0

    const onMove = (e) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }
    document.addEventListener('mousemove', onMove)

    const animate = () => {
      dotX += (mouseX - dotX) * 0.4
      dotY += (mouseY - dotY) * 0.4
      dot.style.left = dotX + 'px'
      dot.style.top = dotY + 'px'
      ringX += (mouseX - ringX) * 0.15
      ringY += (mouseY - ringY) * 0.15
      ring.style.left = ringX + 'px'
      ring.style.top = ringY + 'px'
      requestAnimationFrame(animate)
    }
    animate()

    const onEnter = () => { dot.classList.add('hover'); ring.classList.add('hover') }
    const onLeave = () => { dot.classList.remove('hover'); ring.classList.remove('hover') }

    const attach = () => {
      document.querySelectorAll('a, button, .car-row, .process-step').forEach(el => {
        el.addEventListener('mouseenter', onEnter)
        el.addEventListener('mouseleave', onLeave)
      })
    }
    attach()

    return () => {
      document.removeEventListener('mousemove', onMove)
    }
  }, [])

  return (
    <>
      <div className="cursor-dot" ref={dotRef}></div>
      <div className="cursor-ring" ref={ringRef}></div>
    </>
  )
}