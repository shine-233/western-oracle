<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { drawRunes, type Rune } from '../data/runes'
import { RUNE_POEMS, type PoemLang } from '../data/runePoems'
import { sparkle, sparkleFromEvent } from '../lib/sparkle'
import { addHistory } from '../lib/history'
import { sfx } from '../lib/sfx'
import { t } from '../lib/i18n'
import AiChat from '../components/AiChat.vue'

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

watch(allRevealed, (done) => {
  if (!done) return
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
        <div class="stone-face" :class="{ flipped: revealedStones[i] }">
          <span v-if="!revealedStones[i]" class="mystery">✦</span>
          <span v-else class="glyph">{{ d.rune.glyph }}</span>
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
.poem-wrap {
  margin-top: 10px;
  border: 1.5px dashed rgba(245, 200, 110, 0.45);
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
