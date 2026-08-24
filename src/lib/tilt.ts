import type { Directive } from 'vue'

/** v-tilt：鼠标跟随 3D 倾斜（建模感互动），可选最大角度 */
export const vTilt: Directive<HTMLElement, number | undefined> = {
  mounted(el, binding) {
    const max = binding.value ?? 9
    el.style.transition = 'transform 0.18s ease-out'
    el.style.willChange = 'transform'

    const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

    el.addEventListener('mousemove', (e) => {
      if (reduced()) return
      const r = el.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width - 0.5
      const py = (e.clientY - r.top) / r.height - 0.5
      el.style.transform = `perspective(620px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) translateY(-3px)`
    })
    el.addEventListener('mouseleave', () => {
      el.style.transform = ''
    })
  },
}
