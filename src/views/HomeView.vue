<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { RouterLink } from 'vue-router'
import { dailyCard, cardImageUrl } from '../data/tarot'
import { dailyRune } from '../data/runes'
import { moonPhase } from '../lib/astrology'
import { todayAlmanac } from '../lib/daily'
import { PLANETS } from '../data/corpus'
import { loadJSON } from '../lib/storage'
import { vTilt } from '../lib/tilt'
import { t, locale } from '../lib/i18n'

const VoxelWitch3D = defineAsyncComponent(() => import('../components/VoxelWitch3D.vue'))

const today = dailyCard()
const rune = dailyRune()
const phase = moonPhase()

const moonName = computed(() => t(`moon.${phase.index}.name`))
const moonDesc = computed(() => t(`moon.${phase.index}.desc`))
const lunaSays = computed(() =>
  phase.index === 4 ? t('home.luna.full') : phase.index === 0 ? t('home.luna.new') : t('home.luna.default'),
)

const almanac = todayAlmanac()
const rulerName = computed(() =>
  locale.value === 'zh' ? PLANETS[almanac.rulerKey]?.cn ?? '' : almanac.rulerKey,
)

const modules = [
  { to: '/tarot', glyph: '✦', title: 'nav.tarot', desc: 'mod.tarot.desc' },
  { to: '/astrology', glyph: '☉', title: 'nav.astrology', desc: 'mod.astrology.desc' },
  { to: '/synastry', glyph: '☍', title: 'nav.synastry', desc: 'mod.synastry.desc' },
  { to: '/transits', glyph: '⟳', title: 'nav.transits', desc: 'mod.transits.desc' },
  { to: '/numerology', glyph: '∴', title: 'nav.numerology', desc: 'mod.numerology.desc' },
  { to: '/runes', glyph: 'ᛟ', title: 'nav.runes', desc: 'mod.runes.desc' },
  { to: '/library', glyph: '📖', title: 'nav.library', desc: 'mod.library.desc' },
  { to: '/history', glyph: '📜', title: 'nav.history', desc: 'mod.history.desc' },
]

const savedName = loadJSON<{ name?: string }>('num-profile', {}).name
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 5) return t('home.greeting.night')
  if (h < 11) return t('home.greeting.morning')
  if (h < 14) return t('home.greeting.noon')
  if (h < 18) return t('home.greeting.afternoon')
  return t('home.greeting.evening')
})
</script>

