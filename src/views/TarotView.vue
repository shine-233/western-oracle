<script setup lang="ts">
import { computed, ref } from 'vue'
import { ALL_CARDS, SPREADS, dailyCard, type SpreadDef, type TarotCard } from '../data/tarot'
import { randInt, shuffle } from '../lib/random'
import { askAI, isAiEnabled, oracleSystemPrompt } from '../lib/ai'
import { sparkle, sparkleFromEvent } from '../lib/sparkle'
import { sfx } from '../lib/sfx'
import { cardImageUrl } from '../data/tarot'
import { WAITE_MEANINGS } from '../data/waiteMeanings'
import { TAROT_SOURCES } from '../data/tarotSources'
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
const detail = ref<DrawnCard | null>(null)
const aiText = ref<string | null>(null)
const aiLoading = ref(false)
const aiFailed = ref(false)

const today = dailyCard()

const allFlipped = computed(() => drawn.value.length > 0 && drawn.value.every((d) => d.flipped))
const isCeltic = computed(() => spread.value.id === 'celtic')

function draw(e?: MouseEvent): void {
  const picked = shuffle(ALL_CARDS).slice(0, spread.value.positions.length)
  drawn.value = picked.map((card) => ({
    card,
    reversed: allowReversed.value && randInt(2) === 0,
    flipped: false,
  }))
  aiText.value = null
  aiFailed.value = false
  sfx.whoosh()
  if (e) sparkleFromEvent(e, 12)
}

