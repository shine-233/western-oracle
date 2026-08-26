<script setup lang="ts">
/** 月相呼吸房：跟着月相节奏做一轮呼吸练习。三种节拍可换，星环胀缩驱动背景星尘明暗，完成点亮一颗星并累计。 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { moonPhase } from '../lib/astrology'
import { t } from '../lib/i18n'
import { L } from '../data/oracleArcade'
import { isSoundOn, sfx } from '../lib/sfx'
import { sparkleFromEvent } from '../lib/sparkle'
import DecryptTitle from '../components/DecryptTitle.vue'
import ApprenticeReact from '../components/ApprenticeReact.vue'

const phase = moonPhase()

/* ---------- 三种呼吸节拍 ---------- */
interface Step {
  key: string
  label: [string, string]
  secs: number
}
interface Pattern {
  id: string
  name: [string, string]
  glyph: string
  desc: [string, string]
  targetRounds: number
  steps: Step[]
}

const PATTERNS: Pattern[] = [
  {
    id: 'moon', name: ['月相呼吸', 'Moon breath'], glyph: '☾',
    desc: ['吸4 · 屏4 · 呼6 —— 跟着月相涨落，最经典的一套', 'in 4 · hold 4 · out 6 — follow the moon’s tide'],
    targetRounds: 3,
    steps: [
      { key: 'in', label: ['吸气', 'Breathe in'], secs: 4 },
      { key: 'hold', label: ['屏息', 'Hold'], secs: 4 },
      { key: 'out', label: ['呼气', 'Breathe out'], secs: 6 },
    ],
  },
  {
    id: 'sleep', name: ['安睡吐纳', 'Sleep 4-7-8'], glyph: '✧',
    desc: ['吸4 · 屏7 · 呼8 —— 拉长呼气哄神经系统入睡', 'in 4 · hold 7 · out 8 — the long exhale that lulls the nerves'],
    targetRounds: 4,
    steps: [
      { key: 'in', label: ['吸气', 'Breathe in'], secs: 4 },
      { key: 'hold', label: ['屏息', 'Hold'], secs: 7 },
      { key: 'out', label: ['缓呼', 'Slow out'], secs: 8 },
    ],
  },
  {
    id: 'box', name: ['方箱呼吸', 'Box breathing'], glyph: '□',
    desc: ['吸4 · 屏4 · 呼4 · 再屏4 —— 四边等长，稳住注意力', 'in 4 · hold 4 · out 4 · hold 4 — four equal sides for a steady mind'],
    targetRounds: 4,
    steps: [
      { key: 'in', label: ['吸气', 'Breathe in'], secs: 4 },
      { key: 'hold', label: ['屏息', 'Hold'], secs: 4 },
      { key: 'out', label: ['呼气', 'Breathe out'], secs: 4 },
      { key: 'hold2', label: ['虚抱', 'Hold empty'], secs: 4 },
    ],
  },
]

const patternIdx = ref(0)
const pat = computed(() => PATTERNS[patternIdx.value]!)
const steps = computed(() => pat.value.steps)

function pickPattern(i: number): void {
  stop()
  patternIdx.value = i
  sfx.blip()
}

/* ---------- 呼吸状态机 ---------- */
const round = ref(0) // 已完成的轮数
const stepIdx = ref(0)
const stepLeft = ref<number>(PATTERNS[0]!.steps[0]!.secs)
const running = ref(false)
let timer: number | null = null

const currentPhase = computed(() => steps.value[stepIdx.value % steps.value.length]!)
const ringScale = computed(() => {
  // 吸气时从 0.72 涨到 1，屏住保持 1，呼气/虚抱缩回去
  if (!running.value) return 1
  const p = currentPhase.value
  if (p.key === 'in') return 0.72 + (1 - stepLeft.value / p.secs) * 0.28
  if (p.key === 'hold') return 1
  return stepLeft.value / p.secs * 0.28 + 0.72
})
/** 星空亮度跟着呼吸走 */
const skyGlow = computed(() => (running.value ? 0.35 + (Number(ringScale) - 0.72) * 1.4 : 0.55))

function chime(freq: number): void {
  if (!isSoundOn()) return
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.001, ctx.currentTime)
    g.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.03)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2)
    osc.connect(g)
    g.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 1.3)
    window.setTimeout(() => ctx.close(), 1500)
  } catch {
    /* 音频不可用就算了 */
  }
}

function tickStep(): void {
  stepLeft.value -= 1
  if (stepLeft.value > 0) return
  const nextIdx = (stepIdx.value + 1) % steps.value.length
  if (nextIdx === 0) {
    round.value += 1
    awardStar()
    chime(523.3)
  } else {
    chime(nextIdx === 1 ? 392 : 440)
  }
  stepIdx.value = nextIdx
  stepLeft.value = steps.value[nextIdx]!.secs
}

