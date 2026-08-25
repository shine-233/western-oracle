/**
 * 磁吸悬浮指令（awwwards 风格 micro-interaction）：指针靠近时元素被轻轻吸向指针。
 * 用法：v-magnetic 或 v-magnetic="0.35"（吸附强度系数）。
 * 仅在精确指针（鼠标）且未开启减少动效时启用；离开时弹性回位。
 */
import type { Directive } from 'vue'

export const vMagnetic: Directive<HTMLElement, number | undefined> = {
  mounted(el, binding): void {
    if (!window.matchMedia('(pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const strength = typeof binding.value === 'number' ? binding.value : 0.22
    let raf = 0

    const onMove = (e: MouseEvent): void => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const rect = el.getBoundingClientRect()
        const dx = e.clientX - (rect.left + rect.width / 2)
        const dy = e.clientY - (rect.top + rect.height / 2)
        el.style.transition = 'transform 0.18s ease-out'
        el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`
      })
    }

    const onLeave = (): void => {
      if (raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
      el.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
      el.style.transform = 'translate(0px, 0px)'
      window.setTimeout(() => {
        if (!raf) el.style.transition = ''
      }, 520)
    }

    el.addEventListener('mousemove', onMove, { passive: true })
    el.addEventListener('mouseleave', onLeave)
    ;(el as HTMLElement & { __magneticOff?: () => void }).__magneticOff = (): void => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
      if (raf) cancelAnimationFrame(raf)
    }
  },
  unmounted(el): void {
    ;(el as HTMLElement & { __magneticOff?: () => void }).__magneticOff?.()
  },
}
