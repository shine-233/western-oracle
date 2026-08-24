<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  CITY_PRESETS,
  ELEMENT_CN,
  MODALITY_CN,
  TIMEZONES,
  ZODIAC_SIGNS,
  computeNatalChart,
  type BirthInput,
  type NatalChart,
} from '../lib/astrology'
import { loadJSON, saveJSON } from '../lib/storage'
import { askAI, isAiEnabled, oracleSystemPrompt } from '../lib/ai'
import AstroWheel from '../components/AstroWheel.vue'

const PLANET_CN: Record<string, string> = {
  Sun: '太阳', Moon: '月亮', Mercury: '水星', Venus: '金星', Mars: '火星',
  Jupiter: '木星', Saturn: '土星', Uranus: '天王星', Neptune: '海王星', Pluto: '冥王星',
}

interface ProfileForm {
  date: string
  time: string
  tz: number
  cityIndex: number
  lat: number
  lng: number
}

const saved = loadJSON<Partial<ProfileForm>>('birth-profile', {})
const form = ref<ProfileForm>({
  date: saved.date ?? '',
  time: saved.time ?? '12:00',
  tz: saved.tz ?? 8,
  cityIndex: saved.cityIndex ?? -1,
  lat: saved.lat ?? 39.9042,
  lng: saved.lng ?? 116.4074,
})

const chart = ref<NatalChart | null>(null)
const errorText = ref('')
const aiText = ref<string | null>(null)
const aiLoading = ref(false)
const aiFailed = ref(false)

function onCityChange(): void {
  const preset = CITY_PRESETS[form.value.cityIndex]
  if (preset) {
    form.value.lat = preset.lat
    form.value.lng = preset.lng
  }
}

function submit(): void {
  errorText.value = ''
  aiText.value = null
  aiFailed.value = false

  const [y, m, d] = form.value.date.split('-').map(Number)
  const [hh, mm] = form.value.time.split(':').map(Number)
  if (!y || !m || !d || Number.isNaN(hh) || Number.isNaN(mm)) {
    errorText.value = '请填写完整的出生日期与时间。'
    return
  }
  if (!Number.isFinite(form.value.lat) || !Number.isFinite(form.value.lng)) {
    errorText.value = '经纬度必须是有效数字。'
    return
  }

  const input: BirthInput = {
    year: y,
    month: m,
    day: d,
    hour: hh,
    minute: mm,
    timezone: form.value.tz,
    latitude: form.value.lat,
    longitude: form.value.lng,
  }

  try {
    chart.value = computeNatalChart(input)
    saveJSON('birth-profile', form.value)
  } catch (e) {
    errorText.value = `计算失败：${e instanceof Error ? e.message : String(e)}`
  }
}

const elementSummary = computed(() => {
  if (!chart.value) return ''
  return Object.entries(chart.value.elements)
    .map(([el, names]) => `${ELEMENT_CN[el] ?? el} ${names.length}`)
    .join('　·　')
})

const modalitySummary = computed(() => {
  if (!chart.value) return ''
  return Object.entries(chart.value.modalities)
    .map(([md, names]) => `${MODALITY_CN[md] ?? md} ${names.length}`)
    .join('　·　')
})

function chartPayload(c: NatalChart): string {
  const planets = c.planets
    .map((p) => `${PLANET_CN[p.name] ?? p.name} ${p.signCn}${p.degText}${p.retro ? '逆行' : ''}（第${p.house}宫）`)
    .join('；')
  const aspects = c.aspects.map((a) => `${a.body1} ${a.type} ${a.body2}`).join('、')
  return [
    '以下是用户本命盘数据，请给出综合人格画像与人生主题解读：',
    `上升：${c.ascendant.text}；天顶：${c.midheaven.text}`,
    `星体落座：${planets}`,
    `主要相位：${aspects}`,
    `元素分布：${Object.entries(c.elements).map(([k, v]) => `${ELEMENT_CN[k]}${v.length}`).join('、')}；模式分布：${Object.entries(c.modalities).map(([k, v]) => `${MODALITY_CN[k]}${v.length}`).join('、')}`,
  ].join('\n')
}

async function askAiInterpretation(): Promise<void> {
  if (!chart.value || !isAiEnabled() || aiLoading.value) return
  aiLoading.value = true
  aiFailed.value = false
  aiText.value = null
  const res = await askAI(oracleSystemPrompt(), chartPayload(chart.value))
  if (res === null) aiFailed.value = true
  else aiText.value = res
  aiLoading.value = false
}
</script>

