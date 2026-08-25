<script setup lang="ts">
/** 星光八音盒：点星演奏的生成式音画盒（WebAudio 本地合成，尊重全站静音开关） */
import { onBeforeUnmount, ref } from 'vue'
import { isSoundOn } from '../lib/sfx'
import { sparkleFromEvent } from '../lib/sparkle'
import { L } from '../data/oracleArcade'
import DecryptTitle from '../components/DecryptTitle.vue'

/* ---------- 北斗七星布局（SVG 坐标）与五声音阶 ---------- */
interface Star {
  x: number
  y: number
  /** 频率 Hz */
  freq: number
  name: [string, string]
}
// C D E G A C5 D5 —— 中国五声音阶，怎么按都好听
const STARS: Star[] = [
  { x: 60, y: 150, freq: 261.6, name: ['天枢·宫', 'Dubhe · Do'] },
  { x: 105, y: 120, freq: 293.7, name: ['天璇·商', 'Merak · Re'] },
  { x: 150, y: 132, freq: 329.6, name: ['天玑·角', 'Phecda · Mi'] },
  { x: 196, y: 108, freq: 392.0, name: ['天权·徵', 'Megrez · Sol'] },
  { x: 238, y: 66, freq: 440.0, name: ['玉衡·羽', 'Alioth · La'] },
  { x: 262, y: 104, freq: 523.3, name: ['开阳·高宫', 'Mizar · Do↑'] },
  { x: 214, y: 52, freq: 587.3, name: ['摇光·高商', 'Alkaid · Re↑'] },
]

/* ---------- 音频引擎 ---------- */
let ctx: AudioContext | null = null
let master: GainNode | null = null
let delayNode: DelayNode | null = null

function ensureAudio(): void {
  if (ctx) return
  ctx = new AudioContext()
  master = ctx.createGain()
  master.gain.value = 0.55
  // 回声营造"星空感"
  delayNode = ctx.createDelay(1)
  delayNode.delayTime.value = 0.28
  const feedback = ctx.createGain()
  feedback.gain.value = 0.34
  const wet = ctx.createGain()
  wet.gain.value = 0.35
  delayNode.connect(feedback)
  feedback.connect(delayNode)
  delayNode.connect(wet)
  wet.connect(ctx.destination)
  master.connect(ctx.destination)
}

function playNote(freq: number): void {
  if (!isSoundOn()) return
  ensureAudio()
  if (!ctx || !master) return
  const t = ctx.currentTime
  // 主音色：三角波，柔和起音
  const osc = ctx.createOscillator()
  osc.type = 'triangle'
  osc.frequency.value = freq
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0, t)
  gain.gain.linearRampToValueAtTime(0.32, t + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9)
  osc.connect(gain)
  gain.connect(master)
  gain.connect(delayNode!)
  // 高八度泛音点缀
  const shimmer = ctx.createOscillator()
  shimmer.type = 'sine'
  shimmer.frequency.value = freq * 2
  const sg = ctx.createGain()
  sg.gain.setValueAtTime(0, t)
  sg.gain.linearRampToValueAtTime(0.08, t + 0.01)
  sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.5)
  shimmer.connect(sg)
  sg.connect(master)
  osc.start(t)
  osc.stop(t + 1)
  shimmer.start(t)
  shimmer.stop(t + 0.6)
}

/* ---------- 点星演奏 ---------- */
const ripples = ref<Array<{ id: number; x: number; y: number }>>([])
let rippleId = 0

function strike(star: Star, e?: MouseEvent): void {
  playNote(star.freq)
  const id = rippleId++
  ripples.value.push({ id, x: star.x, y: star.y })
  window.setTimeout(() => {
    ripples.value = ripples.value.filter((r) => r.id !== id)
  }, 900)
  if (e) sparkleFromEvent(e, 5)
}

/* ---------- 十六步自动作曲 ---------- */
const STEPS = 16
const sequence = ref<Array<number | null>>(Array(STEPS).fill(null))
const playing = ref(false)
const currentStep = ref(-1)
let timer: number | null = null

function generate(e?: MouseEvent): void {
  // 随机游走旋律：相邻步优先走邻近音，偶尔跳进，偶尔休止
  const seq: Array<number | null> = []
  let cur = Math.floor(Math.random() * STARS.length)
  for (let i = 0; i < STEPS; i++) {
    if (Math.random() < 0.18 && i > 0 && seq[i - 1] !== null) {
      seq.push(null)
      continue
    }
    const move = Math.random() < 0.72 ? (Math.random() < 0.5 ? -1 : 1) : Math.random() < 0.5 ? -2 : 2
    cur = Math.min(STARS.length - 1, Math.max(0, cur + move))
    seq.push(cur)
  }
  sequence.value = seq
  sfxBlip()
  if (e) sparkleFromEvent(e, 6)
}

function sfxBlip(): void {
  playNote(STARS[0]!.freq * (Math.random() < 0.5 ? 1 : 2))
}

function togglePlay(): void {
  if (playing.value) {
    stopPlay()
    return
  }
  ensureAudio()
  playing.value = true
  let step = 0
  timer = window.setInterval(() => {
    currentStep.value = step
    const noteIdx = sequence.value[step]
    if (noteIdx !== null) playNote(STARS[noteIdx]!.freq)
    step = (step + 1) % STEPS
  }, 300)
}

function stopPlay(): void {
  playing.value = false
  currentStep.value = -1
  if (timer !== null) window.clearInterval(timer)
  timer = null
}

onBeforeUnmount(stopPlay)

