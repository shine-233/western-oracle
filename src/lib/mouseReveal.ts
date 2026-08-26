/**
 * 鼠标显影（Mouse Reveal）：光标处显影一层隐藏星屑。
 * - 桌面：跟随 pointer；移动端：跟随触摸拖动
 * - prefers-reduced-motion 或 save-data 时自动关闭
 * 由 main.ts 调用 installMouseReveal() 挂载，零模板侵入。
 */

export function installMouseReveal(): void {
  if (typeof document === 'undefined') return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return

  const layer = document.createElement('div')
  layer.className = 'mouse-reveal-layer'
  layer.setAttribute('aria-hidden', 'true')

  // 星尘纹理：多层细密径向点
  let dots = ''
  let seed = 7
  const rand = (): number => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  for (let i = 0; i < 130; i++) {
    const x = rand() * 100
    const y = rand() * 100
    const r = 0.6 + rand() * 1.4
    const c = rand() < 0.55 ? 'var(--gold)' : rand() < 0.5 ? 'var(--pink)' : 'var(--lavender)'
    dots += `radial-gradient(${r.toFixed(2)}px ${r.toFixed(2)}px at ${x.toFixed(1)}% ${y.toFixed(1)}%, ${c}, transparent 100%)${i < 129 ? ',' : ''}`
  }
  layer.style.backgroundImage = dots

  const style = document.createElement('style')
  style.textContent = `
.mouse-reveal-layer{
  /* 层叠契约：本层 z-index:-1 + pointer-events:none ——
     星尘藏在面板之下、页面底色之上，光标扫过面板间隙时"显影"。
     -1 保证永不遮挡任何交互与浮层（弹窗 z2000 / 学徒弹幕 z9400 /
     CRT 覆层 z9990 / 进度条 z9999）；body 需保持透明或半透明底，
     若给 body 加不透明背景会盖住本层。改层级前先核对这些浮层。 */
  position:fixed; inset:0; z-index:-1; pointer-events:none;
  opacity:0; transition:opacity .6s ease;
  -webkit-mask-image:radial-gradient(circle var(--mr-r,170px) at var(--mr-x,-500px) var(--mr-y,-500px), #000 30%, transparent 75%);
  mask-image:radial-gradient(circle var(--mr-r,170px) at var(--mr-x,-500px) var(--mr-y,-500px), #000 30%, transparent 75%);
}
@media (pointer:coarse){ .mouse-reveal-layer{ --mr-r:120px; } }
`
  document.head.append(style)
  document.body.append(layer)

  let raf = 0
  let px = -500
  let py = -500
  const apply = (): void => {
    raf = 0
    layer.style.setProperty('--mr-x', `${px}px`)
    layer.style.setProperty('--mr-y', `${py}px`)
  }
  const onMove = (e: PointerEvent): void => {
    px = e.clientX
    py = e.clientY
    layer.style.opacity = '1'
    if (!raf) raf = requestAnimationFrame(apply)
  }
  const onLeave = (): void => {
    layer.style.opacity = '0'
  }
  window.addEventListener('pointermove', onMove, { passive: true })
  window.addEventListener('pointerdown', onMove, { passive: true })
  document.addEventListener('pointerleave', onLeave)
  window.addEventListener('blur', onLeave)
}
