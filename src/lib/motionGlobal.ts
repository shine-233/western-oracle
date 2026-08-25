/**
 * 全站动效引擎：一次安装，覆盖所有模块（含未来新增页面）。
 * - 滚动显现：MutationObserver 监听全文档，自动为进入视口的 .panel / 卡片
 *   加 reveal 动画（已带入场动画类的不重复处理）
 * - 磁吸按钮：事件委托，所有 .btn 悬浮时轻微吸向指针
 * - 入场幕帘：像素星光加载幕布，资源就绪后揭开（awwwards 式开场）
 * 全部尊重 prefers-reduced-motion；纯 DOM 实现，不侵入任何视图文件。
 */

const ENTRANCE_CLASSES = ['stagger-in', 'bounce-in', 'reveal-pending', 'revealed', 'page-enter-active']
let installed = false

function reducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/* ---------- 1. 滚动显现 ---------- */
let io: IntersectionObserver | null = null
const handled = new WeakSet<Element>()

function ensureRevealStyles(): void {
  if (document.getElementById('wo-motion-styles')) return
  const tag = document.createElement('style')
  tag.id = 'wo-motion-styles'
  tag.textContent = `
.wo-auto-reveal { opacity: 0; transform: translateY(22px); }
.wo-auto-revealed {
  opacity: 1;
  transform: none;
  transition: opacity .6s cubic-bezier(.22,.61,.36,1), transform .68s cubic-bezier(.34,1.3,.64,1);
}
@media (prefers-reduced-motion: reduce) {
  .wo-auto-reveal { opacity: 1; transform: none; }
}
`
  document.head.appendChild(tag)
}

function observeEl(el: Element): void {
  if (handled.has(el)) return
  // 已有自带入场动画的元素不重复处理
  if (ENTRANCE_CLASSES.some((c) => el.classList.contains(c))) return
  handled.add(el)
  el.classList.add('wo-auto-reveal')
  io?.observe(el)
}

function scan(root: ParentNode): void {
  root.querySelectorAll?.('.panel:not(header .panel)').forEach(observeEl)
}

function installAutoReveal(): void {
  if (reducedMotion()) return
  ensureRevealStyles()
  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        const el = e.target as HTMLElement
        el.classList.add('wo-auto-revealed')
        el.classList.remove('wo-auto-reveal')
        io?.unobserve(el)
      }
    },
    { threshold: 0.08, rootMargin: '0px 0px -30px 0px' },
  )
  scan(document.body)
  // 路由切换后新挂载的面板自动纳入
  new MutationObserver((muts) => {
    for (const m of muts) {
      m.addedNodes.forEach((n) => {
        if (!(n instanceof HTMLElement)) return
        if (n.classList.contains('panel')) observeEl(n)
        scan(n)
      })
    }
  }).observe(document.body, { childList: true, subtree: true })
}

/* ---------- 2. 磁吸按钮（委托版） ---------- */
function installAutoMagnetic(): void {
  if (!window.matchMedia('(pointer: fine)').matches || reducedMotion()) return
  let raf = 0
  let active: HTMLElement | null = null

  document.addEventListener(
    'pointermove',
    (e) => {
      if (!active) return
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        if (!active) return
        const me = e as MouseEvent
        const rect = active.getBoundingClientRect()
        const dx = me.clientX - (rect.left + rect.width / 2)
        const dy = me.clientY - (rect.top + rect.height / 2)
        active.style.transform = `translate(${dx * 0.16}px, ${dy * 0.16}px)`
      })
    },
    { passive: true },
  )

  document.addEventListener('pointerover', (e) => {
    const t = (e.target as HTMLElement)?.closest?.('.btn') as HTMLElement | null
    if (t && t !== active) {
      active?.style.setProperty('transform', '')
      active = t.classList.contains('no-magnet') ? null : t
      if (active) active.style.transition = 'transform .18s ease-out'
    }
  })

  document.addEventListener('pointerout', (e) => {
    const t = (e.target as HTMLElement)?.closest?.('.btn') as HTMLElement | null
    if (t && t === active) {
      t.style.transition = 'transform .5s cubic-bezier(.34,1.56,.64,1)'
      t.style.transform = 'translate(0,0)'
      window.setTimeout(() => {
        t.style.transition = ''
        t.style.transform = ''
      }, 520)
      active = null
    }
  })
}

/* ---------- 3. 入场幕帘 ---------- */
function installCurtain(): void {
  if (sessionStorage.getItem('wo-intro-done') || reducedMotion()) {
    sessionStorage.setItem('wo-intro-done', '1')
    return
  }
  sessionStorage.setItem('wo-intro-done', '1')
  const veil = document.createElement('div')
  veil.id = 'wo-curtain'
  veil.innerHTML = `
    <div class="wc-inner">
      <div class="wc-sigil">✦</div>
      <div class="wc-title">WESTERN ORACLE</div>
      <div class="wc-stars"><i></i><i></i><i></i><i></i><i></i></div>
    </div>`
  const style = document.createElement('style')
  style.textContent = `
#wo-curtain {
  position: fixed; inset: 0; z-index: 99999;
  display: grid; place-items: center;
  background:
    radial-gradient(800px 400px at 50% 30%, rgba(107,91,214,.25), transparent 60%),
    linear-gradient(170deg, #151232 0%, #0d0b20 70%);
  transition: opacity .6s ease, visibility .6s;
}
#wo-curtain.wc-hide { opacity: 0; visibility: hidden; pointer-events: none; }
.wc-inner { text-align: center; }
.wc-sigil {
  font-size: 3rem; color: #f5c86e;
  animation: wc-breathe 1.4s ease-in-out infinite;
  filter: drop-shadow(0 0 18px rgba(245,200,110,.7));
}
@keyframes wc-breathe { 50% { transform: scale(1.25) rotate(180deg); } }
.wc-title {
  margin-top: 14px; font-family: 'Press Start 2P', monospace;
  font-size: .62rem; letter-spacing: .35em; color: #b3a6f7;
}
.wc-stars { margin-top: 18px; display: flex; justify-content: center; gap: 9px; }
.wc-stars i {
  width: 6px; height: 6px; border-radius: 50%;
  background: #ffe3a8; animation: wc-dot 1s ease-in-out infinite;
}
.wc-stars i:nth-child(2) { animation-delay: .12s; background: #ff9fce; }
.wc-stars i:nth-child(3) { animation-delay: .24s; }
.wc-stars i:nth-child(4) { animation-delay: .36s; background: #ff9fce; }
.wc-stars i:nth-child(5) { animation-delay: .48s; }
@keyframes wc-dot { 50% { transform: translateY(-8px); opacity: .45; } }
@media (prefers-reduced-motion: reduce) {
  .wc-sigil, .wc-stars i { animation: none; }
}
`
  document.head.appendChild(style)
  document.body.appendChild(veil)
  const hide = (): void => {
    veil.classList.add('wc-hide')
    window.setTimeout(() => veil.remove(), 700)
  }
  if (document.readyState === 'complete') window.setTimeout(hide, 500)
  else window.addEventListener('load', () => window.setTimeout(hide, 350))
  window.setTimeout(hide, 2200) // 兜底：最多 2.2s 必揭幕
}

/** 应用启动时调用一次（main.ts） */
export function installMotionGlobal(): void {
  if (installed) return
  installed = true
  installCurtain()
  installAutoReveal()
  installAutoMagnetic()
}
