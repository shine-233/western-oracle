<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { drawRunes, dailyRune, type Rune } from '../data/runes'
import { RUNE_POEMS, type PoemLang } from '../data/runePoems'
import { sparkle, sparkleFromEvent } from '../lib/sparkle'
import { addHistory } from '../lib/history'
import { sfx } from '../lib/sfx'
import { t } from '../lib/i18n'
import AiChat from '../components/AiChat.vue'
import ApprenticeReact from '../components/ApprenticeReact.vue'

const MascotCard = defineAsyncComponent(() => import('../components/MascotCard.vue'))

interface DrawnRune {
  rune: Rune
  reversed: boolean
}

const POEM_LANG_CN: Record<PoemLang, string> = {
  anglo_saxon: '盎格鲁-撒克逊卢恩诗 · 8-9世纪',
  norwegian: '挪威卢恩诗 · 13世纪',
  icelandic: '冰岛卢恩诗 · 15世纪',
}

function poemsOf(rune: Rune): Array<{ lang: PoemLang; title: string; original: string; translation: string }> {
  const entry = RUNE_POEMS.find((x) => x.rune === rune.name)
  if (!entry) return []
  return (Object.keys(entry.poems) as PoemLang[]).map((lang) => ({
    lang,
    title: POEM_LANG_CN[lang],
    original: entry.poems[lang]!.original,
    translation: entry.poems[lang]!.translation,
  }))
}

const count = ref(3)
const allowReversed = ref(true)
const question = ref('')
const drawn = ref<DrawnRune[]>([])
const revealedStones = ref<boolean[]>([])
const todayRune = dailyRune()

const allRevealed = computed(() => drawn.value.length > 0 && revealedStones.value.length > 0 && revealedStones.value.every(Boolean))

