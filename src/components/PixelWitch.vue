<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { sparkle } from '../lib/sparkle'
import { WITCH_PALETTE, WITCH_SPRITE } from '../data/witchSprite'

const PALETTE = WITCH_PALETTE
const SPRITE = WITCH_SPRITE

interface Pixel {
  x: number
  y: number
  fill: string
}

const pixels: Pixel[] = []
SPRITE.forEach((row, y) => {
  row.split('').forEach((ch, x) => {
    const fill = PALETTE[ch]
    if (fill) pixels.push({ x, y, fill })
  })
})

const CELL = 7
const WIDTH = 20 * CELL
const HEIGHT = SPRITE.length * CELL

const TIPS = [
  '星星今天也在偷偷看你哦 ✦',
  '抽牌之前，先深呼吸三次～',
  '月亮说：今晚适合许愿！',
  '别怕逆位，它只是换了个角度爱你。',
  '命运之轮转动时，记得抓稳帽子！',
  '今天的宇宙快递已送达，请注意查收～',
  '塔罗不会告诉你结局，只会照亮岔路口。',
  '水逆怕什么，我们还有星星护体！',
  '悄悄说：点我旁边的星星有惊喜。',
  '你比星盘上写的还要好一点点。',
  '符文袋今天特别吵，想去看看吗？',
  '占星不是宿命，是天气预报～',
  '记得给梦想浇水，巫女我看着呢！',
  '呼——今天也拜托你多关照啦！',
]

const visible = ref(false)
const bubbleOpen = ref(false)
const typedText = ref('')
let typeTimer: number | null = null
let closeTimer: number | null = null
let chatterTimer: number | null = null

function say(text: string): void {
  if (typeTimer !== null) window.clearInterval(typeTimer)
  if (closeTimer !== null) window.clearTimeout(closeTimer)
  bubbleOpen.value = true
  typedText.value = ''
  let i = 0
  typeTimer = window.setInterval(() => {
    i++
    typedText.value = text.slice(0, i)
    if (i >= text.length && typeTimer !== null) {
      window.clearInterval(typeTimer)
      typeTimer = null
      closeTimer = window.setTimeout(() => (bubbleOpen.value = false), 4200)
    }
  }, 45)
}

function onClick(event: MouseEvent): void {
  say(TIPS[Math.floor(Math.random() * TIPS.length)]!)
  sparkle(event.clientX, event.clientY, 10)
}

onMounted(() => {
  window.setTimeout(() => (visible.value = true), 600)
  window.setTimeout(() => say('嗨！我是小巫女露娜，点我可以听星星的悄悄话～'), 1600)
  // 定时自言自语
  chatterTimer = window.setInterval(() => {
    if (!bubbleOpen.value) say(TIPS[Math.floor(Math.random() * TIPS.length)]!)
  }, 42000)
})

onBeforeUnmount(() => {
  if (typeTimer !== null) window.clearInterval(typeTimer)
  if (closeTimer !== null) window.clearTimeout(closeTimer)
  if (chatterTimer !== null) window.clearInterval(chatterTimer)
})
</script>

<template>
  <div class="witch-corner" :class="{ visible }">
    <transition name="bubble">
      <div v-if="bubbleOpen" class="speech-bubble">
        {{ typedText }}<span class="caret">▌</span>
      </div>
    </transition>

    <button class="witch-btn" aria-label="小巫女露娜" @click="onClick">
      <span class="orbit-star s1">✦</span>
      <span class="orbit-star s2">✧</span>
      <span class="orbit-star s3">⋆</span>
      <svg
        class="witch-sprite"
        :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
        :width="WIDTH"
        :height="HEIGHT"
        shape-rendering="crispEdges"
      >
        <rect v-for="(p, i) in pixels" :key="i" :x="p.x * CELL" :y="p.y * CELL" :width="CELL" :height="CELL" :fill="p.fill" />
        <!-- 眨眼眼皮：覆盖在两个眼睛像素上 -->
        <rect class="eyelid" :x="7 * CELL" :y="11 * CELL" :width="CELL" :height="CELL" :fill="PALETTE.S" />
        <rect class="eyelid" :x="12 * CELL" :y="11 * CELL" :width="CELL" :height="CELL" :fill="PALETTE.S" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.witch-corner {
  position: fixed;
  right: 18px;
  bottom: 14px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  pointer-events: none;
}
.witch-corner.visible { opacity: 1; transform: none; pointer-events: auto; }

.witch-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  animation: witch-bob 3.2s ease-in-out infinite;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  filter: drop-shadow(0 8px 18px rgba(0, 0, 0, 0.5));
}
.witch-btn:hover { transform: scale(1.08) rotate(-4deg); }
.witch-btn:active { transform: scale(0.94); }

@keyframes witch-bob {
  0%, 100% { translate: 0 0; }
  50% { translate: 0 -7px; }
}

.eyelid { opacity: 0; animation: blink 4.6s infinite; }
@keyframes blink {
  0%, 91%, 100% { opacity: 0; }
  93%, 97% { opacity: 1; }
}

.orbit-star {
  position: absolute;
  color: var(--gold-bright);
  pointer-events: none;
  animation: orbit-twinkle 2.2s ease-in-out infinite;
  text-shadow: 0 0 8px color-mix(in srgb, var(--gold-bright) 90%, transparent);
}
.orbit-star.s1 { top: -4px; right: -6px; font-size: 14px; }
.orbit-star.s2 { top: 40%; left: -14px; font-size: 10px; animation-delay: 0.7s; color: var(--pink-soft); }
.orbit-star.s3 { bottom: 6px; right: -12px; font-size: 11px; animation-delay: 1.4s; color: var(--mint); }
@keyframes orbit-twinkle {
  0%, 100% { opacity: 0.25; transform: scale(0.7) rotate(0deg); }
  50% { opacity: 1; transform: scale(1.25) rotate(40deg); }
}

.speech-bubble {
  position: relative;
  max-width: 240px;
  background: #fff6ec;
  color: #4a3468;
  font-family: var(--cute);
  font-size: 0.95rem;
  line-height: 1.7;
  padding: 12px 16px;
  border-radius: 16px 16px 4px 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  margin-right: 6px;
  min-height: 1.7em;
}
.speech-bubble::after {
  content: '';
  position: absolute;
  bottom: -8px;
  right: 22px;
  border: 8px solid transparent;
  border-top-color: #fff6ec;
  border-bottom: 0;
}
.caret { animation: caret-blink 0.9s steps(1) infinite; color: var(--pink); }
@keyframes caret-blink { 50% { opacity: 0; } }

.bubble-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.bubble-leave-active { transition: all 0.2s ease; }
.bubble-enter-from { opacity: 0; transform: translateY(10px) scale(0.85); }
.bubble-leave-to { opacity: 0; transform: scale(0.9); }

@media (max-width: 600px) {
  .witch-corner { right: 8px; bottom: 8px; }
  .witch-sprite { width: 100px; height: auto; }
  .speech-bubble { max-width: 190px; font-size: 0.85rem; }
}
</style>
