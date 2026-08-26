/**
 * 全员巡游彩蛋：2 秒内连点顶部站牌 5 次，
 * 露娜与七位学徒排成一队从右往左横穿屏幕底部，各自举着招牌 emoji。
 * 自包含：自带样式与 DOM，退出即清理。
 */
import { sfx } from './sfx'

const CREW: Array<{ glyph: string; name: string; color: string }> = [
  { glyph: '🧙‍♀️', name: '露娜', color: '#b3a6f7' },
  { glyph: '✦', name: '墨墨', color: '#f5c86e' },
  { glyph: '☉', name: '阿斯特拉', color: '#7dd3fc' },
  { glyph: '∴', name: 'Numi', color: '#7de8c3' },
  { glyph: 'ᛟ', name: 'Runa', color: '#a8a29e' },
  { glyph: '☍', name: 'Cupie', color: '#ff9fce' },
  { glyph: '☄️', name: 'Comet', color: '#ffd76e' },
  { glyph: '🔮', name: 'Mist', color: '#c9b8e8' },
]

let clicks = 0
let firstAt = 0
let running = false

export function installParadeEgg(): void {
  const brand = document.querySelector('.brand')
  if (!brand) return
  brand.addEventListener('click', () => {
    const now = Date.now()
    if (now - firstAt > 2000) {
      clicks = 0
      firstAt = now
    }
    clicks++
    if (clicks >= 5 && !running) {
      clicks = 0
      runParade()
    }
  })
}

function runParade(): void {
  running = true
  sfx.whoosh()
  const layer = document.createElement('div')
  layer.style.cssText =
    'position:fixed;inset:auto 0 0 0;z-index:9500;pointer-events:none;height:120px;overflow:hidden;'
  const strip = document.createElement('div')
  strip.style.cssText =
    'position:absolute;top:26px;left:100%;display:flex;gap:34px;align-items:flex-end;will-change:transform;'
  for (const [i, m] of CREW.entries()) {
    const fig = document.createElement('div')
    fig.style.cssText = `display:flex;flex-direction:column;align-items:center;gap:4px;animation:parade-hop ${1 + (i % 3) * 0.17}s ease-in-out ${i * 0.09}s infinite;`
    fig.innerHTML = `<span style="font-size:30px;filter:drop-shadow(0 0 10px ${m.color})">${m.glyph}</span>` +
      `<span style="font-size:11px;font-family:'ZCOOL KuaiLe',sans-serif;color:${m.color};text-shadow:0 0 8px ${m.color}66">${m.name}</span>`
    strip.appendChild(fig)
  }
  const style = document.createElement('style')
  style.textContent =
    '@keyframes parade-hop{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}' +
    '@keyframes parade-roll{to{transform:translateX(calc(-100vw - 620px))}}'
  strip.style.animation = 'parade-roll 9s linear forwards'
  layer.appendChild(style)
  layer.appendChild(strip)
  document.body.appendChild(layer)
  window.setTimeout(() => {
    layer.remove()
    running = false
    sfx.ding()
  }, 9200)
}