function toggle(e?: MouseEvent): void {
  running.value = !running.value
  if (running.value) {
    stepIdx.value = 0
    stepLeft.value = steps.value[0]!.secs
    chime(392)
    timer = window.setInterval(tickStep, 1000)
  } else {
    stop()
  }
  if (e) sparkleFromEvent(e, 6)
}

function stop(): void {
  running.value = false
  if (timer !== null) window.clearInterval(timer)
  timer = null
}

onBeforeUnmount(() => {
  if (timer !== null) window.clearInterval(timer)
})

/* ---------- 累计星星（localStorage 持久化） ---------- */
interface BreathLog {
  total: number
  today: string
  todayCount: number
}
const LOG_KEY = 'wo.moonbreath'
function dayKey(d = new Date()): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}
function loadLog(): BreathLog {
  try {
    const raw = JSON.parse(localStorage.getItem(LOG_KEY) ?? 'null') as BreathLog | null
    if (raw && typeof raw.total === 'number') {
      return raw.today === dayKey() ? raw : { ...raw, today: dayKey(), todayCount: 0 }
    }
  } catch { /* ignore */ }
  return { total: 0, today: dayKey(), todayCount: 0 }
}
const log = ref<BreathLog>(loadLog())
function saveLog(): void {
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(log.value))
  } catch { /* ignore */ }
}
function awardStar(): void {
  log.value.total += 1
  if (log.value.today !== dayKey()) {
    log.value.today = dayKey()
    log.value.todayCount = 0
  }
  log.value.todayCount += 1
  saveLog()
}

/* 月相文案 */
const phaseLabel = computed(() => t(`moon.${phase.index}.name`))
</script>

<template>
  <div class="page-root">
    <h2><DecryptTitle :text="L(['月相呼吸房', 'Moon Breath Room'])" /></h2>
    <p class="hint">{{ L([
      `今夜是「${phaseLabel}」的时刻。挑一套节拍，跟着圆环一起呼吸。三轮之后，肩膀会先松下来。`,
      `Tonight belongs to "${phaseLabel}". Pick a rhythm and follow the ring. Three rounds and your shoulders drop first.`,
    ]) }}</p>

    <!-- 节拍选择 -->
    <div class="pattern-row">
      <button
        v-for="(p, i) in PATTERNS"
        :key="p.id"
        class="pat-chip"
        :class="{ active: patternIdx === i }"
        @click="pickPattern(i)"
      >
        <span class="pat-glyph">{{ p.glyph }}</span>
        <span class="pat-name">{{ L([p.name[0], p.name[1]]) }}</span>
        <small class="pat-desc">{{ L([p.desc[0], p.desc[1]]) }}</small>
      </button>
    </div>

    <section class="panel breath-stage">
      <!-- 月相徽章 + 累计 -->
      <div class="badge-row">
        <span class="moon-badge">{{ phase.emoji }} {{ phaseLabel }}</span>
        <span class="total-badge" title="累计完成的呼吸轮">✦ {{ log.total }}{{ log.todayCount > 0 ? ` · ${L(['今夜', 'tonight'])} ${log.todayCount}` : '' }}</span>
      </div>

      <!-- 呼吸环 -->
      <div class="ring-wrap">
        <div class="sky-dust" :style="{ opacity: Math.min(1, Math.max(0.15, skyGlow)) }" />
        <div class="halo-ring" :style="{ transform: `scale(${(Number(ringScale) || 1) * 1.35})` }" />
        <div class="breath-ring" :style="{ transform: `scale(${ringScale})` }">
          <span class="phase-word">{{ running ? L([currentPhase.label[0], currentPhase.label[1]]) : L(['准备好了吗', 'Ready?']) }}</span>
          <span v-if="running" class="count-num">{{ stepLeft }}</span>
          <span v-else class="count-num">☾</span>
        </div>
        <!-- 本轮目标的进度点 -->
        <div v-if="round > 0 || running" class="goal-dots">
          <i v-for="n in pat.targetRounds" :key="n" class="goal-dot" :class="{ done: n <= round }" />
        </div>
        <!-- 完成的星星 -->
        <div v-if="round > 0" class="earned-stars">
          <i v-for="n in Math.min(round, 12)" :key="n" class="earned-star" :style="{ animationDelay: n * 0.08 + 's' }">✦</i>
        </div>
      </div>

      <ApprenticeReact module="moonbreath" :score="Math.min(round * 34, 100)" />
      <button class="btn breath-btn" @click="toggle($event)">
        {{ running ? L(['停下来', 'Pause']) : L(['开始一轮', 'Begin a round']) }}
      </button>
      <Transition name="pop">
        <p v-if="round >= pat.targetRounds" class="done-note pop">
          {{ L([
            `${pat.targetRounds}轮完成，${log.todayCount}颗星进账。月亮看见了——去睡吧，或者去干点真正想干的。`,
            `${pat.targetRounds} rounds done, ${log.todayCount} stars banked. The moon saw it — go sleep, or go do the thing you truly want.`,
          ]) }}
        </p>
      </Transition>
    </section>
  </div>
