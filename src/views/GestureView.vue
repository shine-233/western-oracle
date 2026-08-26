<script setup lang="ts">
/**
 * 手势占卜 · 命运抓取（对标 ai-tarot-oracle 的 MediaPipe 交互维度）
 * - MediaPipe HandLandmarker 由 CDN 懒加载：只在点击启用时下载，离开页面即释放摄像头
 * - 张开手掌 = 蓄力充能 / 食指指向 = 瞄准游标 / 握拳 0.7s = 抓住当前牌
 * - 无摄像头、CDN 失败或拒绝授权 → 自动落回鼠标模式（按住蓄力、松手抓牌）
 * - 三张命运牌：过去 / 现在 / 未来，抓一张翻一张；视频仅本地处理
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { MAJOR_ARCANA, cardImageUrl } from '../data/tarot'
import { L } from '../data/oracleArcade'
import { sfx } from '../lib/sfx'
import { addHistory } from '../lib/history'
import DecryptTitle from '../components/DecryptTitle.vue'

type Mode = 'idle' | 'loading' | 'hand' | 'mouse'

interface FloatCard {
  id: string
  nameCn: string
  img: string
  uprightText: string
  reversed: boolean
  drawn: boolean
}

const mode = ref<Mode>('idle')
const errMsg = ref('')
const charge = ref(0)
const aimed = ref(-1)
const gestureLabel = ref('')

const SLOT_ZH = ['过去', '现在', '未来'] as const
const SLOT_EN = ['Past', 'Present', 'Future'] as const
function slotLabel(i: number): string {
  return L([SLOT_ZH[i]!, SLOT_EN[i]!]!)
}

/* ---------- 三张命运牌 ---------- */
function pickThree(): FloatCard[] {
  const out: FloatCard[] = []
  const used = new Set<number>()
  while (out.length < 3) {
    const i = Math.floor(Math.random() * MAJOR_ARCANA.length)
    if (used.has(i)) continue
    used.add(i)
    const c = MAJOR_ARCANA[i]!
    const rev = Math.random() < 0.35
    out.push({
      id: c.id,
      nameCn: `${c.nameCn}${rev ? (L(['（逆位）', ' (Rev.)']) ) : ''}`,
      img: cardImageUrl(c.id),
      uprightText: rev ? c.reversed : c.upright,
      reversed: rev,
      drawn: false,
    })
  }
  return out
}
const cards = ref<FloatCard[]>(pickThree())

function resetReading(): void {
  cards.value = pickThree()
  charge.value = 0
  aimed.value = -1
  sfx.riffle()
}

const allDrawn = computed(() => cards.value.every((c) => c.drawn))

function grabCard(idx: number): void {
  const c = cards.value[idx]
  if (!c || c.drawn) return
  c.drawn = true
  charge.value = 0
  aimed.value = -1
  sfx.ding()
  if (cards.value.every((x) => x.drawn)) {
    addHistory({
      type: 'gesture',
      label: L(['隔空抽牌 · 三牌', 'Air-draw · Three cards']),
      summary: cards.value.map((x) => x.nameCn).join(' / '),
    })
  }
}

/* ---------- 摄像头 + MediaPipe ---------- */
const videoRef = ref<HTMLVideoElement | null>(null)
const stageRef = ref<HTMLDivElement | null>(null)
/* eslint-disable @typescript-eslint/no-explicit-any */
let landmarker: any = null
let stream: MediaStream | null = null
let rafId = 0
let lastVideoTime = -1
let grabHoldUntil = 0
/* eslint-enable @typescript-eslint/no-explicit-any */

/** 多 CDN 回退：jsDelivr 主源，unpkg 备源，npmmirror 国内镜像 */
const CDN_BASES = [
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14',
  'https://unpkg.com/@mediapipe/tasks-vision@0.10.14',
  'https://registry.npmmirror.com/@mediapipe/tasks-vision/0.10.14/files',
]

async function enableHand(): Promise<void> {
  if (mode.value === 'loading' || mode.value === 'hand') return
  errMsg.value = ''
  mode.value = 'loading'
  let loaded = false
  for (const BASE of CDN_BASES) {
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('no-mediaDevices')
      const vision: any = await import(/* @vite-ignore */ `${BASE}/vision_bundle.mjs`)
      const fileset = await vision.FilesetResolver.forVisionTasks(`${BASE}/wasm`)
      landmarker = await vision.HandLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 1,
      })
      stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })
      const v = videoRef.value!
      v.srcObject = stream
      await v.play()
      mode.value = 'hand'
      sfx.ding()
      requestAnimationFrame(tickHand)
      loaded = true
      break
    } catch (e) {
      if (e instanceof Error && e.message === 'no-mediaDevices') {
        errMsg.value = L(['这个浏览器不支持摄像头。', 'Camera not supported in this browser.'])
        mode.value = 'mouse'
        return
      }
      landmarker = null
      continue // 换下一个 CDN
    }
  }
  if (!loaded) {
    errMsg.value = L(
      ['三个 CDN 都没能加载手势模型（离线 / 被墙 / 拒绝授权）。已切到鼠标模式。',
       'All three CDNs failed (offline / blocked / denied). Switched to mouse mode.'],
    )
    mode.value = 'mouse'
  }
}