function draw(e?: MouseEvent): void {
  drawn.value = drawRunes(count.value, allowReversed.value)
  revealedStones.value = drawn.value.map(() => false)
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

const ruleReading = computed(() => {
  if (!allRevealed.value) return ''
  return drawn.value
    .map((d, i) => {
      const pos = count.value === 1 ? '抽到的符文' : POSITIONS[i] ?? `第${i + 1}位`
      return `【${pos}】${d.rune.nameCn}（${d.rune.name}）${d.reversed ? ' · 倒转' : ''}\n${meaningOf(d)}`
    })
    .join('\n\n')
})

const aiContext = computed(() => {
  const lines = drawn.value.map((d, i) => {
    const pos = count.value === 1 ? '抽到的符文' : POSITIONS[i] ?? `第${i + 1}位`
    return `${pos}：${d.rune.name}（${d.rune.nameCn}，${d.reversed ? '倒转' : '正位'}；释义：${meaningOf(d)}）`
  })
  return [
    question.value.trim() ? `提问者的问题：「${question.value.trim()}」` : '提问者没有具体问题，请做整体指引。',
    ...lines,
  ].join('\n')
})

const pet = ref<InstanceType<typeof MascotCard> | null>(null)

watch(allRevealed, (done) => {
  if (!done) return
  pet.value?.celebrate()
  addHistory({
    type: 'rune',
    label: `符文 · ${count.value === 1 ? '单颗' : '三颗牌位'}`,
    question: question.value.trim() || undefined,
    summary: drawn.value.map((d) => `${d.rune.nameCn}${d.reversed ? '(倒)' : ''}`).join('、'),
    detail: ruleReading.value,
  })
})
</script>

<template>
  <div class="page-root">
    <h2><DecryptTitle :text="t('rune.title')" /></h2>
  <p class="hint">{{ t('rune.hint') }}</p>

  <section class="panel" style="margin-top: 18px;">
    <div class="form-row">
      <label class="field">
        <span>{{ t('rune.count') }}</span>
        <select v-model.number="count">
          <option :value="1">{{ t('rune.one') }}</option>
          <option :value="3">{{ t('rune.three') }}</option>
        </select>
      </label>
      <label class="field">
        <span>{{ t('tarot.q') }}</span>
        <input v-model="question" type="text" maxlength="120" :placeholder="t('tarot.q.ph')" />
      </label>
    </div>
    <div style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap;">
      <label class="toggle-row"><input v-model="allowReversed" type="checkbox" /> {{ t('tarot.allowRev') }}</label>
      <button class="btn" @click="draw($event)">{{ t('rune.draw', { n: count }) }}</button>
    </div>
  </section>

  <!-- 今日一符 -->
  <section class="panel daily-rune stagger-in">
    <span class="dr-glyph">{{ todayRune.rune.glyph }}</span>
    <div class="dr-text">
      <h3 style="margin: 0 0 4px;">{{ t('rune.daily.title') }}<span class="tag">{{ todayRune.rune.name }}</span></h3>
      <p style="margin: 0; line-height: 1.8; font-size: 0.9rem;">
        {{ todayRune.rune.nameCn }} · {{ todayRune.reversed ? t('c.inverted') : t('c.upright') }}<br />
        {{ todayRune.reversed && todayRune.rune.reversed ? todayRune.rune.reversed : todayRune.rune.upright }}
      </p>
    </div>
  </section>

  <template v-if="drawn.length">
    <div style="display: flex; justify-content: flex-end; margin-top: 16px;">
      <button v-if="!allRevealed" class="btn ghost small" @click="revealAll">{{ t('rune.revealAll') }}</button>
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
        <div class="stone3d" :class="{ flipped: revealedStones[i] }">
          <div class="stone-face stone-back"><span class="mystery">✦</span></div>
          <div class="stone-face stone-front">
            <span class="glyph">{{ d.rune.glyph }}</span>
          </div>
        </div>
        <figcaption v-if="revealedStones[i]" class="bounce-in">
          <strong>{{ d.rune.nameCn }}</strong>
          <small>{{ d.rune.name }} · {{ d.reversed ? t('c.inverted') : t('c.upright') }}</small>
          <p>{{ meaningOf(d) }}</p>
          <div v-if="poemsOf(d.rune).length" class="poem-wrap">
            <details>
              <summary>{{ t('src.rune.summary') }}<span class="tag">研究数据</span></summary>
              <div v-for="p in poemsOf(d.rune)" :key="p.lang" class="poem-quote">
                <span class="poem-title">{{ p.title }}</span>
                「{{ p.translation }}」<br />
                <span class="poem-oe">{{ p.original }}</span>
              </div>
            </details>
          </div>
        </figcaption>
        <figcaption v-else class="tap-hint">{{ t('rune.tap') }}</figcaption>
      </figure>
    </div>

    <div class="divider-star">✦ ✦ ✦</div>

    <section v-if="allRevealed" class="panel reading-panel">
      <h3 style="margin-top: 0;">{{ t('rune.local') }}<span class="tag">{{ t('c.localTag') }}</span></h3>
      <div class="reading">{{ ruleReading }}</div>
    </section>

    <ApprenticeReact module="runes" :score="Math.round(100 - (drawn.filter((d) => d.reversed).length / Math.max(drawn.length, 1)) * 55)" />

    <MascotCard ref="pet" id="golem" />
    <AiChat :context="aiContext" :title="t('ai.rune.title')" :intro="t('ai.rune.intro')" />
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

/* 今日一符 */
.daily-rune {
  margin-top: 18px;
  display: flex;
  gap: 18px;
  align-items: center;
  border-color: color-mix(in srgb, var(--mint) 40%, transparent);
}
.dr-glyph {
  font-size: 2.6rem;
  color: var(--mint);
  text-shadow: 0 0 14px color-mix(in srgb, var(--mint) 55%, transparent);
  animation: glyph-breathe 3s ease-in-out infinite;
}
@keyframes glyph-breathe {
  50% { opacity: 0.65; transform: scale(1.06); }
}
.dr-text { flex: 1; }
/* 双面卢恩石：点击绕 Y 轴翻转揭示 */
.stone3d {
  position: relative;
  width: 92px;
  height: 108px;
  margin: 0 auto;
  perspective: 480px;
}
.stone-face {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0;
  background: linear-gradient(160deg, #4a4462, #2a2547);
  box-shadow: inset 0 0 0 3px #2e2650, inset 0 0 0 5px rgba(240, 230, 200, 0.18), 6px 6px 0 rgba(10, 8, 30, 0.6);
  border: 3px solid #2e2650;
  backface-visibility: hidden;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.stone-back { transform: rotateY(0deg); }
.stone-front { transform: rotateY(180deg); background: linear-gradient(160deg, #565075, #332d58); }
.stone3d.flipped .stone-back { transform: rotateY(-180deg); }
.stone3d.flipped .stone-front { transform: rotateY(0deg); }
.stone3d { transform-style: preserve-3d; transition: transform 0.55s cubic-bezier(0.45, 0, 0.3, 1.2); }
.rune-stone:hover .stone3d:not(.flipped) { transform: translateY(-5px) rotate(-3deg); }
.glyph { font-size: 2.6rem; color: #f0e6c8; text-shadow: 0 2px 0 rgba(0, 0, 0, 0.6); }
/* 倒转符文：翻面完成后再整体旋转 180° */
.rune-stone.rev .stone3d.flipped .glyph { display: inline-block; transform: rotate(180deg); }
.mystery {
  font-size: 1.8rem;
  color: var(--gold-bright);
  animation: mystery-pulse 1.6s ease-in-out infinite;
}
@keyframes mystery-pulse {
  0%, 100% { opacity: 0.4; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.15); }
}
.rune-stone figcaption { margin-top: 12px; }
.rune-stone strong { color: var(--gold-bright); letter-spacing: 0.08em; }
.rune-stone small { display: block; color: var(--ink-dim); font-size: 0.78rem; margin: 3px 0 8px; }
.rune-stone p { font-size: 0.88rem; line-height: 1.75; color: var(--ink); margin: 0; }
.tap-hint { color: var(--ink-dim); opacity: 0.65; font-size: 0.8rem; }
@media (prefers-reduced-motion: reduce) {
  .stone3d, .stone-face { transition: none !important; }
}
.poem-wrap {
  margin-top: 10px;
  border: 1.5px dashed color-mix(in srgb, var(--gold) 45%, transparent);
  border-radius: 8px;
  padding: 8px 10px;
}
.poem-wrap summary {
  cursor: pointer;
  color: var(--lavender-soft);
  font-size: 0.75rem;
  user-select: none;
}
.poem-wrap summary:hover { color: var(--gold-bright); }
.poem-wrap[open] summary { margin-bottom: 8px; color: var(--gold-bright); }
.poem-block { margin-top: 10px; display: flex; flex-direction: column; gap: 8px; }
.poem-quote {
  padding: 10px 12px;
  background: rgba(13, 11, 32, 0.6);
  border-left: 3px solid var(--gold);
  font-size: 0.8rem;
  font-style: italic;
  color: var(--ink-dim);
  line-height: 1.8;
  text-align: left;
}
.poem-title { display: block; font-style: normal; color: var(--mint); font-size: 0.72rem; letter-spacing: 0.1em; margin-bottom: 4px; }
.poem-oe { font-style: normal; opacity: 0.8; font-size: 0.75rem; }
.poem-src { display: block; margin-top: 2px; font-size: 0.7rem; opacity: 0.6; font-style: normal; }
.reading-panel { margin-top: 26px; }
</style>
