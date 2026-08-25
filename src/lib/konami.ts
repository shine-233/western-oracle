/**
 * 彩蛋：科乐美秘技「上上下下左右左右BA」。
 * 触发后全屏落下星屑雨 + 弹出露娜悄悄话 toast + 8-bit 上扬音效。
 * 自包含样式注入，不依赖全局 CSS / i18n 词条。
 */
import { locale } from './i18n'
import { sfx } from './sfx'

const SEQ = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']

let styleInjected = false

function injectStyle(): void {
  if (styleInjected) return
  styleInjected = true
  const tag = document.createElement('style')
  tag.textContent = `
.konami-star {
  position: fixed;
  top: -4vh;
  z-index: 9500;
  pointer-events: none;
  animation: konami-fall linear forwards;
}
@keyframes konami-fall {
  to { transform: translateY(112vh) rotate(540deg); opacity: 0.15; }
}
.konami-toast {
  position: fixed;
  left: 50%;
  bottom: 5vh;
  transform: translateX(-50%) translateY(20px);
  z-index: 9600;
  max-width: min(92vw, 520px);
  padding: 14px 22px;
  background: rgba(13, 11, 32, 0.92);
  border: 2px solid var(--gold, #f5c86e);
  border-radius: 14px;
  color: var(--gold-bright, #ffe3a8);
  font-size: 0.95rem;
  line-height: 1.7;
  text-align: center;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.55), 0 0 22px rgba(245, 200, 110, 0.35);
  opacity: 0;
  transition: opacity 0.35s ease, transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.konami-toast.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
@media (prefers-reduced-motion: reduce) {
  .konami-star { display: none; }
  .konami-toast { transition: opacity 0.3s ease; }
}
`
  document.head.appendChild(tag)
}

function starRain(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const glyphs = ['✦', '✧', '⭐', '⋆', '˚', '☾']
  for (let i = 0; i < 56; i++) {
    const el = document.createElement('span')
    el.className = 'konami-star'
    el.textContent = glyphs[Math.floor(Math.random() * glyphs.length)]!
    el.style.left = `${Math.random() * 100}vw`
    el.style.fontSize = `${9 + Math.random() * 16}px`
    el.style.color = ['#f5c86e', '#ff9fce', '#b3a6f7', '#7de8c3'][Math.floor(Math.random() * 4)]!
    el.style.animationDuration = `${1.6 + Math.random() * 2.2}s`
    el.style.animationDelay = `${Math.random() * 1.4}s`
    document.body.appendChild(el)
    window.setTimeout(() => el.remove(), 5600)
  }
}

function toast(): void {
  const zh = locale.value === 'zh'
  const lines = zh
    ? '✨ 露娜：「你发现了星星的秘密通道！作为奖励，今晚的星空会替你保守一个愿望。」'
    : '✨ Luna: "You found the stars\' secret passage! As a reward, tonight\'s sky will keep one wish for you."'
  const el = document.createElement('div')
  el.className = 'konami-toast'
  el.setAttribute('role', 'status')
  el.textContent = lines
  document.body.appendChild(el)
  requestAnimationFrame(() => el.classList.add('show'))
  window.setTimeout(() => {
    el.classList.remove('show')
    window.setTimeout(() => el.remove(), 450)
  }, 4200)
}

/** 安装全局按键监听（幂等，仅应用启动时调用一次） */
export function installKonami(): void {
  let idx = 0
  window.addEventListener(
    'keydown',
    (e) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key
      idx = k === SEQ[idx] ? idx + 1 : k === SEQ[0] ? 1 : 0
      if (idx !== SEQ.length) return
      idx = 0
      injectStyle()
      starRain()
      toast()
      sfx.ding()
    },
    { passive: true },
  )
}
