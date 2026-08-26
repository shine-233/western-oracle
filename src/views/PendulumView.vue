<script setup lang="ts">
/** 灵摆占卜 v2：真实阻尼球摆物理（rAF 积分）。
 * 两种玩法：① 按住蓄力松手——答案先定后演，蓄力决定振幅与时长；
 * ② 直接抓住摆锤甩起来——往哪甩它就怎么答（前后=是 左右=否 斜着=画圈），全靠你手上的真实方向。
 * 运动带残影拖尾；判定后写入历史并召唤当值学徒点评。 */
import { computed, defineAsyncComponent, onBeforeUnmount, ref } from 'vue'
import { L } from '../data/oracleArcade'
import { sparkleFromEvent } from '../lib/sparkle'
import { sfx } from '../lib/sfx'
import { addHistory } from '../lib/history'
import ApprenticeReact from '../components/ApprenticeReact.vue'
import DecryptTitle from '../components/DecryptTitle.vue'

const MascotCard = defineAsyncComponent(() => import('../components/MascotCard.vue'))

type Answer = 'yes' | 'no' | 'wait'
type Phase = 'idle' | 'charging' | 'swinging' | 'verdict'

const phase = ref<Phase>('idle')
const question = ref('')
const chargeLevel = ref(0)
const answer = ref<Answer | null>(null)
const reactScore = ref(70)
const reactKey = ref(0)
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

/* ================= 物理引擎：阻尼球面单摆 ================= */
// 状态：th=离铅垂线夹角(rad)，ph=方位角(0=屏幕左右摆, PI/2=朝向/远离你的前后摆)
// om=dθ/dt，wp=dφ/dt。半隐式欧拉积分。
const LEN = 150 // 摆长像素
const G_L = 9.2 // g/L，决定固有周期
const DAMP_T = 0.62 // 角向阻尼
const DAMP_P = 0.34 // 方位阻尼

let th = 0.03
let ph = Math.PI / 2
let om = 0
let wp = 0
let raf = 0
/** 组件已卸载标志：拦截卸载后仍会触发的 window 指针回调 */
let disposed = false
let prevT = 0
let swingClock = 0 // 本轮摆动已持续秒数
let simActive = false
let trailTick = 0
let recorded = false

interface TrailDot { x: number; y: number }
const TRAIL_N = 22
let trailPool: HTMLElement[] = []
let trailData: TrailDot[] = []

const pendEl = ref<HTMLElement | null>(null)
const bobEl = ref<HTMLElement | null>(null)
const chainEl = ref<HTMLElement | null>(null)
const trailEl = ref<HTMLElement | null>(null)

function ensureTrailPool(): void {
  if (!trailEl.value || trailPool.length > 0) return
  for (let i = 0; i < TRAIL_N; i++) {
    const d = document.createElement('i')
    d.className = 'trail-dot'
    trailEl.value.appendChild(d)
    trailPool.push(d)
  }
}

function clearTrail(): void {
  trailData = []
  for (const d of trailPool) d.style.opacity = '0'
}

/** 物理推进一步 */
function integrate(dt: number): void {
  const st = Math.sin(th)
  const ct = Math.cos(th)
  const aTh = st * ct * wp * wp - G_L * st - DAMP_T * om
  const aPh = (-2 * om * wp * ct) / Math.max(st, 0.08) - DAMP_P * wp
  om += aTh * dt
  th += om * dt
  wp += aPh * dt
  if (th < 0) { th = -th; om *= -0.6 } // 摆线不可穿透
}

/** 把物理状态渲染到 DOM */
function render(): void {
  const sx = Math.sin(th) * Math.cos(ph)
  const dz = Math.sin(th) * Math.sin(ph) // >0 朝向你
  if (pendEl.value) {
    const deg = (Math.asin(Math.max(-0.94, Math.min(0.94, sx))) * 180) / Math.PI
    pendEl.value.style.transform = `rotate(${deg.toFixed(2)}deg)`
  }
  if (bobEl.value) {
    const depthY = dz * 16
    const sc = 1 + dz * 0.09
    bobEl.value.style.transform = `translateY(${depthY.toFixed(1)}px) scale(${sc.toFixed(3)})`
    bobEl.value.style.filter = `brightness(${(1 + Math.abs(dz) * 0.14).toFixed(2)})`
  }
  if (chainEl.value) {
    chainEl.value.style.opacity = String(0.9 - Math.abs(dz) * 0.18)
  }
}

