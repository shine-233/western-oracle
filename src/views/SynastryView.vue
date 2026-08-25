<script setup lang="ts">
import { defineAsyncComponent, nextTick, ref, watch } from 'vue'
import { computeNatalChart, crossAspects, type BirthInput, type ChartPlanet, type CrossAspect, type NatalChart } from '../lib/astrology'
import { PLANETS } from '../data/corpus'
import { readSynastry, type SynastryReading } from '../lib/interpret'
import { addHistory } from '../lib/history'
import { sfx } from '../lib/sfx'
import { sparkle } from '../lib/sparkle'
import { t } from '../lib/i18n'
import AstroWheel from '../components/AstroWheel.vue'
import BirthForm from '../components/BirthForm.vue'
import { vTilt } from '../lib/tilt'
import AiChat from '../components/AiChat.vue'
import DecryptTitle from '../components/DecryptTitle.vue'

const MascotCard = defineAsyncComponent(() => import('../components/MascotCard.vue'))

const chartA = ref<NatalChart | null>(null)
const chartB = ref<NatalChart | null>(null)
const aspects = ref<CrossAspect[]>([])
const reading = ref<SynastryReading | null>(null)
const pet = ref<InstanceType<typeof MascotCard> | null>(null)

function onSubmitA(input: BirthInput): void {
  chartA.value = computeNatalChart(input)
  tryPair()
}

function onSubmitB(input: BirthInput): void {
  chartB.value = computeNatalChart(input)
  tryPair()
}

function tryPair(): void {
  if (chartA.value && chartB.value) {
    aspects.value = crossAspects(chartA.value.planets, chartB.value.planets)
    reading.value = readSynastry(chartA.value, chartB.value, aspects.value)
    sfx.ding()
    pet.value?.celebrate()

    const cn = (k: string): string => PLANETS[k]?.cn ?? k
    const top = aspects.value.slice(0, 6).map((a) => `A方${cn(a.body1)}${a.type}B方${cn(a.body2)}`).join('、')
    addHistory({
      type: 'synastry',
      label: '合盘 · 双人比较盘',
      summary: `${reading.value.tags.join(' / ')}；缘分指数 ${reading.value.score}；交叉相位 ${aspects.value.length} 条：${top}`,
      detail: [reading.value.overview, ...reading.value.items.map((it) => `${it.title}\n${it.text}`), reading.value.advice].join('\n\n'),
    })
  }
}

function planetLine(p: ChartPlanet): string {
  return `${p.cn} ${p.signCn}${p.degText}${p.retro ? '℞' : ''}（第${p.house}宫）`
}

/* ---------- 高分庆祝：缘分指数 ≥ 80 时星屑环绕 ---------- */
const scoreWrap = ref<HTMLElement | null>(null)

watch(reading, async (r) => {
  if (!r || r.score < 80) return
  await nextTick()
  const el = scoreWrap.value?.querySelector('.score-ring')
  if (!el) return
  const rect = el.getBoundingClientRect()
  sparkle(rect.left + rect.width / 2, rect.top + rect.height / 2, 16)
})

const aiContext = (): string => {
  if (!chartA.value || !chartB.value || !reading.value) return ''
  const top = aspects.value.slice(0, 15)
  return [
    '请解读两人合盘（比较盘）的缘分与相处课题，语气温柔有趣：',
    `本地规则引擎结论：${reading.value.overview} 缘分指数 ${reading.value.score}/100（${reading.value.tags.join('、')}）。请在此基础上深化，不要重复罗列。`,
    `A 方：${chartA.value.planets.map(planetLine).join('；')}`,
    `B 方：${chartB.value.planets.map(planetLine).join('；')}`,
    `交叉相位（按紧密程度排序）：${top.map((a) => `A方${PLANETS[a.body1]?.cn ?? a.body1} ${a.type} B方${PLANETS[a.body2]?.cn ?? a.body2}（偏差${a.orb}°）`).join('、')}`,
  ].join('\n')
}
</script>