function onFlip(e: MouseEvent | undefined, d: DrawnCard): void {
  if (d.flipped) {
    detail.value = d
    sfx.toggle()
    return
  }
  d.flipped = true
  sfx.flip()
  if (e) sparkle(e.clientX, e.clientY, 6)
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
  <div class="page-root">
    <h2>塔罗占卜</h2>
  <p class="hint">洗牌时在心里默想你的问题，再从牌堆中抽取属于你的牌。牌面为 1909 年公版 Rider-Waite-Smith 插图。</p>

  <!-- 每日一牌 -->
  <section class="panel daily-panel bounce-in">
    <div class="daily-inner">
      <img :src="cardImageUrl(today.card.id)" :alt="today.card.nameCn" :class="{ upside: today.reversed }" />
      <div class="daily-text">
        <span class="dc-label">TODAY'S CARD · 每日一牌</span>
        <h3 style="margin: 6px 0;">{{ today.card.nameCn }}{{ today.reversed ? ' · 逆位' : '' }}</h3>
        <p class="reading">{{ today.reversed ? today.card.reversed : today.card.upright }}</p>
      </div>
    </div>
  </section>

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

  <!-- 凯尔特十字特殊布局 -->
  <section v-if="drawn.length && isCeltic" style="margin-top: 34px;">
    <div class="celtic-board">
      <div class="celtic-cell c-pos5"><span class="pos-label">5 冠冕</span><TarotCardItem :card="drawn[4]!.card" :reversed="drawn[4]!.reversed" :revealed="drawn[4]!.flipped" @flip="onFlip($event, drawn[4]!)" /></div>
      <div class="celtic-cell c-pos4"><span class="pos-label">4 过去</span><TarotCardItem :card="drawn[3]!.card" :reversed="drawn[3]!.reversed" :revealed="drawn[3]!.flipped" @flip="onFlip($event, drawn[3]!)" /></div>
      <div class="celtic-cell c-cross">
        <span class="pos-label">1 现状</span>
        <div class="cross-stack">
          <TarotCardItem :card="drawn[0]!.card" :reversed="drawn[0]!.reversed" :revealed="drawn[0]!.flipped" @flip="onFlip($event, drawn[0]!)" />
          <div class="crossing-card"><TarotCardItem :card="drawn[1]!.card" :reversed="drawn[1]!.reversed" :revealed="drawn[1]!.flipped" @flip="onFlip($event, drawn[1]!)" /></div>
        </div>
      </div>
      <div class="celtic-cell c-pos6"><span class="pos-label">6 近期未来</span><TarotCardItem :card="drawn[5]!.card" :reversed="drawn[5]!.reversed" :revealed="drawn[5]!.flipped" @flip="onFlip($event, drawn[5]!)" /></div>
      <div class="celtic-cell c-pos3"><span class="pos-label">3 根基</span><TarotCardItem :card="drawn[2]!.card" :reversed="drawn[2]!.reversed" :revealed="drawn[2]!.flipped" @flip="onFlip($event, drawn[2]!)" /></div>
      <div class="celtic-cell c-pos10"><span class="pos-label">10 结果</span><TarotCardItem :card="drawn[9]!.card" :reversed="drawn[9]!.reversed" :revealed="drawn[9]!.flipped" @flip="onFlip($event, drawn[9]!)" /></div>
      <div class="celtic-cell c-pos9"><span class="pos-label">9 希望与恐惧</span><TarotCardItem :card="drawn[8]!.card" :reversed="drawn[8]!.reversed" :revealed="drawn[8]!.flipped" @flip="onFlip($event, drawn[8]!)" /></div>
      <div class="celtic-cell c-pos8"><span class="pos-label">8 环境</span><TarotCardItem :card="drawn[7]!.card" :reversed="drawn[7]!.reversed" :revealed="drawn[7]!.flipped" @flip="onFlip($event, drawn[7]!)" /></div>
      <div class="celtic-cell c-pos7"><span class="pos-label">7 自我</span><TarotCardItem :card="drawn[6]!.card" :reversed="drawn[6]!.reversed" :revealed="drawn[6]!.flipped" @flip="onFlip($event, drawn[6]!)" /></div>
    </div>
  </section>

  <!-- 普通牌阵布局 -->
  <section v-if="drawn.length && !isCeltic" style="margin-top: 34px;">
    <div class="tarot-row">
      <div
        v-for="(d, i) in drawn"
        :key="d.card.id"
        class="tarot-slot deal-in"
        :style="{ animationDelay: `${i * 90}ms` }"
      >
        <span class="pos-label">{{ spread.positions[i] }}</span>
        <TarotCardItem :card="d.card" :reversed="d.reversed" :revealed="d.flipped" @flip="onFlip($event, d)" />
      </div>
    </div>
  </section>

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
  </div>

  <!-- 卡牌详情弹窗 -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="detail" class="modal-backdrop" @click.self="detail = null">
        <div class="modal-panel panel bounce-in">
          <button class="modal-close btn small ghost" @click="detail = null">✕ 关闭</button>
          <div class="modal-body">
            <img :src="cardImageUrl(detail.card.id)" :alt="detail.card.nameCn" :class="{ upside: detail.reversed }" />
            <div class="modal-info">
              <span class="dc-label">{{ detail.card.rankLabel }} · {{ detail.card.name }}</span>
              <h3 style="margin: 6px 0;">{{ detail.card.nameCn }}{{ detail.reversed ? ' · 逆位' : '' }}</h3>
              <p class="hint">关键词：{{ detail.card.keywords.join(' / ') }}</p>
              <div class="modal-sec">
                <strong>正位</strong>
                <p class="reading">{{ detail.card.upright }}</p>
              </div>
              <div class="modal-sec">
                <strong>逆位</strong>
                <p class="reading">{{ detail.card.reversed }}</p>
              </div>
              <div v-if="WAITE_MEANINGS[detail.card.id]" class="modal-sec waite">
                <strong>Waite 原文牌意 · 1911<span class="tag">研究数据</span></strong>
                <p class="reading en-quote">↑ {{ WAITE_MEANINGS[detail.card.id]!.up }}</p>
                <p class="reading en-quote">↓ {{ WAITE_MEANINGS[detail.card.id]!.rev }}</p>
              </div>
              <div v-if="TAROT_SOURCES[detail.card.id]" class="modal-sec papus">
                <strong>Papus 占卜释义 · 1892<span class="tag">研究数据</span></strong>
                <p class="reading en-quote">{{ TAROT_SOURCES[detail.card.id]!.papus }}</p>
              </div>
              <div v-if="TAROT_SOURCES[detail.card.id]?.fortuneTelling.length" class="modal-sec fortune">
                <strong>Fortune Telling · McElroy<span class="tag">研究数据</span></strong>
                <p v-for="f in TAROT_SOURCES[detail.card.id]!.fortuneTelling" :key="f" class="reading en-quote">✦ {{ f }}</p>
              </div>
              <p class="hint" style="font-style: italic;">小提示：再点一下可以收起弹窗～</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.daily-panel { border-color: rgba(245, 200, 110, 0.4); }
.daily-inner { display: flex; gap: 20px; align-items: center; flex-wrap: wrap; }
.daily-inner img {
  width: 96px;
  border-radius: 10px;
  border: 2px solid var(--gold);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.45);
}
.daily-inner img.upside { transform: rotate(180deg); }
.daily-text { flex: 1 1 260px; }
.dc-label { font-family: var(--pixel); font-size: 0.55rem; letter-spacing: 0.15em; color: var(--pink-soft); }

