<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { ALL_CARDS, SPREADS, dailyCard, type SpreadDef, type TarotCard } from '../data/tarot'
import { randInt, shuffle } from '../lib/random'
import { sparkle, sparkleFromEvent } from '../lib/sparkle'
import { sfx } from '../lib/sfx'
import { useEscClose } from '../lib/useEsc'
import { cardImageUrl } from '../data/tarot'
import { WAITE_MEANINGS } from '../data/waiteMeanings'
import { TAROT_SOURCES } from '../data/tarotSources'
import { TAROT_MODERN } from '../data/tarotModern'
import { BOOK_T_DECANS } from '../data/bookTDecans'
import { addHistory } from '../lib/history'
import { downloadShareCard } from '../lib/share'
import { t, locale } from '../lib/i18n'
import TarotCardItem from '../components/TarotCardItem.vue'
import AiChat from '../components/AiChat.vue'
import ApprenticeReact from '../components/ApprenticeReact.vue'
import DecryptTitle from '../components/DecryptTitle.vue'

const MascotCard = defineAsyncComponent(() => import('../components/MascotCard.vue'))
import { reflectionFor } from '../data/tarotReflections'
import { cardMeaning } from '../data/tarotEn'

interface DrawnCard {
  card: TarotCard
  reversed: boolean
  flipped: boolean
}

type Stage = 'form' | 'shuffle' | 'fan' | 'reading'

const stage = ref<Stage>('form')
const spread = ref<SpreadDef>(SPREADS[1]!)
const question = ref('')
const allowReversed = ref(true)
const drawn = ref<DrawnCard[]>([])
const detail = ref<DrawnCard | null>(null)

/** 扇形牌堆 */
const FAN_COUNT = 27
const FAN_ARC = 96
const deck = ref<TarotCard[]>([])
const pickedSet = ref<Set<number>>(new Set())

const today = dailyCard()

/* ---------- 是/否 快问 ---------- */
const ynResult = ref<{ card: TarotCard; reversed: boolean } | null>(null)

function drawYesNo(e?: MouseEvent): void {
  const card = ALL_CARDS[randInt(ALL_CARDS.length)]!
  const reversed = allowReversed.value && Math.random() < 0.5
  ynResult.value = { card, reversed }
  sfx.flip()
  pet.value?.celebrate()
  if (e) sparkleFromEvent(e, 10)
}

const ynAdvice = computed(() => {
  const r = ynResult.value
  if (!r) return ''
  const kw = locale.value === 'zh' ? r.card.nameCn : r.card.name
  return `${kw}（${r.reversed ? t('c.reversed') : t('c.upright')}）：${r.reversed ? r.card.reversed : r.card.upright}`
})

useEscClose(() => {
  detail.value = null
})

const allFlipped = computed(() => drawn.value.length > 0 && drawn.value.every((d) => d.flipped))
const isCeltic = computed(() => spread.value.id === 'celtic')

/* ---------- 仪式流程 ---------- */

let shuffleTimers: number[] = []

function beginRitual(): void {
  stage.value = 'shuffle'
  drawn.value = []
  pickedSet.value = new Set()
  deck.value = shuffle(ALL_CARDS)
  sfx.riffle()
  shuffleTimers.forEach((t) => window.clearTimeout(t))
  shuffleTimers = [
    window.setTimeout(() => sfx.riffle(), 520),
    window.setTimeout(() => {
      sfx.whoosh()
      stage.value = 'fan'
    }, 1250),
  ]
}

function backToForm(): void {
  stage.value = 'form'
  drawn.value = []
  pickedSet.value = new Set()
}

/** 扇形卡片的角度与层级 */
function fanStyle(i: number): Record<string, string> {
  const t = i / (FAN_COUNT - 1)
  const angle = -FAN_ARC / 2 + FAN_ARC * t
  const picked = pickedSet.value.has(i)
  return {
    transform: picked
      ? 'translateX(-50%) rotate(' + angle + 'deg) translateY(-46px)'
      : 'translateX(-50%) rotate(' + angle + 'deg)',
    zIndex: String(i),
    opacity: picked ? '0.25' : '1',
    pointerEvents: picked ? 'none' : 'auto',
  }
}

