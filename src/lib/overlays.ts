/**
 * 全站互动基建（零侵入挂载，不改任何业务组件）：
 * 1) 开场 Preloader —— 五芒星描线 + 进度数字，一次会话只演一次
 * 2) 自定义光标 —— 外环滞后跟随 + 内点即时，悬停可点元素时放大
 * 3) 全局点击反馈委托 —— 首页模块卡 / 每日卡 / 星座芯片等被点时自动补音效与星屑
 * 触屏、prefers-reduced-motion 自动降级；不依赖任何框架生命周期。
 */
import { sfx } from './sfx'
import { sparkleFromEvent } from './sparkle'
import { locale } from './i18n'

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

/* ---------- 5. 离开彩蛋：切走标签页时标题喊你回来 + favicon 跟随月相 ---------- */
function installTabWitch(): void {
  const BASE_TITLE = document.title
  let swapped = false

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      document.title = ['✧ 牌还在桌上呢…', '✧ 星星等你回来', '✧ 别走呀，水晶球还亮着'][Math.floor(Math.random() * 3)]
    } else {
      document.title = BASE_TITLE
      sfx.blip()
    }
  })

  // favicon：按今日月相换一枚小月亮（8 相位）
  const applyFavicon = async (): Promise<void> => {
    if (swapped) return
    swapped = true
    try {
      const { moonPhase } = await import('./astrology')
      const idx = moonPhase().index
      // 用 emoji 绘制成 svg data-uri，无需美术资源
      const faces = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘']
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><text x="32" y="42" font-size="40" text-anchor="middle">${faces[idx] ?? '🌙'}</text></svg>`
      const link = document.querySelector<HTMLLinkElement>("link[rel*='icon']")
      if (link) link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`
    } catch { /* 静默 */ }
  }
  applyFavicon()
}

/* ---------- 6. 主题切换涟漪 + 导航转场音效 ---------- */
let lastMouseX = innerWidth / 2
let lastMouseY = innerHeight / 2

function installThemeRipple(): void {
  if (REDUCED) return
  window.addEventListener('mousemove', (e) => {
    lastMouseX = e.clientX
    lastMouseY = e.clientY
  }, { passive: true })

  const mo = new MutationObserver(() => {
    const el = document.createElement('div')
    el.className = 'wo-theme-ripple'
    el.style.left = `${lastMouseX}px`
    el.style.top = `${lastMouseY}px`
    document.body.appendChild(el)
    window.setTimeout(() => el.remove(), 1000)
    sfx.whoosh()
  })
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
}

function installNavSfx(): void {
  document.addEventListener('click', (e) => {
    const target = e.target as Element | null
    if (target?.closest?.('.site-nav a')) sfx.whoosh()
  }, { passive: true })
}

/* ---------- 7. 滚动速度倾斜（快速滚动时内容轻微斜切，awwwards 手感） ---------- */
function installScrollSkew(): void {
  if (REDUCED || !FINE) return
  // 只斜切内容区 <main>；#app 里含 fixed 星野层，transform 会产生新的包含块导致其失效
  const app = document.querySelector('main')
  if (!app) return

  let lastY = window.scrollY
  let skew = 0
  let rafId = 0
  let ticking = false

  const loop = (): void => {
    const y = window.scrollY
    const delta = y - lastY
    lastY = y
    // 速度 → 目标倾斜角，限幅 ±2.2deg
    const target = Math.max(-2.2, Math.min(2.2, delta * 0.06))
    skew += (target - skew) * 0.12
    if (Math.abs(skew) < 0.01 && delta === 0) {
      app.style.transform = ''
      ticking = false
      return
    }
    app.style.transform = `skewY(${skew.toFixed(3)}deg)`
    rafId = requestAnimationFrame(loop)
  }
  const kick = (): void => {
    if (!ticking) {
      ticking = true
      rafId = requestAnimationFrame(loop)
    }
  }
  window.addEventListener('scroll', kick, { passive: true })
  window.addEventListener('beforeunload', () => cancelAnimationFrame(rafId))
}

