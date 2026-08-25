<script setup lang="ts">
/** 灵摆占卜：按住蓄力 → 放手摆动 → 判读倾向。纯前端动画，答案先定后演（经典灵摆手法）。 */
import { computed, ref } from 'vue'
import { L } from '../data/oracleArcade'
import { sparkleFromEvent } from '../lib/sparkle'
import { sfx } from '../lib/sfx'
import DecryptTitle from '../components/DecryptTitle.vue'

type Answer = 'yes' | 'no' | 'wait'
type Phase = 'idle' | 'charging' | 'swinging' | 'verdict'

const phase = ref<Phase>('idle')
const question = ref('')
const chargeLevel = ref(0)
const answer = ref<Answer | null>(null)
let chargeTimer: number | null = null

const VERDICTS: Record<Answer, { zh: string; en: string; zhLine: string; enLine: string; cls: string }> = {
  yes: {
    zh: '前后摆 —— 是', en: 'Swing forth-back — YES',
    zhLine: '灵摆顺着你的方向去了。放手做，风是顺的。',
    enLine: 'The pendulum walked your way. Go for it; the wind agrees.',
    cls: 'yes',
  },
  no: {
    zh: '左右摆 —— 否', en: 'Swing left-right — NO',
    zhLine: '它在横着挡你。不是不行，是这扇门现在不开。',
    enLine: 'It blocks sideways: not never, just not this door today.',
    cls: 'no',
  },
  wait: {
    zh: '画圈 —— 再等等', en: 'Circling — not yet',
    zhLine: '答案还在路上转圈。信息不全的时候，不动比乱动聪明。',
    enLine: 'The answer is still circling in. With partial info, waiting beats guessing.',
    cls: 'wait',
  },
}

function startCharge(e?: MouseEvent): void {
  if (phase.value !== 'idle' && phase.value !== 'verdict') return
  answer.value = null
  phase.value = 'charging'
  chargeLevel.value = 0
  sfx.riffle()
  chargeTimer = window.setInterval(() => {
    chargeLevel.value = Math.min(100, chargeLevel.value + 7)
  }, 90)
  void e
}

function release(e?: MouseEvent): void {
  if (phase.value !== 'charging') return
  doRelease(e)
}

function onPointerLeave(e?: MouseEvent): void {
  if (phase.value === 'charging') doRelease(e)
}

function doRelease(e?: MouseEvent): void {
  if (chargeTimer !== null) window.clearInterval(chargeTimer)
  chargeTimer = null
  // 先定答案，动画只是演出
  const roll = Math.random()
  const hasQuestion = question.value.trim().length > 0
  answer.value = roll < (hasQuestion ? 0.42 : 0.34) ? 'yes' : roll < (hasQuestion ? 0.78 : 0.68) ? 'no' : 'wait'
  phase.value = 'swinging'
  sfx.whoosh()
  if (e) sparkleFromEvent(e, 8)
  window.setTimeout(() => {
    phase.value = 'verdict'
    sfx.ding()
  }, 3400)
}

const swingClass = computed(() => {
  if (phase.value === 'charging') return 'charging'
  if (phase.value === 'swinging' || phase.value === 'verdict') {
    return answer.value === 'yes' ? 'swing-v' : answer.value === 'no' ? 'swing-h' : 'swing-circle'
  }
  return ''
})

const verdict = computed(() => (answer.value ? VERDICTS[answer.value] : null))
</script>

<template>
  <div class="page-root">
    <h2><DecryptTitle :text="L(['灵摆占卜', 'Pendulum Oracle'])" /></h2>
    <p class="hint">{{ L([
      '闭眼默念你的问题，按住灵摆蓄力——越专注，充得越满。松手，它自己会回答：前后为是，左右为否，画圈就是再等等。',
      'Hold your question in mind, press and hold the pendulum to charge it, then release. Forth-back means yes, left-right means no, circling means wait.',
    ]) }}</p>

    <div class="pend-layout">
      <!-- 灵摆舞台 -->
      <section class="panel stage">
        <div class="pendulum" :class="[swingClass, 'phase-' + phase]" @pointerdown.stop>
          <div class="chain" />
          <div class="bob">
            <span class="bob-glyph">☾</span>
          </div>
        </div>
        <div class="charge-bar" aria-hidden="true">
          <i :style="{ width: chargeLevel + '%' }" />
        </div>

        <button
          v-if="phase === 'idle' || phase === 'verdict'"
          class="btn"
          @pointerdown="startCharge($event)"
          @pointerup="release($event)"
          @pointerleave="onPointerLeave($event)"
        >
          {{ L(['✊ 按住蓄力 · 松手发问', '✊ Hold to charge · release to ask']) }}
        </button>
        <p v-else-if="phase === 'charging'" class="hint charging-tip">
          {{ L(['保持专注……松手即提问', 'Stay focused… release to ask']) }}
        </p>
      </section>

      <!-- 问题与判读 -->
      <section class="panel side-panel">
        <label class="field">
          <span>{{ L(['你的是非题（可选）', 'Your yes-no question (optional)']) }}</span>
          <input
            v-model="question"
            type="text"
            maxlength="80"
            :placeholder="L(['比如：今天适合主动联系他吗？', 'e.g. Should I reach out today?'])"
            :disabled="phase === 'charging' || phase === 'swinging'"
          />
        </label>

        <!-- 读法说明 -->
        <ul class="legend">
          <li><i class="dot dot-yes" />{{ L(['前后摆动 = 是，顺着来', 'Forth-back = yes, flow with it']) }}</li>
          <li><i class="dot dot-no" />{{ L(['左右摆动 = 否，先缓缓', 'Left-right = no, ease off']) }}</li>
          <li><i class="dot dot-wait" />{{ L(['画圈 = 时机未到，别急', 'Circles = not yet, no rush']) }}</li>
        </ul>

        <Transition name="pop">
          <div v-if="phase === 'verdict' && verdict" class="verdict-card" :class="verdict.cls">
            <strong>{{ L([verdict.zh, verdict.en]) }}</strong>
            <p>{{ L([verdict.zhLine, verdict.enLine]) }}</p>
            <small v-if="question.trim()">「{{ question.trim() }}」</small>
          </div>
        </Transition>
      </section>
    </div>
  </div>
