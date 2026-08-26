/**
 * 学徒弹幕：任何模块完成占卜（addHistory 触发 wo-divination 事件）后，
 * 当值学徒的像素小人从右下角冒出一句现场点评。
 * 全局生效——包括未来新增的模块，零视图侵入。
 */
import { APPRENTICES, type MoodKey } from '../data/apprenticeProfiles'
import { MASCOTS, mascotVoxels } from '../data/mascots'
import { MODULE_APPRENTICE } from './reactMood'
import { locale } from './i18n'

let installed = false
let styleInjected = false

const MOOD_FACE: Record<MoodKey, string> = { great: '🌟', good: '🌤️', meh: '🌫️', oops: '🌧️' }

function injectStyles(): void {
  if (styleInjected) return
  styleInjected = true
  const tag = document.createElement('style')
  tag.textContent = `
.rp-wrap {
  position: fixed; left: 18px; bottom: 18px; z-index: 9400;
  display: flex; align-items: flex-end; gap: 10px;
  max-width: min(88vw, 380px);
  animation: rp-in .45s cubic-bezier(.34,1.56,.64,1);
}
@keyframes rp-in {
  from { opacity: 0; transform: translateY(16px) scale(.92); }
}
.rp-sprite {
  width: 58px; flex-shrink: 0; image-rendering: pixelated;
  filter: drop-shadow(0 3px 8px rgba(0,0,0,.4));
}
.rp-bubble {
  position: relative;
  background: rgba(30,26,69,.92);
  border: 2px solid var(--ac, #f5c86e);
  border-radius: 12px; border-bottom-right-radius: 4px;
  padding: 8px 12px 9px;
  box-shadow: 0 10px 30px rgba(0,0,0,.5);
}
.rp-head {
  font-family: var(--cute); color: var(--gold-bright); font-size: .85rem;
}
.rp-line { margin: 2px 0 0; line-height: 1.65; color: var(--ink,#f0edfb); font-size: .85rem; }
.rp-out { opacity: 0; transform: translateY(10px); transition: all .3s ease; }
/* 小屏：抬到露娜(z1000)与回到顶部(z1100)上方错开，且收窄气泡避免盖住弹窗内容 */
@media (max-width: 560px) {
  .rp-wrap { left: 10px; right: auto; bottom: 96px; max-width: min(74vw, 420px); }
  .rp-sprite { width: 46px; }
}
@media (prefers-reduced-motion: reduce) { .rp-wrap { animation: none; } }
`
  document.head.appendChild(tag)
}

/** 从摘要文本猜情绪（关键词 + 分数） */
function moodFromSummary(s: string): MoodKey {
  if (/daikichi|大吉|master|大师数|满分|perfect/i.test(s)) return 'great'
  if (/\b(kyo|凶)\b|失败|翻车|error/i.test(s)) return 'oops'
  const m = s.match(/(\d{1,3})\s*\/\s*100|指数\s*(\d{1,3})/)
  const score = Number(m?.[1] ?? m?.[2] ?? NaN)
  if (!Number.isNaN(score)) {
    if (score >= 78) return 'great'
    if (score >= 55) return 'good'
    if (score >= 35) return 'meh'
    return 'oops'
  }
  const rev = (s.match(/逆位|倒转|reversed/gi) ?? []).length
  if (rev >= 3) return 'meh'
  // 稳定伪随机：多数给 good，少量 great/meh
  let h = 0
  for (const ch of s) h = (h * 31 + ch.codePointAt(0)!) >>> 0
  return h % 5 === 0 ? 'great' : h % 7 === 0 ? 'meh' : 'good'
}

function show(detail: { type?: string; label?: string; summary?: string }): void {
  injectStyles()
  const type = detail.type ?? ''
  const appId = MODULE_APPRENTICE[type] ?? 'cat'
  const who = APPRENTICES.find((a) => a.id === appId) ?? APPRENTICES[0]!
  const zh = locale.value === 'zh'
  const mood = moodFromSummary(`${detail.label ?? ''} ${detail.summary ?? ''}`)
  const line = who.moods[mood][zh ? 'zh' : 'en']

  document.querySelectorAll('.rp-wrap').forEach((el) => el.remove())

  const wrap = document.createElement('div')
  wrap.className = 'rp-wrap'
  wrap.style.setProperty('--ac', who.color)

  const sprite = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  sprite.setAttribute('class', 'rp-sprite')
  const def = MASCOTS[who.id]
  if (def) {
    const cols = Math.max(...def.sprite.map((r) => r.length))
    sprite.setAttribute('viewBox', `0 0 ${cols} ${def.sprite.length}`)
    const ns = 'http://www.w3.org/2000/svg'
    for (const v of mascotVoxels(def)) {
      const rect = document.createElementNS(ns, 'rect')
      rect.setAttribute('x', String(v.x + 0.03))
      rect.setAttribute('y', String(v.y + 0.03))
      rect.setAttribute('width', '0.94')
      rect.setAttribute('height', '0.94')
      rect.setAttribute('fill', v.color)
      sprite.appendChild(rect)
    }
  }

  const bubble = document.createElement('div')
  bubble.className = 'rp-bubble'
  bubble.innerHTML = `
    <div class="rp-head">${MOOD_FACE[mood]} ${zh ? who.nameZh : who.nameEn} <span style="font-family:var(--pixel);font-size:.42rem;color:var(--ink-dim);letter-spacing:.1em">${zh ? '现场点评' : 'LIVE'}</span></div>
    <p class="rp-line"></p>`
  bubble.querySelector('.rp-line')!.textContent = line

  wrap.appendChild(sprite)
  wrap.appendChild(bubble)
  document.body.appendChild(wrap)

  window.setTimeout(() => {
    wrap.classList.add('rp-out')
    window.setTimeout(() => wrap.remove(), 320)
  }, 4200)
}

/** 安装：监听全局占卜事件（history.ts 在每次 addHistory 时派发） */
export function installReactPopups(): void {
  if (installed) return
  installed = true
  window.addEventListener(
    'wo-divination',
    (e) => {
      const detail = (e as CustomEvent).detail as { type?: string; label?: string; summary?: string }
      show(detail ?? {})
    },
    { passive: true },
  )
}
