<script setup lang="ts">
/**
 * 记忆闪回 · 四十秒挑战：微游戏第二弹。
 * 和街机页「记忆圣殿」的差别：限时 40 秒、连击加成、时间奖励——
 * 追求手感与心跳，不追求大盘慢筛。最高分存本机。
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { locale } from '../lib/i18n'
import { sfx } from '../lib/sfx'
import { loadJSON, saveJSON, migrateRaw } from '../lib/storage'
import { shuffle } from '../lib/random'

const L = (p: [string, string]): string => (locale.value === 'zh' ? p[0]! : p[1]!)

interface Cell {
  uid: number
  glyph: string
  open: boolean
  done: boolean
}

const GLYPHS = ['✦', '☽', '☉', '♃', 'ᛟ', '☄']
const ROUND_SECS = 40
const BEST_KEY = 'memflash-best'
// 历史上误存成 wo-wo-memflash-best，搬一次家
migrateRaw('wo-wo-memflash-best', BEST_KEY)

const deck = ref<Cell[]>([])
const started = ref(false)
const over = ref(false)
const won = ref(false)
const timeLeft = ref(ROUND_SECS)
const score = ref(0)
const combo = ref(0)
const bestCombo = ref(0)
const best = ref<number | null>(loadJSON<number | null>(BEST_KEY, null))
const picked = ref<number[]>([])
const lock = ref(false)

let timer = 0
let uidSeq = 0

const pairsLeft = computed(() => deck.value.filter((c) => !c.done).length / 2)

function newRound(): void {
  const cells: Cell[] = []
  for (const g of GLYPHS) {
    for (let k = 0; k < 2; k++) cells.push({ uid: uidSeq++, glyph: g, open: false, done: false })
  }
  deck.value = shuffle(cells)
  picked.value = []
  lock.value = false
  started.value = true
  over.value = false
  won.value = false
  score.value = 0
  combo.value = 0
  bestCombo.value = 0
  timeLeft.value = ROUND_SECS
  sfx.whoosh()
  if (timer) window.clearInterval(timer)
  timer = window.setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) finish()
  }, 1000)
}

function finish(): void {
  if (!started.value || over.value) return
  window.clearInterval(timer)
  timer = 0
  over.value = true
  won.value = pairsLeft.value === 0
  if (won.value) {
    score.value += timeLeft.value * 20
    sfx.ding()
  } else {
    sfx.toggle()
  }
  if (best.value === null || score.value > best.value) {
    best.value = score.value
    saveJSON(BEST_KEY, score.value)
  }
}

function flip(i: number): void {
  if (lock.value || over.value) return
  const c = deck.value[i]
  if (!c || c.open || c.done) return
  c.open = true
  sfx.blip()
  picked.value.push(i)
  if (picked.value.length < 2) return
  const [a, b] = [picked.value[0]!, picked.value[1]!]
  picked.value = []
  const ca = deck.value[a]!
  const cb = deck.value[b]!
  if (ca.glyph === cb.glyph) {
    ca.done = true
    cb.done = true
    combo.value++
    bestCombo.value = Math.max(bestCombo.value, combo.value)
    score.value += 100 + (combo.value - 1) * 25
    sfx.ding()
    if (pairsLeft.value === 0) finish()
  } else {
    combo.value = 0
    lock.value = true
    window.setTimeout(() => {
      ca.open = false
      cb.open = false
      lock.value = false
    }, 620)
  }
}

const verdict = computed(() =>
  won.value
    ? L([`清盘！剩 ${timeLeft.value} 秒，手气与记性俱佳。`, `Cleared with ${timeLeft.value}s to spare — sharp memory, sharp luck.`])
    : L([`时间到，还差 ${pairsLeft.value} 对。牌都记住了，下次就是你的。`, `Time. ${pairsLeft.value} pair(s) short. The cards know you now — next run is yours.`]),
)

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer)
})
</script>

<template>
  <div class="mf-root">
    <div class="mf-hud">
      <span>⏱ <strong :class="{ low: started && !over && timeLeft <= 10 }">{{ started ? timeLeft : ROUND_SECS }}s</strong></span>
      <span>✧ {{ L(['得分', 'Score']) }} <strong>{{ score }}</strong></span>
      <span>🔥 {{ L(['连击', 'Combo']) }} <strong>×{{ combo }}</strong></span>
      <span v-if="best !== null">🏆 {{ L(['最佳', 'Best']) }} <strong>{{ best }}</strong></span>
      <button class="btn ghost small" @click="newRound">
        {{ started && !over ? L(['重开一局', 'Restart']) : L(['开始挑战', 'Start']) }}
      </button>
    </div>

    <div class="mf-grid" :class="{ dim: !started || over }">
      <button
        v-for="(c, i) in deck"
        :key="c.uid"
        class="mf-card"
        :class="{ up: c.open || c.done, done: c.done }"
        :disabled="!started || over"
        :aria-label="c.open || c.done ? c.glyph : L(['扣着的星符', 'Face-down glyph'])"
        @click="flip(i)"
      >
        <span class="mf-inner">
          <span class="face back">✧</span>
          <span class="face front">{{ c.glyph }}</span>
        </span>
      </button>
    </div>

    <Transition name="pop">
      <p v-if="over" class="mf-verdict">{{ verdict }}</p>
    </Transition>
    <p v-if="!started" class="mf-hint">{{ L(['六对星符，四十秒。连着配对有加成，翻错连击归零。', 'Six pairs, forty seconds. Chain matches for bonuses; one miss resets the combo.']) }}</p>
  </div>
</template>

<style scoped>
.mf-hud {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 14px;
  color: var(--ink-dim);
  font-size: 0.9rem;
}
.mf-hud strong { color: var(--gold-bright); font-family: var(--cute); }
.mf-hud strong.low { color: var(--danger, #ff8a8a); animation: mf-pulse 1s ease-in-out infinite; }
@keyframes mf-pulse { 50% { opacity: 0.45; } }

.mf-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(64px, 92px));
  gap: 10px;
  justify-content: center;
  transition: opacity 0.3s;
}
.mf-grid.dim { opacity: 0.45; }
.mf-card {
  aspect-ratio: 3 / 4;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  perspective: 520px;
}
.mf-card:disabled { cursor: default; }
.mf-inner {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.45s cubic-bezier(0.34, 1.2, 0.4, 1);
}
.mf-card.up .mf-inner { transform: rotateY(180deg); }
.face {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  backface-visibility: hidden;
  border-radius: 10px;
  font-size: 1.7rem;
}
.face.back {
  background:
    radial-gradient(circle at 50% 38%, color-mix(in srgb, var(--pink) 20%, transparent), transparent 60%),
    repeating-linear-gradient(45deg, #221d4e 0 6px, #191542 6px 12px);
  border: 2px solid #2e2650;
  color: rgba(245, 200, 110, 0.5);
}
.face.front {
  transform: rotateY(180deg);
  background: #241f47;
  border: 2px solid var(--gold);
  color: var(--gold-bright);
  text-shadow: 0 0 12px rgba(255, 215, 110, 0.55);
}
.mf-card.done .face.front { border-color: var(--mint); color: var(--mint); opacity: 0.75; }
.mf-verdict {
  text-align: center;
  margin: 16px auto 0;
  max-width: 460px;
  padding: 10px 14px;
  border: 1.5px dashed var(--gold);
  border-radius: 10px;
  color: var(--ink);
}
.mf-hint { text-align: center; margin-top: 12px; color: var(--ink-dim); font-size: 0.85rem; }
.pop-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.pop-enter-from { opacity: 0; transform: translateY(10px) scale(0.95); }
@media (max-width: 480px) {
  .mf-grid { grid-template-columns: repeat(4, minmax(58px, 1fr)); gap: 8px; }
  .face { font-size: 1.3rem; }
}
@media (prefers-reduced-motion: reduce) {
  .mf-inner { transition-duration: 0.01s; }
  .mf-hud strong.low { animation: none; }
}
</style>