<template>
  <div class="page-root">
    <h2><DecryptTitle :text="t('syn.title')" /></h2>
    <p class="hint">{{ t('syn.hint') }}</p>

    <div class="pair-forms">
      <section class="panel">
        <h3 style="margin-top: 0;">{{ t('syn.personA') }}</h3>
        <BirthForm use-saved :button-label="t('synastry.aSubmit')" @submit="onSubmitA" />
      </section>
      <section class="panel">
        <h3 style="margin-top: 0;">{{ t('syn.personB') }}</h3>
        <BirthForm :button-label="t('synastry.bSubmit')" @submit="onSubmitB" />
      </section>
    </div>

    <template v-if="chartA && chartB && reading">
      <div class="divider-star">✦ ✦ ✦</div>

      <!-- 缘分指数卡 -->
      <section class="panel score-panel bounce-in">
        <div ref="scoreWrap" class="score-ring-wrap">
          <svg viewBox="0 0 120 120" class="score-ring">
            <circle cx="60" cy="60" r="52" class="ring-bg" />
            <circle cx="60" cy="60" r="52" class="ring-fg" :stroke-dasharray="`${(reading.score / 100) * 327} 327`" />
            <text x="60" y="57" text-anchor="middle" class="score-num">{{ reading.score }}</text>
            <text x="60" y="76" text-anchor="middle" class="score-label">{{ t('syn.score') }}</text>
          </svg>
        </div>
        <div class="score-info">
          <div class="tag-row">
            <span v-for="t in reading.tags" :key="t" class="love-tag">{{ t }}</span>
          </div>
          <p class="reading">{{ reading.overview }}</p>
        </div>
      </section>

      <section class="astro-layout" style="margin-top: 18px;">
        <div v-tilt="5">
          <AstroWheel
            :planets="chartA.planets"
            :cusps="chartA.cusps"
            :asc-lon="chartA.ascendant.lon"
            :aspects="chartA.aspects"
            :inner-planets="chartB.planets"
            :synastry-aspects="aspects"
          />
        </div>

        <section class="panel">
          <h3 style="margin-top: 0;">{{ t('syn.overview') }}</h3>
          <div class="side-by-side">
            <div>
              <p class="who">{{ t('syn.sideA') }}</p>
              <ul class="fact-list">
                <li>{{ t('astro.asc') }} {{ chartA.ascendant.text }}</li>
                <li v-for="p in chartA.planets.slice(0, 6)" :key="'a' + p.name">{{ planetLine(p) }}</li>
              </ul>
            </div>
            <div>
              <p class="who b">{{ t('syn.sideB') }}</p>
              <ul class="fact-list">
                <li>{{ t('astro.asc') }} {{ chartB.ascendant.text }}</li>
                <li v-for="p in chartB.planets.slice(0, 6)" :key="'b' + p.name">{{ planetLine(p) }}</li>
              </ul>
            </div>
          </div>
        </section>
      </section>

      <section class="panel reading-panel stagger-in" style="margin-top: 18px;">
        <h3 style="margin-top: 0;">{{ t('syn.local') }}<span class="tag">{{ t('syn.localTag', { n: aspects.length }) }}</span></h3>
        <ol class="interp-list">
          <li v-for="(item, i) in reading.items" :key="i" class="interp-item">
            <strong class="interp-title">{{ item.title }}</strong>
            <p>{{ item.text }}</p>
          </li>
        </ol>
        <p v-if="reading.items.length === 0" class="hint">{{ t('syn.none') }}</p>
        <div class="advice-box">✧ {{ reading.advice }}</div>
      </section>

      <MascotCard ref="pet" id="twins" />
      <AiChat :context="aiContext()" :title="t('ai.syn.title')" :intro="t('ai.syn.intro')" />
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

/* 缘分指数卡 */
.score-panel {
  display: flex;
  gap: 24px;
  align-items: center;
  flex-wrap: wrap;
}
.score-ring { width: 150px; height: 150px; }
.ring-bg {
  fill: none;
  stroke: rgba(179, 166, 247, 0.18);
  stroke-width: 9;
}
.ring-fg {
  fill: none;
  stroke: var(--pink);
  stroke-width: 9;
  stroke-linecap: round;
  transform: rotate(-90deg);
  transform-origin: 60px 60px;
  filter: drop-shadow(0 0 8px rgba(255, 159, 206, 0.7));
  animation: ring-fill 1.4s cubic-bezier(0.34, 1.3, 0.64, 1) both;
}
@keyframes ring-fill {
  from { stroke-dashoffset: 330; }
}
.score-num {
  fill: var(--gold-bright);
  font-size: 34px;
  font-family: var(--cute);
}
.score-label { fill: var(--ink-dim); font-size: 10px; letter-spacing: 0.2em; }
.score-info { flex: 1 1 300px; }
.tag-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
.love-tag {
  border: 1.5px solid var(--pink);
  color: var(--pink);
  font-size: 0.82rem;
  padding: 3px 12px;
  border-radius: 999px;
  animation: tag-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.love-tag:nth-child(2) { animation-delay: 0.1s; border-color: var(--gold); color: var(--gold); }
.love-tag:nth-child(3) { animation-delay: 0.2s; border-color: var(--mint); color: var(--mint); }
@keyframes tag-pop {
  from { opacity: 0; transform: scale(0.6) rotate(-6deg); }
}

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

.reading-panel { margin-top: 26px; }
.interp-list { margin: 0; padding-left: 22px; display: flex; flex-direction: column; gap: 14px; }
.interp-item { line-height: 1.85; }
.interp-item p { margin: 4px 0 0; color: var(--ink); font-size: 0.93rem; white-space: pre-line; }
.interp-title { color: var(--lavender-soft); font-weight: 400; }
.advice-box {
  margin-top: 18px;
  padding: 13px 16px;
  background: rgba(124, 107, 214, 0.16);
  border-left: 3px solid var(--gold);
  border-radius: 8px;
  line-height: 1.9;
}
</style>
