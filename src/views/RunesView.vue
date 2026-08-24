<script setup lang="ts">
import { ref } from 'vue'
import { drawRunes, type Rune } from '../data/runes'
import { askAI, isAiEnabled, oracleSystemPrompt } from '../lib/ai'
import { sparkleFromEvent } from '../lib/sparkle'

interface DrawnRune {
  rune: Rune
  reversed: boolean
}

const count = ref(3)
const allowReversed = ref(true)
const question = ref('')
const drawn = ref<DrawnRune[]>([])
const revealed = ref(false)
const aiText = ref<string | null>(null)
const aiLoading = ref(false)
const aiFailed = ref(false)

function draw(e?: MouseEvent): void {
  drawn.value = drawRunes(count.value, allowReversed.value)
  revealed.value = false
  aiText.value = null
  aiFailed.value = false
  if (e) sparkleFromEvent(e, 12)
  setTimeout(() => (revealed.value = true), 60)
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
    <div class="rune-row" :class="{ show: revealed }">
      <figure v-for="d in drawn" :key="d.rune.name" class="rune-stone" :class="{ rev: d.reversed }">
        <div class="stone-face">
          <span class="glyph">{{ d.rune.glyph }}</span>
        </div>
        <figcaption>
          <strong>{{ d.rune.nameCn }}</strong>
          <small>{{ d.rune.name }} · {{ d.reversed ? '倒转' : '正位' }}</small>
          <p>{{ meaningOf(d) }}</p>
        </figcaption>
      </figure>
    </div>

    <div class="divider-star">✦ ✦ ✦</div>

    <section class="panel reading-panel">
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
  margin-top: 30px;
  opacity: 0;
  transform: translateY(14px);
  transition: all 0.8s ease;
}
.rune-row.show { opacity: 1; transform: none; }
.stone-face {
  width: 92px;
  height: 108px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: linear-gradient(160deg, #4a4462, #2a2547);
  box-shadow: inset 0 2px 6px rgba(255, 255, 255, 0.12), inset 0 -4px 10px rgba(0, 0, 0, 0.5), 0 6px 16px rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(212, 175, 106, 0.35);
}
.glyph { font-size: 2.6rem; color: #f0e6c8; text-shadow: 0 1px 0 rgba(0, 0, 0, 0.6); }
.rune-stone.rev .stone-face .glyph { display: inline-block; transform: rotate(180deg); }
.rune-stone figcaption { text-align: center; margin-top: 12px; }
.rune-stone strong { color: var(--gold-bright); letter-spacing: 0.08em; }
.rune-stone small { display: block; color: var(--ink-dim); font-size: 0.78rem; margin: 3px 0 8px; }
.rune-stone p { font-size: 0.88rem; line-height: 1.75; color: var(--ink); margin: 0; }
.reading-panel { margin-top: 26px; }
</style>
