/**
 * 滚动入场显现指令（对标 GSAP ScrollTrigger 的 in-view reveal 模式）。
 * 用法：v-reveal 或 v-reveal="2"（级联序号，每个 +90ms 延迟）。
 * 元素进入视口后加 .revealed 并停止观察；尊重 prefers-reduced-motion。
 * 样式由本文件注入，不污染全局样式表。
 */
import type { Directive } from 'vue'

let observer: IntersectionObserver | null = null
let styleInjected = false

function injectStyle(): void {
  if (styleInjected) return
  styleInjected = true
  const tag = document.createElement('style')
  tag.textContent = `
.reveal-pending {
  opacity: 0;
  transform: translateY(26px) scale(0.985);
}
.revealed {
  opacity: 1;
  transform: none;
  transition:
    opacity 0.65s cubic-bezier(0.22, 0.61, 0.36, 1),
    transform 0.7s cubic-bezier(0.34, 1.3, 0.64, 1);
}
@media (prefers-reduced-motion: reduce) {
  .reveal-pending { opacity: 1; transform: none; }
  .revealed { transition: none; }
}
`
  document.head.appendChild(tag)
}

function getObserver(): IntersectionObserver {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('revealed')
          entry.target.classList.remove('reveal-pending')
          observer?.unobserve(entry.target)
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -36px 0px' },
    )
  }
  return observer
}

export const vReveal: Directive<HTMLElement, number | undefined> = {
  mounted(el, binding): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    injectStyle()
    el.classList.add('reveal-pending')
    const order = typeof binding.value === 'number' ? binding.value : -1
    if (order > 0) el.style.transitionDelay = `${Math.min(order * 90, 720)}ms`
    getObserver().observe(el)
  },
  unmounted(el): void {
    observer?.unobserve(el)
  },
}
