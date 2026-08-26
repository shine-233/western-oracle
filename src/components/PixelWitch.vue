<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { sparkle, sparkleFromEvent } from '../lib/sparkle'
import { sfx } from '../lib/sfx'
import { WITCH_PALETTE, WITCH_SPRITE, WITCH_FACE, WITCH_W, WITCH_H } from '../data/witchSprite'

const PALETTE = WITCH_PALETTE
const SPRITE = WITCH_SPRITE
const F = WITCH_FACE

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

const CELL = 8
const WIDTH = WITCH_W * CELL
const HEIGHT = WITCH_H * CELL

/* ---------- 表情引擎：idle / blink / happy / shy / wow ---------- */
type Mood = 'idle' | 'blink' | 'happy' | 'shy' | 'wow'
const mood = ref<Mood>('idle')
let moodTimer: number | null = null
let blinkTimer: number | null = null

function setMood(m: Mood, ms: number): void {
  if (moodTimer !== null) window.clearTimeout(moodTimer)
  mood.value = m
  moodTimer = window.setTimeout(() => (mood.value = 'idle'), ms)
}

/** 随机眨眼：单眨为主，偶尔连眨两下 */
function blinkLoop(): void {
  const delay = 2400 + Math.random() * 3200
  blinkTimer = window.setTimeout(() => {
    if (mood.value === 'idle') {
      setMood('blink', 140)
      if (Math.random() < 0.28) {
        window.setTimeout(() => {
          if (mood.value === 'idle') setMood('blink', 120)
        }, 220)
      }
    }
    blinkLoop()
  }, delay)
}

/** 眼皮覆盖高度：普通眨眼全闭，害羞只眯上半 */
const lidH = computed(() => (mood.value === 'shy' ? F.eyeL.h / 2 : F.eyeL.h))
const lidsOn = computed(() => mood.value === 'blink' || mood.value === 'shy' || mood.value === 'happy')
const blushOn = computed(() => mood.value === 'happy' || mood.value === 'shy')

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
  if (dragMoved) return
  setMood('happy', 950)
  sfx.ding()
  say(TIPS[Math.floor(Math.random() * TIPS.length)]!)
  sparkle(event.clientX, event.clientY, 10)
}

/* ---------- 拖拽搬家（live2d 招牌交互）：位置记忆，松手喊晕 ---------- */
const POS_KEY = 'wo-luna-pos'
const posX = ref<number | null>(null)
const posY = ref<number | null>(null)
const dragging = ref(false)
let dragMoved = false
let grabDX = 0
let grabDY = 0
let startX = 0
let startY = 0

try {
  const raw = JSON.parse(localStorage.getItem(POS_KEY) ?? 'null') as { x: number; y: number } | null
  if (raw && typeof raw.x === 'number' && typeof raw.y === 'number') {
    posX.value = Math.min(Math.max(raw.x, 4), window.innerWidth - WIDTH - 8)
    posY.value = Math.min(Math.max(raw.y, 4), window.innerHeight - HEIGHT - 8)
  }
} catch {
  /* ignore */
}

function savePos(): void {
  try {
    localStorage.setItem(POS_KEY, JSON.stringify({ x: posX.value ?? -1, y: posY.value ?? -1 }))
  } catch {
    /* ignore */
  }
}

function onDragStart(e: PointerEvent): void {
  const corner = (e.currentTarget as HTMLElement).closest('.witch-corner') as HTMLElement | null
  if (!corner) return
  const rect = corner.getBoundingClientRect()
  if (posX.value === null || posY.value === null) {
    posX.value = rect.left
    posY.value = rect.top
  }
  grabDX = e.clientX - posX.value!
  grabDY = e.clientY - posY.value!
  startX = e.clientX
  startY = e.clientY
  dragMoved = false
  dragging.value = true
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}

function onDragMove(e: PointerEvent): void {
  if (!dragging.value) return
  if (Math.hypot(e.clientX - startX, e.clientY - startY) > 8) dragMoved = true
  posX.value = Math.min(Math.max(e.clientX - grabDX, 4), window.innerWidth - WIDTH - 8)
  posY.value = Math.min(Math.max(e.clientY - grabDY, 4), window.innerHeight - HEIGHT - 8)
}

function onDragEnd(): void {
  if (!dragging.value) return
  dragging.value = false
  savePos()
  if (dragMoved) {
    setMood('shy', 1200)
    say(L_DIZZY[Math.floor(Math.random() * L_DIZZY.length)]!)
    sfx.blip()
  }
}

function onDbl(event: MouseEvent): void {
  if (dragMoved) return
  setMood('wow', 1150)
  sparkleFromEvent(event, 16)
  sfx.ding()
  say(SURPRISE[Math.floor(Math.random() * SURPRISE.length)]!)
}

const L_DIZZY = [
  '哇啊——帽子要飞了！',
  '搬家中……扫帚还在后面！',
  '轻一点啦，星星都被你摇下来了。',
]
const SURPRISE = [
  '✦ 双击有惊喜——被你发现啦！',
  '星星雨！今天运气+1！',
  '再双击一下，我就要飘起来了～',
]

