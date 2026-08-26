<script setup lang="ts">
/** 奇趣占卜坊：占卜骰子（CSS 3D）· 命运转盘 · 神签求签 */
import { computed, ref } from 'vue'
import {
  PLANET_FACES,
  REALM_FACES,
  WHEEL_SECTORS,
  diceReading,
  drawOracleSlip,
  L,
  type DieFace,
  type FortuneRank,
  type OracleSlip,
} from '../data/oracleArcade'
import { sparkleFromEvent } from '../lib/sparkle'
import { sfx } from '../lib/sfx'
import DecryptTitle from '../components/DecryptTitle.vue'

type Tab = 'dice' | 'wheel' | 'sortition'
const tab = ref<Tab>('dice')

const RANK_LABEL: Record<FortuneRank, [string, string]> = {
  blessed: ['星佑', 'Star-Blessed'],
  favored: ['眷顾', 'Favored'],
  quiet: ['静好', 'Quiet Grace'],
  turning: ['逆转', 'The Turning'],
}

function switchTab(next: Tab): void {
  tab.value = next
  sfx.blip()
}

/* ---------- 占卜骰子 ---------- */
// 六个面的"归位"角度：让指定面朝向观众
const FACE_ROT: Array<[number, number]> = [
  [0, 0],
  [0, 180],
  [0, -90],
  [0, 90],
  [-90, 0],
  [90, 0],
]

const planetRot = ref({ x: -20, y: -30 })
const realmRot = ref({ x: -20, y: 30 })
const rolling = ref(false)
const dicePair = ref<{ p: DieFace; r: DieFace } | null>(null)

function rollDice(e?: MouseEvent): void {
  if (rolling.value) return
  rolling.value = true
  dicePair.value = null
  sfx.riffle()
  const pi = Math.floor(Math.random() * 6)
  const ri = Math.floor(Math.random() * 6)
  applyRoll(planetRot, pi)
  applyRoll(realmRot, ri)
  if (e) sparkleFromEvent(e, 8)
  window.setTimeout(() => {
    dicePair.value = { p: PLANET_FACES[pi]!, r: REALM_FACES[ri]! }
    sfx.ding()
    rolling.value = false
  }, 1500)
}

function applyRoll(rot: typeof planetRot, idx: number): void {
  const [fx, fy] = FACE_ROT[idx]!
  const tx = 360 * (2 + Math.floor(Math.random() * 2))
  const ty = 360 * (2 + Math.floor(Math.random() * 2))
  // 保证累计角度一直增大，转起来才像真的在翻滚
  rot.value = {
    x: rot.value.x - (rot.value.x % 360) + fx + tx + 360,
    y: rot.value.y - (rot.value.y % 360) + fy + ty + 360,
  }
}

/* ---------- 命运转盘 ---------- */
const SECTOR_ANGLE = 360 / WHEEL_SECTORS.length
const wheelRot = ref(0)
const spinning = ref(false)
const wheelResult = ref<number | null>(null)

const wheelPath = computed(() =>
  WHEEL_SECTORS.map((s, i) => {
    const a0 = (i * SECTOR_ANGLE - 90 - SECTOR_ANGLE / 2) * (Math.PI / 180)
    const a1 = a0 + SECTOR_ANGLE * (Math.PI / 180)
    const cx = 110
    const cy = 110
    const rr = 96
    const x0 = cx + rr * Math.cos(a0)
    const y0 = cy + rr * Math.sin(a0)
    const x1 = cx + rr * Math.cos(a1)
    const y1 = cy + rr * Math.sin(a1)
    return { d: `M ${cx} ${cy} L ${x0} ${y0} A ${rr} ${rr} 0 0 1 ${x1} ${y1} Z`, color: s.color }
  }),
)

function spinWheel(e?: MouseEvent): void {
  if (spinning.value) return
  spinning.value = true
  wheelResult.value = null
  sfx.whoosh()
  const pick = Math.floor(Math.random() * WHEEL_SECTORS.length)
  // 指针在正上方：让第 pick 扇区停到 -90° 位置
  const targetMod = (360 - pick * SECTOR_ANGLE) % 360
  const currentMod = ((wheelRot.value % 360) + 360) % 360
  let delta = targetMod - currentMod
  delta = ((delta % 360) + 360) % 360
  wheelRot.value += 360 * (4 + Math.floor(Math.random() * 3)) + delta + (Math.random() * SECTOR_ANGLE * 0.5 - SECTOR_ANGLE * 0.25)
  if (e) sparkleFromEvent(e, 6)
  window.setTimeout(() => {
    wheelResult.value = pick
    sfx.ding()
    spinning.value = false
  }, 4200)
}

