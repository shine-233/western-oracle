<script setup lang="ts">
/** 星光八音盒 v2：点星演奏的生成式音画盒。
 * 新增：AnalyserNode 实时像素频谱、播放时点亮对应北斗星、旋律保存/回放、可调节拍。
 * （WebAudio 本地合成，尊重全站静音开关） */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { isSoundOn, sfx } from '../lib/sfx'
import { sparkleFromEvent } from '../lib/sparkle'
import { loadJSON, saveJSON } from '../lib/storage'
import { L } from '../data/oracleArcade'
import DecryptTitle from '../components/DecryptTitle.vue'
import ApprenticeReact from '../components/ApprenticeReact.vue'

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
let analyser: AnalyserNode | null = null
let specData: Uint8Array | null = null

function ensureAudio(): void {
  if (ctx) {
    // iOS 上已建的 context 可能仍停在 suspended，每次进曲前补一次 resume
    if (ctx.state === 'suspended') void ctx.resume()
    return
  }
  ctx = new AudioContext()
  master = ctx.createGain()
  master.gain.value = 0.55
  // 频谱分析：接在 master 后，柱状可视化用
  analyser = ctx.createAnalyser()
  analyser.fftSize = 128 // 64 bins，够像素柱状图用
  analyser.smoothingTimeConstant = 0.78
  specData = new Uint8Array(analyser.frequencyBinCount)
  master.connect(analyser)
  analyser.connect(ctx.destination)
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
  // 注意：master 的唯一出口是 analyser→destination。
  // 这里若再 connect(ctx.destination) 会与 analyser 路径并联，整体响度 ×2 且有削波风险。
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
const litStar = ref(-1)
let litTimer = 0

function lightStar(i: number): void {
  litStar.value = i
  if (litTimer) window.clearTimeout(litTimer)
  litTimer = window.setTimeout(() => (litStar.value = -1), 380)
}

function strike(star: Star, e?: MouseEvent): void {
  playNote(star.freq)
  lightStar(STARS.indexOf(star))
  const id = rippleId++
  ripples.value.push({ id, x: star.x, y: star.y })
  window.setTimeout(() => {
    ripples.value = ripples.value.filter((r) => r.id !== id)
  }, 900)
  if (e) sparkleFromEvent(e, 5)
}

/* ---------- 十六步自动作曲 + 节拍 + 播放点亮 ---------- */
const STEPS = 16
const sequence = ref<Array<number | null>>(Array(STEPS).fill(null))
const playing = ref(false)
const currentStep = ref(-1)
let timer: number | null = null
/** 每步毫秒（可调） */
const tempoMs = ref(300)

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

/** 手工编辑：点一下升一个音（空→宫→商→角…→摇光→空），点到哪个音当场奏哪个 */
function cycleCell(i: number): void {
  const cur = sequence.value[i] ?? -1
  const next = cur + 1 >= STARS.length ? null : cur + 1
  sequence.value[i] = next
  if (next !== null) {
    playNote(STARS[next]!.freq)
    lightStar(next)
  } else {
    sfxBlip()
  }
}

/** 右键/长按清格 */
function clearCell(i: number): void {
  if (sequence.value[i] === null) return
  sequence.value[i] = null
  sfxBlip()
}

function sfxBlip(): void {
  playNote(STARS[0]!.freq * (Math.random() < 0.5 ? 1 : 2))
}

function startLoop(): void {
  stopLoopOnly()
  playing.value = true
  let step = 0
  timer = window.setInterval(() => {
    currentStep.value = step
    const noteIdx = sequence.value[step]
    if (noteIdx !== null) {
      playNote(STARS[noteIdx]!.freq)
      lightStar(noteIdx)
    }
    step = (step + 1) % STEPS
  }, tempoMs.value)
}
function stopLoopOnly(): void {
  if (timer !== null) window.clearInterval(timer)
  timer = null
}

function togglePlay(): void {
  if (playing.value) {
    stopPlay()
    return
  }
  ensureAudio()
  startLoop()
}

function onTempoChange(): void {
  if (playing.value) startLoop() // 用新节拍重启循环
}

function stopPlay(): void {
  playing.value = false
  currentStep.value = -1
  stopLoopOnly()
}

/* ---------- 旋律收藏（本机） ---------- */
interface SavedTune {
  name: string
  steps: Array<number | null>
  at: number
}
const savedTunes = ref<SavedTune[]>(loadJSON<SavedTune[]>('musicbox-tunes', []))

function saveTune(): void {
  if (!sequence.value.some((s) => s !== null)) return
  const tune: SavedTune = {
    name: L(['小曲', 'Tune']) + ` #${savedTunes.value.length + 1}`,
    steps: [...sequence.value],
    at: Date.now(),
  }
  savedTunes.value = [tune, ...savedTunes.value].slice(0, 12)
  saveJSON('musicbox-tunes', savedTunes.value)
  sfx.ding()
}

function loadTune(t: SavedTune, e?: MouseEvent): void {
  // 脏数据防护：旧版本/损坏的 localStorage 可能含越界索引，播放时会崩
  const clean = Array.from({ length: STEPS }, (_, i) => {
    const v = t.steps[i]
    return typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < STARS.length ? v : null
  })
  if (!clean.some((s) => s !== null)) return
  sequence.value = clean
  sfx.blip()
  if (e) sparkleFromEvent(e, 6)
}

function removeTune(at: number): void {
  savedTunes.value = savedTunes.value.filter((x) => x.at !== at)
  saveJSON('musicbox-tunes', savedTunes.value)
}

/* ---------- 导出：WAV 音频 + 星谱分享卡 ---------- */
const exporting = ref(false)
/** 导出失败的可见提示（以前失败只响个音效，用户根本不知道发生了什么） */
const exportFailed = ref(false)
let exportFailTimer = 0

/** 离线渲染当前旋律（复刻在线合成链：三角波主音 ×2 泛音 + 回声） */
async function renderOffline(): Promise<AudioBuffer> {
  const stepSec = tempoMs.value / 1000
  const total = STEPS * stepSec + 1.6
  const sampleRate = 44100
  const off = new OfflineAudioContext(2, Math.ceil(total * sampleRate), sampleRate)
  // 复刻回声链
  const delay = off.createDelay(1)
  delay.delayTime.value = 0.28
  const fb = off.createGain()
  fb.gain.value = 0.34
  const wet = off.createGain()
  wet.gain.value = 0.3
  delay.connect(fb)
  fb.connect(delay)
  delay.connect(wet)
  wet.connect(off.destination)

  for (let i = 0; i < STEPS; i++) {
    const n = sequence.value[i]
    if (n === null) continue
    const freq = STARS[n]!.freq
    const t0 = i * stepSec + 0.05
    // 主音 triangle
    const osc = off.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = freq
    const g = off.createGain()
    g.gain.setValueAtTime(0, t0)
    g.gain.linearRampToValueAtTime(0.22, t0 + 0.02)
    g.gain.exponentialRampToValueAtTime(0.001, t0 + Math.min(0.6, stepSec * 2))
    osc.connect(g)
    g.connect(off.destination)
    g.connect(delay)
    osc.start(t0)
    osc.stop(t0 + 0.65)
    // 倍频 shimmer
    const sh = off.createOscillator()
    sh.type = 'sine'
    sh.frequency.value = freq * 2
    const sg = off.createGain()
    sg.gain.setValueAtTime(0, t0)
    sg.gain.linearRampToValueAtTime(0.06, t0 + 0.02)
    sg.gain.exponentialRampToValueAtTime(0.0005, t0 + 0.5)
    sh.connect(sg)
    sg.connect(delay)
    sh.start(t0)
    sh.stop(t0 + 0.55)
  }
  return off.startRendering()
}

/** AudioBuffer → 16-bit PCM WAV Blob */
function bufToWav(buf: AudioBuffer): Blob {
  const numCh = buf.numberOfChannels
  const len = buf.length
  const bytes = 44 + len * numCh * 2
  const ab = new ArrayBuffer(bytes)
  const view = new DataView(ab)
  const wstr = (o: number, s: string): void => {
    for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i))
  }
  wstr(0, 'RIFF')
  view.setUint32(4, bytes - 8, true)
  wstr(8, 'WAVE')
  wstr(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numCh, true)
  view.setUint32(24, buf.sampleRate, true)
  view.setUint32(28, buf.sampleRate * numCh * 2, true)
  view.setUint16(32, numCh * 2, true)
  view.setUint16(34, 16, true)
  wstr(36, 'data')
  view.setUint32(40, len * numCh * 2, true)
  let p = 44
  const chans: Float32Array[] = []
  for (let c = 0; c < numCh; c++) chans.push(buf.getChannelData(c))
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < numCh; c++) {
      const v = Math.max(-1, Math.min(1, chans[c]![i]))
      view.setInt16(p, v < 0 ? v * 0x8000 : v * 0x7fff, true)
      p += 2
    }
  }
  return new Blob([ab], { type: 'audio/wav' })
}

