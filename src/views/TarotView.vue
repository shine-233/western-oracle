<script setup lang="ts">
import { computed, ref } from 'vue'
import { ALL_CARDS, SPREADS, type SpreadDef, type TarotCard } from '../data/tarot'
import { randInt, shuffle } from '../lib/random'
import { askAI, isAiEnabled, oracleSystemPrompt } from '../lib/ai'
import TarotCardItem from '../components/TarotCardItem.vue'

interface DrawnCard {
  card: TarotCard
  reversed: boolean
  flipped: boolean
}

const spread = ref<SpreadDef>(SPREADS[1]!)
const question = ref('')
const allowReversed = ref(true)
const drawn = ref<DrawnCard[]>([])
const aiText = ref<string | null>(null)
const aiLoading = ref(false)
const aiFailed = ref(false)

const allFlipped = computed(() => drawn.value.length > 0 && drawn.value.every((d) => d.flipped))

function draw(): void {
  const picked = shuffle(ALL_CARDS).slice(0, spread.value.positions.length)
  drawn.value = picked.map((card) => ({
    card,
    reversed: allowReversed.value && randInt(2) === 0,
    flipped: false,
  }))
  aiText.value = null
  aiFailed.value = false
}

function flipAll(): void {
  drawn.value.forEach((d, i) => {
    setTimeout(() => (d.flipped = true), 220 * i)
  })
}

function meaningOf(d: DrawnCard): string {
  return d.reversed ? d.card.reversed : d.card.upright
}

const ruleReading = computed(() => {
  if (!allFlipped.value) return ''
  return drawn.value
    .map((d, i) => {
      const pos = spread.value.positions[i] ?? `第${i + 1}张`
      return `【${pos}】${d.card.nameCn}${d.reversed ? ' · 逆位' : ''}\n关键词：${d.card.keywords.join(' / ')}\n${meaningOf(d)}`
    })
    .join('\n\n')
})

async function askAiInterpretation(): Promise<void> {
  if (!isAiEnabled() || !allFlipped.value || aiLoading.value) return
  aiLoading.value = true
  aiFailed.value = false
  aiText.value = null

  const lines = drawn.value.map((d, i) => {
    const pos = spread.value.positions[i] ?? `第${i + 1}张`
    return `${pos}：${d.card.name}（${d.reversed ? '逆位' : '正位'}，关键词 ${d.card.keywords.join('、')}；传统释义：${meaningOf(d)}）`
  })
  const payload = [
    question.value.trim() ? `提问者的问题：「${question.value.trim()}」` : '提问者没有具体问题，请做整体运势指引。',
    `牌阵：${spread.value.name}`,
    ...lines,
  ].join('\n')

  const res = await askAI(oracleSystemPrompt(), payload)
  if (res === null) {
    aiFailed.value = true
  } else {
    aiText.value = res
  }
  aiLoading.value = false
}
</script>

<template>
  <h2>塔罗占卜</h2>
  <p class="hint">洗牌时在心里默想你的问题，再从牌堆中抽取属于你的牌。</p>

  <section class="panel" style="margin-top: 18px;">
    <div class="form-row">
      <label class="field">
        <span>选择牌阵</span>
        <select v-model="spread">
          <option v-for="s in SPREADS" :key="s.id" :value="s">{{ s.name }} —— {{ s.desc }}</option>
        </select>
      </label>
    </div>
    <label class="field">
      <span>你的问题（可选，用于 AI 解读）</span>
      <input v-model="question" type="text" maxlength="120" placeholder="例如：我该不该换一份工作？" />
    </label>
    <div style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap; margin-top: 8px;">
      <label class="toggle-row">
        <input v-model="allowReversed" type="checkbox" /> 启用逆位
      </label>
      <button class="btn" @click="draw">洗牌 · 抽 {{ spread.positions.length }} 张</button>
      <button v-if="drawn.length && !allFlipped" class="btn ghost small" @click="flipAll">翻开全部</button>
    </div>
  </section>

  <section v-if="drawn.length" style="margin-top: 34px;">
    <div class="tarot-row">
      <div v-for="(d, i) in drawn" :key="d.card.id" class="tarot-slot">
        <span class="pos-label">{{ spread.positions[i] }}</span>
        <TarotCardItem
          :card="d.card"
          :reversed="d.reversed"
          :revealed="d.flipped"
          @flip="d.flipped = true"
        />
      </div>
    </div>

    <template v-if="allFlipped">
      <div class="divider-star">✦ ✦ ✦</div>
      <section class="panel reading-panel">
        <h3 style="margin-top: 0;">牌面解读<span class="tag">本地规则</span></h3>
        <div class="reading">{{ ruleReading }}</div>
      </section>

      <section v-if="aiText || aiFailed || isAiEnabled()" class="panel reading-panel" style="margin-top: 18px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0;">AI 综合解读</h3>
          <button v-if="!aiText" class="btn small" :disabled="aiLoading" @click="askAiInterpretation">
            {{ aiLoading ? '星语传达中…' : '开始解读' }}
          </button>
        </div>
        <div v-if="aiText" class="reading ai" style="margin-top: 14px;">{{ aiText }}</div>
        <p v-else-if="aiFailed" class="error-text" style="margin-bottom: 0;">
          AI 解读失败：请检查设置中的接口地址与密钥，或稍后重试。上方本地解读仍然有效。
        </p>
        <p v-else-if="!isAiEnabled()" class="hint" style="margin-bottom: 0;">
          在「设置」中配置 OpenAI 兼容接口的 API Key 即可启用 AI 解读。
        </p>
      </section>
    </template>
  </section>
</template>

<style scoped>
.tarot-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 16px;
}
.pos-label {
  display: block;
  margin-bottom: 10px;
  font-size: 0.82rem;
  letter-spacing: 0.2em;
  color: var(--violet-soft);
  text-align: center;
}
.reading-panel { margin-top: 26px; }
</style>