function fingersState(lm: Array<{ x: number; y: number }>): boolean[] {
  // 指尖(8/12/16/20) 离腕(0) 比 指节(6/10/14/18) 更远 = 伸直
  const d = (a: { x: number; y: number }, b: { x: number; y: number }): number =>
    Math.hypot(a.x - b.x, a.y - b.y)
  const checks: Array<[number, number]> = [[8, 6], [12, 10], [16, 14], [20, 18]]
  return checks.map(([tip, pip]) => d(lm[tip]!, lm[0]!) > d(lm[pip]!, lm[0]!) * 1.08)
}

function tickHand(): void {
  if (mode.value !== 'hand') return
  const v = videoRef.value
  if (!v || !landmarker) return
  if (v.readyState >= 2 && v.videoWidth > 0 && v.currentTime !== lastVideoTime) {
    lastVideoTime = v.currentTime
    let res: any = null
    try {
      res = landmarker.detectForVideo(v, performance.now())
    } catch {
      res = null
    }
    const lm = res?.landmarks?.[0]
    if (lm) {
      const ext: boolean[] = fingersState(lm)
      const open = ext.every(Boolean)
      const point = ext[0]! && !ext[1]! && !ext[2]! && !ext[3]!
      const fist = !ext.some(Boolean)

      const rect = stageRef.value?.getBoundingClientRect()
      if (rect) updateAim((1 - lm[8]!.x) * rect.width, lm[8]!.y * rect.height)

      if (open) {
        gestureLabel.value = L(['张开手掌 · 蓄力中', 'Open palm · charging'])
        charge.value = Math.min(100, charge.value + 1.6)
        if (charge.value >= 30 && charge.value < 32) sfx.blip()
      } else if (fist && charge.value >= 25) {
        gestureLabel.value = L(['握拳 · 抓取！', 'Fist · grab!'])
        if (!grabHoldUntil) grabHoldUntil = performance.now() + 700
        if (performance.now() >= grabHoldUntil) {
          if (aimed.value >= 0) grabCard(aimed.value)
          grabHoldUntil = 0
          charge.value = 0
        }
      } else {
        grabHoldUntil = 0
        gestureLabel.value = point ? L(['食指指向 · 移动游标', 'Pointing · aim']) : ''
      }
    } else {
      gestureLabel.value = L(['举起你的手', 'Raise your hand'])
    }
  }
  rafId = requestAnimationFrame(tickHand)
}

/* ---------- 瞄准（手/鼠标共用） ---------- */
function updateAim(cx: number, cy: number): void {
  const rect = stageRef.value?.getBoundingClientRect()
  if (!rect) return
  let best = -1
  let bestD = 150
  cards.value.forEach((c, i) => {
    if (c.drawn) return
    const slotX = ((i + 0.5) / 3) * rect.width
    const slotY = rect.height * 0.42
    const d = Math.hypot(cx - slotX, cy - slotY)
    if (d < bestD) {
      bestD = d
      best = i
    }
  })
  if (best !== aimed.value && best >= 0) sfx.tick()
  aimed.value = best
}

/* ---------- 鼠标模式 ---------- */
function onMouseMove(e: MouseEvent): void {
  if (mode.value !== 'mouse') return
  const rect = stageRef.value?.getBoundingClientRect()
  if (!rect) return
  updateAim(e.clientX - rect.left, e.clientY - rect.top)
}
let mouseChargeTimer: number | null = null
function onMouseDown(): void {
  if (mode.value !== 'mouse' || mouseChargeTimer !== null) return
  mouseChargeTimer = window.setInterval(() => {
    charge.value = Math.min(100, charge.value + 4)
  }, 40)
}
function onMouseUp(): void {
  if (mouseChargeTimer !== null) {
    window.clearInterval(mouseChargeTimer)
    mouseChargeTimer = null
  }
  if (mode.value === 'mouse' && charge.value >= 25 && aimed.value >= 0) grabCard(aimed.value)
  charge.value = 0
}

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
  if (mouseChargeTimer !== null) window.clearInterval(mouseChargeTimer)
  stream?.getTracks().forEach((t) => t.stop())
  stream = null
  try {
    landmarker?.close?.()
  } catch {
    /* noop */
  }
  landmarker = null
})
</script>