function pickFromFan(e: MouseEvent, i: number): void {
  if (pickedSet.value.has(i)) return
  if (drawn.value.length >= spread.value.positions.length) return

  const card = deck.value[(i * 7 + drawn.value.length * 3) % deck.value.length]!
  drawn.value.push({
    card,
    reversed: allowReversed.value && randInt(2) === 0,
    flipped: false,
  })
  const next = new Set(pickedSet.value)
  next.add(i)
  pickedSet.value = next
  sfx.pop()
  sparkleFromEvent(e, 8)

  if (drawn.value.length >= spread.value.positions.length) {
    window.setTimeout(() => {
      stage.value = 'reading'
      sfx.ding()
    }, 420)
  }
}

/* ---------- 翻牌 ---------- */

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

/* ---------- 解读 ---------- */

function meaningOf(d: DrawnCard): string {
  return cardMeaning(d.card, locale.value, d.reversed)
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

const cardsLine = computed(() =>
  drawn.value
    .map((d, i) => `${spread.value.positions[i] ?? i + 1}：${d.card.nameCn}${d.reversed ? '(逆)' : '(正)'}`)
    .join('、'),
)

function shareReading(): void {
  const zh = locale.value === 'zh'
  downloadShareCard({
    title: zh ? `塔罗 · ${spread.value.name}` : `Tarot · ${spread.value.name}`,
    subtitle: `${new Date().toLocaleDateString(zh ? 'zh-CN' : 'en-US')}${question.value.trim() ? (zh ? ` · 「${question.value.trim()}」` : ` · "${question.value.trim()}"`) : ''}`,
    lines: [cardsLine.value],
    footer: 'WESTERN ORACLE',
  })
  sfx.ding()
}

const aiContext = computed(() => {
  const lines = drawn.value.map((d, i) => {
    const pos = spread.value.positions[i] ?? `第${i + 1}张`
    const en = TAROT_SOURCES[d.card.id]
    const enKw = en?.keywords.length ? `；EN keywords: ${en.keywords.join(', ')}` : ''
    return `${pos}：${d.card.name}（${d.reversed ? '逆位' : '正位'}，关键词 ${d.card.keywords.join('、')}${enKw}；传统释义：${meaningOf(d)}）`
  })
  return [
    question.value.trim() ? `提问者的问题：「${question.value.trim()}」` : '提问者没有具体问题，请做整体运势指引。',
    `牌阵：${spread.value.name}`,
    ...lines,
  ].join('\n')
})

/* ---------- 历史 ---------- */

const pet = ref<InstanceType<typeof MascotCard> | null>(null)

watch(allFlipped, (done) => {
  if (!done) return
  pet.value?.celebrate()
  addHistory({
    type: 'tarot',
    label: `塔罗 · ${spread.value.name}`,
    question: question.value.trim() || undefined,
    summary: cardsLine.value,
    detail: ruleReading.value,
  })
})
</script>

<template>
  <div class="page-root">
    <h2><DecryptTitle :text="t('tarot.title')" /></h2>
    <p class="hint">{{ t('tarot.hint') }}</p>

    <!-- 每日一牌 -->
    <section class="panel daily-panel bounce-in">
      <div class="daily-inner">
        <img :src="cardImageUrl(today.card.id)" :alt="today.card.nameCn" :class="{ upside: today.reversed }" />
        <div class="daily-text">
          <span class="dc-label">{{ t('home.dc.card') }}</span>
          <h3 style="margin: 6px 0;">{{ locale === 'zh' ? today.card.nameCn : today.card.name }}{{ today.reversed ? (locale === 'zh' ? ' · 逆位' : ' · Reversed') : '' }}</h3>
          <p class="reading">{{ cardMeaning(today.card, locale, today.reversed) }}</p>
        </div>
      </div>
    </section>

    <!-- 是/否 快问 -->
    <section class="panel yn-panel stagger-in">
      <div class="yn-left">
        <h3 style="margin: 0 0 6px;">{{ t('tarot.yn.title') }}<span class="tag">1 CARD</span></h3>
        <p class="hint" style="margin: 0 0 12px;">{{ t('tarot.yn.hint') }}</p>
        <button v-if="!ynResult" class="btn" @click="drawYesNo($event)">{{ t('tarot.yn.draw') }}</button>
        <button v-else class="btn ghost small" @click="drawYesNo($event)">{{ t('tarot.yn.again') }}</button>
        <p v-if="ynResult" class="reading" style="margin: 10px 0 0; font-size: 0.88rem;">{{ ynAdvice }}</p>
      </div>
      <Transition name="pop">
        <div v-if="ynResult" class="yn-card" :key="ynResult.card.id + String(ynResult.reversed)">
          <img
            :src="cardImageUrl(ynResult.card.id)"
            :alt="ynResult.card.nameCn"
            :class="{ upside: ynResult.reversed }"
          />
          <span class="yn-verdict" :class="ynResult.reversed ? 'no' : 'yes'">
            {{ ynResult.reversed ? t('tarot.yn.no') : t('tarot.yn.yes') }}
          </span>
        </div>
      </Transition>
    </section>

    <!-- ① 设定阶段 -->
    <section v-if="stage === 'form'" class="panel stagger-in" style="margin-top: 18px;">
      <div class="form-row">
        <label class="field">
          <span>{{ t('tarot.spread') }}</span>
          <select v-model="spread">
            <option v-for="s in SPREADS" :key="s.id" :value="s">{{ s.name }} —— {{ s.desc }}</option>
          </select>
        </label>
      </div>
      <label class="field">
        <span>{{ t('tarot.q') }}</span>
        <input v-model="question" type="text" maxlength="120" :placeholder="t('tarot.q.ph')" />
      </label>
      <div style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap; margin-top: 8px;">
        <label class="toggle-row">
          <input v-model="allowReversed" type="checkbox" /> {{ t('tarot.allowRev') }}
        </label>
        <button class="btn ritual-btn" @click="beginRitual">{{ t('tarot.start', { n: spread.positions.length }) }}</button>
      </div>
    </section>

    <!-- ② 洗牌阶段 -->
    <section v-if="stage === 'shuffle'" class="panel shuffle-stage">
      <div class="deck-stack">
        <div v-for="n in 6" :key="n" class="deck-card" :style="{ '--i': n }" />
      </div>
      <p class="shuffle-hint">{{ t('tarot.shuffling') }}</p>
    </section>

    <!-- ③ 扇形摊开：手动选牌 -->
    <section v-if="stage === 'fan'" class="panel fan-stage">
      <p class="fan-tip">{{ t('tarot.fanTip', { total: spread.positions.length }) }} · <strong>{{ t('tarot.fanDone', { n: drawn.length }) }}</strong></p>
      <div class="fan-board" role="listbox" aria-label="扇形摊开的塔罗牌堆">
        <button
          v-for="i in FAN_COUNT"
          :key="i"
          class="fan-card"
          :class="{ picked: pickedSet.has(i - 1) }"
          :style="fanStyle(i - 1)"
          :aria-label="'第 ' + i + ' 张牌'"
          @click="pickFromFan($event, i - 1)"
        >
          <span class="fan-card-inner">
            <span class="star-big">✦</span>
            <span class="star-small">✧</span>
          </span>
        </button>
      </div>
      <button class="btn ghost small reshuffle" @click="backToForm">{{ t('tarot.reset') }}</button>
    </section>

    <!-- ④ 已选牌落位 -->
    <template v-if="stage === 'reading' || drawn.length > 0">
      <!-- 凯尔特十字特殊布局（十张全部选定后展示） -->
      <section v-if="isCeltic && drawn.length === spread.positions.length" style="margin-top: 34px;">
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
      <section v-if="!isCeltic && drawn.length" style="margin-top: 34px;">
        <div class="tarot-row">
          <div
            v-for="(d, i) in drawn"
            :key="d.card.id + '-' + i"
            class="tarot-slot deal-in"
            :style="{ animationDelay: `${Math.max(0, i - 1) * 90}ms` }"
          >
            <span class="pos-label">{{ spread.positions[i] }}</span>
            <TarotCardItem :card="d.card" :reversed="d.reversed" :revealed="d.flipped" @flip="onFlip($event, d)" />
          </div>
        </div>
      </section>

      <div v-if="stage === 'reading'" style="display: flex; gap: 14px; justify-content: center; margin-top: 20px; flex-wrap: wrap;">
        <button v-if="!allFlipped" class="btn ghost small" @click="flipAll">{{ t('tarot.flipAll') }}</button>
        <button class="btn ghost small" @click="beginRitual">{{ t('tarot.again') }}</button>
        <button class="btn ghost small" @click="backToForm">{{ t('tarot.newQ') }}</button>
      </div>

      <template v-if="allFlipped">
        <div class="divider-star">✦ ✦ ✦</div>
        <section class="panel reading-panel">
          <h3 style="margin-top: 0;">{{ t('tarot.reading') }}<span class="tag">{{ t('c.localTag') }}</span></h3>
          <div class="reading">{{ ruleReading }}</div>
          <button class="btn ghost small share-btn" @click="shareReading">{{ t('tarot.share') }}</button>
        </section>

        <ApprenticeReact module="tarot" :score="Math.round(100 - (drawn.filter((d) => d.reversed).length / Math.max(drawn.length, 1)) * 50)" />

        <MascotCard ref="pet" id="cat" />
        <AiChat :context="aiContext" :title="t('ai.tarot.title')" :intro="t('ai.tarot.intro')" />
      </template>
    </template>

    <!-- 卡牌详情弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="detail" class="modal-backdrop" @click.self="detail = null">
          <div class="modal-panel panel bounce-in">
            <button class="modal-close btn small ghost" @click="detail = null">{{ t('c.close') }}</button>
            <div class="modal-body">
              <img :src="cardImageUrl(detail.card.id)" :alt="detail.card.nameCn" :class="{ upside: detail.reversed }" />
              <div class="modal-info">
                <span class="dc-label">{{ detail.card.rankLabel }} · {{ detail.card.name }}</span>
                <h3 style="margin: 6px 0;">{{ locale === 'zh' ? detail.card.nameCn : detail.card.name }}{{ detail.reversed ? (locale === 'zh' ? ' · 逆位' : ' · Reversed') : '' }}</h3>
                <p class="hint">{{ t('c.keywords') }}：{{ detail.card.keywords.join(' / ') }}</p>
                <div class="modal-sec">
                  <strong>{{ t('c.upright') }}</strong>
                  <p class="reading">{{ cardMeaning(detail.card, locale) }}</p>
                </div>
                <div class="modal-sec">
                  <strong>{{ t('c.reversed') }}</strong>
                  <p class="reading">{{ cardMeaning(detail.card, locale, true) }}</p>
                </div>
                <details class="sources-box">
                  <summary>{{ t('src.tarot.summary') }}<span class="tag">研究数据</span></summary>
                  <div v-if="WAITE_MEANINGS[detail.card.id]" class="src-block src-waite">
                    <strong>Waite 原文牌意 · 1911</strong>
                    <p class="reading en-quote">“{{ WAITE_MEANINGS[detail.card.id]!.up }}”</p>
                    <p class="reading en-quote">“{{ WAITE_MEANINGS[detail.card.id]!.rev }}”</p>
                  </div>
                  <div v-if="TAROT_SOURCES[detail.card.id]?.papus" class="src-block src-papus">
                    <strong>Papus 占卜释义 · 1892</strong>
                    <p class="reading en-quote">{{ TAROT_SOURCES[detail.card.id]!.papus }}</p>
                  </div>
                  <div v-if="TAROT_SOURCES[detail.card.id]?.fortuneTelling.length" class="src-block src-fortune">
                    <strong>Fortune Telling · McElroy</strong>
                    <p v-for="f in TAROT_SOURCES[detail.card.id]!.fortuneTelling" :key="f" class="reading en-quote">✦ {{ f }}</p>
                  </div>
                  <div v-if="BOOK_T_DECANS[detail.card.id]" class="src-block src-decan">
                    <strong>Golden Dawn 十度分金 · Book T</strong>
                    <p class="reading en-quote">
                      {{ BOOK_T_DECANS[detail.card.id]!.sign }} {{ BOOK_T_DECANS[detail.card.id]!.fromDegree }}°–{{ BOOK_T_DECANS[detail.card.id]!.toDegree }}°
                      · 守护 {{ BOOK_T_DECANS[detail.card.id]!.ruler }} · “{{ BOOK_T_DECANS[detail.card.id]!.gdTitle }}”
                    </p>
                  </div>
                  <div v-if="TAROT_MODERN[detail.card.id]" class="src-block src-modern">
                    <strong>现代语境四域 · Tarotoo (MIT)</strong>
                    <template v-if="!detail.reversed">
                      <p class="reading">♥ 恋爱：{{ TAROT_MODERN[detail.card.id]!.love }}</p>
                      <p class="reading">💼 事业：{{ TAROT_MODERN[detail.card.id]!.career }}</p>
                      <p class="reading">🌙 情绪：{{ TAROT_MODERN[detail.card.id]!.mood }}</p>
                      <p class="reading">✨ 灵性：{{ TAROT_MODERN[detail.card.id]!.spiritual }}</p>
                    </template>
                    <template v-else>
                      <p class="reading">♥ 恋爱：{{ TAROT_MODERN[detail.card.id]!.loveReversed }}</p>
                      <p class="reading">💼 事业：{{ TAROT_MODERN[detail.card.id]!.careerReversed }}</p>
                      <p class="reading">🌙 情绪：{{ TAROT_MODERN[detail.card.id]!.moodReversed }}</p>
                      <p class="reading">✨ 灵性：{{ TAROT_MODERN[detail.card.id]!.spiritualReversed }}</p>
                    </template>
                    <p class="reading en-quote">Yes/No: {{ detail.reversed ? TAROT_MODERN[detail.card.id]!.yesNoReversed : TAROT_MODERN[detail.card.id]!.yesNo }}</p>
                  </div>
                </details>
                <div class="reflect-box">
                  <strong>🪞 {{ t('tarot.reflect') }}</strong>
                  <p>{{ reflectionFor(detail.card.id) }}</p>
                </div>
                <p class="hint" style="font-style: italic;">{{ t('tarot.modalTip') }}</p>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.daily-panel { border-color: color-mix(in srgb, var(--gold) 40%, transparent); }
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

/* 是/否 快问 */
.yn-panel { display: flex; gap: 20px; align-items: center; flex-wrap: wrap; margin-top: 18px; }
.yn-left { flex: 1 1 260px; }
.yn-card {
  position: relative;
  width: 96px;
  animation: yn-drop 0.55s cubic-bezier(0.34, 1.4, 0.64, 1) both;
}
.yn-card img {
  width: 100%;
  border-radius: 10px;
  border: 2px solid var(--gold);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.45);
}
.yn-card img.upside { transform: rotate(180deg); }
.yn-verdict {
  position: absolute;
  left: 50%;
  bottom: -12px;
  transform: translateX(-50%);
  white-space: nowrap;
  font-family: var(--cute);
  font-size: 0.8rem;
  padding: 2px 12px;
  border-radius: 999px;
  background: var(--void-2);
}
.yn-verdict.yes { color: var(--mint); border: 1.5px solid var(--mint); box-shadow: 0 0 10px color-mix(in srgb, var(--mint) 40%, transparent); }
.yn-verdict.no { color: var(--pink); border: 1.5px solid var(--pink); box-shadow: 0 0 10px color-mix(in srgb, var(--pink) 40%, transparent); }
@keyframes yn-drop {
  from { opacity: 0; transform: translateY(-26px) rotate(-8deg) scale(0.85); }
}

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
.share-btn { display: inline-block; margin-top: 14px; }
.ritual-btn {
  font-family: var(--cute);
  letter-spacing: 0.12em;
  animation: ritual-glow 2.6s ease-in-out infinite;
}
@keyframes ritual-glow {
  0%, 100% { box-shadow: 0 0 0 color-mix(in srgb, var(--gold) 0%, transparent); transform: scale(1); }
  50% { box-shadow: 0 0 26px color-mix(in srgb, var(--gold) 40%, transparent); transform: scale(1.02); }
}

