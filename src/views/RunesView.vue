<script setup lang="ts">
import { computed, ref } from 'vue'
import { drawRunes, type Rune } from '../data/runes'
import { RUNE_POEM_OE } from '../data/runePoemOE'
import { askAI, isAiEnabled, oracleSystemPrompt } from '../lib/ai'
import { sparkle, sparkleFromEvent } from '../lib/sparkle'
import { sfx } from '../lib/sfx'

function poemOf(rune: Rune): { oe: string; en: string } | null {
  const p = RUNE_POEM_OE.find((x) => x.rune === rune.name)
  return p ? { oe: p.oe, en: p.en } : null
}

interface DrawnRune {
  rune: Rune
  reversed: boolean
}

const count = ref(3)
const allowReversed = ref(true)
const question = ref('')
const drawn = ref<DrawnRune[]>([])
const revealedStones = ref<boolean[]>([])
const aiText = ref<string | null>(null)
const aiLoading = ref(false)
const aiFailed = ref(false)

const allRevealed = computed(() => drawn.value.length > 0 && revealedStones.value.length > 0 && revealedStones.value.every(Boolean))

function draw(e?: MouseEvent): void {
  drawn.value = drawRunes(count.value, allowReversed.value)
  revealedStones.value = drawn.value.map(() => false)
  aiText.value = null
  aiFailed.value = false
  sfx.whoosh()
  if (e) sparkleFromEvent(e, 12)
}

function revealStone(i: number, e: MouseEvent): void {
  if (revealedStones.value[i]) return
  revealedStones.value[i] = true
  sfx.ding()
  sparkle(e.clientX, e.clientY, 8)
}

function revealAll(): void {
  revealedStones.value.forEach((_, i) => {
    setTimeout(() => {
      revealedStones.value[i] = true
      sfx.ding()
    }, 280 * i)
  })
}

function meaningOf(d: DrawnRune): string {
  if (!d.reversed) return d.rune.upright
  return d.rune.reversed ?? d.rune.upright + '（此符文无倒转义）'
}

const POSITIONS = ['境况', '挑战', '指引']

async function askAiInterpretation(): Promise<void> {
  if (!isAiEnabled() || drawn.value.length === 0 || aiLoading.value) return
  aiLoading.value = true
  aiFailed.value = false
  const lines = drawn.value.map((d, i) => {
    const pos = count.value === 1 ? '抽到的符文' : POSITIONS[i] ?? `第${i + 1}位`
    return `${pos}：${d.rune.name}（${d.rune.nameCn}，${d.reversed ? '倒转' : '正位'}；释义：${meaningOf(d)}）`
  })
  const payload = [
    question.value.trim() ? `提问者的问题：「${question.value.trim()}」` : '提问者没有具体问题，请做整体指引。',
    ...lines,
  ].join('\n')
  const res = await askAI(oracleSystemPrompt(), payload)
  if (res === null) aiFailed.value = true
  else aiText.value = res
  aiLoading.value = false
}
</script>

