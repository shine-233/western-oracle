<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  CITY_PRESETS,
  ELEMENT_CN,
  MODALITY_CN,
  TIMEZONES,
  computeNatalChart,
  type BirthInput,
  type NatalChart,
} from '../lib/astrology'
import { ASPECTS, HOUSES, PATTERNS_CN, PLANETS, SIGNS, aspectText, houseFullText, kindLabel, planetInHouseText, planetInSignText, signFullText } from '../data/corpus'
import { loadJSON, saveJSON } from '../lib/storage'
import { addHistory } from '../lib/history'
import { sfx } from '../lib/sfx'
import { t, locale } from '../lib/i18n'
import AstroWheel from '../components/AstroWheel.vue'
import AiChat from '../components/AiChat.vue'
import DecryptTitle from '../components/DecryptTitle.vue'

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
const expandedPlanet = ref<string | null>(null)
const signModal = ref<number | null>(null)
const houseModal = ref<number | null>(null)

function togglePlanet(name: string): void {
  expandedPlanet.value = expandedPlanet.value === name ? null : name
  sfx.blip()
}

function onCityChange(): void {
  const preset = CITY_PRESETS[form.value.cityIndex]
  if (preset) {
    form.value.lat = preset.lat
    form.value.lng = preset.lng
  }
}

/** 行星展开后的组合解读 */
function planetDetail(name: string): string {
  const p = chart.value?.planets.find((x) => x.name === name)
  if (!p) return ''
  const info = PLANETS[name]
  const parts = [
    `${info?.cn ?? name} · ${kindLabel(name)}｜${info?.detail ?? ''}`,
    planetInSignText(name, p.signIndex),
    p.house > 0 ? planetInHouseText(name, p.house) : '',
  ].filter(Boolean)
  return parts.join('\n\n')
}

/** 相位一览的悬停/点击含义 */
function showAspect(type: string): void {
  window.alert(aspectText(type))
  sfx.pop()
}

/** 本地综合速读（无需 AI） */
const localReading = computed(() => {
  const c = chart.value
  if (!c) return ''

  const sun = c.planets.find((p) => p.name === 'Sun')
  const moon = c.planets.find((p) => p.name === 'Moon')
  const asc = c.ascendant.text

  const elSorted = Object.entries(c.elements).sort((a, b) => b[1].length - a[1].length)
  const dominantEl = elSorted[0]
  const EL_TEXT: Record<string, string> = {
    fire: '行动先于思考，热情是你的默认设置',
    earth: '务实与感官是你的锚，安全感来自看得摸得着的东西',
    air: '信息与关系是你的氧气，思考本身就是一种生活',
    water: '情绪与直觉是你的罗盘，感受力是最锋利的天赋',
  }

  const topAspects = [...c.aspects].sort((a, b) => b.strength - a.strength).slice(0, 3)
  const ASPECT_CN_LOCAL: Record<string, string> = {
    conjunction: '合相', sextile: '六合', square: '刑相', trine: '拱相', opposition: '冲相',
  }
  const NATURE_SHORT: Record<string, string> = {
    conjunction: '两股能量深度绑定，是盘面的主旋律',
    sextile: '隐藏的机会通道，主动一点就能打开',
    square: '反复出现的张力点，也是成长最快的引擎',
    trine: '天生顺手的才华区，记得别让它闲置',
    opposition: '人生跷跷板的两端，课题在于来回取平衡',
  }

  const lines = [
    `你的太阳在${sun ? `${sun.signCn}第${sun.house}宫` : '—'}，月亮在${moon ? `${moon.signCn}第${moon.house}宫` : '—'}，上升${asc}。`,
    `元素分布以「${dominantEl ? ELEMENT_CN[dominantEl[0]!] : '—'}」为主导——${dominantEl ? EL_TEXT[dominantEl[0]!] : ''}。`,
    ...topAspects.map((a) => {
      const cnA = PLANETS[a.body1]?.cn ?? a.body1
      const cnB = PLANETS[a.body2]?.cn ?? a.body2
      return `${cnA}${ASPECT_CN_LOCAL[a.type] ?? a.type}${cnB}（强度 ${a.strength}%）：${NATURE_SHORT[a.type] ?? ''}。`
    }),
  ]
  if (c.patterns.length > 0) {
    lines.push(`格局检测：你拥有「${c.patterns.map((pt) => pt.cn).join('」「')}」，这是整张盘最醒目的骨架。`)
  }
  return lines.join('\n')
})

