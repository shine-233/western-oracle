<script setup lang="ts">
/** 月相呼吸房：跟着月相节奏做一轮 4-4-6 呼吸，星环随呼吸胀缩，完成一轮点亮一颗星。 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { moonPhase } from '../lib/astrology'
import { t } from '../lib/i18n'
import { L } from '../data/oracleArcade'
import { isSoundOn } from '../lib/sfx'
import { sparkleFromEvent } from '../lib/sparkle'
import DecryptTitle from '../components/DecryptTitle.vue'

const phase = moonPhase()

/* ---------- 呼吸节拍：吸4s - 屏4s - 呼6s ---------- */
const PHASES = [
  { key: 'in', label: ['吸气', 'Breathe in'], secs: 4 },
  { key: 'hold', label: ['屏息', 'Hold'], secs: 4 },
  { key: 'out', label: ['呼气', 'Breathe out'], secs: 6 },
] as const

const round = ref(0) // 已完成的轮数
const stepIdx = ref(0)
const stepLeft = ref<number>(PHASES[0]!.secs)
const running = ref(false)
let timer: number | null = null

const currentPhase = computed(() => PHASES[stepIdx.value % 3]!)
const ringScale = computed(() => {
  // 吸气时从 0.72 涨到 1，屏住保持 1，呼气缩回去
  if (!running.value) return 1
  const p = currentPhase.value
  if (p.key === 'in') return 0.72 + (1 - stepLeft.value / p.secs) * 0.28
  if (p.key === 'hold') return 1
  return stepLeft.value / p.secs * 0.28 + 0.72
})

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
  const nextIdx = (stepIdx.value + 1) % 3
  if (nextIdx === 0) {
    round.value += 1
    chime(523.3)
  } else {
    chime(nextIdx === 1 ? 392 : 440)
  }
  stepIdx.value = nextIdx
  stepLeft.value = PHASES[nextIdx]!.secs
}

function toggle(e?: MouseEvent): void {
  running.value = !running.value
  if (running.value) {
    stepIdx.value = 0
    stepLeft.value = PHASES[0]!.secs
    chime(392)
    timer = window.setInterval(tickStep, 1000)
  } else {
    if (timer !== null) window.clearInterval(timer)
    timer = null
  }
  if (e) sparkleFromEvent(e, 6)
}

onBeforeUnmount(() => {
  if (timer !== null) window.clearInterval(timer)
})

/* 月相文案 */
const phaseLabel = computed(() => t(`moon.${phase.index}.name`))
</script>

<template>
  <div class="page-root">
    <h2><DecryptTitle :text="L(['月相呼吸房', 'Moon Breath Room'])" /></h2>
    <p class="hint">{{ L([
      `今夜是「${phaseLabel}」的时刻。跟着圆环一起：吸 4 秒、停 4 秒、呼 6 秒。三轮之后，肩膀会先松下来。`,
      `Tonight belongs to "${phaseLabel}". Follow the ring: in for 4, hold for 4, out for 6. Three rounds and your shoulders drop first.`,
    ]) }}</p>

    <section class="panel breath-stage">
      <!-- 月相徽章 -->
      <span class="moon-badge">{{ phase.emoji }} {{ phaseLabel }}</span>

      <!-- 呼吸环 -->
      <div class="ring-wrap">
        <div class="halo-ring" :style="{ transform: `scale(${(Number(ringScale) || 1) * 1.35})` }" />
        <div class="breath-ring" :style="{ transform: `scale(${ringScale})` }">
          <span class="phase-word">{{ running ? L([currentPhase.label[0], currentPhase.label[1]]) : L(['准备好了吗', 'Ready?']) }}</span>
          <span v-if="running" class="count-num">{{ stepLeft }}</span>
          <span v-else class="count-num">☾</span>
        </div>
        <!-- 完成的星星 -->
        <div v-if="round > 0" class="earned-stars">
          <i v-for="n in Math.min(round, 12)" :key="n" class="earned-star" :style="{ animationDelay: n * 0.08 + 's' }">✦</i>
        </div>
      </div>

      <button class="btn breath-btn" @click="toggle($event)">
        {{ running ? L(['停下来', 'Pause']) : L(['开始一轮', 'Begin a round']) }}
      </button>
      <p v-if="round >= 3" class="done-note pop">
        {{ L(['三轮完成。月亮看见了——去睡吧，或者去干点真正想干的。', 'Three rounds done. The moon saw it — go sleep, or go do the thing you truly want.']) }}
      </p>
    </section>
  </div>
</template>

<style scoped>
.breath-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
}
.moon-badge {
  font-family: var(--pixel);
  font-size: 0.62rem;
  letter-spacing: 0.15em;
  color: var(--gold-bright);
  border: 1.5px solid rgba(245, 200, 110, 0.45);
  border-radius: 999px;
  padding: 5px 16px;
}

.ring-wrap { position: relative; width: 300px; height: 300px; margin: 26px 0; display: grid; place-items: center; }
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

.earned-stars { position: absolute; bottom: 6px; display: flex; gap: 6px; }
.earned-star {
  color: var(--gold-bright);
  text-shadow: 0 0 10px rgba(255, 227, 168, 0.8);
  animation: star-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  font-style: normal;
}
@keyframes star-in { from { opacity: 0; transform: scale(0.3) rotate(-30deg); } }

.breath-btn { min-width: 160px; }

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
}
</style>