function sampleTrail(): void {
  if (!trailEl.value || !bobEl.value) return
  ensureTrailPool()
  const br = bobEl.value.getBoundingClientRect()
  const tr = trailEl.value.getBoundingClientRect()
  trailData.push({ x: br.left + br.width / 2 - tr.left, y: br.top + br.height / 2 - tr.top })
  if (trailData.length > TRAIL_N) trailData.shift()
  trailData.forEach((p, i) => {
    const d = trailPool[i]
    if (!d) return
    const f = (i + 1) / trailData.length
    d.style.left = `${p.x}px`
    d.style.top = `${p.y}px`
    d.style.opacity = String(f * 0.4)
    d.style.transform = `translate(-50%,-50%) scale(${(0.4 + f * 0.6).toFixed(2)})`
  })
}

function loop(t: number): void {
  raf = requestAnimationFrame(loop)
  if (!simActive || prevT === 0) { prevT = t; return }
  let dt = (t - prevT) / 1000
  prevT = t
  if (dt > 0.05) dt = 0.05
  if (dragging) { render(); return }

  // 子步进积分，稳
  const steps = 3
  for (let i = 0; i < steps; i++) integrate(dt / steps)
  swingClock += dt
  render()
  if (++trailTick % 2 === 0) sampleTrail()

  // 能量衰减到位 → 出判定
  const energy = Math.abs(om) + Math.abs(wp) * Math.sin(th)
  if (!recorded && swingClock > 1.2 && ((energy < 0.22 && Math.abs(th) < 0.16) || swingClock > 6.5)) {
    finishReading()
  }
}

function startSim(): void {
  if (simActive || disposed) return
  simActive = true
  prevT = 0
  swingClock = 0
  recorded = false
  clearTrail()
  if (!raf) raf = requestAnimationFrame(loop)
}

/* ================= 蓄力玩法（答案先定后演） ================= */
/** window 级兜底：指针拖出按钮/被元素接管时也能松手 */
let fallbackUp: (() => void) | null = null

function armFallbackRelease(): void {
  disarmFallbackRelease()
  fallbackUp = () => doRelease()
  window.addEventListener('pointerup', fallbackUp, { once: true })
  window.addEventListener('pointercancel', fallbackUp, { once: true })
}
function disarmFallbackRelease(): void {
  if (fallbackUp !== null) {
    window.removeEventListener('pointerup', fallbackUp)
    window.removeEventListener('pointercancel', fallbackUp)
    fallbackUp = null
  }
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
  armFallbackRelease()
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
  if (phase.value !== 'charging') return
  disarmFallbackRelease()
  if (chargeTimer !== null) window.clearInterval(chargeTimer)
  chargeTimer = null
  const power = chargeLevel.value / 100
  const roll = Math.random()
  const hasQuestion = question.value.trim().length > 0
  const ans: Answer =
    roll < (hasQuestion ? 0.42 : 0.34) ? 'yes' : roll < (hasQuestion ? 0.78 : 0.68) ? 'no' : 'wait'
  answer.value = ans
  // 用真实初条件"演"出这个答案：蓄力越满，振幅越大
  const amp = 0.38 + power * 0.5
  if (ans === 'yes') { th = amp; ph = Math.PI / 2; om = 0; wp = 0 }
  else if (ans === 'no') { th = amp; ph = 0; om = 0; wp = 0 }
  else { th = amp * 0.66; ph = 0; om = 0.9 + power; wp = 1.5 + power * 1.3 }
  beginSwing(e)
}

function beginSwing(e?: MouseEvent): void {
  phase.value = 'swinging'
  sfx.whoosh()
  if (e) sparkleFromEvent(e, 8)
  startSim()
}