<template>
  <div class="page-root">
    <h2><DecryptTitle :text="L(['手势占卜 · 命运抓取', 'Gesture Oracle · Seize Fate'])" /></h2>
    <p class="hint">
      {{
        L([
          '用手势抽牌：手掌张开蓄力 → 食指瞄准一张牌 → 握拳抓住它。视频只在本地处理，不上传任何画面。',
          'Draw with gestures: open palm to charge, point at a card, fist to seize it. Video stays local.',
        ])
      }}
    </p>

    <div class="g-toolbar">
      <button v-if="mode === 'idle' || mode === 'mouse'" class="btn" @click="enableHand">
        🖐 {{ L(['启用摄像头手势', 'Enable hand gestures']) }}
      </button>
      <span v-if="mode === 'loading'" class="g-loading">{{ L(['正在召唤手势精灵…', 'Summoning the hand sprite…']) }}</span>
      <span v-if="mode === 'hand'" class="g-live">● {{ gestureLabel }} — {{ Math.round(charge) }}%</span>
      <span v-if="mode === 'mouse'" class="g-mouse">{{ L(['鼠标模式：按住蓄力，松手抓牌', 'Mouse: hold to charge, release to grab']) }}</span>
      <button class="btn ghost small" @click="resetReading">{{ L(['重新洗三张', 'Reshuffle three']) }}</button>
    </div>
    <p v-if="errMsg" class="hint g-err">{{ errMsg }}</p>

    <!-- 舞台 -->
    <div
      ref="stageRef"
      class="g-stage"
      @mousemove="onMouseMove"
      @mousedown="onMouseDown"
      @mouseup="onMouseUp"
      @mouseleave="onMouseUp"
    >
      <video ref="videoRef" class="g-video" playsinline muted :class="{ on: mode === 'hand' }" />

      <div class="g-row">
        <div v-for="(c, i) in cards" :key="i" class="g-slot" :class="{ aimed: aimed === i && !c.drawn, gone: c.drawn }" :style="{ animationDelay: i * 0.9 + 's' }">
          <div v-if="!c.drawn" class="g-back">✦</div>
          <img v-else class="g-face" :src="c.img" :alt="c.nameCn" :class="{ upside: c.reversed }" draggable="false" />
          <span class="g-slot-tag">{{ slotLabel(i) }}{{ c.drawn ? ' ✦' : '' }}</span>
        </div>
      </div>

      <Transition name="slide-fade">
        <div v-if="allDrawn" class="g-done">
          <p class="gd-title">{{ L(['命运已定 ✦', 'Fate sealed ✦']) }}</p>
          <div class="gd-row">
            <figure v-for="(c, i) in cards" :key="'r' + i" class="gd-card">
              <img :src="c.img" :class="{ upside: c.reversed }" :alt="c.nameCn" />
              <figcaption>
                <strong>{{ slotLabel(i) }} · {{ c.nameCn }}</strong>
                <em>{{ c.uprightText }}</em>
              </figcaption>
            </figure>
          </div>
          <button class="btn ghost small" style="margin-top: 10px" @click="resetReading">{{ L(['再来一轮', 'Another round']) }}</button>
        </div>
      </Transition>

      <div class="g-charge" :style="{ opacity: charge > 0 ? 1 : 0.25 }">
        <i :style="{ width: charge + '%' }" />
      </div>
    </div>

    <p class="hint" style="margin-top: 12px">
      {{
        L([
          '提示：第一次启用会从 CDN 下载约 8MB 的手势模型；中途离开页面会立刻关闭摄像头。',
          'First enable downloads ~8MB of model from CDN; leaving this page instantly releases the camera.',
        ])
      }}
    </p>
  </div>
</template>

<style scoped>
.g-toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 14px; }
.g-loading { color: var(--gold-bright); font-family: var(--pixel); font-size: 0.62rem; letter-spacing: 0.12em; }
.g-live { color: var(--mint); font-family: var(--pixel); font-size: 0.6rem; letter-spacing: 0.08em; }
.g-mouse { color: var(--lavender-soft); font-size: 0.85rem; }
.g-err { color: var(--danger); }