.tarot-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 16px;
}
.deal-in { animation: deal-in 0.55s cubic-bezier(0.34, 1.4, 0.64, 1) both; }
@keyframes deal-in {
  0% { opacity: 0; transform: translateY(46px) rotate(9deg) scale(0.85); }
  100% { opacity: 1; transform: none; }
}
.pos-label {
  display: block;
  margin-bottom: 10px;
  font-size: 0.82rem;
  letter-spacing: 0.2em;
  color: var(--lavender-soft);
  text-align: center;
}
.reading-panel { margin-top: 26px; }

/* ---------- 凯尔特十字 ---------- */
.celtic-board {
  display: grid;
  grid-template-columns: repeat(3, minmax(120px, 150px)) 130px;
  grid-template-rows: repeat(4, auto);
  gap: 14px 10px;
  justify-content: center;
}
.c-pos5 { grid-column: 2; grid-row: 1; justify-self: center; }
.c-pos4 { grid-column: 1; grid-row: 2; justify-self: end; align-self: center; }
.c-cross { grid-column: 2; grid-row: 2; }
.c-pos6 { grid-column: 3; grid-row: 2; justify-self: start; align-self: center; }
.c-pos3 { grid-column: 2; grid-row: 3; justify-self: center; }
.c-pos10 { grid-column: 4; grid-row: 1; justify-self: center; }
.c-pos9 { grid-column: 4; grid-row: 2; justify-self: center; }
.c-pos8 { grid-column: 4; grid-row: 3; justify-self: center; }
.c-pos7 { grid-column: 4; grid-row: 4; justify-self: center; }

.cross-stack { position: relative; }
.crossing-card {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(90deg) scale(0.88);
  pointer-events: none;
  filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.5));
}
.crossing-card > * { pointer-events: auto; }

@media (max-width: 720px) {
  .celtic-board {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
  }
  .celtic-cell { width: 50%; }
  .crossing-card { transform: rotate(90deg) scale(0.8); }
}

/* ---------- 详情弹窗 ---------- */
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(10, 8, 30, 0.78);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.modal-panel {
  max-width: 620px;
  width: 100%;
  max-height: 86vh;
  overflow: auto;
  position: relative;
  background: var(--void-1);
}
.modal-close { position: absolute; top: 14px; right: 14px; }
.modal-body { display: flex; gap: 22px; flex-wrap: wrap; align-items: flex-start; }
.modal-body > img {
  width: 190px;
  border: 3px solid var(--gold);
  filter: drop-shadow(5px 5px 0 rgba(10, 8, 30, 0.6));
}
.modal-body > img.upside { transform: rotate(180deg); }
.modal-info { flex: 1 1 260px; }
.modal-sec {
  margin-top: 12px;
  padding: 10px 14px;
  background: rgba(13, 11, 32, 0.6);
  border-left: 3px solid var(--pink);
}
.modal-sec strong { color: var(--gold-bright); font-family: var(--cute); font-weight: 400; }
.modal-sec.waite { border-left-color: var(--gold); }
.modal-sec.papus { border-left-color: var(--pink); }
.modal-sec.fortune { border-left-color: var(--mint); }
.en-quote { font-style: italic; color: var(--ink-dim); font-size: 0.88rem; margin: 4px 0 0; }
.modal-enter-active { transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
.modal-leave-active { transition: all 0.18s ease; }
.modal-enter-from { opacity: 0; }
.modal-enter-from .modal-panel { transform: scale(0.85) translateY(20px); }
.modal-leave-to { opacity: 0; }
</style>
