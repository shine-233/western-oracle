<script setup lang="ts">
import { computed, ref } from 'vue'
import { ASPECT_CN, ELEMENT_CN, PLANET_CN, computeNatalChart, crossAspects, moonPhase, type BirthInput, type NatalChart } from '../lib/astrology'
import { askAI, isAiEnabled, oracleSystemPrompt } from '../lib/ai'
import AstroWheel from '../components/AstroWheel.vue'
import BirthForm from '../components/BirthForm.vue'
import { vTilt } from '../lib/tilt'

const natal = ref<NatalChart | null>(null)
const sky = ref<NatalChart | null>(null)
const aspects = ref<ReturnType<typeof crossAspects>>([])
const lastRefresh = ref('')
const aiText = ref<string | null>(null)
const aiLoading = ref(false)
const aiFailed = ref(false)

const phase = moonPhase()

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
  refresh()
}

function refresh(): void {
  if (!natal.value) return
  sky.value = computeSky()
  aspects.value = crossAspects(sky.value.planets, natal.value.planets)
  lastRefresh.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  aiText.value = null
  aiFailed.value = false
}

const skySunSign = computed(() => sky.value?.planets.find((p) => p.name === 'Sun')?.signCn ?? '')
const skyMoonSign = computed(() => sky.value?.planets.find((p) => p.name === 'Moon')?.signCn ?? '')

const elementLine = computed(() => {
  if (!natal.value) return ''
  return Object.entries(natal.value.elements).map(([k, v]) => `${ELEMENT_CN[k]} ${v.length}`).join(' · ')
})

function aspectLabel(a: { body1: string; body2: string; type: string; orb: number }): string {
  const sym = a.type === 'conjunction' ? '☌' : a.type === 'opposition' ? '☍' : a.type === 'trine' ? '△' : a.type === 'square' ? '□' : '⚹'
  return `行运${PLANET_CN[a.body1]} ${sym} 本命${PLANET_CN[a.body2]}（${ASPECT_CN[a.type]}，偏差 ${a.orb}°）`
}

async function askAiInterpretation(): Promise<void> {
  if (!natal.value || !sky.value || !isAiEnabled() || aiLoading.value) return
  aiLoading.value = true
  aiFailed.value = false
  aiText.value = null

  const transits = sky.value.planets.map((p) => `行运${PLANET_CN[p.name]} ${p.signCn}${p.degText}${p.retro ? '逆行' : ''}`).join('；')
  const natalLine = natal.value.planets.map((p) => `本命${PLANET_CN[p.name]} ${p.signCn}${p.degText}`).join('；')
  const payload = [
    '请解读当下行运对这个人本命盘的影响，给出未来两三周的行动建议：',
    natalLine,
    `当前天象：${transits}`,
    `当前主要行运相位：${aspects.value.slice(0, 12).map(aspectLabel).join('、')}`,
  ].join('\n')

  const res = await askAI(oracleSystemPrompt(), payload)
  if (res === null) aiFailed.value = true
  else aiText.value = res
  aiLoading.value = false
}
</script>

<template>
  <div class="page-root">
    <h2>行运 · Transits</h2>
  <p class="hint">天上的星星此刻正跑到的位置，与你本命盘产生的共振。外环是你的本命盘，内环是此刻的天空。</p>

  <section class="panel" style="margin-top: 18px;">
    <BirthForm use-saved button-label="生成我的行运盘" @submit="onSubmit" />
  </section>

  <template v-if="natal && sky">
    <div class="divider-star">✦ ✦ ✦</div>

    <section class="sky-strip panel bounce-in">
      <div class="sky-item"><span class="dc-label">太阳此刻</span><strong>{{ skySunSign }}</strong></div>
      <div class="sky-item"><span class="dc-label">月亮此刻</span><strong>{{ skyMoonSign }}</strong></div>
      <div class="sky-item"><span class="dc-label">今日月相</span><strong>{{ phase.emoji }} {{ phase.name }}</strong><small>{{ phase.desc }}</small></div>
      <div class="sky-item"><span class="dc-label">刷新于</span><strong>{{ lastRefresh }}</strong><button class="btn ghost small" style="margin-top: 6px;" @click="refresh">刷新天象</button></div>
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
        <h3 style="margin-top: 0;">此刻的天空</h3>
        <table class="planet-table">
          <tbody>
            <tr v-for="p in sky.planets" :key="'sky-' + p.name">
              <td class="pg mint">{{ p.glyph }}</td>
              <td>行运{{ PLANET_CN[p.name] }}<span v-if="p.retro" class="retro">℞</span></td>
              <td>{{ p.signCn }} {{ p.degText }}</td>
            </tr>
          </tbody>
        </table>
        <h3 style="margin-top: 18px;">你的本命格局</h3>
        <p class="hint">元素分布：{{ elementLine }}；上升 {{ natal.ascendant.text }}，天顶 {{ natal.midheaven.text }}。</p>
      </section>
    </section>

    <section class="panel" style="margin-top: 18px;">
      <h3 style="margin-top: 0;">正在发生的行运相位（{{ aspects.length }} 条，按紧密排序）</h3>
      <div class="transit-list">
        <div v-for="(a, i) in aspects" :key="i" class="transit-item" :class="'t-' + a.type">
          <span class="sym">{{ a.type === 'conjunction' ? '☌' : a.type === 'opposition' ? '☍' : a.type === 'trine' ? '△' : a.type === 'square' ? '□' : '⚹' }}</span>
          <span class="txt">行运{{ PLANET_CN[a.body1] }} × 本命{{ PLANET_CN[a.body2] }}</span>
          <span class="meta">{{ ASPECT_CN[a.type] }} · {{ a.orb }}°</span>
        </div>
      </div>
      <p v-if="aspects.length === 0" class="hint">此刻没有紧密行运相位——享受平静的一天吧！</p>
    </section>

    <section class="panel reading-panel" style="margin-top: 18px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0;">AI 行运解读</h3>
        <button v-if="!aiText" class="btn small" :disabled="aiLoading" @click="askAiInterpretation">
          {{ aiLoading ? '推演星轨中…' : '开始解读' }}
        </button>
      </div>
      <div v-if="aiText" class="reading ai" style="margin-top: 14px;">{{ aiText }}</div>
      <p v-else-if="aiFailed" class="error-text" style="margin-bottom: 0;">AI 解读失败：请检查设置中的接口地址与密钥。</p>
      <p v-else-if="!isAiEnabled()" class="hint" style="margin-bottom: 0;">在「设置」中配置 API Key 即可启用 AI 行运解读。</p>
    </section>
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

.transit-list { display: flex; flex-direction: column; gap: 8px; }
.transit-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 14px;
  border-radius: 12px;
  background: rgba(30, 26, 69, 0.6);
  border: 1px solid rgba(179, 166, 247, 0.2);
  font-size: 0.92rem;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.transit-item:hover { transform: translateX(6px); }
.transit-item .sym { font-size: 1.1rem; width: 24px; text-align: center; }
.transit-item .txt { flex: 1; }
.transit-item .meta { color: var(--ink-dim); font-size: 0.8rem; }
.t-conjunction .sym { color: #f5c86e; }
.t-sextile .sym { color: #7de8c3; }
.t-square .sym { color: #ff8a8a; }
.t-trine .sym { color: #b3a6f7; }
.t-opposition .sym { color: #ffb37a; }
.reading-panel { margin-top: 26px; }
</style>