/* ---------- 8. 鼠标揭幕：光标是一盏灯，照亮藏在页面里的星语（mouse reveal） ---------- */
function installMouseReveal(): void {
  if (!FINE || REDUCED) return

  const GLYPHS = ['✦', '✧', '⋆', '☽', '☉', '☿', '♀', '♃', '♄', '♆', '♇', '☄']
  // 聚光灯下才会浮现的「星语」：每次加载随机撒位置
  const SECRETS = ['今天也值得星星', '答案在路上', '好运已发货', '别急，月亮也在赶路', '你被记挂着一整晚']

  const layer = document.createElement('div')
  layer.className = 'wo-reveal'
  layer.setAttribute('aria-hidden', 'true')

  let html = ''
  for (let i = 0; i < 22; i++) {
    const g = GLYPHS[i % GLYPHS.length]!
    const left = (Math.random() * 94 + 2).toFixed(1)
    const top = (Math.random() * 92 + 3).toFixed(1)
    const size = (0.7 + Math.random() * 1.5).toFixed(2)
    const dur = (6 + Math.random() * 9).toFixed(1)
    const blur = Math.random() < 0.4 ? 'filter:blur(1px);' : ''
    html += `<i style="left:${left}vw;top:${top}vh;font-size:${size}rem;animation-duration:${dur}s;${blur}">${g}</i>`
  }
  for (const s of SECRETS) {
    const left = (Math.random() * 80 + 6).toFixed(1)
    const top = (Math.random() * 86 + 6).toFixed(1)
    const dur = (8 + Math.random() * 6).toFixed(1)
    html += `<b style="left:${left}vw;top:${top}vh;animation-duration:${dur}s">${s}</b>`
  }
  layer.innerHTML = html

  const style = document.createElement('style')
  style.id = 'wo-mouse-reveal-style'
  style.textContent = `
    .wo-reveal {
      position: fixed; inset: 0; z-index: 40; pointer-events: none;
      mix-blend-mode: screen; opacity: 0;
      transition: opacity .5s ease;
      -webkit-mask-image: radial-gradient(circle var(--wo-r,200px) at var(--wo-mx,-600px) var(--wo-my,-600px), rgba(0,0,0,.95), transparent 72%);
      mask-image: radial-gradient(circle var(--wo-r,200px) at var(--wo-mx,-600px) var(--wo-my,-600px), rgba(0,0,0,.95), transparent 72%);
    }
    .wo-reveal.on { opacity: .8; }
    .wo-reveal i, .wo-reveal b {
      position: absolute; color: var(--gold-bright, #ffd76e); font-style: normal; font-weight: 600;
      text-shadow: 0 0 12px rgba(255,215,110,.55);
      font-family: var(--cute, inherit); white-space: nowrap;
      animation: wo-drift ease-in-out infinite alternate;
    }
    .wo-reveal b { font-size: .82rem; letter-spacing: .18em; opacity: .92; }
    @keyframes wo-drift {
      from { transform: translate(0,0) rotate(-4deg); }
      to   { transform: translate(10px,-14px) rotate(5deg); }
    }`
  document.head.appendChild(style)
  document.body.appendChild(layer)

  let mx = -600
  let my = -600
  let dirty = false
  const loop = (): void => {
    if (dirty) {
      layer.style.setProperty('--wo-mx', `${mx}px`)
      layer.style.setProperty('--wo-my', `${my}px`)
      layer.classList.add('on')
      dirty = false
    }
    requestAnimationFrame(loop)
  }
  window.addEventListener('mousemove', (e) => {
    mx = e.clientX
    my = e.clientY
    dirty = true
  }, { passive: true })
  document.documentElement.addEventListener('mouseleave', () => {
    layer.classList.remove('on')
    layer.style.setProperty('--wo-mx', '-600px')
    layer.style.setProperty('--wo-my', '-600px')
  })
  requestAnimationFrame(loop)
}

/* ---------- 9. 长按露娜彩蛋：按住首页水晶卡的头像 600ms，她会跟你说句悄悄话 ---------- */
const LUNA_WHISPERS: Array<[string, string]> = [
  ['牌不骗人，人才骗自己。', 'Cards never lie. People do.'],
  ['今晚早点睡，星星也要下班的。', 'Sleep early tonight. Even the stars clock out.'],
  ['怕什么，最坏也不过是重洗一次。', 'Worst case? We reshuffle.'],
  ['今天的风不错，适合把那句话说出口。', 'Good air today — go say the thing.'],
  ['你被记挂着一整晚，知道吗。', 'You were on someone\'s mind all night. Just so you know.'],
]

