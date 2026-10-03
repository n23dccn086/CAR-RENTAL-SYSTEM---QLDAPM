import { useEffect, useRef, useState } from 'react'

export function useCountUp(target, duration = 2000, decimal = 0) {
  const [value, setValue] = useState(0)
  const ref = useRef(null)
  const animated = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true
          const startTime = performance.now()

          const update = (currentTime) => {
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setValue(target * eased)
            if (progress < 1) requestAnimationFrame(update)
            else setValue(target)
          }
          requestAnimationFrame(update)
        }
      })
    }, { threshold: 0.5 })

    observer.observe(el)
    return () => observer.disconnect()
  }, [target, duration])

  const displayValue = decimal > 0
    ? value.toFixed(decimal)
    : Math.floor(value).toLocaleString('vi-VN')

  return { ref, value: displayValue }
}