.g-stage {
  position: relative;
  margin-top: 16px;
  max-width: 680px;
  aspect-ratio: 16 / 10;
  border: 2.5px solid color-mix(in srgb, var(--lavender) 45%, transparent);
  clip-path: polygon(
    0 9px, 4px 9px, 4px 4px, 9px 4px, 9px 0,
    calc(100% - 9px) 0, calc(100% - 9px) 4px, calc(100% - 4px) 4px, calc(100% - 4px) 9px, 100% 9px,
    100% calc(100% - 9px), calc(100% - 4px) calc(100% - 9px), calc(100% - 4px) calc(100% - 4px), calc(100% - 9px) calc(100% - 4px), calc(100% - 9px) 100%,
    9px 100%, 9px calc(100% - 4px), 4px calc(100% - 4px), 4px calc(100% - 9px), 0 calc(100% - 9px)
  );
  background:
    radial-gradient(500px 260px at 50% 0%, color-mix(in srgb, var(--lavender) 16%, transparent), transparent 70%),
    linear-gradient(168deg, var(--void-2), var(--void-1));
  overflow: hidden;
  user-select: none;
}
.g-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
  opacity: 0;
  transition: opacity 0.5s ease;
  pointer-events: none;
}
.g-video.on { opacity: 0.22; filter: saturate(0.55); }

.g-row {
  position: absolute;
  inset: 14% 0 30%;
  display: flex;
  justify-content: center;
  gap: 26px;
}
.g-slot {
  position: relative;
  width: 118px;
  height: fit-content;
  animation: g-float 5.2s ease-in-out infinite;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.25s, opacity 0.4s;
}
@keyframes g-float {
  50% { translate: 0 -9px; }
}
.g-slot.aimed {
  transform: translateY(-10px) scale(1.06);
  filter: drop-shadow(0 0 18px color-mix(in srgb, var(--gold) 75%, transparent));
}
.g-slot.gone { opacity: 0.35; }
.g-back {
  width: 118px;
  height: 186px;
  display: grid;
  place-items: center;
  font-size: 2rem;
  color: var(--gold-bright);
  background:
    radial-gradient(circle at 50% 38%, color-mix(in srgb, var(--pink-soft) 30%, transparent), transparent 60%),
    linear-gradient(160deg, var(--void-3), var(--void-1));
  border: 2px solid var(--gold);
  box-shadow:
    inset 0 0 0 5px color-mix(in srgb, var(--void-1) 80%, transparent),
    0 8px 20px rgba(0, 0, 0, 0.45);
}
.g-slot-tag {
  position: absolute;
  bottom: -24px;
  left: 50%;
  translate: -50% 0;
  font-family: var(--pixel);
  font-size: 0.52rem;
  letter-spacing: 0.14em;
  color: var(--ink-dim);
  white-space: nowrap;
}
.g-face {
  width: 118px;
  border-radius: 8px;
  border: 2px solid var(--gold);
  display: block;
  background: var(--void-1);
}
.g-face.upside { transform: rotate(180deg); }

.g-done {
  position: absolute;
  inset: auto 0 0;
  padding: 14px 16px;
  background: rgba(13, 11, 32, 0.88);
  backdrop-filter: blur(4px);
  text-align: center;
}
.gd-title { margin: 0 0 10px; color: var(--gold-bright); font-family: var(--pixel); font-size: 0.66rem; letter-spacing: 0.2em; }
.gd-row { display: flex; gap: 14px; justify-content: center; align-items: flex-start; flex-wrap: wrap; }
.gd-card { margin: 0; max-width: 190px; text-align: center; }
.gd-card img {
  width: 74px;
  border-radius: 6px;
  border: 1.5px solid var(--gold);
  display: block;
  margin: 0 auto 6px;
}
.gd-card img.upside { transform: rotate(180deg); }
.gd-card strong { display: block; color: var(--gold-bright); font-weight: 400; font-size: 0.82rem; }
.gd-card em { display: block; font-style: normal; color: var(--ink-dim); font-size: 0.72rem; line-height: 1.6; margin-top: 3px; }

.g-charge {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 12px;
  height: 6px;
  background: color-mix(in srgb, var(--lavender) 18%, transparent);
  transition: opacity 0.3s;
}
.g-charge i {
  display: block;
  height: 100%;
  width: 0;
  background: linear-gradient(90deg, var(--gold), var(--pink));
  box-shadow: 0 0 10px color-mix(in srgb, var(--pink) 60%, transparent);
  transition: width 0.12s linear;
}

.slide-fade-enter-active { transition: all 0.35s cubic-bezier(0.34, 1.4, 0.64, 1); }
.slide-fade-enter-from { opacity: 0; transform: translateY(16px); }

@media (max-width: 720px) {
  .g-row { gap: 14px; }
  .g-slot, .g-back, .g-face { width: 92px; }
  .g-back { height: 146px; font-size: 1.5rem; }
}
@media (prefers-reduced-motion: reduce) {
  .g-slot { animation: none; }
  .slide-fade-enter-active { transition: none; }
}
</style>