function submit(): void {
  errorText.value = ''

  const [y, m, d] = form.value.date.split('-').map(Number)
  const [hh, mm] = form.value.time.split(':').map(Number)
  if (!y || !m || !d || Number.isNaN(hh) || Number.isNaN(mm)) {
    errorText.value = t('err.date')
    return
  }
  if (!Number.isFinite(form.value.lat) || !Number.isFinite(form.value.lng)) {
    errorText.value = t('err.coord')
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
    addHistory({
      type: 'astrology',
      label: `占星 · ${chart.value.planets.find((p) => p.name === 'Sun')?.signCn ?? ''}本命盘`,
      summary: `上升 ${chart.value.ascendant.text}；太阳 ${chart.value.planets.find((p) => p.name === 'Sun')?.signCn ?? '—'}；月亮 ${chart.value.planets.find((p) => p.name === 'Moon')?.signCn ?? '—'}；共 ${chart.value.aspects.length} 条主要相位`,
      detail: localReading.value,
    })
    sfx.ding()
  } catch (e) {
    errorText.value = t('err.calc', { msg: e instanceof Error ? e.message : String(e) })
  }
}

const aiContext = computed(() => {
  const c = chart.value
  if (!c) return ''
  const planets = c.planets
    .map((p) => `${PLANET_CN_OF(p.name)} ${p.signCn}${p.degText}${p.retro ? '逆行' : ''}（第${p.house}宫）`)
    .join('；')
  return [
    '以下是用户本命盘数据，请给出综合人格画像与人生主题解读：',
    `上升：${c.ascendant.text}；天顶：${c.midheaven.text}`,
    `星体落座：${planets}`,
    `主要相位：${c.aspects.map((a) => `${PLANET_CN_OF(a.body1)} ${a.type} ${PLANET_CN_OF(a.body2)}`).join('、')}`,
    c.patterns.length > 0 ? `格局：${c.patterns.map((pt) => pt.cn).join('、')}` : '',
  ].filter(Boolean).join('\n')
})

function PLANET_CN_OF(key: string): string {
  return PLANETS[key]?.cn ?? key
}
</script>

<script lang="ts">
export default {}
</script>