/* ================= 抓住甩动玩法（方向即答案） ================= */
let dragging = false
let grabbed = false
let startX = 0
let startY = 0
let hist: Array<{ t: number; x: number; y: number }> = []

function onBobDown(e: PointerEvent): void {
  if (phase.value !== 'idle' && phase.value !== 'verdict') return
  dragging = true
  grabbed = false
  startX = e.clientX
  startY = e.clientY
  hist = [{ t: performance.now(), x: e.clientX, y: e.clientY }]
  phase.value = 'idle'
  answer.value = null
  window.addEventListener('pointermove', onBobMove)
  window.addEventListener('pointerup', onBobUp, { once: true })
  // 移动端：系统抢走手势（滚动/来电）时必须松手，否则 dragging 永久卡死
  window.addEventListener('pointercancel', onBobCancel, { once: true })
  e.preventDefault()
}

function onBobMove(e: PointerEvent): void {
  if (!dragging) return
  const dx = e.clientX - startX
  const dy = e.clientY - startY
  if (!grabbed && Math.hypot(dx, dy) < 6) return
  grabbed = true
  hint.value = false
  // r 必须留在 asin 定义域内（曾因上限 1.15 导致 NaN 冻结整条物理链）
  const r = Math.min(0.995, Math.hypot(dx, dy * 0.75) / LEN)
  th = Math.asin(r)
  ph = Math.atan2(dy * 0.75, dx)
  hist.push({ t: performance.now(), x: e.clientX, y: e.clientY })
  if (hist.length > 6) hist.shift()
  render()
}

function onBobCancel(): void {
  window.removeEventListener('pointermove', onBobMove)
  if (disposed || !dragging) return
  dragging = false
  if (!grabbed) return
  // 系统打断：不给初速度，让摆从当前位置自然衰减出"再等等"
  om = Math.sign(Math.sin(th)) * 0.5
  wp = 0
  answer.value = 'wait'
  beginSwing()
}

function onBobUp(e: PointerEvent): void {
  window.removeEventListener('pointermove', onBobMove)
  window.removeEventListener('pointercancel', onBobCancel)
  if (disposed || !dragging) return
  dragging = false
  if (!grabbed) return // 单击：交给宠物/其他逻辑
  const now = performance.now()
  const a = hist[0]!
  const b = hist[hist.length - 1]!
  const dt = Math.max(16, now - b.t) / 1000
  const vx = (b.x - a.x) / ((b.t - a.t) / 1000 || dt)
  const vy = (b.y - a.y) / ((b.t - a.t) / 1000 || dt)
  const speed = Math.hypot(vx, vy)
  const ax = Math.abs(vx)
  const ay = Math.abs(vy)
  let ans: Answer
  if (speed < 60) ans = 'wait'
  else if (ax > ay * 1.45) ans = 'no'
  else if (ay > ax * 1.45) ans = 'yes'
  else ans = 'wait'
  answer.value = ans
  // 把手上速度转成真实初速度
  if (ans === 'no') { ph = 0; wp = 0; om = Math.sign(vx) * Math.min(2.4, ax / 130) }
  else if (ans === 'yes') { ph = Math.PI / 2; wp = 0; om = Math.sign(vy) * Math.min(2.4, ay / 130) }
  else { th = Math.max(th, 0.32); om = 0.6; wp = (vx * vy >= 0 ? 1 : -1) * Math.min(2.2, 0.9 + speed / 260) }
  beginSwing(e as unknown as MouseEvent)
}

/* ================= 判定与收尾 ================= */
const pet = ref<InstanceType<typeof MascotCard> | null>(null)

