<script setup lang="ts">
/**
 * 行星时 · 今日择时
 * - 日出日落由本地算法计算；24 个行星时按迦勒底次序轮值
 * - 时间轴 24 格：日间暖色 / 夜间冷色，当前时辰呼吸高亮，点击看宜忌
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { CITY_PRESETS } from '../lib/astrology'
import { PLANETS } from '../data/corpus'
import {
  planetaryHours,
  currentPlanetHour,
  riseSet,
  type PlanetaryHour,
} from '../lib/planetaryHours'
import { loadJSON, saveJSON } from '../lib/storage'
import { tt } from '../lib/i18nExtra'
import { PLANET_GOOD, PLANET_AVOID } from '../lib/i18nExtra'
import { locale } from '../lib/i18n'
import { sfx } from '../lib/sfx'
import { sparkleFromEvent } from '../lib/sparkle'
import DecryptTitle from '../components/DecryptTitle.vue'

interface LocForm {
  cityIndex: number
  lat: number
  lng: number
}
const saved = loadJSON<Partial<LocForm>>('hours-loc', {})
const loc = ref<LocForm>({
  cityIndex: saved.cityIndex ?? -1,
  lat: saved.lat ?? 39.9042,
  lng: saved.lng ?? 116.4074,
})

const hours = ref<PlanetaryHour[]>([])
const selected = ref<PlanetaryHour | null>(null)
const nowTick = ref(Date.now())
let timer: number | null = null

const geoBusy = ref(false)

function recompute(): void {
  hours.value = planetaryHours(new Date(), loc.value.lat, loc.value.lng)
  if (!selected.value) selected.value = currentPlanetHour(hours.value)
}

function onCityChange(): void {
  const p = CITY_PRESETS[loc.value.cityIndex]
  if (p) {
    loc.value.lat = p.lat
    loc.value.lng = p.lng
  }
  persistAndRecompute()
}

function persistAndRecompute(): void {
  saveJSON('hours-loc', loc.value)
  selected.value = null
  recompute()
  sfx.blip()
}

function useGeo(): void {
  if (geoBusy.value) return
  geoBusy.value = true
  navigator.geolocation?.getCurrentPosition(
    (pos) => {
      loc.value.cityIndex = -1
      loc.value.lat = Number(pos.coords.latitude.toFixed(4))
      loc.value.lng = Number(pos.coords.longitude.toFixed(4))
      geoBusy.value = false
      persistAndRecompute()
    },
    () => {
      geoBusy.value = false
    },
    { timeout: 8000 },
  )
}

function pick(h: PlanetaryHour, e?: MouseEvent): void {
  selected.value = h
  sfx.blip()
  if (e) sparkleFromEvent(e, 6)
}

const currentH = computed(() => currentPlanetHour(hours.value, new Date(nowTick.value)))
const polar = computed(() => hours.value.length === 0)
const sunInfo = computed(() => {
  const { sunrise, sunset } = riseSet(new Date(), loc.value.lat, loc.value.lng)
  const fmt = (d: Date | null): string =>
    d ? d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '--:--'
  return { rise: fmt(sunrise), set: fmt(sunset) }
})

const zhName = (key: string): string => PLANETS[key]?.cn ?? key
const glyphOf = (key: string): string => PLANETS[key]?.glyph ?? '✦'

function goodTexts(ruler: string): string {
  const list = PLANET_GOOD[ruler] ?? []
  return list.map((p) => (locale.value === 'zh' ? p[0] : p[1])).join('、')
}
function avoidText(ruler: string): string {
  const p = PLANET_AVOID[ruler]
  return p ? (locale.value === 'zh' ? p[0] : p[1]) : '—'
}

onMounted(() => {
  recompute()
  timer = window.setInterval(() => (nowTick.value = Date.now()), 30000)
})
onBeforeUnmount(() => {
  if (timer !== null) window.clearInterval(timer)
})

const dayHours = computed(() => hours.value.filter((h) => h.daytime))
const nightHours = computed(() => hours.value.filter((h) => !h.daytime))

function rangeText(h: PlanetaryHour): string {
  const f = (d: Date): string => d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  return `${f(h.start)} – ${f(h.end)}`
}
</script>

<template>
  <div class="page-root">
    <h2><DecryptTitle :text="tt('hours.title')" /></h2>
    <p class="hint">{{ tt('hours.hint') }}</p>

    <section class="panel stagger-in" style="margin-top: 18px;">
      <div class="loc-row">
        <label class="field" style="flex: 1 1 220px;">
          <span>{{ tt('hours.loc') }}</span>
          <select v-model.number="loc.cityIndex" @change="onCityChange">
            <option value="-1">± {{ loc.lat.toFixed(2) }}, {{ loc.lng.toFixed(2) }}</option>
            <option v-for="(c, i) in CITY_PRESETS" :key="c.city" :value="i">
              {{ c.city }}
            </option>
          </select>
        </label>
        <button v-magnetic class="btn ghost small geo-btn" :disabled="geoBusy" @click="useGeo">
          📍 {{ tt('hours.useGeo') }}
        </button>
      </div>
      <p v-if="!polar" class="hint sun-line">
        ☀ {{ tt('hours.sunrise', { t: sunInfo.rise }) }} &nbsp;&nbsp;
        🌙 {{ tt('hours.sunset', { t: sunInfo.set }) }}
      </p>

      <template v-if="!polar">
        <h4 class="seg-label">☀ {{ tt('hours.daySeg') }}</h4>
        <div class="hour-strip">
          <button
            v-for="h in dayHours"
            :key="'d' + h.index"
            class="hour-cell day"
            :class="{ now: currentH?.index === h.index, sel: selected?.index === h.index }"
            @click="pick(h, $event)"
          >
            <i class="hc-glyph">{{ glyphOf(h.ruler) }}</i>
            <small>{{ h.index }}</small>
          </button>
        </div>

        <h4 class="seg-label">🌙 {{ tt('hours.nightSeg') }}</h4>
        <div class="hour-strip">
          <button
            v-for="h in nightHours"
            :key="'n' + h.index"
            class="hour-cell night"
            :class="{ now: currentH?.index === h.index, sel: selected?.index === h.index }"
            @click="pick(h, $event)"
          >
            <i class="hc-glyph">{{ glyphOf(h.ruler) }}</i>
            <small>{{ h.index }}</small>
          </button>
        </div>

        <Transition name="omen-pop">
          <div v-if="selected" class="detail-box bounce-in">
            <p class="db-head">
              <i class="db-glyph">{{ glyphOf(selected.ruler) }}</i>
              {{ tt('hours.rulerIs', { p: zhName(selected.ruler) }) }}
              <em class="db-range">{{ tt('hours.range', { a: rangeText(selected).split(' – ')[0]!, b: rangeText(selected).split(' – ')[1]! }) }}</em>
              <span v-if="currentH?.index === selected.index" class="tag">{{ tt('hours.now') }}</span>
            </p>
            <p class="db-line good">✧ {{ tt('hours.goodFor') }}：{{ goodTexts(selected.ruler) }}</p>
            <p class="db-line avoid">✕ {{ tt('hours.avoid') }}：{{ avoidText(selected.ruler) }}</p>
          </div>
        </Transition>
      </template>
      <p v-else class="hint">{{ tt('hours.polarHint') }}</p>
    </section>
  </div>
</template>

<style scoped>
.loc-row { display: flex; gap: 14px; align-items: flex-end; flex-wrap: wrap; }
.geo-btn { margin-bottom: 14px; }
.sun-line { margin: 10px 0 0; color: var(--gold-bright); }

.seg-label {
  margin: 20px 0 8px;
  font-family: var(--cute);
  color: var(--lavender-soft);
  font-weight: 400;
  letter-spacing: 0.08em;
}
.hour-strip {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 7px;
}
@media (max-width: 700px) {
  .hour-strip { grid-template-columns: repeat(6, minmax(0, 1fr)); }
}
.hour-cell {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 9px 2px 6px;
  border-radius: 10px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.2s, box-shadow 0.2s;
  color: var(--ink);
}
.hour-cell.day { background: color-mix(in srgb, var(--gold) 13%, var(--void-0)); }
.hour-cell.night { background: color-mix(in srgb, var(--lavender) 12%, var(--void-0)); }
.hour-cell:hover { transform: translateY(-3px); border-color: var(--pink); }
.hour-cell.sel { border-color: var(--mint); box-shadow: 0 0 12px color-mix(in srgb, var(--mint) 45%, transparent); }
.hour-cell.now { animation: now-pulse 2s ease-in-out infinite; border-color: var(--pink); background: color-mix(in srgb, var(--pink) 22%, var(--void-0)); }
@keyframes now-pulse {
  0%, 100% { box-shadow: 0 0 4px color-mix(in srgb, var(--pink) 35%, transparent); }
  50% { box-shadow: 0 0 16px color-mix(in srgb, var(--pink) 75%, transparent); }
}
.hc-glyph { font-style: normal; font-size: 1.25rem; line-height: 1; color: var(--gold-bright); }
.hour-cell small { font-family: var(--pixel); font-size: 0.42rem; opacity: 0.65; }

.detail-box {
  margin-top: 18px;
  padding: 15px 18px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--mint) 6%, var(--void-0));
  border: 2px dashed color-mix(in srgb, var(--lavender) 45%, transparent);
}
.db-head {
  margin: 0 0 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--cute);
  color: var(--gold-bright);
  font-size: 1.05rem;
}
.db-glyph { font-style: normal; font-size: 1.5rem; }
.db-range { font-style: normal; color: var(--ink-dim); font-size: 0.82rem; margin-left: auto; }
.db-line { margin: 5px 0; font-size: 0.92rem; line-height: 1.8; }
.db-line.good { color: var(--mint); }
.db-line.avoid { color: var(--danger); }

.omen-pop-enter-active { transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.omen-pop-enter-from { opacity: 0; transform: translateY(12px) scale(0.95); }
@media (prefers-reduced-motion: reduce) {
  .hour-cell.now { animation: none; }
}
</style>