<template>
  <div class="page-root">
    <h2><DecryptTitle :text="t('astro.title')" /></h2>
    <p class="hint">{{ t('astro.hint') }}</p>

    <section class="panel" style="margin-top: 18px;">
      <div class="form-row">
        <label class="field"><span>{{ t('bf.date') }}</span><input v-model="form.date" type="date" /></label>
        <label class="field"><span>{{ t('bf.time') }}</span><input v-model="form.time" type="time" /></label>
        <label class="field">
          <span>{{ t('bf.tz') }}</span>
          <select v-model.number="form.tz">
            <option v-for="tz in TIMEZONES" :key="tz.label" :value="tz.value">{{ tz.label }}</option>
          </select>
        </label>
      </div>
      <div class="form-row">
        <label class="field">
          <span>{{ t('bf.city') }}</span>
          <select v-model.number="form.cityIndex" @change="onCityChange">
            <option :value="-1">{{ t('bf.manual') }}</option>
            <option v-for="(c, i) in CITY_PRESETS" :key="c.city" :value="i">{{ c.city }}</option>
          </select>
        </label>
        <label class="field"><span>{{ t('bf.lat') }}</span><input v-model.number="form.lat" type="number" step="0.0001" /></label>
        <label class="field"><span>{{ t('bf.lng') }}</span><input v-model.number="form.lng" type="number" step="0.0001" /></label>
      </div>
      <button class="btn" @click="submit">{{ t('astro.submit') }}</button>
      <p v-if="errorText" class="error-text">{{ errorText }}</p>
    </section>

    <template v-if="chart">
      <div class="divider-star">✦ ✦ ✦</div>

      <section class="astro-layout">
        <AstroWheel :planets="chart.planets" :cusps="chart.cusps" :asc-lon="chart.ascendant.lon" :aspects="chart.aspects" />

        <section class="panel astro-facts">
          <h3 style="margin-top: 0;">{{ t('astro.facts') }}</h3>
          <ul class="fact-list">
            <li><strong>{{ t('astro.asc') }} {{ chart.ascendant.text }}</strong>{{ t('astro.ascDesc') }}</li>
            <li><strong>{{ t('astro.mc') }} {{ chart.midheaven.text }}</strong>{{ t('astro.mcDesc') }}</li>
            <li>{{ t('astro.elements') }}：{{ Object.entries(chart.elements).map(([el, names]) => `${ELEMENT_CN[el] ?? el} ${names.length}`).join('　·　') }}</li>
            <li>{{ t('astro.modalities') }}：{{ Object.entries(chart.modalities).map(([md, names]) => `${MODALITY_CN[md] ?? md} ${names.length}`).join('　·　') }}</li>
          </ul>

          <h3>{{ t('astro.planets') }}<span class="hint" style="font-size: 0.75rem;">{{ t('astro.planetsTip') }}</span></h3>
          <table class="planet-table">
            <tbody>
              <template v-for="p in chart.planets" :key="p.name">
                <tr class="planet-row" @click="togglePlanet(p.name)">
                  <td class="pg">{{ p.glyph }}</td>
                  <td>{{ p.cn }}<span v-if="p.retro" class="retro">℞</span><span class="chev">{{ expandedPlanet === p.name ? '▾' : '▸' }}</span></td>
                  <td>{{ locale === 'zh' ? p.signCn : SIGNS[p.signIndex]?.en }} {{ p.degText }}</td>
                  <td class="dim">{{ t('c.houseShort', { n: p.house }) }}</td>
                </tr>
                <tr v-if="expandedPlanet === p.name">
                  <td colspan="4" class="planet-detail bounce-in">{{ planetDetail(p.name) }}</td>
                </tr>
              </template>
            </tbody>
          </table>

          <h3>{{ t('astro.aspects') }}（{{ chart.aspects.length }}）<span class="hint" style="font-size: 0.75rem;">{{ t('astro.aspectsTip') }}</span></h3>
          <div class="aspect-chip-row">
            <button
              v-for="(a, i) in chart.aspects.slice(0, 14)"
              :key="'asp' + i"
              class="mini-aspect"
              :class="'na-' + a.type"
              :title="ASPECTS[a.type]?.cn"
              @click="showAspect(a.type)"
            >{{ PLANET_CN_OF(a.body1) }} {{ a.symbol }} {{ PLANET_CN_OF(a.body2) }}</button>
          </div>
        </section>
      </section>

      <!-- 本地综合速读 -->
      <section class="panel reading-panel stagger-in" style="margin-top: 18px;">
        <h3 style="margin-top: 0;">{{ t('astro.quick') }}<span class="tag">{{ t('c.localTag') }}</span></h3>
        <div class="reading">{{ localReading }}</div>
      </section>

      <!-- 格局 -->
      <section v-if="chart.patterns.length" class="panel reading-panel">
        <h3 style="margin-top: 0;">{{ t('astro.patterns') }}<span class="tag">Pattern</span></h3>
        <div v-for="(pt, i) in chart.patterns" :key="'pat' + i" class="pattern-card">
          <strong>{{ pt.cn }}</strong>
          <span class="pattern-bodies">{{ pt.bodies.map((b) => PLANETS[b]?.cn ?? b).join(' · ') }}</span>
          <p>{{ pt.desc || PATTERNS_CN[pt.type]?.desc }}</p>
        </div>
      </section>

      <!-- 星座 & 宫位百科入口 -->
      <section class="panel reading-panel">
        <h3 style="margin-top: 0;">{{ t('astro.zodiac') }}<span class="hint" style="font-size: 0.75rem;">{{ t('astro.zodiacTip') }}</span></h3>
        <div class="zodiac-grid">
          <button v-for="(s, i) in SIGNS" :key="s.en" class="zodiac-chip" @click="signModal = i; sfx.blip()">
            <span class="zg-glyph">{{ s.glyph }}</span>{{ locale === 'zh' ? s.cn : s.en }}
          </button>
        </div>
        <div class="zodiac-grid house-grid">
          <button v-for="h in HOUSES" :key="h.num" class="zodiac-chip" @click="houseModal = h.num; sfx.blip()">
            <span class="zg-glyph">{{ h.num }}</span>{{ locale === 'zh' ? h.cn : h.en }}
          </button>
        </div>
      </section>

      <AiChat :context="aiContext" :title="t('ai.astro.title')" :intro="t('ai.astro.intro')" />
    </template>

    <!-- 星座档案弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="signModal !== null" class="modal-backdrop" @click.self="signModal = null">
          <div class="modal-panel panel bounce-in">
            <button class="modal-close btn small ghost" @click="signModal = null">✕ 关闭</button>
            <span class="dc-label">{{ SIGNS[signModal]!.en.toUpperCase() }}</span>
            <pre class="reading sign-full">{{ signFullText(signModal!) }}</pre>
          </div>
        </div>
      </Transition>
      <Transition name="modal">
        <div v-if="houseModal !== null" class="modal-backdrop" @click.self="houseModal = null">
          <div class="modal-panel panel bounce-in">
            <button class="modal-close btn small ghost" @click="houseModal = null">✕ 关闭</button>
            <pre class="reading sign-full">{{ houseFullText(houseModal!) }}</pre>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
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
.planet-row { cursor: pointer; transition: background 0.2s; }
.planet-row:hover { background: rgba(124, 107, 214, 0.18); }
.planet-row .chev { color: var(--ink-dim); font-size: 0.7rem; margin-left: 6px; }
.planet-detail {
  color: var(--lavender-soft);
  font-size: 0.85rem;
  line-height: 1.8;
  background: rgba(124, 107, 214, 0.12);
  white-space: pre-wrap;
}
.planet-table .pg { font-size: 1.2rem; color: var(--gold); width: 34px; }
.retro { color: var(--danger); font-size: 0.75rem; margin-left: 4px; }
.dim { color: var(--ink-dim); font-size: 0.85rem; text-align: right; }
.reading-panel { margin-top: 26px; }

