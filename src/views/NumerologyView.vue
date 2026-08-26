<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue'
import { NUMBER_MEANINGS, PERSONAL_YEAR_MEANINGS, calculateNumerology, lifePathChain, personalDay, personalMonth, personalYear, type NumerologyResult } from '../lib/numerology'
import { KABALA_MINOR_KEY, KABALA_THINGS_THOUGHT, KABALA_RESULTANTS } from '../data/sepharialNumbers'
import { locale } from '../lib/i18n'
import { loadJSON, saveJSON } from '../lib/storage'
import { sparkleFromEvent } from '../lib/sparkle'
import { addHistory } from '../lib/history'
import { sfx } from '../lib/sfx'
import { t } from '../lib/i18n'
import AiChat from '../components/AiChat.vue'
import ApprenticeReact from '../components/ApprenticeReact.vue'
import DecryptTitle from '../components/DecryptTitle.vue'

const MascotCard = defineAsyncComponent(() => import('../components/MascotCard.vue'))

const birthDate = ref(loadJSON<{ date?: string }>('num-profile', {}).date ?? '')
const fullName = ref(loadJSON<{ name?: string }>('num-profile', {}).name ?? '')

const result = ref<NumerologyResult | null>(null)
const displayLifePath = ref(0)
const pet = ref<InstanceType<typeof MascotCard> | null>(null)
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
  pet.value?.celebrate()
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

/* ---------- 数字约减链 ---------- */
const birthDigits = computed(() => {
  const [y = '', m = '', d = ''] = birthDate.value.split('-')
  const mm = m.padStart(2, '0')
  const dd = d.padStart(2, '0')
  return (y + mm + dd).split('')
})

const chainSteps = computed(() => {
  const [y, m, d] = birthDate.value.split('-').map(Number)
  if (!y || !m || !d) return []
  return lifePathChain(y, m, d)
})

const chainKey = ref(0)

function replayChain(e?: MouseEvent): void {
  chainKey.value++
  sfx.blip()
  if (e) sparkleFromEvent(e, 6)
}

/* ---------- Sepharial《数字卡巴拉》抽数（1911 公版） ---------- */
const zh = computed(() => locale.value === 'zh')
const resultantKeys = Object.keys(KABALA_RESULTANTS)
interface KabalaPick {
  root: string
  thought: string
  compound: string
  resultant: string
}
const kabalaPick = ref<KabalaPick | null>(null)
const kabalaBusy = ref(false)

/** 出生根数（1-9）的 Sepharial 含义 */
const rootMeaning = computed(() => {
  if (!result.value) return null
  const root = ((result.value.lifePath - 1) % 9) + 1
  const km = KABALA_MINOR_KEY[String(root)]
  return km ? { root, ...km } : null
})