onMounted(() => {
  window.setTimeout(() => (visible.value = true), 600)
  window.setTimeout(() => {
    setMood('happy', 1000)
    say('嗨！我是小巫女露娜，点我可以听星星的悄悄话～')
  }, 1600)
  blinkLoop()
  // 定时自言自语
  chatterTimer = window.setInterval(() => {
    if (!bubbleOpen.value) say(TIPS[Math.floor(Math.random() * TIPS.length)]!)
  }, 42000)
})

onBeforeUnmount(() => {
  if (typeTimer !== null) window.clearInterval(typeTimer)
  if (closeTimer !== null) window.clearTimeout(closeTimer)
  if (chatterTimer !== null) window.clearInterval(chatterTimer)
  if (blinkTimer !== null) window.clearTimeout(blinkTimer)
  if (moodTimer !== null) window.clearTimeout(moodTimer)
})
</script>

<template>
  <div
    class="witch-corner"
    :class="{ visible, dragging: dragging }"
    :style="posX !== null && posY !== null ? { left: posX + 'px', top: posY + 'px', right: 'auto', bottom: 'auto' } : undefined"
  >
    <transition name="bubble">
      <div v-if="bubbleOpen" class="speech-bubble">
        {{ typedText }}<span class="caret">▌</span>
      </div>
    </transition>

    <button
      class="witch-btn"
      aria-label="小巫女露娜"
      title="拖动我可以搬家 · 双击有惊喜 · 点击听悄悄话"
      @click="onClick"
      @dblclick="onDbl"
      @pointerdown="onDragStart"
      @pointermove="onDragMove"
      @pointerup="onDragEnd"
      @pointercancel="onDragEnd"
    >
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
        <rect v-for="(p, i) in pixels" :key="'p' + i" :x="p.x * CELL" :y="p.y * CELL" :width="CELL" :height="CELL" :fill="p.fill" />

        <!-- 表情层：眼皮（眨眼全闭 / 害羞害羞眯上半） -->
        <g v-if="lidsOn">
          <rect :x="F.eyeL.x * CELL" :y="F.eyeL.y * CELL" :width="F.eyeL.w * CELL" :height="lidH * CELL" :fill="PALETTE.S" />
          <rect :x="F.eyeR.x * CELL" :y="F.eyeR.y * CELL" :width="F.eyeR.w * CELL" :height="lidH * CELL" :fill="PALETTE.S" />
        </g>
        <!-- 开心：眼睛变成弯弯的缝（下排保留一点瞳色） -->
        <g v-if="mood === 'happy'">
          <rect :x="F.eyeL.x * CELL" :y="(F.eyeL.y + 1) * CELL" :width="F.eyeL.w * CELL" :height="CELL / 2" :fill="PALETTE.E" />
          <rect :x="F.eyeR.x * CELL" :y="(F.eyeR.y + 1) * CELL" :width="F.eyeR.w * CELL" :height="CELL / 2" :fill="PALETTE.E" />
        </g>
        <!-- 惊讶：嘴巴变 O -->
        <rect
          v-if="mood === 'wow'"
          :x="F.mouth.x * CELL"
          :y="F.mouth.y * CELL"
          :width="F.mouth.w * CELL"
          :height="2 * CELL"
          rx="3"
          :fill="PALETTE.E"
        />
        <!-- 腮红加强：开心 / 害羞 -->
        <g v-if="blushOn">
          <rect :x="F.blushL.x * CELL" :y="F.blushL.y * CELL" :width="F.blushL.w * CELL" :height="CELL" :fill="PALETTE.B" opacity="0.75" />
          <rect :x="F.blushR.x * CELL" :y="F.blushR.y * CELL" :width="F.blushR.w * CELL" :height="CELL" :fill="PALETTE.B" opacity="0.75" />
        </g>
        <!-- 惊讶头顶感叹号 -->
        <g v-if="mood === 'wow'" class="wow-mark">
          <rect :x="23 * CELL" :y="4 * CELL" :width="CELL" :height="3 * CELL" :fill="PALETTE.G" />
          <rect :x="23 * CELL" :y="8 * CELL" :width="CELL" :height="CELL" :fill="PALETTE.G" />
        </g>
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
.witch-corner.dragging .witch-btn { animation: none; cursor: grabbing; }
.witch-corner.dragging { z-index: 1200; }

.witch-btn {
  background: none;
  border: none;
  cursor: grab;
  padding: 0;
  touch-action: none;
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

.wow-mark { animation: wow-jump 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
@keyframes wow-jump {
  0% { opacity: 0; transform: translateY(6px) scale(0.5); }
  60% { opacity: 1; transform: translateY(-3px) scale(1.15); }
  100% { opacity: 1; transform: none; }
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
  .witch-sprite { width: 118px; height: auto; }
  .speech-bubble { max-width: 190px; font-size: 0.85rem; }
}
</style>
