<script setup lang="ts">
import { ref } from 'vue'
import { PLANET_CN, computeNatalChart, crossAspects, type BirthInput, type ChartPlanet, type CrossAspect, type NatalChart } from '../lib/astrology'
import { askAI, isAiEnabled, oracleSystemPrompt } from '../lib/ai'
import AstroWheel from '../components/AstroWheel.vue'
import BirthForm from '../components/BirthForm.vue'

const chartA = ref<NatalChart | null>(null)
const chartB = ref<NatalChart | null>(null)
const aspects = ref<CrossAspect[]>([])
const aiText = ref<string | null>(null)
const aiLoading = ref(false)
const aiFailed = ref(false)

function onSubmitA(input: BirthInput): void {
  chartA.value = computeChartOf(input)
  tryPair()
}

function onSubmitB(input: BirthInput): void {
  chartB.value = computeChartOf(input)
  tryPair()
}

function computeChartOf(input: BirthInput): NatalChart {
  return computeNatalChart(input)
}

function tryPair(): void {
  if (chartA.value && chartB.value) {
    aspects.value = crossAspects(chartA.value.planets, chartB.value.planets)
    aiText.value = null
    aiFailed.value = false
  }
}

function planetLine(p: ChartPlanet): string {
  return `${PLANET_CN[p.name]} ${p.signCn}${p.degText}${p.retro ? '℞' : ''}（第${p.house}宫）`
}

async function askAiInterpretation(): Promise<void> {
  if (!chartA.value || !chartB.value || !isAiEnabled() || aiLoading.value) return
  aiLoading.value = true
  aiFailed.value = false
  aiText.value = null

  const top = aspects.value.slice(0, 15)
  const payload = [
    '请解读两人合盘（比较盘）的缘分与相处课题，语气温柔有趣：',
    `A 方：${chartA.value.planets.map(planetLine).join('；')}`,
    `B 方：${chartB.value.planets.map(planetLine).join('；')}`,
    `交叉相位（按紧密程度排序）：${top.map((a) => `A方${PLANET_CN[a.body1]} ${a.type} B方${PLANET_CN[a.body2]}（偏差${a.orb}°）`).join('、')}`,
  ].join('\n')

  const res = await askAI(oracleSystemPrompt(), payload)
  if (res === null) aiFailed.value = true
  else aiText.value = res
  aiLoading.value = false
}
</script>

<template>
  <div class="page-root">
    <h2>合盘 · Synastry</h2>
  <p class="hint">两盘对照：外环是 A 方，内环是 B 方；虚线是两人星体之间的交叉相位，越紧的缘分越"吵"（也越深）。</p>

  <div class="pair-forms">
    <section class="panel">
      <h3 style="margin-top: 0;">✦ A 方（默认读取本机档案）</h3>
      <BirthForm use-saved button-label="录入 A 方星盘" @submit="onSubmitA" />
    </section>
    <section class="panel">
      <h3 style="margin-top: 0;">✧ B 方</h3>
      <BirthForm button-label="录入 B 方星盘" @submit="onSubmitB" />
    </section>
  </div>

  <template v-if="chartA && chartB">
    <div class="divider-star">✦ ✦ ✦</div>

    <section class="astro-layout">
      <AstroWheel
        :planets="chartA.planets"
        :cusps="chartA.cusps"
        :asc-lon="chartA.ascendant.lon"
        :aspects="chartA.aspects"
        :inner-planets="chartB.planets"
        :synastry-aspects="aspects"
      />

      <section class="panel">
        <h3 style="margin-top: 0;">双方速览</h3>
        <div class="side-by-side">
          <div>
            <p class="who">A 方</p>
            <ul class="fact-list">
              <li>上升 {{ chartA.ascendant.text }}</li>
              <li v-for="p in chartA.planets.slice(0, 5)" :key="p.name">{{ planetLine(p) }}</li>
            </ul>
          </div>
          <div>
            <p class="who b">B 方</p>
            <ul class="fact-list">
              <li>上升 {{ chartB.ascendant.text }}</li>
              <li v-for="p in chartB.planets.slice(0, 5)" :key="p.name">{{ planetLine(p) }}</li>
            </ul>
          </div>
        </div>
      </section>
    </section>

    <section class="panel" style="margin-top: 18px;">
      <h3 style="margin-top: 0;">交叉相位（{{ aspects.length }} 条，按紧密排序）</h3>
      <div class="aspect-chips">
        <span
          v-for="(a, i) in aspects"
          :key="i"
          class="aspect-chip"
          :class="'t-' + a.type"
          :title="`偏差 ${a.orb}°`"
        >A{{ PLANET_CN[a.body1] }} {{ a.type === 'conjunction' ? '☌' : a.type === 'opposition' ? '☍' : a.type === 'trine' ? '△' : a.type === 'square' ? '□' : '⚹' }} B{{ PLANET_CN[a.body2] }}</span>
      </div>
      <p v-if="aspects.length === 0" class="hint">没有紧密交叉相位——你们是细水长流型（或者八竿子打不着，看 AI 怎么说）。</p>
    </section>

    <section class="panel reading-panel" style="margin-top: 18px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0;">AI 缘分解读</h3>
        <button v-if="!aiText" class="btn small" :disabled="aiLoading" @click="askAiInterpretation">
          {{ aiLoading ? '红线测算中…' : '开始解读' }}
        </button>
      </div>
      <div v-if="aiText" class="reading ai" style="margin-top: 14px;">{{ aiText }}</div>
      <p v-else-if="aiFailed" class="error-text" style="margin-bottom: 0;">AI 解读失败：请检查设置中的接口地址与密钥。</p>
      <p v-else-if="!isAiEnabled()" class="hint" style="margin-bottom: 0;">在「设置」中配置 API Key 即可启用 AI 缘分解读。</p>
    </section>
  </template>
  </div>
</template>

<style scoped>
.pair-forms {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-top: 18px;
}
@media (max-width: 860px) { .pair-forms { grid-template-columns: 1fr; } }

.astro-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  gap: 22px;
  align-items: start;
}
@media (max-width: 800px) { .astro-layout { grid-template-columns: 1fr; } }

.side-by-side { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.who { font-family: var(--cute); color: var(--gold-bright); margin: 0 0 6px; font-size: 1.05rem; }
.who.b { color: var(--mint); }
.fact-list { margin: 0; padding-left: 16px; line-height: 1.9; font-size: 0.88rem; color: var(--ink); }

.aspect-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.aspect-chip {
  font-size: 0.82rem;
  padding: 5px 12px;
  border-radius: 999px;
  border: 1.5px solid;
  cursor: default;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.aspect-chip:hover { transform: scale(1.08) rotate(-2deg); }
.t-conjunction { color: #f5c86e; border-color: #f5c86e; }
.t-sextile { color: #7de8c3; border-color: #7de8c3; }
.t-square { color: #ff8a8a; border-color: #ff8a8a; }
.t-trine { color: #b3a6f7; border-color: #b3a6f7; }
.t-opposition { color: #ffb37a; border-color: #ffb37a; }
.reading-panel { margin-top: 26px; }
</style>