<template>
  <div class="page-root">
    <h2>卢恩符文占卜</h2>
  <p class="hint">古弗萨克（Elder Futhark）是北欧最古老的符文体系。静心默想问题，再从智慧之袋中抽取符文石。</p>

  <section class="panel" style="margin-top: 18px;">
    <div class="form-row">
      <label class="field">
        <span>抽取数量</span>
        <select v-model.number="count">
          <option :value="1">单颗 —— 直指核心</option>
          <option :value="3">三颗 —— 境况 · 挑战 · 指引</option>
        </select>
      </label>
      <label class="field">
        <span>你的问题（可选，用于 AI 解读）</span>
        <input v-model="question" type="text" maxlength="120" placeholder="例如：这次远行对我意味着什么？" />
      </label>
    </div>
    <div style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap;">
      <label class="toggle-row"><input v-model="allowReversed" type="checkbox" /> 启用倒转</label>
      <button class="btn" @click="draw($event)">探入符文袋 · 抽 {{ count }} 颗</button>
    </div>
  </section>

  <template v-if="drawn.length">
    <div style="display: flex; justify-content: flex-end; margin-top: 16px;">
      <button v-if="!allRevealed" class="btn ghost small" @click="revealAll">全部翻开</button>
    </div>
    <div class="rune-row">
      <figure
        v-for="(d, i) in drawn"
        :key="d.rune.name"
        class="rune-stone drop-in"
        :class="{ rev: d.reversed, open: revealedStones[i] }"
        :style="{ animationDelay: `${i * 130}ms` }"
        @click="revealStone(i, $event)"
      >
        <div class="stone-face" :class="{ flipped: revealedStones[i] }">
          <span v-if="!revealedStones[i]" class="mystery">✦</span>
          <span v-else class="glyph">{{ d.rune.glyph }}</span>
        </div>
        <figcaption v-if="revealedStones[i]" class="bounce-in">
          <strong>{{ d.rune.nameCn }}</strong>
          <small>{{ d.rune.name }} · {{ d.reversed ? '倒转' : '正位' }}</small>
          <p>{{ meaningOf(d) }}</p>
          <p v-if="poemOf(d.rune)" class="poem-quote">
            「{{ poemOf(d.rune)!.en }}」<br />
            <span class="poem-oe">{{ poemOf(d.rune)!.oe }}</span>
            <span class="poem-src">—— 盎格鲁-撒克逊卢恩诗，Dickins 英译 1915</span>
          </p>
        </figcaption>
        <figcaption v-else class="tap-hint">点一下揭晓</figcaption>
      </figure>
    </div>

    <div class="divider-star">✦ ✦ ✦</div>

    <section v-if="allRevealed" class="panel reading-panel">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0;">AI 综合解读</h3>
        <button v-if="!aiText" class="btn small" :disabled="aiLoading" @click="askAiInterpretation">
          {{ aiLoading ? '符文低语中…' : '开始解读' }}
        </button>
      </div>
      <div v-if="aiText" class="reading ai" style="margin-top: 14px;">{{ aiText }}</div>
      <p v-else-if="aiFailed" class="error-text" style="margin-bottom: 0;">AI 解读失败：请检查设置中的接口地址与密钥，或稍后重试。</p>
      <p v-else-if="!isAiEnabled()" class="hint" style="margin-bottom: 0;">在「设置」中配置 OpenAI 兼容接口的 API Key 即可启用 AI 解读。</p>
    </section>
  </template>
  </div>
</template>

<style scoped>
.rune-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 18px;
  margin-top: 14px;
}
.drop-in { animation: drop-in 0.55s cubic-bezier(0.34, 1.5, 0.64, 1) both; }
@keyframes drop-in {
  0% { opacity: 0; transform: translateY(-34px) scale(0.8); }
  100% { opacity: 1; transform: none; }
}
.rune-stone { cursor: pointer; text-align: center; margin: 0; user-select: none; }
.stone-face {
  width: 92px;
  height: 108px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0;
  background: linear-gradient(160deg, #4a4462, #2a2547);
  box-shadow: inset 0 0 0 3px #2e2650, inset 0 0 0 5px rgba(240, 230, 200, 0.18), 6px 6px 0 rgba(10, 8, 30, 0.6);
  border: 3px solid #2e2650;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.rune-stone:hover .stone-face { transform: translateY(-5px) rotate(-3deg); }
.rune-stone.open .stone-face { background: linear-gradient(160deg, #565075, #332d58); }
.glyph { font-size: 2.6rem; color: #f0e6c8; text-shadow: 0 2px 0 rgba(0, 0, 0, 0.6); }
.mystery {
  font-size: 1.8rem;
  color: var(--gold-bright);
  animation: mystery-pulse 1.6s ease-in-out infinite;
}
@keyframes mystery-pulse {
  0%, 100% { opacity: 0.4; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.15); }
}
.rune-stone.rev .stone-face .glyph { display: inline-block; transform: rotate(180deg); }
.rune-stone figcaption { margin-top: 12px; }
.rune-stone strong { color: var(--gold-bright); letter-spacing: 0.08em; }
.rune-stone small { display: block; color: var(--ink-dim); font-size: 0.78rem; margin: 3px 0 8px; }
.rune-stone p { font-size: 0.88rem; line-height: 1.75; color: var(--ink); margin: 0; }
.tap-hint { color: var(--ink-dim); opacity: 0.65; font-size: 0.8rem; }
.poem-quote {
  margin-top: 10px;
  padding: 10px 12px;
  background: rgba(13, 11, 32, 0.6);
  border-left: 3px solid var(--gold);
  font-size: 0.8rem;
  font-style: italic;
  color: var(--ink-dim);
  line-height: 1.8;
  text-align: left;
}
.poem-oe { font-style: normal; opacity: 0.8; font-size: 0.75rem; }
.poem-src { display: block; margin-top: 6px; font-size: 0.7rem; opacity: 0.6; font-style: normal; }
.reading-panel { margin-top: 26px; }
</style>