.aspect-chip-row { display: flex; flex-wrap: wrap; gap: 7px; }
.mini-aspect {
  background: rgba(30, 26, 69, 0.65);
  border: 1.5px solid rgba(179, 166, 247, 0.35);
  color: var(--ink);
  font-size: 0.82rem;
  padding: 4px 10px;
  border-radius: 999px;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.2s;
}
.mini-aspect:hover { transform: scale(1.08) rotate(-1.5deg); }
.na-trine { color: #b3a6f7; border-color: #b3a6f7; }
.na-sextile { color: #7de8c3; border-color: #7de8c3; }
.na-square { color: #ff8a8a; border-color: #ff8a8a; }
.na-opposition { color: #ffb37a; border-color: #ffb37a; }
.na-conjunction { color: #f5c86e; border-color: #f5c86e; }

.pattern-card {
  padding: 12px 16px;
  margin-top: 12px;
  background: rgba(124, 107, 214, 0.12);
  border-left: 3px solid var(--pink);
  border-radius: 8px;
}
.pattern-card strong { color: var(--gold-bright); font-family: var(--cute); font-weight: 400; }
.pattern-bodies { display: block; color: var(--ink-dim); font-size: 0.8rem; margin: 4px 0; }
.pattern-card p { margin: 4px 0 0; line-height: 1.8; font-size: 0.9rem; }

.zodiac-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.house-grid { margin-top: 10px; }
.zodiac-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(30, 26, 69, 0.6);
  border: 1.5px solid rgba(179, 166, 247, 0.3);
  color: var(--ink);
  font-size: 0.85rem;
  padding: 5px 11px;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.zodiac-chip:hover { transform: translateY(-2px) scale(1.05); border-color: var(--gold); }
.zg-glyph { color: var(--gold-bright); font-size: 1em; }

.dc-label { font-family: var(--pixel); font-size: 0.55rem; letter-spacing: 0.15em; color: var(--pink-soft); }
.sign-full { font-family: inherit; white-space: pre-wrap; }

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
  max-width: 560px;
  width: 100%;
  max-height: 84vh;
  overflow: auto;
  position: relative;
  background: var(--void-1);
}
.modal-close { position: absolute; top: 14px; right: 14px; }
.modal-enter-active { transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
.modal-leave-active { transition: all 0.18s ease; }
.modal-enter-from { opacity: 0; }
.modal-enter-from .modal-panel { transform: scale(0.85) translateY(20px); }
.modal-leave-to { opacity: 0; }
</style>