function drawKabala(e?: MouseEvent): void {
  if (kabalaBusy.value || resultantKeys.length === 0) return
  kabalaBusy.value = true
  sfx.riffle()
  window.setTimeout(() => {
    const root = String(1 + Math.floor(Math.random() * 9))
    const compound = resultantKeys[Math.floor(Math.random() * resultantKeys.length)]!
    kabalaPick.value = {
      root,
      thought: KABALA_THINGS_THOUGHT[root] ?? '',
      compound,
      resultant: KABALA_RESULTANTS[compound] ?? '',
    }
    kabalaBusy.value = false
    sfx.ding()
    if (e) sparkleFromEvent(e, 8)
    addHistory({
      type: 'numerology',
      label: '灵数 · 卡巴拉抽数',
      summary: `根数 ${root} · 合成数 ${compound}`,
      detail: `${KABALA_THINGS_THOUGHT[root] ?? ''}\n\n合成数 ${compound}：${KABALA_RESULTANTS[compound] ?? ''}`,
    })
  }, 420)
}
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
      <ApprenticeReact module="numerology" :mood="[11, 22, 33].includes(result.lifePath) ? 'great' : 'good'" style="display: flex; justify-content: center;" />
      <p class="nh-label">{{ t('num.lifePath') }}</p>
      <p class="nh-value">{{ displayLifePath }}</p>
      <p class="nh-title">{{ NUMBER_MEANINGS[result.lifePath]?.title }}</p>
      <p class="reading">{{ NUMBER_MEANINGS[result.lifePath]?.detail }}</p>
    </section>

    <!-- 数字约减链：点一下重播 -->
    <section v-if="chainSteps.length" class="panel chain-panel" @click="replayChain($event)">
      <h3 style="margin: 0 0 4px;">{{ t('num.chain') }}<span class="tag">↻</span></h3>
      <p class="hint" style="margin: 0 0 14px;">{{ t('num.chainHint') }}</p>
      <div :key="chainKey">
        <div class="chain-digits">
          <span v-for="(dg, i) in birthDigits" :key="'d' + i" class="chain-digit">{{ dg }}</span>
        </div>
        <div class="chain-row">
          <template v-for="(step, i) in chainSteps" :key="'s' + i + '-' + chainKey">
            <span v-if="i > 0" class="chain-arrow" :style="{ '--d': (i - 0.5) * 0.22 + 's' }">→</span>
            <span
              class="chain-chip"
              :class="{ final: i === chainSteps.length - 1, master: step === 11 || step === 22 || step === 33 }"
              :style="{ '--d': i * 0.22 + 's' }"
            >{{ step }}</span>
          </template>
        </div>
      </div>
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

    <!-- Sepharial 数字卡巴拉（1911 公版考据层） -->
    <section class="panel kabala-panel">
      <h3 style="margin-top: 0;">🔢 {{ zh ? 'Sepharial 数字卡巴拉' : 'Sepharial’s Kabala of Numbers' }}<span class="tag">1911</span></h3>
      <p class="hint" style="margin-top: 0;">
        {{ zh
          ? '心里想一件要占问的事，点「抽数」。根数告诉你「想的是什么」，合成数告诉你「结果偏向哪里」——出自 Sepharial《The Kabala of Numbers》的原表。'
          : 'Hold a question in mind, then draw. The root tells what you are really asking about; the compound number hints where it tends — straight from Sepharial’s 1911 tables.' }}
      </p>

      <div v-if="rootMeaning" class="kb-root">
        <span class="kb-root-num">{{ rootMeaning.root }}</span>
        <div class="kb-root-text">
          <b>{{ zh ? `你的出生根数 ${rootMeaning.root}` : `Your birth root ${rootMeaning.root}` }}
            <em v-if="rootMeaning.planet" class="kb-planet">☉ {{ rootMeaning.planet }}</em>
          </b>
          <p>{{ rootMeaning.meaning }}</p>
        </div>
      </div>

      <button class="btn" :disabled="kabalaBusy" @click="drawKabala($event)">
        {{ kabalaBusy ? '✦ …' : (zh ? '🎲 抽数一卦' : '🎲 Draw a number') }}
      </button>

      <Transition name="kabala-pop">
        <div v-if="kabalaPick" :key="kabalaPick.compound + kabalaPick.root" class="kb-cards">
          <div class="kb-card" style="--kd: 0s">
            <small>ROOT · {{ kabalaPick.root }}</small>
            <strong>{{ zh ? '所思何事' : 'Things thought' }}</strong>
            <p>{{ kabalaPick.thought }}</p>
          </div>
          <div class="kb-arrow">→</div>
          <div class="kb-card gold" style="--kd: 0.14s">
            <small>COMPOUND · {{ kabalaPick.compound }}</small>
            <strong>{{ zh ? '结果之象' : 'Resultant' }}</strong>
            <p>{{ kabalaPick.resultant }}</p>
          </div>
        </div>
      </Transition>
    </section>

    <MascotCard ref="pet" id="numi" />
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
  border: 2px solid color-mix(in srgb, var(--pink) 35%, transparent);
  animation: floaty 4.5s ease-in-out infinite;
}
.pday-box:nth-child(2) { animation-delay: 0.6s; border-color: color-mix(in srgb, var(--mint) 40%, transparent); }
.pday-box:nth-child(3) { animation-delay: 1.2s; border-color: color-mix(in srgb, var(--gold) 45%, transparent); }
.pday-box small { display: block; color: var(--ink-dim); font-size: 0.75rem; letter-spacing: 0.2em; margin-bottom: 4px; }
.pday-box strong { font-family: var(--cute); font-size: 1.9rem; color: var(--gold-bright); font-weight: 400; }