<template>
  <h2>西洋占星 · 本命盘</h2>
  <p class="hint">输入出生年月日、时间（尽量精确到分钟，影响上升星座）与出生地坐标，全部计算在你的浏览器内完成。</p>

  <section class="panel" style="margin-top: 18px;">
    <div class="form-row">
      <label class="field"><span>出生日期</span><input v-model="form.date" type="date" /></label>
      <label class="field"><span>出生时间</span><input v-model="form.time" type="time" /></label>
      <label class="field">
        <span>时区</span>
        <select v-model.number="form.tz">
          <option v-for="t in TIMEZONES" :key="t.label" :value="t.value">{{ t.label }}</option>
        </select>
      </label>
    </div>
    <div class="form-row">
      <label class="field">
        <span>出生城市（快捷选择）</span>
        <select v-model.number="form.cityIndex" @change="onCityChange">
          <option :value="-1">—— 手动输入经纬度 ——</option>
          <option v-for="(c, i) in CITY_PRESETS" :key="c.city" :value="i">{{ c.city }}</option>
        </select>
      </label>
      <label class="field"><span>北纬（°）</span><input v-model.number="form.lat" type="number" step="0.0001" /></label>
      <label class="field"><span>东经（°）</span><input v-model.number="form.lng" type="number" step="0.0001" /></label>
    </div>
    <button class="btn" @click="submit">绘制本命盘</button>
    <p v-if="errorText" class="error-text">{{ errorText }}</p>
  </section>

  <template v-if="chart">
    <div class="divider-star">✦ ✦ ✦</div>

    <section class="astro-layout">
      <AstroWheel :planets="chart.planets" :cusps="chart.cusps" :asc-lon="chart.ascendant.lon" :aspects="chart.aspects" />

      <section class="panel astro-facts">
        <h3 style="margin-top: 0;">命盘要点</h3>
        <ul class="fact-list">
          <li><strong>上升 {{ chart.ascendant.text }}</strong> —— 你给世界的第一印象</li>
          <li><strong>天顶 {{ chart.midheaven.text }}</strong> —— 事业与社会形象的方向</li>
          <li>元素分布：{{ elementSummary }}</li>
          <li>三大模式：{{ modalitySummary }}</li>
        </ul>
        <h3>行星落座</h3>
        <table class="planet-table">
          <tbody>
            <tr v-for="p in chart.planets" :key="p.name">
              <td class="pg">{{ p.glyph }}</td>
              <td>{{ PLANET_CN[p.name] }}<span v-if="p.retro" class="retro">℞</span></td>
              <td>{{ p.signCn }} {{ p.degText }}</td>
              <td class="dim">第{{ p.house }}宫</td>
            </tr>
          </tbody>
        </table>
        <h3>主要相位（{{ chart.aspects.length }}）</h3>
        <p class="hint">
          {{ chart.aspects.map((a) => `${PLANET_CN[a.body1] ?? a.body1} ${a.symbol} ${PLANET_CN[a.body2] ?? a.body2}`).join(' · ') }}
        </p>
        <p class="hint" style="margin-top: 10px;">
          十二星座：{{ ZODIAC_SIGNS.map((s) => s.cn).join(' ') }}
        </p>
      </section>
    </section>

    <section class="panel reading-panel" style="margin-top: 18px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0;">AI 命盘解读</h3>
        <button v-if="!aiText" class="btn small" :disabled="aiLoading" @click="askAiInterpretation">
          {{ aiLoading ? '星辰演算中…' : '开始解读' }}
        </button>
      </div>
      <div v-if="aiText" class="reading ai" style="margin-top: 14px;">{{ aiText }}</div>
      <p v-else-if="aiFailed" class="error-text" style="margin-bottom: 0;">
        AI 解读失败：请检查设置中的接口地址与密钥，或稍后重试。
      </p>
      <p v-else-if="!isAiEnabled()" class="hint" style="margin-bottom: 0;">
        在「设置」中配置 OpenAI 兼容接口的 API Key 即可启用 AI 解读。
      </p>
    </section>
  </template>
</template>

<style scoped>
.astro-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  gap: 22px;
  align-items: start;
}
@media (max-width: 800px) {
  .astro-layout { grid-template-columns: 1fr; }
}
.fact-list { margin: 0; padding-left: 20px; line-height: 2; }
.planet-table { width: 100%; border-collapse: collapse; }
.planet-table td { padding: 6px 8px; border-bottom: 1px solid rgba(169, 158, 240, 0.15); font-size: 0.95rem; }
.planet-table .pg { font-size: 1.2rem; color: var(--gold); width: 34px; }
.retro { color: var(--danger); font-size: 0.75rem; margin-left: 4px; }
.dim { color: var(--ink-dim); font-size: 0.85rem; text-align: right; }
.reading-panel { margin-top: 26px; }
</style>
