<script setup lang="ts">
import { computed, ref } from 'vue'
import { NUMBER_MEANINGS, PERSONAL_YEAR_MEANINGS, calculateNumerology, personalDay, personalMonth, personalYear, type NumerologyResult } from '../lib/numerology'
import { loadJSON, saveJSON } from '../lib/storage'
import { sparkleFromEvent } from '../lib/sparkle'
import { addHistory } from '../lib/history'
import { sfx } from '../lib/sfx'
import { t } from '../lib/i18n'
import AiChat from '../components/AiChat.vue'
import DecryptTitle from '../components/DecryptTitle.vue'

const birthDate = ref(loadJSON<{ date?: string }>('num-profile', {}).date ?? '')
const fullName = ref(loadJSON<{ name?: string }>('num-profile', {}).name ?? '')

const result = ref<NumerologyResult | null>(null)
const displayLifePath = ref(0)
let lastRecordedKey = ''

function countUp(target: number): void {
  const start = performance.now()
  const dur = 700
  const step = (t: number): void => {
    const p = Math.min(1, (t - start) / dur)
    displayLifePath.value = Math.round(target * (1 - Math.pow(1 - p, 3)))
    if (p < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

function submit(e?: MouseEvent): void {
  const parts = birthDate.value.split('-').map(Number)
  const [y, m, d] = parts
  if (!y || !m || !d) return
  result.value = calculateNumerology({ y, m, d }, fullName.value)
  saveJSON('num-profile', { date: birthDate.value, name: fullName.value })
  countUp(result.value.lifePath)
  sfx.pop()
  if (e) sparkleFromEvent(e, 10)

  const r = result.value
  // 同一生日+姓名组合只记录一次历史
  const dedupeKey = `${birthDate.value}|${fullName.value.trim()}`
  if (lastRecordedKey === dedupeKey) return
  lastRecordedKey = dedupeKey

  const summaryLines = [
    `生命路径数 ${r.lifePath}（${NUMBER_MEANINGS[r.lifePath]?.title ?? ''}）`,
    `生日数 ${r.birthday}`,
    r.expression !== null ? `表达数 ${r.expression}` : '',
    r.soulUrge !== null ? `灵魂愿望数 ${r.soulUrge}` : '',
    r.personality !== null ? `人格数 ${r.personality}` : '',
  ].filter(Boolean)
  addHistory({
    type: 'numerology',
    label: '灵数 · 命盘数字',
    summary: summaryLines.join('，'),
    detail: [
      `${NUMBER_MEANINGS[r.lifePath]?.title ?? ''}：${NUMBER_MEANINGS[r.lifePath]?.detail ?? ''}`,
      ...rows.value.filter((row) => row.key !== 'lifePath' && row.meaning).map((row) => `${t(row.titleKey)} ${row.value}：${row.meaning!.title} —— ${row.meaning!.essence}`),
    ].join('\n\n'),
  })
}

const aiContext = computed(() => {
  const r = result.value
  if (!r) return ''
  return [
    '请解读以下生命灵数组合：',
    `生命路径数：${r.lifePath}（${NUMBER_MEANINGS[r.lifePath]?.title ?? ''}）`,
    `生日数：${r.birthday}`,
    r.expression !== null ? `表达数：${r.expression}` : '',
    r.soulUrge !== null ? `灵魂愿望数：${r.soulUrge}` : '',
    r.personality !== null ? `人格数：${r.personality}` : '',
  ].filter(Boolean).join('\n')
})

interface Row {
  key: keyof NumerologyResult
  titleKey: string
  descKey: string
}

const ROWS: Row[] = [
  { key: 'lifePath', titleKey: 'row.lifePath.t', descKey: 'row.lifePath.d' },
  { key: 'birthday', titleKey: 'row.birthday.t', descKey: 'row.birthday.d' },
  { key: 'expression', titleKey: 'row.expression.t', descKey: 'row.expression.d' },
  { key: 'soulUrge', titleKey: 'row.soulUrge.t', descKey: 'row.soulUrge.d' },
  { key: 'personality', titleKey: 'row.personality.t', descKey: 'row.personality.d' },
]

const rows = computed(() => {
  if (!result.value) return []
  return ROWS.map((r) => ({
    ...r,
    value: result.value![r.key],
    meaning: result.value![r.key] !== null ? NUMBER_MEANINGS[result.value![r.key] as number] : null,
  }))
})

function hasName(): boolean {
  return result.value?.expression !== null
}

const todayNumbers = computed(() => {
  if (!result.value) return null
  const now = new Date()
  const [y, m, d] = birthDate.value.split('-').map(Number)
  if (!y || !m || !d) return null
  const py = personalYear(m, d, now.getFullYear())
  return {
    year: py,
    month: personalMonth(py, now.getMonth() + 1),
    day: personalDay(personalMonth(py, now.getMonth() + 1), now.getDate()),
    yearMeaning: PERSONAL_YEAR_MEANINGS[py] ?? '',
  }
})
</script>

<template>
  <div class="page-root">
    <h2><DecryptTitle :text="t('num.title')" /></h2>
  <p class="hint">{{ t('num.hint') }}</p>

  <section class="panel" style="margin-top: 18px;">
    <div class="form-row">
      <label class="field"><span>{{ t('bf.date') }}</span><input v-model="birthDate" type="date" @change="submit()" /></label>
      <label class="field"><span>{{ t('num.name') }}</span><input v-model="fullName" type="text" :placeholder="t('num.namePh')" /></label>
    </div>
    <button class="btn" :disabled="!birthDate" @click="submit($event)">{{ t('num.submit') }}</button>
  </section>

  <template v-if="result">
    <div class="divider-star">✦ ✦ ✦</div>

    <section class="num-hero panel">
      <p class="nh-label">{{ t('num.lifePath') }}</p>
      <p class="nh-value">{{ displayLifePath }}</p>
      <p class="nh-title">{{ NUMBER_MEANINGS[result.lifePath]?.title }}</p>
      <p class="reading">{{ NUMBER_MEANINGS[result.lifePath]?.detail }}</p>
    </section>

    <div class="num-grid">
      <section v-for="row in rows.filter((r) => r.key !== 'lifePath')" :key="row.key" class="panel num-card">
        <h3 style="margin: 0 0 4px;">{{ t(row.titleKey) }}<span class="tag">{{ row.value ?? '—' }}</span></h3>
        <p class="hint" style="margin-top: 0;">{{ t(row.descKey) }}</p>
        <div v-if="row.meaning" class="reading">
          <strong>{{ row.meaning.title }}</strong> —— {{ row.meaning.essence }}<br />{{ row.meaning.detail }}
        </div>
        <p v-else class="hint" style="font-style: italic;">填写英文/拼音名后解锁。</p>
      </section>
    </div>

    <p v-if="!hasName()" class="hint" style="text-align: center;">{{ t('num.nameHint') }}</p>

    <section v-if="todayNumbers" class="panel" style="margin-top: 18px;">
      <h3 style="margin-top: 0;">{{ t('num.today') }}<span class="tag">PERSONAL DAY</span></h3>
      <div class="pday-row">
        <div class="pday-box"><small>{{ t('num.year') }}</small><strong>{{ todayNumbers.year }}</strong></div>
        <div class="pday-box"><small>{{ t('num.month') }}</small><strong>{{ todayNumbers.month }}</strong></div>
        <div class="pday-box"><small>{{ t('num.day') }}</small><strong>{{ todayNumbers.day }}</strong></div>
        <p class="hint" style="flex: 1 1 200px; margin: 0;">{{ todayNumbers.yearMeaning }}</p>
      </div>
    </section>

    <AiChat :context="aiContext" :title="t('ai.num.title')" :intro="t('ai.num.intro')" />
  </template>
  </div>
</template>

<style scoped>
.num-hero { text-align: center; padding: 34px; }
.nh-label { color: var(--ink-dim); letter-spacing: 0.3em; margin: 0 0 6px; }
.nh-value {
  font-family: var(--serif);
  font-size: 4.2rem;
  margin: 0;
  background: linear-gradient(120deg, var(--gold-bright), #fff2d9 45%, var(--gold));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.nh-title { color: var(--gold-bright); font-family: var(--serif); letter-spacing: 0.15em; margin: 4px 0 14px; }
.num-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
  margin-top: 16px;
}
.reading-panel { margin-top: 26px; }
.pday-row { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; }
.pday-box {
  min-width: 86px;
  text-align: center;
  padding: 12px 16px;
  border-radius: 16px;
  background: rgba(13, 11, 32, 0.7);
  border: 2px solid rgba(255, 159, 206, 0.35);
  animation: floaty 4.5s ease-in-out infinite;
}
.pday-box:nth-child(2) { animation-delay: 0.6s; border-color: rgba(125, 232, 195, 0.4); }
.pday-box:nth-child(3) { animation-delay: 1.2s; border-color: rgba(245, 200, 110, 0.45); }
.pday-box small { display: block; color: var(--ink-dim); font-size: 0.75rem; letter-spacing: 0.2em; margin-bottom: 4px; }
.pday-box strong { font-family: var(--cute); font-size: 1.9rem; color: var(--gold-bright); font-weight: 400; }
</style>