</template>

<style scoped>
.pend-layout {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) minmax(280px, 1fr);
  gap: 20px;
  margin-top: 18px;
}
@media (max-width: 780px) { .pend-layout { grid-template-columns: 1fr; } }

.stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 380px;
}

.pendulum {
  position: relative;
  width: 160px;
  height: 240px;
  transform-origin: top center;
}
.chain {
  position: absolute;
  left: 50%;
  top: 12px;
  width: 2px;
  height: 150px;
  transform: translateX(-50%);
  background: linear-gradient(rgba(179, 166, 247, 0.15), var(--gold));
}
.bob {
  position: absolute;
  left: 50%;
  top: 158px;
  width: 52px;
  height: 52px;
  margin-left: -26px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #6b5bd6, #241d52);
  border: 3px solid rgba(245, 200, 110, 0.8);
  box-shadow: 0 0 22px rgba(255, 215, 110, 0.45);
  display: grid;
  place-items: center;
}
.bob-glyph { font-size: 1.5rem; color: #ffe3a8; }

/* 待机轻晃 */
.pendulum.phase-idle { animation: idle-sway 3.6s ease-in-out infinite; }
@keyframes idle-sway { 0%, 100% { transform: rotate(-1.6deg); } 50% { transform: rotate(1.6deg); } }

/* 蓄力抖动 */
.pendulum.charging { animation: charge-jitter 0.12s linear infinite; }
@keyframes charge-jitter {
  0%, 100% { transform: translateX(-1.5px); }
  50% { transform: translateX(1.5px); }
}

/* 三种答案的摆法 */
.pendulum.swing-v { animation: swing-vertical 1.15s ease-in-out infinite; }
@keyframes swing-vertical {
  0%, 100% { transform: rotateX(0deg) translateY(0); }
  25% { transform: rotateX(24deg) translateY(-4px); }
  75% { transform: rotateX(-24deg) translateY(-4px); }
}
.pendulum.swing-h { animation: swing-horizontal 1.15s ease-in-out infinite; }
@keyframes swing-horizontal {
  0%, 100% { transform: rotate(16deg); }
  50% { transform: rotate(-16deg); }
}
.pendulum.swing-circle { animation: swing-circle 1.5s linear infinite; }
@keyframes swing-circle {
  0% { transform: translateX(14px) rotate(9deg); }
  25% { transform: translateX(0) rotate(0) translateY(-8px); }
  50% { transform: translateX(-14px) rotate(-9deg); }
  75% { transform: translateX(0) rotate(0) translateY(-8px); }
}

.charge-bar {
  width: 200px;
  height: 8px;
  margin: 18px 0 16px;
  border-radius: 999px;
  background: rgba(13, 11, 32, 0.85);
  border: 1px solid rgba(179, 166, 247, 0.35);
  overflow: hidden;
}
.charge-bar i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--mint), var(--gold), var(--pink));
  transition: width 0.09s linear;
}
.charging-tip { color: var(--gold-bright); }

.side-panel .field { display: block; }
.legend { list-style: none; padding: 0; margin: 16px 0; display: flex; flex-direction: column; gap: 10px; }
.legend li { display: flex; align-items: center; gap: 10px; color: var(--ink-dim); font-size: 0.88rem; }
.dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.dot-yes { background: var(--mint); box-shadow: 0 0 8px var(--mint); }
.dot-no { background: var(--pink); box-shadow: 0 0 8px var(--pink); }
.dot-wait { background: var(--lavender); box-shadow: 0 0 8px var(--lavender); }

.verdict-card {
  padding: 16px 18px;
  border-radius: 12px;
  line-height: 1.9;
  animation: chip-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.verdict-card strong { display: block; font-family: var(--cute); font-weight: 400; font-size: 1.15rem; margin-bottom: 6px; }
.verdict-card p { margin: 0; font-size: 0.92rem; }
.verdict-card small { display: block; margin-top: 8px; opacity: 0.65; }
.verdict-card.yes { border: 2px solid var(--mint); background: rgba(125, 232, 195, 0.08); }
.verdict-card.no { border: 2px solid var(--pink); background: rgba(255, 159, 206, 0.08); }
.verdict-card.wait { border: 2px solid var(--lavender); background: rgba(179, 166, 247, 0.08); }

.pop-enter-active { transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
.pop-enter-from { opacity: 0; transform: translateY(12px) scale(0.94); }
.pop-leave-active { transition: all 0.15s ease; }
.pop-leave-to { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .pendulum.idle-sway, .pendulum.charging,
  .pendulum.swing-v, .pendulum.swing-h, .pendulum.swing-circle { animation: none !important; }
}
@media (prefers-reduced-motion: reduce) {
  .phase-idle { animation: none !important; }
}
</style>
