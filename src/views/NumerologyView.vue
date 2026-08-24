<script setup lang="ts">
import { computed, ref } from 'vue'
import { NUMBER_MEANINGS, PERSONAL_YEAR_MEANINGS, calculateNumerology, personalDay, personalMonth, personalYear, type NumerologyResult } from '../lib/numerology'
import { loadJSON, saveJSON } from '../lib/storage'
import { askAI, isAiEnabled, oracleSystemPrompt } from '../lib/ai'
import { sparkleFromEvent } from '../lib/sparkle'
import { sfx } from '../lib/sfx'

const birthDate = ref(loadJSON<{ date?: string }>('num-profile', {}).date ?? '')
const fullName = ref(loadJSON<{ name?: string }>('num-profile', {}).name ?? '')

const result = ref<NumerologyResult | null>(null)
const displayLifePath = ref(0)
const aiText = ref<string | null>(null)
const aiLoading = ref(false)
const aiFailed = ref(false)

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
  aiText.value = null
  aiFailed.value = false
  if (e) sparkleFromEvent(e, 10)
}

interface Row {
  key: keyof NumerologyResult
  title: string
  desc: string
}

const ROWS: Row[] = [
  { key: 'lifePath', title: '生命路径数', desc: '由完整生日得出，是你此生的主课题与人生方向。' },
  { key: 'birthday', title: '生日数', desc: '出生当天的数字，代表你与生俱来的天赋礼物。' },
  { key: 'expression', title: '表达数', desc: '由姓名全拼得出，呈现你向外展现的才能与做事风格（需英文/拼音名）。' },
  { key: 'soulUrge', title: '灵魂愿望数', desc: '姓名中的元音所藏，是你内心深处真正的渴望。' },
  { key: 'personality', title: '人格数', desc: '姓名中的辅音所显，是他人眼中你的印象与气场。' },
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

async function askAiInterpretation(): Promise<void> {
  if (!result.value || !isAiEnabled() || aiLoading.value) return
  aiLoading.value = true
  aiFailed.value = false
  const r = result.value
  const payload = [
    '请解读以下生命灵数组合：',
    `生命路径数：${r.lifePath}`,
    `生日数：${r.birthday}`,
    r.expression !== null ? `表达数：${r.expression}` : '',
    r.soulUrge !== null ? `灵魂愿望数：${r.soulUrge}` : '',
    r.personality !== null ? `人格数：${r.personality}` : '',
  ].filter(Boolean).join('\n')
  const res = await askAI(oracleSystemPrompt(), payload)
  if (res === null) aiFailed.value = true
  else aiText.value = res
  aiLoading.value = false
}
</script>

<template>
  <div class="page-root">
    <h2>生命灵数</h2>
  <p class="hint">毕达哥拉斯体系：数字是宇宙的语言。输入生日即可开始；填写英文或拼音名可解锁姓名相关数字。</p>

  <section class="panel" style="margin-top: 18px;">
    <div class="form-row">
      <label class="field"><span>出生日期</span><input v-model="birthDate" type="date" @change="submit()" /></label>
      <label class="field"><span>英文 / 拼音全名（可选）</span><input v-model="fullName" type="text" placeholder="例如：Zhang San" /></label>
    </div>
    <button class="btn" :disabled="!birthDate" @click="submit($event)">计算灵数</button>
  </section>

  <template v-if="result">
    <div class="divider-star">✦ ✦ ✦</div>

    <section class="num-hero panel">
      <p class="nh-label">生命路径数</p>
      <p class="nh-value">{{ displayLifePath }}</p>
      <p class="nh-title">{{ NUMBER_MEANINGS[result.lifePath]?.title }}</p>
      <p class="reading">{{ NUMBER_MEANINGS[result.lifePath]?.detail }}</p>
    </section>

    <div class="num-grid">
      <section v-for="row in rows.filter((r) => r.key !== 'lifePath')" :key="row.key" class="panel num-card">
        <h3 style="margin: 0 0 4px;">{{ row.title }}<span class="tag">{{ row.value ?? '—' }}</span></h3>
        <p class="hint" style="margin-top: 0;">{{ row.desc }}</p>
        <div v-if="row.meaning" class="reading">
          <strong>{{ row.meaning.title }}</strong> —— {{ row.meaning.essence }}<br />{{ row.meaning.detail }}
        </div>
        <p v-else class="hint" style="font-style: italic;">填写英文/拼音名后解锁。</p>
      </section>
    </div>

    <p v-if="!hasName()" class="hint" style="text-align: center;">提示：表达数、灵魂愿望数与人格数需要英文字母参与计算。</p>

    <section v-if="todayNumbers" class="panel" style="margin-top: 18px;">
      <h3 style="margin-top: 0;">今日流日<span class="tag">PERSONAL DAY</span></h3>
      <div class="pday-row">
        <div class="pday-box"><small>流年</small><strong>{{ todayNumbers.year }}</strong></div>
        <div class="pday-box"><small>流月</small><strong>{{ todayNumbers.month }}</strong></div>
        <div class="pday-box"><small>流日</small><strong>{{ todayNumbers.day }}</strong></div>
        <p class="hint" style="flex: 1 1 200px; margin: 0;">{{ todayNumbers.yearMeaning }}</p>
      </div>
    </section>

    <section class="panel reading-panel" style="margin-top: 18px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0;">AI 灵数解读</h3>
        <button v-if="!aiText" class="btn small" :disabled="aiLoading" @click="askAiInterpretation">
          {{ aiLoading ? '数字共鸣中…' : '开始解读' }}
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