/* ---------- 神签 ---------- */
const shaking = ref(false)
const slip = ref<OracleSlip | null>(null)

function shakeBox(e?: MouseEvent): void {
  if (shaking.value) return
  slip.value = null
  shaking.value = true
  sfx.riffle()
  window.setTimeout(() => {
    shaking.value = false
    slip.value = drawOracleSlip()
    sfx.ding()
    if (e) sparkleFromEvent(e, 10)
  }, 900)
}
</script>

<template>
  <div class="page-root">
    <h2><DecryptTitle :text="L(['奇趣占卜坊', 'Oracle Arcade'])" /></h2>
    <p class="hint">{{ L([
      '三件小玩具，不问大事，专治无聊和纠结。手感好不好，掷了才知道。',
      'Three pocket oracles for boredom and tiny dilemmas — feel first, think later.',
    ]) }}</p>

    <!-- 页签 -->
    <div class="arcade-tabs">
      <button class="arcade-tab" :class="{ active: tab === 'dice' }" @click="switchTab('dice')">🎲 {{ L(['占卜骰子', 'Dice']) }}</button>
      <button class="arcade-tab" :class="{ active: tab === 'wheel' }" @click="switchTab('wheel')">🎡 {{ L(['命运转盘', 'Wheel']) }}</button>
      <button class="arcade-tab" :class="{ active: tab === 'sortition' }" @click="switchTab('sortition')">🏺 {{ L(['德尔斐神签', 'Delphic Lots']) }}</button>
    </div>

    <!-- 骰子 -->
    <section v-if="tab === 'dice'" class="panel arcade-panel bounce-in">
      <div class="dice-stage">
        <div class="die-wrap">
          <div class="cube" :style="{ transform: `rotateX(${planetRot.x}deg) rotateY(${planetRot.y}deg)` }">
            <div v-for="(f, i) in PLANET_FACES" :key="'p' + i" class="cube-face planet-face">{{ f.glyph }}<small>{{ f.zh }}</small></div>
          </div>
          <span class="die-name">{{ L(['行星骰', 'Planet die']) }}</span>
        </div>
        <span class="dice-x">×</span>
        <div class="die-wrap">
          <div class="cube" :style="{ transform: `rotateX(${realmRot.x}deg) rotateY(${realmRot.y}deg)` }">
            <div v-for="(f, i) in REALM_FACES" :key="'r' + i" class="cube-face realm-face">{{ f.glyph }}<small>{{ f.zh }}</small></div>
          </div>
          <span class="die-name">{{ L(['领域骰', 'Realm die']) }}</span>
        </div>
      </div>
      <div class="arcade-actions">
        <button class="btn" :disabled="rolling" @click="rollDice($event)">
          {{ rolling ? L(['翻滚中…', 'Tumbling…']) : L(['掷一把', 'Roll it']) }}
        </button>
      </div>
      <Transition name="pop">
        <p v-if="dicePair" class="reading dice-result">{{ diceReading(dicePair.p, dicePair.r) }}</p>
      </Transition>
    </section>

    <!-- 转盘 -->
    <section v-if="tab === 'wheel'" class="panel arcade-panel bounce-in">
      <div class="wheel-stage">
        <div class="wheel-pointer">▼</div>
        <svg viewBox="0 0 220 220" class="wheel-svg" :style="{ transform: `rotate(${wheelRot}deg)` }">
          <path v-for="(seg, i) in wheelPath" :key="i" :d="seg.d" :fill="seg.color" opacity="0.28" stroke="#2e2650" stroke-width="1.5" />
          <text
            v-for="(s, i) in WHEEL_SECTORS"
            :key="'t' + i"
            :x="110 + 62 * Math.cos(((i * SECTOR_ANGLE - 90) * Math.PI) / 180)"
            :y="110 + 62 * Math.sin(((i * SECTOR_ANGLE - 90) * Math.PI) / 180)"
            text-anchor="middle"
            dominant-baseline="central"
            class="wheel-label"
          >{{ s.emoji }}</text>
          <circle cx="110" cy="110" r="12" fill="#2e2650" stroke="#f5c86e" stroke-width="2" />
        </svg>
      </div>
      <div class="arcade-actions">
        <button class="btn" :disabled="spinning" @click="spinWheel($event)">
          {{ spinning ? L(['命运旋转中…', 'Destiny spinning…']) : L(['转动命运', 'Spin it']) }}
        </button>
      </div>
      <Transition name="pop">
        <div v-if="wheelResult !== null" class="reading wheel-result">
          <strong>{{ WHEEL_SECTORS[wheelResult]!.emoji }} {{ L([WHEEL_SECTORS[wheelResult]!.zh, WHEEL_SECTORS[wheelResult]!.en]) }}</strong>
          <p>{{ L([WHEEL_SECTORS[wheelResult]!.zhLine, WHEEL_SECTORS[wheelResult]!.enLine]) }}</p>
        </div>
      </Transition>
    </section>

    <!-- 德尔斐神签 -->
    <section v-if="tab === 'sortition'" class="panel arcade-panel bounce-in">
      <p class="hint" style="margin-top: 0;">{{ L(['古希腊德尔斐圣所的抽签占卜（Cleromancy）：心念一事，从圣签筒中抽出你的神谕。', 'Cleromancy at Delphi: hold a question in mind, then draw your lot from the sacred urn.']) }}</p>
      <div class="omi-stage">
        <div class="omi-box" :class="{ shake: shaking }" @click="shakeBox($event)">
          <div class="omi-sticks"><i v-for="n in 9" :key="n" /></div>
          <span class="omi-hole">{{ L(['摇一摇', 'shake me']) }}</span>
        </div>
      </div>
      <Transition name="pop">
        <div v-if="slip" class="omi-slip" :class="'rank-' + slip.rank">
          <strong class="omi-rank">{{ L(RANK_LABEL[slip.rank]) }}</strong>
          <p class="omi-poem">{{ L([slip.zhPoem, slip.enPoem]) }}</p>
          <p class="omi-advice">{{ L([slip.zhAdvice, slip.enAdvice]) }}</p>
          <small class="omi-lucky">✧ {{ L(['幸运方位与时刻', 'Lucky direction & hour']) }}：{{ slip.lucky }}</small>
        </div>
      </Transition>
      <div class="arcade-actions">
        <button class="btn ghost small" @click="shakeBox($event)">
          {{ slip ? L(['再抽一支', 'Draw another lot']) : L(['抽一支神签', 'Draw a lot']) }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.arcade-tabs { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 16px; }
.arcade-tab {
  font-family: var(--cute);
  font-size: 0.95rem;
  padding: 9px 18px;
  border-radius: 999px;
  border: 2px solid rgba(179, 166, 247, 0.4);
  background: rgba(21, 18, 50, 0.7);
  color: var(--ink-dim);
  cursor: pointer;
  transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.arcade-tab:hover { transform: translateY(-2px); color: var(--gold-bright); }
.arcade-tab.active { border-color: var(--gold); color: var(--gold-bright); background: rgba(245, 200, 110, 0.12); }

.arcade-panel { margin-top: 16px; padding: 26px; }

/* ---- 骰子 ---- */
.dice-stage { display: flex; gap: 30px; justify-content: center; align-items: center; flex-wrap: wrap; perspective: 700px; }
.die-wrap { display: flex; flex-direction: column; align-items: center; gap: 14px; }
.die-name { font-family: var(--pixel); font-size: 0.55rem; letter-spacing: 0.15em; color: var(--pink-soft); }
.dice-x { font-family: var(--cute); font-size: 1.8rem; color: var(--gold); }
.cube {
  position: relative;
  width: 92px;
  height: 92px;
  transform-style: preserve-3d;
  transition: transform 1.45s cubic-bezier(0.18, 0.9, 0.24, 1.05);
}
.cube-face {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 2px;
  font-size: 2rem;
  color: #fff;
  background: linear-gradient(145deg, #37306e, #241d52);
  border: 2px solid rgba(245, 200, 110, 0.65);
  border-radius: 12px;
  backface-visibility: hidden;
  box-shadow: inset 0 0 18px rgba(0, 0, 0, 0.5);
}
.cube-face small { font-size: 0.68rem; opacity: 0.75; }
.realm-face { border-color: rgba(125, 232, 195, 0.6); }
.cube-face:nth-child(1) { transform: translateZ(46px); }
.cube-face:nth-child(2) { transform: rotateY(180deg) translateZ(46px); }
.cube-face:nth-child(3) { transform: rotateY(90deg) translateZ(46px); }
.cube-face:nth-child(4) { transform: rotateY(-90deg) translateZ(46px); }
.cube-face:nth-child(5) { transform: rotateX(90deg) translateZ(46px); }
.cube-face:nth-child(6) { transform: rotateX(-90deg) translateZ(46px); }

.arcade-actions { display: flex; justify-content: center; margin-top: 22px; }
.dice-result { text-align: center; margin: 16px auto 0; max-width: 480px; }

/* ---- 转盘 ---- */
.wheel-stage { position: relative; width: 240px; margin: 0 auto; }
.wheel-pointer {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  font-size: 1.4rem;
  color: var(--gold-bright);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6));
}
.wheel-svg {
  width: 100%;
  transition: transform 4.1s cubic-bezier(0.12, 0.8, 0.16, 1);
  filter: drop-shadow(0 10px 26px rgba(0, 0, 0, 0.45));
}
.wheel-label { font-size: 20px; }
.wheel-result { text-align: center; margin: 16px auto 0; max-width: 460px; }
.wheel-result strong { color: var(--gold-bright); font-family: var(--cute); font-weight: 400; font-size: 1.1rem; }
.wheel-result p { margin: 6px 0 0; }

/* ---- 神签 ---- */
.omi-stage { display: flex; justify-content: center; }
.omi-box {
  width: 130px;
  height: 160px;
  border-radius: 14px 14px 40px 40px;
  background: linear-gradient(160deg, #b0433c, #7c2a28);
  border: 3px solid #2e2650;
  box-shadow: inset 0 0 24px rgba(0, 0, 0, 0.35), 0 12px 26px rgba(0, 0, 0, 0.4);
  display: grid;
  place-items: center;
  cursor: pointer;
  user-select: none;
}
.omi-box:hover { filter: brightness(1.08); }
.omi-box.shake { animation: omi-shake 0.16s linear infinite; }
@keyframes omi-shake {
  0%, 100% { transform: rotate(-4deg) translateY(0); }
  50% { transform: rotate(4deg) translateY(-5px); }
}
.omi-sticks { display: flex; gap: 5px; height: 70px; align-items: flex-end; }
.omi-sticks i {
  width: 7px;
  border-radius: 4px 4px 0 0;
  background: linear-gradient(#ffe3a8, #c9a24f);
  animation: stick-bob 3s ease-in-out infinite;
}
.omi-sticks i:nth-child(odd) { height: 58px; animation-delay: 0.4s; }
.omi-sticks i:nth-child(even) { height: 70px; }
@keyframes stick-bob { 50% { transform: translateY(-3px); } }
.omi-hole {
  position: absolute;
  margin-top: 120px;
  font-family: var(--pixel);
  font-size: 0.55rem;
  color: #ffe3a8;
  letter-spacing: 0.2em;
}
.omi-slip {
  margin: 20px auto 0;
  max-width: 420px;
  background: #fff6ec;
  color: #2e2650;
  border-radius: 10px;
  padding: 20px 22px;
  text-align: center;
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.45);
}
.omi-slip.rank-daikichi { border-top: 6px solid #e0483e; }
.omi-slip.rank-kichi { border-top: 6px solid #e09a3e; }
.omi-slip.rank-suekichi { border-top: 6px solid #6ba36b; }
.omi-slip.rank-kyo { border-top: 6px solid #5a6bd6; }
.omi-rank { font-family: var(--cute); font-size: 1.5rem; letter-spacing: 0.3em; display: block; }
.omi-poem { font-style: italic; margin: 10px 0 6px; opacity: 0.85; }
.omi-advice { margin: 0; line-height: 1.8; }
.omi-lucky { display: block; margin-top: 10px; opacity: 0.6; }

.pop-enter-active { transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
.pop-enter-from { opacity: 0; transform: translateY(14px) scale(0.92); }
.pop-leave-active { transition: all 0.15s ease; }
.pop-leave-to { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .cube, .wheel-svg, .omi-box.shake, .omi-sticks i { animation: none !important; transition-duration: 0.01s !important; }
}
</style>