function finishReading(): void {
  if (recorded) return
  recorded = true
  phase.value = 'verdict'
  sfx.ding()
  // 手机上给一下触觉反馈（不支持的设备静默跳过）
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(24)
  const ans = (answer.value ?? 'wait') as Answer
  reactScore.value = ans === 'yes' ? 86 : ans === 'no' ? 42 : 26
  reactKey.value++
  pet.value?.celebrate()
  const v = VERDICTS[ans]
  addHistory({
    type: 'pendulum',
    label: L([`灵摆 · ${v.zh.split(' —— ')[1] ?? ''}`, `Pendulum · ${(v.en.split('— ')[1] ?? v.en).trim()}`]),
    question: question.value.trim() || undefined,
    summary: L([`${v.zh}${question.value.trim() ? `：「${question.value.trim()}」` : ''}`,
      `${v.en}${question.value.trim() ? `: "${question.value.trim()}"` : ''}`]),
    detail: [
      L([question.value.trim() ? `问题：${question.value.trim()}` : '（开放一问）',
        question.value.trim() ? `Question: ${question.value.trim()}` : '(open question)']),
      L([v.zh, v.en]),
      L([v.zhLine, v.enLine]),
    ].join('\n'),
  })
}

const swingHint = computed(() => {
  if (phase.value === 'charging') return L(['保持专注……松手即提问', 'Stay focused… release to ask'])
  if (phase.value === 'swinging') return L(['它在回答……', 'It is answering…'])
  return ''
})

onBeforeUnmount(() => {
  disposed = true
  if (raf) cancelAnimationFrame(raf)
  raf = 0
  simActive = false
  if (chargeTimer !== null) window.clearInterval(chargeTimer)
  disarmFallbackRelease()
  window.removeEventListener('pointermove', onBobMove)
  window.removeEventListener('pointerup', onBobUp)
  window.removeEventListener('pointercancel', onBobCancel)
})

const hint = ref(true)

const verdict = computed(() => (answer.value ? VERDICTS[answer.value] : null))
</script>

<template>
  <div class="page-root">
    <h2><DecryptTitle :text="L(['灵摆占卜', 'Pendulum Oracle'])" /></h2>
    <p class="hint">{{ L([
      '两种问法：按住蓄力再松手，或者直接揪住摆锤朝想问的方向甩——前后为是，左右为否，斜着画圈。这回它是真听物理话的。',
      'Two ways to ask: hold to charge and release, or grab the bob and fling it — forth-back is yes, sideways is no, diagonal circles for wait. This time the physics is real.',
    ]) }}</p>

    <div class="pend-layout">
      <!-- 灵摆舞台 -->
      <section class="panel stage">
        <i class="stage-ripple" aria-hidden="true" />
        <i class="stage-ripple r2" aria-hidden="true" />
        <div class="pend-wrap">
          <div ref="pendEl" class="pendulum" :class="'phase-' + phase" @pointerdown.stop>
            <div ref="chainEl" class="chain" />
            <div
              ref="bobEl"
              class="bob"
              @pointerdown="onBobDown"
              :style="{ cursor: phase === 'idle' || phase === 'verdict' ? 'grab' : 'default' }"
            >
              <span class="bob-glyph">☾</span>
            </div>
          </div>
          <div ref="trailEl" class="trail-layer" aria-hidden="true" />
        </div>
        <div class="charge-bar" aria-hidden="true">
          <i :style="{ width: chargeLevel + '%' }" />
        </div>

        <!-- 常驻按钮：v-if 会在按下瞬间把元素移除，导致 pointerup 永远丢失（死锁 bug）。
             改为 v-show 保持挂载，并另挂 window 级兜底释放。 -->
        <button
          v-show="phase === 'idle' || phase === 'verdict' || phase === 'charging'"
          class="btn charge-btn"
          :class="{ dim: phase !== 'idle' && phase !== 'verdict' }"
          @pointerdown="startCharge($event)"
          @pointerup="release($event)"
          @pointerleave="onPointerLeave($event)"
          @keydown.space.prevent="startCharge()"
          @keyup.space.prevent="release()"
        >
          {{ L(['按住蓄力 · 松手发问', 'Hold to charge · release to ask']) }}
        </button>
        <p v-if="swingHint" class="hint charging-tip">{{ swingHint }}</p>
        <p class="drag-hint">{{ L([
          '手痒的话，也可以直接揪住月亮石甩出去',
          'Or just grab the moonstone and fling it',
        ]) }}</p>
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

        <ApprenticeReact v-if="phase === 'verdict'" :key="reactKey" module="pendulum" :score="reactScore" />
      </section>
    </div>

    <MascotCard ref="pet" id="twins" :height="210" />
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
  position: relative;
  overflow: hidden;
}

