<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  ASPECT_CN,
  ELEMENT_CN,
  computeNatalChart,
  crossAspects,
  moonPhase,
  type BirthInput,
  type NatalChart,
} from '../lib/astrology'
import { PLANETS } from '../data/corpus'
import { readTransits, type TransitReading } from '../lib/interpret'
import { addHistory } from '../lib/history'
import { sfx } from '../lib/sfx'
import { vTilt } from '../lib/tilt'
import { t, locale } from '../lib/i18n'
import { SIGNS } from '../data/corpus'
import AstroWheel from '../components/AstroWheel.vue'
import BirthForm from '../components/BirthForm.vue'
import AiChat from '../components/AiChat.vue'
import DecryptTitle from '../components/DecryptTitle.vue'

const natal = ref<NatalChart | null>(null)
const sky = ref<NatalChart | null>(null)
const aspects = ref<ReturnType<typeof crossAspects>>([])
const reading = ref<TransitReading | null>(null)
const lastRefresh = ref('')

const phase = moonPhase()
const moonName = computed(() => t(`moon.${phase.index}.name`))
const moonDesc = computed(() => t(`moon.${phase.index}.desc`))

/** 当前时刻天象盘（用浏览器本地时区；宫位无意义，仅取行星） */
function computeSky(): NatalChart {
  const now = new Date()
  return computeNatalChart({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
    hour: now.getHours(),
    minute: now.getMinutes(),
    timezone: -now.getTimezoneOffset() / 60,
    latitude: 0,
    longitude: 0,
  })
}

function onSubmit(input: BirthInput): void {
  natal.value = computeNatalChart(input)
  refresh(true)
}

function refresh(first = false): void {
  if (!natal.value) return
  sky.value = computeSky()
  aspects.value = crossAspects(sky.value.planets, natal.value.planets)
  reading.value = readTransits(natal.value, sky.value, aspects.value)
  lastRefresh.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  if (!first) sfx.whoosh()

  if (first && reading.value) {
    const cn = (k: string): string => PLANETS[k]?.cn ?? k
    addHistory({
      type: 'transit',
      label: `行运 · ${lastRefresh.value}`,
      summary: `${reading.value.overview.split('。')[0]}。重点相位：${aspects.value.slice(0, 5).map((a) => `行运${cn(a.body1)}${ASPECT_CN[a.type]}本命${cn(a.body2)}`).join('、') || '无紧密行运'}`,
      detail: [
        reading.value.overview,
        ...(reading.value.highlight ? [reading.value.highlight] : []),
        ...reading.value.items.map((it) => `${it.title}\n${it.text}`),
      ].join('\n\n'),
    })
  }
}

const skySunSign = computed(() => sky.value?.planets.find((p) => p.name === 'Sun')?.signCn ?? '')
const skyMoonSign = computed(() => sky.value?.planets.find((p) => p.name === 'Moon')?.signCn ?? '')

const elementLine = computed(() => {
  if (!natal.value) return ''
  return Object.entries(natal.value.elements).map(([k, v]) => `${ELEMENT_CN[k]} ${v.length}`).join(' · ')
})

const aiContext = (): string => {
  if (!natal.value || !sky.value || !reading.value) return ''
  const transits = sky.value.planets.map((p) => `行运${PLANETS[p.name]?.cn ?? p.name} ${p.signCn}${p.degText}${p.retro ? '逆行' : ''}`).join('；')
  const natalLine = natal.value.planets.map((p) => `本命${p.cn} ${p.signCn}${p.degText}`).join('；')
  return [
    '请解读当下行运对这个人本命盘的影响，给出未来两三周的行动建议：',
    `本地引擎结论：${reading.value.overview}${reading.value.highlight ? '\n重点：' + reading.value.highlight : ''}。请在此基础上深化，不要重复罗列。`,
    natalLine,
    `当前天象：${transits}`,
    `当前主要行运相位：${aspects.value.slice(0, 12).map((a) => `行运${PLANETS[a.body1]?.cn ?? a.body1} ${a.type} 本命${PLANETS[a.body2]?.cn ?? a.body2}（偏差 ${a.orb}°）`).join('、')}`,
  ].join('\n')
}
</script>