async function exportWav(e?: MouseEvent): Promise<void> {
  if (!sequence.value.some((s) => s !== null) || exporting.value) return
  exporting.value = true
  sfxBlip()
  try {
    const buf = await renderOffline()
    const blob = bufToWav(buf)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `starlight-tune-${new Date().toISOString().slice(0, 10)}.wav`
    a.click()
    window.setTimeout(() => URL.revokeObjectURL(a.href), 4000)
    sfx.ding()
    if (e) sparkleFromEvent(e, 8)
  } catch {
    sfx.pop()
    exportFailed.value = true
    window.clearTimeout(exportFailTimer)
    exportFailTimer = window.setTimeout(() => (exportFailed.value = false), 3200)
  } finally {
    exporting.value = false
  }
}

/** 把当前旋律画成一张星谱分享卡 PNG */
async function exportCard(e?: MouseEvent): Promise<void> {
  if (!sequence.value.some((s) => s !== null)) return
  // 等中文手写体真正就绪再落画布，否则分享卡标题会退化成默认字体
  try {
    if ('fonts' in document) await document.fonts.ready
  } catch { /* 字体 API 不可用就直接画 */ }
  const cv = document.createElement('canvas')
  cv.width = 900
  cv.height = 500
  const g = cv.getContext('2d')
  if (!g) return
  // 底色夜空
  const bg = g.createLinearGradient(0, 0, 900, 500)
  bg.addColorStop(0, '#151232')
  bg.addColorStop(1, '#241d52')
  g.fillStyle = bg
  g.fillRect(0, 0, 900, 500)
  // 随机小星
  g.fillStyle = 'rgba(207,197,255,0.5)'
  for (let i = 0; i < 90; i++) {
    g.fillRect(Math.random() * 900, Math.random() * 500, 1.4, 1.4)
  }
  // 标题
  g.fillStyle = '#f5c86e'
  g.font = '30px "ZCOOL KuaiLe", sans-serif'
  g.fillText('✦ 星光八音盒', 48, 78)
  g.font = '13px monospace'
  g.fillStyle = '#b3a6f7'
  g.fillText('STARLIGHT MUSIC BOX · WESTERN ORACLE', 48, 104)
  // 星谱网格
  const gx = 64
  const gy = 150
  const cw = 46
  const ch = 34
  g.strokeStyle = 'rgba(179,166,247,0.18)'
  for (let r = 0; r < STARS.length; r++) {
    g.beginPath()
    g.moveTo(gx, gy + r * ch)
    g.lineTo(gx + cw * STEPS, gy + r * ch)
    g.stroke()
  }
  for (let c = 0; c <= STEPS; c++) {
    g.beginPath()
    g.moveTo(gx + c * cw, gy)
    g.lineTo(gx + c * cw, gy + (STARS.length - 1) * ch)
    g.stroke()
  }
  // 音符点
  sequence.value.forEach((n, i) => {
    if (n === null) return
    const x = gx + i * cw + cw / 2
    const y = gy + n * ch
    g.fillStyle = '#ffe3a8'
    g.shadowColor = '#f5c86e'
    g.shadowBlur = 14
    g.beginPath()
    g.arc(x, y, 9, 0, Math.PI * 2)
    g.fill()
    g.shadowBlur = 0
    g.fillStyle = '#151232'
    g.font = 'bold 11px sans-serif'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText(STARS[n]!.name[0]!.slice(0, 1), x, y + 1)
    g.textAlign = 'left'
    g.textBaseline = 'alphabetic'
  })
  // 音符图例
  STARS.forEach((st, r) => {
    g.fillStyle = '#8a85b5'
    g.font = '12px "ZCOOL KuaiLe", sans-serif'
    g.fillText(`${st.name[0]} ${Math.round(st.freq)}Hz`, 12, gy + r * ch + 4)
  })
  // 页脚信息
  g.fillStyle = '#8a85b5'
  g.font = '13px monospace'
  g.fillText(`${Math.round(60000 / tempoMs.value)} BPM · ${new Date().toLocaleDateString('zh-CN')}`, 48, 452)
  g.fillStyle = '#ff9fce'
  g.fillText('✧ make a wish, press play', 620, 452)

  const url = cv.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = `starlight-card-${Date.now()}.png`
  a.click()
  sfx.ding()
  if (e) sparkleFromEvent(e, 8)
}