function installLunaPress(): void {
  if (REDUCED) return

  const style = document.createElement('style')
  style.id = 'wo-luna-press-style'
  style.textContent = `
    .wo-luna-whisper {
      position: fixed; z-index: 60; pointer-events: none;
      font-family: var(--cute, inherit); color: #fff;
      background: rgba(30, 26, 69, .92);
      border: 2px solid var(--gold, #ffd76e);
      border-radius: 12px 12px 12px 3px;
      padding: 8px 14px; font-size: .9rem; line-height: 1.6;
      max-width: min(260px, 72vw);
      transform: translate(-50%, -130%);
      box-shadow: 0 8px 24px rgba(0, 0, 0, .45);
      animation: wo-whisper-in .35s cubic-bezier(.34, 1.56, .64, 1);
    }
    .wo-luna-whisper.out { transition: opacity .4s ease, transform .4s ease; opacity: 0; transform: translate(-50%, -165%); }
    @keyframes wo-whisper-in { from { opacity: 0; transform: translate(-50%, -110%) scale(.7); } }`
  document.head.appendChild(style)

  let timer = 0
  let ox = 0
  let oy = 0

  const clear = (): void => {
    if (timer) {
      window.clearTimeout(timer)
      timer = 0
    }
  }

  document.addEventListener('contextmenu', (e) => {
    if ((e.target as Element | null)?.closest?.('.luna-face')) e.preventDefault()
  })

  document.addEventListener('pointerdown', (e) => {
    if (!(e.target as Element | null)?.closest?.('.luna-face')) return
    ox = e.clientX
    oy = e.clientY
    clear()
    timer = window.setTimeout(() => {
      timer = 0
      const pair = LUNA_WHISPERS[Math.floor(Math.random() * LUNA_WHISPERS.length)]!
      const el = document.createElement('div')
      el.className = 'wo-luna-whisper'
      el.textContent = locale.value === 'zh' ? pair[0] : pair[1]
      el.style.left = `${Math.min(Math.max(ox, 90), innerWidth - 90)}px`
      el.style.top = `${Math.max(oy, 80)}px`
      document.body.appendChild(el)
      sparkleFromEvent(e, 10)
      sfx.ding()
      window.setTimeout(() => el.classList.add('out'), 2200)
      window.setTimeout(() => el.remove(), 2700)
    }, 600)
  }, { passive: true })

  const cancel = (e: PointerEvent): void => {
    if (!timer) return
    if (e.pointerType !== 'mouse' && Math.hypot(e.clientX - ox, e.clientY - oy) > 18) clear()
    else if (e.type !== 'pointermove') clear()
  }
  ;['pointermove', 'pointerup', 'pointercancel'].forEach((name) =>
    document.addEventListener(name, cancel as EventListener, { passive: true }),
  )
}

/* ---------- 10. 卡片悬停显影：光标在卡面内游走时亮起一盏随行小灯 ---------- */
function installCardSpotlight(): void {
  if (!FINE || REDUCED) return
  const SEL =
    '.oracle-card,.lib-card,.daily-card,.omen-box,.pattern-card,.hist-item,.transit-item,.pet-card,.mem-card'
  const style = document.createElement('style')
  style.id = 'wo-spotlight-style'
  style.textContent = `
    ${SEL} { position: relative; }
    ${SEL}::after {
      content: '';
      position: absolute; inset: 0;
      border-radius: inherit;
      pointer-events: none;
      opacity: 0;
      transition: opacity .3s ease;
      background: radial-gradient(210px circle at var(--wo-sx, 50%) var(--wo-sy, 50%),
        color-mix(in srgb, var(--gold, #ffd76e) 15%, transparent), transparent 62%);
      mix-blend-mode: screen;
    }
    ${SEL}:hover::after { opacity: 1; }`
  document.head.appendChild(style)

  let pending: HTMLElement | null = null
  let px = 0
  let py = 0
  let raf = 0
  const flush = (): void => {
    raf = 0
    if (!pending) return
    const r = pending.getBoundingClientRect()
    pending.style.setProperty('--wo-sx', `${px - r.left}px`)
    pending.style.setProperty('--wo-sy', `${py - r.top}px`)
    pending = null
  }
  document.addEventListener('pointermove', (e) => {
    const t = ((e.target as Element | null)?.closest?.(SEL) ?? null) as HTMLElement | null
    if (!t) return
    pending = t as HTMLElement
    px = e.clientX
    py = e.clientY
    if (!raf) raf = requestAnimationFrame(flush)
  }, { passive: true })
}

/** main.ts 里调用一次 */
export function installOverlays(): void {
  if (typeof document === 'undefined') return
  installPreloader()
  installCursor()
  installClickFeedback()
  installScrollReveal()
  installTabWitch()
  installThemeRipple()
  installNavSfx()
  installScrollSkew()
  installMouseReveal()
  installLunaPress()
  installCardSpotlight()
}