<template>
  <div class="page-root">
    <h2><DecryptTitle :text="t('tr.title')" /></h2>
    <p class="hint">{{ t('tr.hint') }}</p>

    <section class="panel" style="margin-top: 18px;">
      <BirthForm use-saved :button-label="t('transits.submit')" @submit="onSubmit" />
    </section>

    <template v-if="natal && sky && reading">
      <div class="divider-star">✦ ✦ ✦</div>

      <section class="sky-strip panel bounce-in">
        <div class="sky-item"><span class="dc-label">{{ t('tr.sunNow') }}</span><strong>{{ skySunSign }}</strong></div>
        <div class="sky-item"><span class="dc-label">{{ t('tr.moonNow') }}</span><strong>{{ skyMoonSign }}</strong></div>
        <div class="sky-item"><span class="dc-label">{{ t('tr.phase') }}</span><strong>{{ phase.emoji }} {{ moonName }}</strong><small>{{ moonDesc }}</small></div>
        <div class="sky-item"><span class="dc-label">{{ t('tr.refreshed') }}</span><strong>{{ lastRefresh }}</strong><button class="btn ghost small" style="margin-top: 6px;" @click="refresh()">{{ t('tr.refresh') }}</button></div>
      </section>

      <!-- 今日主线 -->
      <section v-if="reading.highlight" class="panel highlight-card bounce-in" style="margin-top: 18px;">
        <h3 style="margin: 0 0 8px;">{{ t('tr.headline') }}<span class="tag">{{ t('c.localTag') }}</span></h3>
        <p style="margin: 0; line-height: 1.9;">{{ reading.highlight }}</p>
      </section>

      <section class="astro-layout" style="margin-top: 18px;">
        <div v-tilt="5">
          <AstroWheel
            :planets="natal.planets"
            :cusps="natal.cusps"
            :asc-lon="natal.ascendant.lon"
            :aspects="natal.aspects"
            :inner-planets="sky.planets"
            :synastry-aspects="aspects"
          />
        </div>

        <section class="panel">
          <h3 style="margin-top: 0;">{{ t('tr.sky') }}</h3>
          <table class="planet-table">
            <tbody>
              <tr v-for="p in sky.planets" :key="'sky-' + p.name">
                <td class="pg mint">{{ p.glyph }}</td>
                <td>{{ p.cn }}<span v-if="p.retro" class="retro">℞</span></td>
                <td>{{ locale === 'zh' ? p.signCn : SIGNS[p.signIndex]?.en }} {{ p.degText }}</td>
              </tr>
            </tbody>
          </table>
          <h3 style="margin-top: 18px;">{{ t('tr.natalTitle') }}</h3>
          <p class="hint">{{ t('astro.elements') }}：{{ elementLine }}；{{ t('astro.asc') }} {{ natal.ascendant.text }}，{{ t('astro.mc') }} {{ natal.midheaven.text }}。</p>
        </section>
      </section>

      <section class="panel reading-panel stagger-in" style="margin-top: 18px;">
        <h3 style="margin-top: 0;">{{ t('tr.list') }}<span class="tag">{{ t('tr.listTag', { n: aspects.length }) }}</span></h3>
        <p class="hint" style="margin-top: 0;">{{ reading.overview }}</p>
        <div class="transit-list">
          <div
            v-for="(item, i) in reading.items"
            :key="i"
            class="transit-item"
            :class="'lv-' + item.level"
          >
            <span class="lvl-dot" />
            <span class="txt">
              <strong>{{ item.title }}</strong>
              <em>{{ item.text }}</em>
            </span>
          </div>
        </div>
        <p v-if="reading.items.length === 0" class="hint">{{ t('tr.none') }}</p>
      </section>

      <AiChat :context="aiContext()" :title="t('ai.tr.title')" :intro="t('ai.tr.intro')" />
    </template>
  </div>
</template>

<style scoped>
.sky-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  text-align: center;
}
.sky-item { display: flex; flex-direction: column; gap: 4px; }
.sky-item strong { font-family: var(--cute); color: var(--gold-bright); font-size: 1.15rem; font-weight: 400; }
.sky-item small { color: var(--ink-dim); font-size: 0.78rem; line-height: 1.5; }

.highlight-card {
  border-color: rgba(245, 200, 110, 0.55);
  background:
    radial-gradient(ellipse at 90% 10%, rgba(245, 200, 110, 0.12), transparent 55%),
    var(--void-1);
}

.astro-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  gap: 22px;
  align-items: start;
}
@media (max-width: 800px) { .astro-layout { grid-template-columns: 1fr; } }

.planet-table { width: 100%; border-collapse: collapse; }
.planet-table td { padding: 6px 8px; border-bottom: 1px solid rgba(179, 166, 247, 0.15); font-size: 0.95rem; }
.planet-table .pg { font-size: 1.2rem; color: var(--gold); width: 34px; }
.planet-table .pg.mint { color: var(--mint); }
.retro { color: var(--danger); font-size: 0.75rem; margin-left: 4px; }

.reading-panel { margin-top: 26px; }
.transit-list { display: flex; flex-direction: column; gap: 8px; margin-top: 14px; }
.transit-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 11px 15px;
  border-radius: 12px;
  background: rgba(30, 26, 69, 0.6);
  border: 1px solid rgba(179, 166, 247, 0.2);
  font-size: 0.92rem;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.2s;
}
.transit-item:hover { transform: translateX(6px); border-color: rgba(179, 166, 247, 0.55); }
.lvl-dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 6px; flex-shrink: 0; }
.lv-high .lvl-dot { background: var(--pink); box-shadow: 0 0 10px var(--pink); animation: dot-pulse 1.6s ease-in-out infinite; }
.lv-mid .lvl-dot { background: var(--gold); box-shadow: 0 0 8px rgba(245, 200, 110, 0.7); }
.lv-low .lvl-dot { background: var(--lavender); opacity: 0.6; }
@keyframes dot-pulse { 50% { transform: scale(1.35); opacity: 0.75; } }
.transit-item .txt { flex: 1; display: flex; flex-direction: column; gap: 3px; }
.transit-item strong { color: var(--lavender-soft); font-weight: 400; }
.transit-item em { font-style: normal; color: var(--ink-dim); font-size: 0.86rem; line-height: 1.75; }
.dc-label { font-family: var(--pixel); font-size: 0.55rem; letter-spacing: 0.15em; color: var(--pink-soft); }
</style>
