/** 星屑粒子特效：在页面任意位置爆出小星星 */

export function sparkle(x: number, y: number, count = 8): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span')
    el.className = 'sparkle-particle'
    el.textContent = pickGlyph()
    const size = 8 + Math.random() * 8
    el.style.left = `${x}px`
    el.style.top = `${y}px`
    el.style.fontSize = `${size}px`
    el.style.setProperty('--dx', `${(Math.random() - 0.5) * 140}px`)
    el.style.setProperty('--dy', `${-30 - Math.random() * 100}px`)
    el.style.setProperty('--rot', `${(Math.random() - 0.5) * 540}deg`)
    el.style.animationDelay = `${Math.random() * 0.12}s`
    document.body.appendChild(el)
    window.setTimeout(() => el.remove(), 1100)
  }
}

export function sparkleFromEvent(e: { clientX: number; clientY: number }, count = 8): void {
  sparkle(e.clientX, e.clientY, count)
}

function pickGlyph(): string {
  const glyphs = ['✦', '✧', '⭐', '⋆', '˚']
  return glyphs[Math.floor(Math.random() * glyphs.length)]!
}