onBeforeUnmount(() => {
  stopPlay()
  cancelAnimationFrame(specRaf)
  if (litTimer) window.clearTimeout(litTimer)
  if (exportFailTimer) window.clearTimeout(exportFailTimer)
  // 关闭本页独立的 AudioContext（sfx.ts 的全局实例不归这里管）
  void ctx?.close().catch(() => {})
  ctx = null
  analyser = null
  specData = null
})

/* ---------- 像素频谱可视化 ---------- */
const specCanvas = ref<HTMLCanvasElement | null>(null)
let specRaf = 0

function drawSpec(): void {
  specRaf = requestAnimationFrame(drawSpec)
  const cv = specCanvas.value
  if (!cv) return
  const g = cv.getContext('2d')
  if (!g) return
  // 没在出声（没建音频链、已停止、页面切走）时不烧 rAF：清一次屏就歇着
  if (!analyser || !specData || !playing.value || document.hidden) {
    g.clearRect(0, 0, cv.width, cv.height)
    return
  }
  analyser.getByteFrequencyData(specData as Uint8Array<ArrayBuffer>)
  const W = cv.width
  const H = cv.height
  g.clearRect(0, 0, W, H)
  const bins = specData.length
  const cellW = 8
  const cols = Math.min(bins, Math.floor(W / cellW))
  for (let i = 0; i < cols; i++) {
    // 低频在前，取对数感：跳过纯静默高段
    const v = specData[i]! / 255
    const hPx = Math.max(v > 0.02 ? 4 : 0, Math.round(v * H))
    if (hPx <= 0) continue
    // 高度量化到 6px 网格 → 像素阶梯感
    const q = Math.max(1, Math.round(hPx / 6)) * 6
    for (let yy = 0; yy < q; yy += 6) {
      const frac = 1 - yy / H
      g.fillStyle = yy < 6 ? '#ffe3a8' : frac > 0.5 ? 'rgba(245,200,110,0.85)' : 'rgba(179,166,247,0.75)'
      g.fillRect(i * cellW + 1, H - yy - 6, cellW - 2, 4)
    }
  }
}

