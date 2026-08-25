/**
 * 全站互动基建（零侵入挂载，不改任何业务组件）：
 * 1) 开场 Preloader —— 五芒星描线 + 进度数字，一次会话只演一次
 * 2) 自定义光标 —— 外环滞后跟随 + 内点即时，悬停可点元素时放大
 * 3) 全局点击反馈委托 —— 首页模块卡 / 每日卡 / 星座芯片等被点时自动补音效与星屑
 * 触屏、prefers-reduced-motion 自动降级；不依赖任何框架生命周期。
 */
import { sfx } from './sfx'
import { sparkleFromEvent } from './sparkle'

const REDUCED =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const FINE =
  typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches

/* ---------- 1. Preloader ---------- */
const PENTACLE_POINTS = Array.from({ length: 5 }, (_, i) => {
  const a = (-90 + i * 72) * (Math.PI / 180)
  return [50 + 34 * Math.cos(a), 50 + 34 * Math.sin(a)] as const
})
/** 五芒星画法路径：0→2→4→1→3→0 */
const STAR_PATH = [PENTACLE_POINTS[0], PENTACLE_POINTS[2], PENTACLE_POINTS[4], PENTACLE_POINTS[1], PENTACLE_POINTS[3], PENTACLE_POINTS[0]]
  .map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
  .join(' ')

function installPreloader(): void {
  if (REDUCED) return
  try {
    if (sessionStorage.getItem('wo.opened') === '1') return
  } catch { /* ignore */ }

  const el = document.createElement('div')
  el.id = 'wo-preloader'
  el.innerHTML = `
    <svg viewBox="0 0 100 100" width="120" height="120" aria-hidden="true">
      <circle cx="50" cy="50" r="44" fill="none" class="pl-circle"/>
      <path d="${STAR_PATH}" fill="none" class="pl-star"/>
    </svg>
    <span class="pl-pct">0%</span>`
  document.body.appendChild(el)

  const pct = el.querySelector('.pl-pct') as HTMLSpanElement
  const start = performance.now()
  const DUR = 1500
  let raf = 0
  const tick = (): void => {
    const t = Math.min(1, (performance.now() - start) / DUR)
    // 缓出曲线，结尾减速更有仪式感
    const eased = 1 - Math.pow(1 - t, 2.2)
    pct.textContent = `${Math.round(eased * 100)}%`
    if (t < 1) {
      raf = requestAnimationFrame(tick)
    } else {
      finish()
    }
  }
  let done = false
  const finish = (): void => {
    if (done) return
    done = true
    cancelAnimationFrame(raf)
    el.classList.add('pl-done')
    window.setTimeout(() => el.remove(), 700)
    try {
      sessionStorage.setItem('wo.opened', '1')
    } catch { /* ignore */ }
  }
  el.addEventListener('click', finish)
  raf = requestAnimationFrame(tick)
}

/* ---------- 2. 自定义光标 ---------- */
function installCursor(): void {
  if (!FINE || REDUCED) return

  const ring = document.createElement('div')
  ring.className = 'wo-cursor-ring'
  const dot = document.createElement('div')
  dot.className = 'wo-cursor-dot'
  document.body.append(ring, dot)
  document.documentElement.classList.add('wo-cursor-on')

  let mx = innerWidth / 2
  let my = innerHeight / 2
  let rx = mx
  let ry = my
  let scale = 1
  let targetScale = 1
  let visible = false

  const onMove = (e: MouseEvent): void => {
    mx = e.clientX
    my = e.clientY
    if (!visible) {
      visible = true
      rx = mx
      ry = my
      ring.style.opacity = '1'
      dot.style.opacity = '1'
    }
    const t = e.target as Element | null
    const interactive = !!t?.closest?.(
      'a, button, .btn, .hour-cell, .oracle-card, .daily-card, .zodiac-chip, [role="button"]',
    )
    targetScale = interactive ? 2.1 : 1
  }
  const onLeave = (): void => {
    visible = false
    ring.style.opacity = '0'
    dot.style.opacity = '0'
  }
  const loop = (): void => {
    rx += (mx - rx) * 0.16
    ry += (my - ry) * 0.16
    scale += (targetScale - scale) * 0.18
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%) scale(${scale.toFixed(3)})`
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`
    requestAnimationFrame(loop)
  }
  window.addEventListener('mousemove', onMove, { passive: true })
  document.documentElement.addEventListener('mouseleave', onLeave)
  requestAnimationFrame(loop)
}

/* ---------- 3. 全局点击反馈委托 ---------- */
const FEEDBACK_SELECTOR = [
  '.oracle-card',
  '.daily-card',
  '.zodiac-chip',
  '.lib-card',
  '.hist-item',
  '.transit-item',
  '.omen-box',
  '.pattern-card',
].join(',')

function installClickFeedback(): void {
  document.addEventListener('click', (e) => {
    const target = e.target as Element | null
    if (!target?.closest?.(FEEDBACK_SELECTOR)) return
    sparkleFromEvent(e, 6)
    // 声音开关由 sfx 内部判断；未开启时 blip 是静默的
    sfx.blip()
  }, { passive: true })
}

/* ---------- 4. 滚动编排：面板进入视口时自动浮现 ---------- */
function installScrollReveal(): void {
  if (REDUCED || !('IntersectionObserver' in window)) return

  const style = document.createElement('style')
  style.id = 'wo-reveal-style'
  style.textContent = `
    .panel[data-wo-reveal]:not(.wo-in) { opacity: 0; transform: translateY(22px); }
    .panel[data-wo-reveal].wo-in {
      opacity: 1; transform: none;
      transition: opacity 0.55s ease, transform 0.6s cubic-bezier(0.34, 1.3, 0.64, 1);
      transition-delay: var(--wo-d, 0ms);
    }`
  document.head.appendChild(style)

  const io = new IntersectionObserver(
    (entries) => {
      let i = 0
      for (const en of entries) {
        if (!en.isIntersecting) continue
        const el = en.target as HTMLElement
        // 同批进入的面板做 60ms 级联
        el.style.setProperty('--wo-d', `${i * 60}ms`)
        el.classList.add('wo-in')
        io.unobserve(el)
        i++
      }
    },
    { threshold: 0.08, rootMargin: '0px 0px -30px 0px' },
  )

  const observe = (): void => {
    document.querySelectorAll('.panel:not([data-wo-reveal])').forEach((el) => {
      // 已在首屏内的直接放行，避免开场闪隐
      const r = el.getBoundingClientRect()
      if (r.top < innerHeight && r.bottom > 0) return
      el.setAttribute('data-wo-reveal', '')
      io.observe(el)
    })
  }

  observe()
  // 兜底：动态插入的面板（占卜结果等）每 1.2s 补录一次
  window.setInterval(observe, 1200)
}

/** main.ts 里调用一次 */
export function installOverlays(): void {
  if (typeof document === 'undefined') return
  installPreloader()
  installCursor()
  installClickFeedback()
  installScrollReveal()
}