/* ---------- 洗牌阶段 ---------- */
.shuffle-stage { text-align: center; padding: 40px 18px 30px; }
.deck-stack { position: relative; height: 190px; width: 120px; margin: 0 auto; perspective: 700px; }
.deck-card {
  position: absolute;
  inset: 0;
  border-radius: 10px;
  background:
    radial-gradient(circle at 50% 42%, color-mix(in srgb, var(--pink-soft) 28%, transparent), transparent 55%),
    repeating-linear-gradient(45deg, #221d4e 0 8px, #191542 8px 16px);
  border: 3px solid #2e2650;
  box-shadow: inset 0 0 0 3px #151232, inset 0 0 0 5px color-mix(in srgb, var(--pink) 50%, transparent);
  animation: riffle-shuffle 0.55s cubic-bezier(0.34, 1.4, 0.64, 1) infinite alternate;
  animation-delay: calc(var(--i) * 70ms);
}
@keyframes riffle-shuffle {
  0% { transform: translate(calc(var(--i) * -3px), 0) rotate(calc(var(--i) * -2.4deg)); }
  100% { transform: translate(calc(var(--i) * 3px), -3px) rotate(calc(var(--i) * 2.4deg)); }
}
.shuffle-hint { color: var(--lavender-soft); letter-spacing: 0.25em; margin-top: 22px; animation: hint-pulse 1.4s ease-in-out infinite; }
@keyframes hint-pulse { 50% { opacity: 0.45; } }

/* ---------- 扇形选牌 ---------- */
.fan-stage { padding-bottom: 26px; }
.fan-tip { text-align: center; color: var(--gold-bright); letter-spacing: 0.15em; margin: 4px 0 0; }
.fan-tip strong { color: var(--pink-soft); font-size: 1.1em; }
.fan-board {
  position: relative;
  height: 320px;
  margin-top: 12px;
  overflow: hidden;
}
.fan-card {
  position: absolute;
  left: 50%;
  top: 108%;
  width: 104px;
  height: 168px;
  transform-origin: 50% 118%;
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
  cursor: pointer;
  background:
    radial-gradient(circle at 50% 42%, color-mix(in srgb, var(--pink-soft) 28%, transparent), transparent 55%),
    radial-gradient(circle at 50% 58%, color-mix(in srgb, var(--gold) 20%, transparent), transparent 50%),
    repeating-linear-gradient(45deg, #221d4e 0 8px, #191542 8px 16px);
  border: 3px solid #2e2650;
  box-shadow: inset 0 0 0 3px #151232, inset 0 0 0 5px color-mix(in srgb, var(--pink) 50%, transparent), 0 4px 14px rgba(0, 0, 0, 0.45);
  border-radius: 9px;
  padding: 0;
}
.fan-card:hover:not(.picked) {
  filter: brightness(1.22) drop-shadow(0 0 12px color-mix(in srgb, var(--pink-soft) 55%, transparent));
}
.fan-card.picked {
  filter: brightness(0.6) saturate(0.5);
  box-shadow: inset 0 0 0 3px #151232, inset 0 0 0 5px color-mix(in srgb, var(--pink) 20%, transparent);
}
.fan-card-inner { position: relative; display: block; width: 100%; height: 100%; }
.fan-card-inner .star-big {
  position: absolute;
  top: 42%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.7rem;
  color: var(--gold-bright);
  text-shadow: 0 0 12px color-mix(in srgb, var(--gold-bright) 80%, transparent);
}
.fan-card-inner .star-small { position: absolute; bottom: 8px; right: 10px; font-size: 0.7rem; color: var(--pink-soft); opacity: 0.8; }
.reshuffle { display: block; margin: 0 auto; }

@media (max-width: 640px) {
  .fan-board { height: 250px; }
  .fan-card { width: 78px; height: 128px; }
}

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
.sources-box {
  margin-top: 14px;
  border: 1.5px dashed color-mix(in srgb, var(--gold) 50%, transparent);
  border-radius: 10px;
  padding: 10px 14px;
  background: rgba(13, 11, 32, 0.45);
}
.sources-box summary {
  cursor: pointer;
  color: var(--lavender-soft);
  font-size: 0.85rem;
  letter-spacing: 0.05em;
  user-select: none;
  transition: color 0.2s;
}
.sources-box summary:hover { color: var(--gold-bright); }
.sources-box[open] summary { margin-bottom: 10px; color: var(--gold-bright); }
.src-block {
  padding: 9px 12px;
  margin-top: 8px;
  background: rgba(21, 18, 50, 0.55);
  border-left: 3px solid var(--gold);
}
.src-block.src-papus { border-left-color: var(--pink); }
.src-block.src-fortune { border-left-color: var(--mint); }
.src-block.src-decan { border-left-color: var(--gold); }
.src-block.src-modern { border-left-color: var(--pink-soft); }
.reflect-box {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(124, 107, 214, 0.14);
  border-left: 3px solid var(--lavender);
}
.reflect-box strong { color: var(--lavender-soft); font-family: var(--cute); font-weight: 400; }
.reflect-box p { margin: 6px 0 0; line-height: 1.9; color: var(--ink); }
.en-quote { font-style: italic; color: var(--ink-dim); font-size: 0.88rem; margin: 4px 0 0; white-space: normal; }
.modal-enter-active { transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
.modal-leave-active { transition: all 0.18s ease; }
.modal-enter-from { opacity: 0; }
.modal-enter-from .modal-panel { transform: scale(0.85) translateY(20px); }
.modal-leave-to { opacity: 0; }
</style>