onMounted(() => {
  drawSpec()
})

/* ---------- 背景飘落星屑 ---------- */
const dust = Array.from({ length: 26 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  delay: `${(i % 9) * 0.9}s`,
  dur: `${7 + (i % 5)}s`,
}))

/** 加权抽签逻辑见 oracleArcade.ts；此处星屑纯 CSS 动画，无需额外 JS */
</script>

<template>
  <div class="page-root mb-page">
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
          stroke="var(--gold-bright)"
        />
        <!-- 星体 -->
        <g
          v-for="(s, i) in STARS"
          :key="i"
          class="star"
          :class="{ lit: litStar === i }"
          role="button"
          tabindex="0"
          :aria-label="`${L(s.name)} ${L(['演奏', 'play'])}`"
          @click="strike(s, $event)"
          @keydown.enter.prevent="strike(s)"
          @keydown.space.prevent="strike(s)"
        >
          <circle :cx="s.x" :cy="s.y" :r="18" class="halo" :style="{ animationDelay: i * 0.45 + 's' }" />
          <circle :cx="s.x" :cy="s.y" r="7" fill="var(--gold-bright)" class="core" />
          <text :x="s.x" :y="s.y + 30" text-anchor="middle" class="star-name">{{ L(s.name).split('·')[1] ?? '' }}</text>
        </g>
      </svg>

      <!-- 实时像素频谱（播放/点星时跳动） -->
      <canvas ref="specCanvas" width="640" height="52" class="spec-canvas" aria-hidden="true"></canvas>

      <!-- 作曲机 -->
      <div class="sequencer">
        <div class="seq-grid">
          <button
            v-for="(noteIdx, i) in sequence"
            :key="i"
            class="seq-cell"
            :class="{ active: currentStep === i, filled: noteIdx !== null }"
            :title="L(['每点一下升一个音，右键清掉', 'tap to raise the note, right-click to clear'])"
            :aria-label="L(['第', 'step']) + (i + 1) + L(['步', ': ']) + (noteIdx !== null ? STARS[noteIdx]!.name[0] : L(['空', 'rest']))"
            @click="cycleCell(i)"
            @contextmenu.prevent="clearCell(i)"
          >
            <i v-if="noteIdx !== null" class="note-dot" />
          </button>
        </div>
        <p class="seq-tip">{{ L([
          '每格点一下升一个音（宫→商→角→徵→羽→高宫→高商→休止），右键长按可清掉',
          'Each tap raises the step one pitch (Do→Re→Mi→Sol→La→Do↑→Re↑→rest); right-click clears',
        ]) }}</p>
        <p v-if="playing" class="hint" style="margin: 10px 0 0; text-align: center;">
          {{ L(['♪ 正在播放你的小曲…再点一次停止', '♪ Playing your tune… tap again to stop']) }}
        </p>
      </div>

      <ApprenticeReact module="musicbox" :score="playing ? 88 : 60" />
      <Transition name="fade-swap">
        <p v-if="exportFailed" class="export-err">{{ L([
          '这台浏览器不太配合，离线灌录失败了——换个 Chrome/Edge 试试',
          'Offline render failed in this browser — try Chrome or Edge',
        ]) }}</p>
      </Transition>
      <div class="mb-actions">
        <button class="btn ghost small" @click="generate($event)">{{ L(['换一首曲子', 'New tune']) }}</button>
        <button class="btn" @click="togglePlay">
          {{ playing ? L(['■ 停止', '■ Stop']) : L(['▶ 播放', '▶ Play']) }}
        </button>
        <button class="btn ghost small" :disabled="!sequence.some((s) => s !== null)" @click="saveTune">
          ✦ {{ L(['收藏这段', 'Save tune']) }}
        </button>
        <button class="btn ghost small" :disabled="!sequence.some((s) => s !== null) || exporting" @click="exportWav($event)">
          {{ exporting ? L(['正在灌录…', 'Rendering…']) : L(['导出 WAV', 'Export WAV']) }}
        </button>
        <button class="btn ghost small" :disabled="!sequence.some((s) => s !== null)" @click="exportCard($event)">
          {{ L(['星谱分享卡', 'Star-map card']) }}
        </button>
        <label class="tempo-ctl">
          ♪ {{ L(['节拍', 'Tempo']) }}
          <input type="range" min="180" max="520" step="20" v-model.number="tempoMs" @change="onTempoChange" />
        </label>
      </div>

      <!-- 旋律收藏架 -->
      <div v-if="savedTunes.length" class="tune-shelf">
        <span class="shelf-label">{{ L(['✦ 收藏的曲子', '✦ Saved tunes']) }}</span>
        <span
          v-for="(t, i) in savedTunes"
          :key="`${t.at}-${i}`"
          class="tune-chip"
          :title="L(['点按载入 · 右侧 ✕ 删除', 'click to load, ✕ to delete'])"
        >
          <button class="tune-load" @click="loadTune(t, $event)">♪ {{ t.name }}</button>
          <button class="tune-del" @click="removeTune(t.at)">✕</button>
        </span>
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
/* 星屑随文档流飘落（absolute + 相对定位根），避免滚动斜切时 fixed 层抖动 */
.mb-page { position: relative; overflow: hidden; }