/* 模块氛围：灵摆底下的占卜涟漪（与全局星野区分开） */
.stage-ripple {
  position: absolute;
  bottom: -60px;
  left: 50%;
  width: 340px;
  height: 120px;
  transform: translateX(-50%);
  border-radius: 50%;
  border: 1.5px solid color-mix(in srgb, var(--lavender) 30%, transparent);
  animation: stage-wave 4.5s ease-out infinite;
  pointer-events: none;
}
.stage-ripple.r2 { animation-delay: 2.2s; }
@keyframes stage-wave {
  0% { opacity: 0; transform: translateX(-50%) scale(0.55); }
  25% { opacity: 0.7; }
  100% { opacity: 0; transform: translateX(-50%) scale(1.35); }
}
@media (prefers-reduced-motion: reduce) {
  .stage-ripple { animation: none; opacity: 0.25; }
}

.pend-wrap { position: relative; width: 220px; height: 250px; }
.trail-layer { position: absolute; inset: 0; pointer-events: none; overflow: visible; }
:deep(.trail-dot) {
  position: absolute;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--gold-bright);
  box-shadow: 0 0 8px rgba(255, 215, 110, 0.85);
  opacity: 0;
  pointer-events: none;
}

.pendulum {
  position: absolute;
  left: 50%;
  top: 0;
  width: 160px;
  height: 240px;
  margin-left: -80px;
  transform-origin: top center;
  will-change: transform;
}
.chain {
  position: absolute;
  left: 50%;
  top: 12px;
  width: 2px;
  height: 154px;
  transform: translateX(-50%);
  background: linear-gradient(color-mix(in srgb, var(--lavender) 15%, transparent), var(--gold));
  transition: opacity 0.2s;
}
.bob {
  position: absolute;
  left: 50%;
  top: 162px;
  width: 52px;
  height: 52px;
  margin-left: -26px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, var(--lavender), var(--void-2));
  border: 3px solid rgba(245, 200, 110, 0.8);
  box-shadow: 0 0 22px rgba(255, 215, 110, 0.45);
  display: grid;
  place-items: center;
  touch-action: none;
  transition: filter 0.2s;
}
.bob:active { cursor: grabbing !important; }
.bob-glyph { font-size: 1.5rem; color: #ffe3a8; pointer-events: none; }

/* 待机轻晃（仅视觉，物理待命时叠加） */
.pendulum.phase-idle { animation: idle-sway 3.6s ease-in-out infinite; }
@keyframes idle-sway { 0%, 100% { transform: rotate(-1.6deg); } 50% { transform: rotate(1.6deg); } }

/* 蓄力抖动 */
.pendulum.phase-charging { animation: charge-jitter 0.12s linear infinite; }
@keyframes charge-jitter {
  0%, 100% { transform: translateX(-1.5px); }
  50% { transform: translateX(1.5px); }
}

.charge-bar {
  width: 200px;
  height: 8px;
  margin: 18px 0 10px;
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
.drag-hint {
  font-family: var(--pixel);
  font-size: 0.55rem;
  letter-spacing: 0.1em;
  color: var(--ink-dim);
  opacity: 0.8;
  animation: hint-bob 2.2s ease-in-out infinite;
}
@keyframes hint-bob { 50% { transform: translateY(-4px); } }

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
  /* 判定卡像摆锤落定：轻晃两下停住，不用全站通用的弹跳曲线 */
  animation: verdict-sway 0.75s cubic-bezier(0.22, 1, 0.36, 1);
}
@keyframes verdict-sway {
  from { opacity: 0; transform: translateY(10px) rotate(-1.6deg); }
  55% { transform: translateY(0) rotate(0.9deg); }
  to { opacity: 1; transform: rotate(0deg); }
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
  .pendulum.phase-idle, .pendulum.phase-charging { animation: none !important; }
  .drag-hint { animation: none; }
}
</style>
