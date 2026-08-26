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