.box-stage { position: relative; overflow: hidden; }
.sky-svg { width: 100%; max-width: 640px; display: block; margin: 0 auto; }

.star { cursor: pointer; }
.star .core { filter: drop-shadow(0 0 6px rgba(255, 227, 168, 0.9)); transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); transform-origin: center; transform-box: fill-box; }
.star:hover .core { transform: scale(1.5); }
/* 播放点亮：星星被奏响时放大爆闪 */
.star.lit .core {
  transform: scale(2.1);
  filter: drop-shadow(0 0 16px #fff) drop-shadow(0 0 30px rgba(255, 227, 168, 0.9));
}
.star.lit .halo { fill: rgba(255, 240, 200, 0.5); animation: none; }
.star.lit .star-name { fill: var(--gold-bright); opacity: 1; }

.spec-canvas {
  display: block;
  width: 100%;
  max-width: 640px;
  height: 52px;
  margin: 4px auto 0;
  image-rendering: pixelated;
  opacity: 0.95;
}

.tempo-ctl {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  color: var(--ink-dim);
}
.tempo-ctl input[type='range'] { width: 110px; accent-color: var(--gold); cursor: ew-resize; }

.tune-shelf {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 14px;
}
.shelf-label { font-size: 0.8rem; color: var(--ink-dim); }
.tune-chip {
  display: inline-flex;
  align-items: center;
  border: 1.5px solid rgba(245, 200, 110, 0.45);
  border-radius: 999px;
  overflow: hidden;
  animation: chip-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes chip-in { from { opacity: 0; transform: scale(0.7); } }
.tune-load {
  border: none;
  background: transparent;
  color: var(--gold-bright);
  padding: 5px 6px 5px 13px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.2s;
}
.tune-load:hover { background: rgba(245, 200, 110, 0.15); }
.tune-del {
  border: none;
  background: transparent;
  color: var(--ink-dim);
  padding: 5px 10px 5px 4px;
  cursor: pointer;
  font-size: 0.72rem;
}
.tune-del:hover { color: var(--danger); }
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
.seq-tip {
  margin: 8px 0 0;
  text-align: center;
  font-size: 0.72rem;
  color: var(--ink-dim);
  opacity: 0.75;
}
.export-err {
  margin: 10px auto 0;
  max-width: 380px;
  text-align: center;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1.5px dashed rgba(255, 159, 120, 0.55);
  color: #ffb98a;
  font-size: 0.85rem;
}
.fade-swap-enter-active { transition: all 0.25s ease; }
.fade-swap-enter-from { opacity: 0; transform: translateY(4px); }
.fade-swap-leave-active { transition: all 0.5s ease; }
.fade-swap-leave-to { opacity: 0; }
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
  position: absolute;
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