<template>
  <div class="page-root">
    <section class="hero">
    <h1>{{ t('home.hero') }}</h1>
    <p class="sub">TAROT · ASTROLOGY · NUMEROLOGY · RUNES</p>
    <p class="hint" style="max-width: 580px; margin: 18px auto 0;">
      {{ t('home.intro', { greet: greeting, name: savedName ?? '' }) }}
    </p>
  </section>

  <!-- 每日板块 -->
  <section class="daily-grid">
    <div class="daily-card">
      <span class="dc-label">{{ t('home.dc.card') }}</span>
      <img :src="cardImageUrl(today.card.id)" :alt="today.card.nameCn" :class="{ upside: today.reversed }" />
      <p class="dc-value">{{ locale === 'zh' ? today.card.nameCn : today.card.name }}{{ today.reversed ? (locale === 'zh' ? ' · 逆位' : ' · Reversed') : '' }}</p>
      <p class="dc-sub">{{ today.reversed ? today.card.reversed : today.card.upright }}</p>
    </div>
    <div class="daily-card">
      <span class="dc-label">{{ t('home.dc.rune') }}</span>
      <p class="daily-rune-glyph" :class="{ upside: rune.reversed }">{{ rune.rune.glyph }}</p>
      <p class="dc-value">{{ rune.rune.nameCn }}{{ rune.reversed ? ' · 倒转' : '' }}</p>
      <p class="dc-sub">{{ rune.reversed ? rune.rune.reversed ?? rune.rune.upright : rune.rune.upright }}</p>
    </div>
    <div class="daily-card">
      <span class="dc-label">{{ t('home.dc.moon') }}</span>
      <p class="moon-emoji">{{ phase.emoji }}</p>
      <p class="dc-value">{{ moonName }}</p>
      <p class="dc-sub">{{ moonDesc }}</p>
    </div>
    <div class="daily-card">
      <span class="dc-label">{{ t('home.dc.says') }}</span>
      <p class="luna-face">🧙‍♀️</p>
      <p class="dc-value">{{ lunaSays }}</p>
      <p class="dc-sub"><RouterLink to="/tarot" class="mini-link">{{ t('home.luna.go') }}</RouterLink></p>
    </div>
  </section>

  <!-- 今日星历 -->
  <section class="panel almanac stagger-in">
    <h3 style="margin: 0 0 14px;">✦ {{ t('alm.title') }}</h3>
    <div class="alm-grid">
      <div class="alm-item">
        <span class="alm-key">{{ t('alm.ruler') }}</span>
        <strong class="alm-val ruler">{{ PLANETS[almanac.rulerKey]?.glyph }} {{ rulerName }}</strong>
        <small>{{ almanac.rulerLine }}</small>
      </div>
      <div class="alm-item do">
        <span class="alm-key">{{ t('alm.do') }}</span>
        <strong class="alm-val">{{ almanac.doText }}</strong>
        <small>{{ moonDesc }}</small>
      </div>
      <div class="alm-item dont">
        <span class="alm-key">{{ t('alm.dont') }}</span>
        <strong class="alm-val">{{ almanac.dontText }}</strong>
        <small>·</small>
      </div>
      <div class="alm-item">
        <span class="alm-key">{{ t('alm.color') }} / {{ t('alm.number') }}</span>
        <strong class="alm-val color-row">
          <i class="color-dot" :style="{ background: almanac.luckyColor.hex }" />
          {{ locale === 'zh' ? almanac.luckyColor.cn : almanac.luckyColor.en }}
          <em>{{ almanac.luckyNumber }}</em>
        </strong>
        <small>·</small>
      </div>
    </div>
  </section>

  <div class="divider-star">✦ ✦ ✦</div>

  <!-- 露娜的 3D 小屋 -->
  <section class="panel voxel-panel">
    <div class="voxel-head">
      <h3 style="margin: 0;">{{ t('home.voxel.title') }}</h3>
      <p class="hint" style="margin: 6px 0 0;">{{ t('home.voxel.desc') }}</p>
    </div>
    <VoxelWitch3D />
  </section>

  <div class="divider-star">✦ ✦ ✦</div>

  <section class="oracle-grid">
    <RouterLink v-for="m in modules" :key="m.to" :to="m.to" v-tilt="7" class="oracle-card">
      <span class="glyph">{{ m.glyph }}</span>
      <h3>{{ t(m.title) }}</h3>
      <p>{{ t(m.desc) }}</p>
    </RouterLink>
  </section>

  <section class="panel" style="margin-top: 40px;">
    <h3 style="margin-top: 0;">{{ t('home.ai.title') }}</h3>
    <p class="hint">
      {{ t('home.ai.pre') }}<strong>{{ t('home.ai.mid') }}</strong>{{ t('home.ai.post') }}<RouterLink to="/settings">{{ t('nav.settings') }}</RouterLink>{{ t('home.ai.post2') }}
    </p>
  </section>
  </div>
</template>

<style scoped>
.daily-card img {
  width: 92px;
  border-radius: 8px;
  border: 2px solid var(--gold);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
  display: block;
  margin: 0 auto 10px;
}
.daily-card img.upside { transform: rotate(180deg); }
.daily-rune-glyph {
  font-size: 3.2rem;
  color: #f0e6c8;
  margin: 6px 0 10px;
  text-shadow: 0 0 18px rgba(240, 230, 200, 0.4);
  line-height: 1;
}
.daily-rune-glyph.upside { display: inline-block; transform: rotate(180deg); }
.moon-emoji { font-size: 3rem; margin: 6px 0 10px; line-height: 1; }
.luna-face { font-size: 3rem; margin: 6px 0 10px; line-height: 1; animation: floaty 4s ease-in-out infinite; }
.mini-link { color: var(--pink-soft); }
.voxel-panel { margin-top: 10px; }
.voxel-head { margin-bottom: 16px; }

/* 今日星历 */
.almanac { margin-top: 18px; border-color: rgba(125, 232, 195, 0.35); }
.alm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 14px;
}
.alm-item {
  padding: 13px 15px;
  background: rgba(30, 26, 69, 0.55);
  border: 1.5px solid rgba(179, 166, 247, 0.25);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.2s;
}
.alm-item:hover { transform: translateY(-3px); border-color: var(--mint); }
.alm-item.do:hover { border-color: var(--gold); }
.alm-item.dont:hover { border-color: var(--danger); }
.alm-key { font-family: var(--pixel); font-size: 0.55rem; letter-spacing: 0.12em; color: var(--ink-dim); }
.alm-val { color: var(--gold-bright); font-weight: 400; line-height: 1.5; }
.alm-val.ruler { font-size: 1.25rem; }
.alm-item small { color: var(--ink-dim); font-size: 0.75rem; }
.color-row { display: flex; align-items: center; gap: 7px; }
.color-row em { font-style: normal; color: var(--pink); font-family: var(--pixel); font-size: 0.9rem; margin-left: auto; }
.color-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: inline-block;
  box-shadow: 0 0 8px currentColor;
  animation: dot-breathe 2.6s ease-in-out infinite;
}
@keyframes dot-breathe { 50% { transform: scale(1.25); } }
</style>