/* 数字约减链 */
.chain-panel { margin-top: 16px; cursor: pointer; transition: border-color 0.25s; }
.chain-panel:hover { border-color: color-mix(in srgb, var(--gold) 50%, transparent); }
.chain-digits { display: flex; flex-wrap: wrap; gap: 7px; justify-content: center; margin-bottom: 14px; }
.chain-digit {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: rgba(13, 11, 32, 0.75);
  border: 1.5px solid color-mix(in srgb, var(--lavender) 30%, transparent);
  color: var(--lavender-soft);
  font-family: var(--pixel);
  font-size: 0.65rem;
}
.chain-row { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; align-items: center; }
.chain-chip {
  min-width: 52px;
  padding: 8px 16px;
  text-align: center;
  border-radius: 12px;
  border: 2px solid var(--gold);
  color: var(--gold-bright);
  font-family: var(--cute);
  font-size: 1.45rem;
  background: rgba(13, 11, 32, 0.6);
  animation: chip-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  animation-delay: var(--d);
}
.chain-chip.final {
  background: linear-gradient(135deg, var(--gold), #ffe6b3);
  color: var(--void-2);
  box-shadow: 0 0 18px color-mix(in srgb, var(--gold) 55%, transparent);
  transform: scale(1.12);
}
.chain-chip.master {
  border-color: var(--pink);
  box-shadow: 0 0 16px color-mix(in srgb, var(--pink) 60%, transparent);
}
.chain-arrow { color: var(--ink-dim); animation: arrow-in 0.4s ease both; animation-delay: var(--d); }
@keyframes chip-in { from { opacity: 0; transform: translateY(12px) scale(0.55); } }
@keyframes arrow-in { from { opacity: 0; } }

/* ---------- Sepharial 卡巴拉 ---------- */
.kabala-panel { margin-top: 18px; }
.kb-root {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  margin-bottom: 14px;
  border-radius: 12px;
  background: rgba(13, 11, 32, 0.6);
  border: 1.5px solid color-mix(in srgb, var(--lavender) 28%, transparent);
}
.kb-root-num {
  font-family: var(--cute);
  font-size: 2rem;
  color: var(--gold-bright);
  min-width: 44px;
  text-align: center;
  text-shadow: 0 0 14px color-mix(in srgb, var(--gold) 60%, transparent);
}
.kb-root-text b { display: flex; align-items: center; gap: 10px; color: var(--lavender-soft); font-weight: 400; }
.kb-root-text p { margin: 4px 0 0; font-size: 0.86rem; line-height: 1.85; color: var(--ink-dim); }
.kb-planet { font-style: normal; font-family: var(--pixel); font-size: 0.6rem; letter-spacing: 0.1em; color: var(--gold); border: 1px solid color-mix(in srgb, var(--gold) 45%, transparent); border-radius: 999px; padding: 2px 8px; }

.kb-cards { display: flex; gap: 14px; margin-top: 18px; align-items: stretch; flex-wrap: wrap; }
.kb-card {
  flex: 1 1 240px;
  padding: 15px 17px;
  border-radius: 12px;
  background: rgba(13, 11, 32, 0.65);
  border: 1.5px solid color-mix(in srgb, var(--lavender) 30%, transparent);
  animation: kb-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  animation-delay: var(--kd);
}
.kb-card.gold { border-color: color-mix(in srgb, var(--gold) 55%, transparent); box-shadow: 0 8px 22px color-mix(in srgb, var(--gold) 12%, transparent); }
.kb-card small { display: block; font-family: var(--pixel); font-size: 0.55rem; letter-spacing: 0.12em; color: var(--ink-dim); margin-bottom: 5px; }
.kb-card strong { display: block; font-family: var(--cute); font-weight: 400; color: var(--lavender-soft); margin-bottom: 7px; }
.kb-card.gold strong { color: var(--gold-bright); }
.kb-card p { margin: 0; line-height: 1.9; font-size: 0.88rem; color: var(--ink); opacity: 0.94; }
.kb-arrow { align-self: center; color: var(--ink-dim); font-size: 1.3rem; animation: arrow-in 0.4s ease 0.2s both; }
.kabala-pop-enter-active { transition: all 0.35s ease; }
.kabala-pop-enter-from { opacity: 0; transform: translateY(10px); }
@keyframes kb-in { from { opacity: 0; transform: translateY(16px) rotate(-2deg); } }
@media (prefers-reduced-motion: reduce) {
  .kb-card, .kb-arrow { animation: none; }
}
@media (prefers-reduced-motion: reduce) {
  .chain-chip, .chain-arrow { animation: none; }
}
</style>