/* ---------- 背景飘落星屑 ---------- */
const dust = Array.from({ length: 26 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  delay: `${(i % 9) * 0.9}s`,
  dur: `${7 + (i % 5)}s`,
}))

/** 加权抽签逻辑见 oracleArcade.ts；此处星屑纯 CSS 动画，无需额外 JS */
</script>

<template>
  <div class="page-root">
    <h2><DecryptTitle :text="L(['星光八音盒', 'Starlight Music Box'])" /></h2>
    <p class="hint">{{ L([
      '北斗七星是一台八音盒：点星星演奏，或者让作曲家骰子替你写一首十六步的小曲。建议开着声音。',
      'The Big Dipper is a music box: tap stars to play, or let the composer dice write you sixteen steps. Sound on.',
    ]) }}</p>

    <!-- 演奏台 -->
    <section class="panel box-stage">
      <svg viewBox="0 0 320 220" class="sky-svg">
        <!-- 连线 -->
        <polyline
          :points="STARS.map((s) => `${s.x},${s.y}`).join(' ')"
          fill="none"
          stroke="rgba(179, 166, 247, 0.28)"
          stroke-width="1"
          stroke-dasharray="4 6"
        />
        <!-- 音符涟漪 -->
        <circle
          v-for="r in ripples"
          :key="r.id"
          :cx="r.x"
          :cy="r.y"
          :r="8"
          class="ripple"
          fill="none"
          stroke="#ffe3a8"
        />
        <!-- 星体 -->
        <g v-for="(s, i) in STARS" :key="i" class="star" @click="strike(s, $event)">
          <circle :cx="s.x" :cy="s.y" :r="18" class="halo" :style="{ animationDelay: i * 0.45 + 's' }" />
          <circle :cx="s.x" :cy="s.y" r="7" fill="#ffe3a8" class="core" />
          <text :x="s.x" :y="s.y + 30" text-anchor="middle" class="star-name">{{ L(s.name).split('·')[1] ?? '' }}</text>
        </g>
      </svg>

      <!-- 作曲机 -->
      <div class="sequencer">
        <div class="seq-grid">
          <button
            v-for="(noteIdx, i) in sequence"
            :key="i"
            class="seq-cell"
            :class="{ active: currentStep === i, filled: noteIdx !== null }"
            :title="noteIdx !== null ? STARS[noteIdx]!.name[0] : '·'"
            @click="sequence[i] = noteIdx === null ? Math.floor(Math.random() * STARS.length) : null; sfxBlip()"
          >
            <i v-if="noteIdx !== null" class="note-dot" />
          </button>
        </div>
        <p v-if="playing" class="hint" style="margin: 10px 0 0; text-align: center;">
          {{ L(['♪ 正在播放你的小曲…再点一次停止', '♪ Playing your tune… tap again to stop']) }}
        </p>
      </div>

      <div class="mb-actions">
        <button class="btn ghost small" @click="generate($event)">🎲 {{ L(['换一首曲子', 'New tune']) }}</button>
        <button class="btn" @click="togglePlay">
          {{ playing ? L(['■ 停止', '■ Stop']) : L(['▶ 播放', '▶ Play']) }}
        </button>
      </div>
    </section>

    <!-- 飘落星屑 -->
    <i
      v-for="(d, i) in dust"
      :key="'d' + i"
      class="dust"
      :style="{ left: d.left, animationDelay: d.delay, animationDuration: d.dur }"
    >✦</i>
  </div>
</template>

<style scoped>
.box-stage { position: relative; overflow: hidden; }
.sky-svg { width: 100%; max-width: 640px; display: block; margin: 0 auto; }

.star { cursor: pointer; }
.star .core { filter: drop-shadow(0 0 6px rgba(255, 227, 168, 0.9)); transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); transform-origin: center; transform-box: fill-box; }
.star:hover .core { transform: scale(1.5); }
.halo {
  fill: rgba(255, 227, 168, 0.14);
  animation: halo-breathe 3s ease-in-out infinite;
}
@keyframes halo-breathe { 50% { opacity: 0.35; } }
.star-name { font-size: 11px; fill: var(--lavender-soft); opacity: 0.75; }

.ripple {
  r: 8;
  opacity: 0.9;
  stroke-width: 2;
  animation: ripple-out 0.9s ease-out forwards;
  pointer-events: none;
}
@keyframes ripple-out {
  to { r: 42; opacity: 0; stroke-width: 0.5; }
}

.sequencer { margin-top: 8px; }
.seq-grid { display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; }
.seq-cell {
  width: 34px;
  height: 44px;
  border-radius: 8px;
  border: 1.5px solid rgba(179, 166, 247, 0.35);
  background: rgba(13, 11, 32, 0.7);
  cursor: pointer;
  display: grid;
  place-items: end center;
  padding-bottom: 6px;
  transition: all 0.15s;
}
.seq-cell:hover { border-color: var(--gold); transform: translateY(-3px); }
.seq-cell.filled { border-color: var(--gold); }
.note-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--gold-bright); box-shadow: 0 0 8px rgba(255, 227, 168, 0.8); }
.seq-cell.active { background: rgba(245, 200, 110, 0.25); border-color: #fff; transform: translateY(-5px); }

.mb-actions { display: flex; gap: 14px; justify-content: center; margin-top: 20px; flex-wrap: wrap; }

.dust {
  position: fixed;
  top: -30px;
  color: rgba(255, 227, 168, 0.5);
  font-size: 0.8rem;
  pointer-events: none;
  animation: dust-fall linear infinite;
  z-index: 0;
}
@keyframes dust-fall {
  to { transform: translateY(110vh) rotate(360deg); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .halo, .dust, .ripple { animation: none !important; }
}
</style>