</template>

<style scoped>
/* 节拍选择卡 */
.pattern-row { display: flex; gap: 10px; margin-top: 16px; flex-wrap: wrap; }
.pat-chip {
  flex: 1 1 180px;
  text-align: left;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1.5px solid rgba(179, 166, 247, 0.3);
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.pat-chip:hover { transform: translateY(-3px); border-color: rgba(179, 166, 247, 0.65); }
.pat-chip.active {
  border-color: var(--gold);
  background: color-mix(in srgb, var(--gold) 9%, transparent);
  box-shadow: 0 6px 18px rgba(245, 200, 110, 0.14);
}
.pat-glyph { font-size: 1.15rem; color: var(--gold-bright); margin-right: 7px; }
.pat-name { font-family: var(--cute); font-size: 0.95rem; color: var(--gold-bright); }
.pat-desc { display: block; margin-top: 5px; font-size: 0.72rem; line-height: 1.7; color: var(--ink-dim); }

.breath-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
}
.badge-row { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
.moon-badge, .total-badge {
  font-family: var(--pixel);
  font-size: 0.62rem;
  letter-spacing: 0.15em;
  color: var(--gold-bright);
  border: 1.5px solid rgba(245, 200, 110, 0.45);
  border-radius: 999px;
  padding: 5px 16px;
}
.total-badge { color: var(--lavender-soft); border-color: rgba(179, 166, 247, 0.45); }

.ring-wrap { position: relative; width: 300px; height: 300px; margin: 26px 0; display: grid; place-items: center; }
/* 背景星尘：随呼吸明暗 */
.sky-dust {
  position: absolute;
  inset: -60px;
  pointer-events: none;
  background-image:
    radial-gradient(1.5px 1.5px at 22% 30%, #ffe3a8 50%, transparent 51%),
    radial-gradient(1px 1px at 68% 18%, #fff 50%, transparent 51%),
    radial-gradient(1.8px 1.8px at 80% 62%, #cfc5ff 50%, transparent 51%),
    radial-gradient(1px 1px at 34% 74%, #ffe3a8 50%, transparent 51%),
    radial-gradient(1.2px 1.2px at 52% 46%, #fff 50%, transparent 51%),
    radial-gradient(1px 1px at 12% 58%, #cfc5ff 50%, transparent 51%),
    radial-gradient(1.4px 1.4px at 90% 36%, #ffe3a8 50%, transparent 51%),
    radial-gradient(1px 1px at 44% 92%, #fff 50%, transparent 51%);
  transition: opacity 1s linear;
}
.halo-ring {
  position: absolute;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(179, 166, 247, 0.22), transparent 65%);
  transition: transform 1s linear;
}
.breath-ring {
  width: 210px;
  height: 210px;
  border-radius: 50%;
  border: 3px solid var(--gold);
  background:
    radial-gradient(circle at 32% 28%, rgba(255, 255, 255, 0.14), transparent 50%),
    rgba(36, 29, 82, 0.9);
  box-shadow: 0 0 34px rgba(245, 200, 110, 0.35), inset 0 0 30px rgba(107, 91, 214, 0.4);
  display: grid;
  place-items: center;
  align-content: center;
  gap: 4px;
  transition: transform 1s linear;
}
.phase-word { font-family: var(--cute); color: var(--gold-bright); font-size: 1.15rem; letter-spacing: 0.2em; }
.count-num { font-family: var(--pixel); font-size: 1.5rem; color: #fff; }

.goal-dots { position: absolute; top: 2px; display: flex; gap: 8px; }
.goal-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  border: 1.5px solid rgba(245, 200, 110, 0.5);
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.goal-dot.done {
  background: var(--gold-bright);
  border-color: var(--gold-bright);
  box-shadow: 0 0 9px rgba(255, 227, 168, 0.85);
}

.earned-stars { position: absolute; bottom: 6px; display: flex; gap: 6px; }
.earned-star {
  color: var(--gold-bright);
  text-shadow: 0 0 10px rgba(255, 227, 168, 0.8);
  animation: star-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  font-style: normal;
}
@keyframes star-in { from { opacity: 0; transform: scale(0.3) rotate(-30deg); } }

.breath-btn { min-width: 160px; }

.pop-enter-active { transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.pop-enter-from { opacity: 0; transform: translateY(12px); }
.pop-leave-active { transition: all 0.15s ease; }
.pop-leave-to { opacity: 0; }

.done-note {
  max-width: 420px;
  text-align: center;
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1.5px dashed rgba(125, 232, 195, 0.5);
  color: var(--mint);
  line-height: 1.85;
}

@media (prefers-reduced-motion: reduce) {
  .breath-ring, .halo-ring { transition: none; }
  .sky-dust { transition: none; }
}
</style>
