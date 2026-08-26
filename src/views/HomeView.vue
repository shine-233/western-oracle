<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { RouterLink } from 'vue-router'
import { dailyCard, cardImageUrl } from '../data/tarot'
import { cardMeaning } from '../data/tarotEn'
import { dailyRune } from '../data/runes'
import { moonPhase } from '../lib/astrology'
import { todayAlmanac } from '../lib/daily'
import { PLANETS } from '../data/corpus'
import { loadJSON } from '../lib/storage'
import { vTilt } from '../lib/tilt'
import { vReveal } from '../lib/reveal'
import { t, locale } from '../lib/i18n'
import StreakBadge from '../components/StreakBadge.vue'

const VoxelWitch3D = defineAsyncComponent(() => import('../components/VoxelWitch3D.vue'))

interface ModDef {
  to: string
  glyph: string
  title: string
  desc: string
  heat: number
}

/**
 * 全部模块按人气热度（heat 0-100）归入四大分组；
 * 组内与人气榜均按 heat 降序。只增不删：19 个入口全部保留。
 */
const GROUPS: { id: string; icon: string; title: string; sub: string; mods: ModDef[] }[] = [
  {
    id: 'core',
    icon: '🔮',
    title: 'home.group.core',
    sub: 'home.group.core.sub',
    mods: [
      { to: '/tarot', glyph: '✦', title: 'nav.tarot', desc: 'mod.tarot.desc', heat: 98 },
      { to: '/astrology', glyph: '☉', title: 'nav.astrology', desc: 'mod.astrology.desc', heat: 96 },
      { to: '/numerology', glyph: '∴', title: 'nav.numerology', desc: 'mod.numerology.desc', heat: 84 },
      { to: '/synastry', glyph: '☍', title: 'nav.synastry', desc: 'mod.synastry.desc', heat: 82 },
      { to: '/gesture', glyph: '🖐', title: 'nav.gesture', desc: 'mod.gesture.desc', heat: 72 },
      { to: '/runes', glyph: 'ᛟ', title: 'nav.runes', desc: 'mod.runes.desc', heat: 66 },
    ],
  },
  {
    id: 'soul',
    icon: '🖐',
    title: 'home.group.soul',
    sub: 'home.group.soul.sub',
    mods: [
      { to: '/palmistry', glyph: '🖐', title: 'nav.palmistry', desc: 'mod.palmistry.desc', heat: 78 },
      { to: '/dreams', glyph: '🌙', title: 'nav.dreams', desc: 'mod.dreams.desc', heat: 76 },
      { to: '/pendulum', glyph: '🜨', title: 'nav.pendulum', desc: 'mod.pendulum.desc', heat: 62 },
      { to: '/crystal', glyph: '🔮', title: 'nav.crystal', desc: 'mod.crystal.desc', heat: 58 },
    ],
  },
  {
    id: 'sky',
    icon: '🪐',
    title: 'home.group.sky',
    sub: 'home.group.sky.sub',
    mods: [
      { to: '/transits', glyph: '⟳', title: 'nav.transits', desc: 'mod.transits.desc', heat: 64 },
      { to: '/orrery', glyph: '🪐', title: 'nav.orrery', desc: 'mod.orrery.desc', heat: 56 },
      { to: '/biorhythm', glyph: '📈', title: 'nav.biorhythm', desc: 'mod.biorhythm.desc', heat: 54 },
      { to: '/moonbreath', glyph: '🌕', title: 'nav.moonbreath', desc: 'mod.moonbreath.desc', heat: 52 },
      { to: '/hours', glyph: '⏳', title: 'nav.hours', desc: 'mod.hours.desc', heat: 50 },
    ],
  },
  {
    id: 'play',
    icon: '🎲',
    title: 'home.group.play',
    sub: 'home.group.play.sub',
    mods: [
      { to: '/arcade', glyph: '🎲', title: 'nav.arcade', desc: 'mod.arcade.desc', heat: 68 },
      { to: '/library', glyph: '📖', title: 'nav.library', desc: 'mod.library.desc', heat: 48 },
      { to: '/musicbox', glyph: '✦', title: 'nav.musicbox', desc: 'mod.musicbox.desc', heat: 46 },
    ],
  },
  {
    id: 'east',
    icon: '🏮',
    title: 'home.group.east',
    sub: 'home.group.east.sub',
    mods: [
      { to: '/meihua', glyph: '☯', title: 'nav.meihua', desc: 'mod.meihua.desc', heat: 60 },
    ],
  },
]

/** 全站人气总排名（跨组比较） */
const ALL_MODS = [...GROUPS.flatMap((g) => g.mods)].sort((a, b) => b.heat - a.heat)
const RANK = new Map<string, number>(ALL_MODS.map((m, i) => [m.to, i + 1]))
function rankOf(m: ModDef): number {
  return RANK.get(m.to) ?? 99
}

const TOP3 = ALL_MODS.slice(0, 3)
const PODIUM_ORDER = [TOP3[1], TOP3[0], TOP3[2]]
const MEDALS = ['🥇', '🥈', '🥉'] as const

/* 每日板块 */
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
    <div class="daily-card" v-reveal="0">
      <span class="dc-label">{{ t('home.dc.card') }}</span>
      <img :src="cardImageUrl(today.card.id)" :alt="today.card.nameCn" :class="{ upside: today.reversed }" />
      <p class="dc-value">{{ locale === 'zh' ? today.card.nameCn : today.card.name }}{{ today.reversed ? (locale === 'zh' ? ' · 逆位' : ' · Reversed') : '' }}</p>
      <p class="dc-sub">{{ cardMeaning(today.card, locale, today.reversed) }}</p>
    </div>
    <div class="daily-card" v-reveal="1">
      <span class="dc-label">{{ t('home.dc.rune') }}</span>
      <p class="daily-rune-glyph" :class="{ upside: rune.reversed }">{{ rune.rune.glyph }}</p>
      <p class="dc-value">{{ rune.rune.nameCn }}{{ rune.reversed ? ' · 倒转' : '' }}</p>
      <p class="dc-sub">{{ rune.reversed ? rune.rune.reversed ?? rune.rune.upright : rune.rune.upright }}</p>
    </div>
    <div class="daily-card" v-reveal="2">
      <span class="dc-label">{{ t('home.dc.moon') }}</span>
      <p class="moon-emoji">{{ phase.emoji }}</p>
      <p class="dc-value">{{ moonName }}</p>
      <p class="dc-sub">{{ moonDesc }}</p>
    </div>
    <div class="daily-card" v-reveal="3">
      <span class="dc-label">{{ t('home.dc.says') }}</span>
      <p class="luna-face">🧙‍♀️</p>
      <p class="dc-value">{{ lunaSays }}</p>
      <p class="dc-sub"><RouterLink to="/tarot" class="mini-link">{{ t('home.luna.go') }}</RouterLink></p>
    </div>
  </section>

  <div style="display: flex; justify-content: center; margin: 16px 0 4px;">
    <StreakBadge />
  </div>

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
        <small>{{ almanac.doEn }}</small>
      </div>
      <div class="alm-item dont">
        <span class="alm-key">{{ t('alm.dont') }}</span>
        <strong class="alm-val">{{ almanac.dontText }}</strong>
        <small>{{ almanac.dontEn }}</small>
      </div>
      <div class="alm-item">
        <span class="alm-key">{{ t('alm.color') }} / {{ t('alm.number') }}</span>
        <strong class="alm-val color-row">
          <i class="color-dot" :style="{ background: almanac.luckyColor.hex }" />
          {{ locale === 'zh' ? almanac.luckyColor.cn : almanac.luckyColor.en }}
          <em>{{ almanac.luckyNumber }}</em>
        </strong>
        <small class="hex-note">{{ almanac.luckyColor.hex.toUpperCase() }}</small>
      </div>
    </div>
  </section>

  <!-- 🔥 人气榜领奖台 -->
  <section class="panel hall-panel">
    <div class="hall-head">
      <h3 style="margin: 0;">🔥 {{ t('home.hall.title') }} <span class="hall-en">HALL OF FAME</span></h3>
      <p class="hint" style="margin: 8px 0 0;">{{ t('home.hall.sub') }}</p>
    </div>
    <div class="podium">
      <RouterLink
        v-for="(m, i) in PODIUM_ORDER"
        :key="m.to"
        :to="m.to"
        v-reveal="i + 1"
        class="podium-card"
        :class="{ champion: rankOf(m) === 1 }"
      >
        <span class="medal" aria-hidden="true">{{ MEDALS[rankOf(m) - 1] }}</span>
        <span class="rank-line">{{ t('home.hall.rank', { n: rankOf(m) }) }}</span>
        <span class="glyph">{{ m.glyph }}</span>
        <h4>{{ t(m.title) }}</h4>
        <p class="p-desc">{{ t(m.desc) }}</p>
        <div class="heat big" role="img" :aria-label="`heat ${m.heat}`">
          <i :style="{ '--w': m.heat + '%' }" />
          <b>{{ m.heat }}</b>
        </div>
        <span class="p-enter">{{ t('home.hall.enter') }}</span>
      </RouterLink>
    </div>
  </section>

  <div style="display: flex; justify-content: center; margin: 16px 0 4px;" />

  <!-- 露娜的 3D 小屋 -->
  <section class="panel voxel-panel">
    <div class="voxel-head">
      <h3 style="margin: 0;">{{ t('home.voxel.title') }}</h3>
      <p class="hint" style="margin: 6px 0 0;">{{ t('home.voxel.desc') }}</p>
    </div>
    <VoxelWitch3D />
  </section>

  <div class="divider-star">✦ ✦ ✦</div>

  <!-- 四大分组 · 组内按人气排序 -->
  <section v-for="g in GROUPS" :key="g.id" class="group-section" v-reveal>
    <header class="group-head">
      <span class="g-icon" aria-hidden="true">{{ g.icon }}</span>
      <div class="g-titles">
        <h3>{{ t(g.title) }}</h3>
        <small>{{ t(g.sub) }}</small>
      </div>
      <span class="g-en" aria-hidden="true">{{ g.id.toUpperCase() }}</span>
    </header>
    <div class="oracle-grid group-grid">
      <RouterLink
        v-for="(m, i) in g.mods"
        :key="m.to"
        :to="m.to"
        v-reveal="i % 4"
        v-tilt="7"
        class="oracle-card mod-card"
      >
        <span class="rank-chip">#{{ rankOf(m) }}</span>
        <span v-if="m.heat >= 80" class="hot-tag">🔥 {{ t('home.card.hot') }}</span>
        <span class="glyph">{{ m.glyph }}</span>
        <h3>{{ t(m.title) }}</h3>
        <p>{{ t(m.desc) }}</p>
        <div class="heat" role="img" :aria-label="`heat ${m.heat}`">
          <i :style="{ '--w': m.heat + '%' }" />
          <b>{{ m.heat }}</b>
        </div>
      </RouterLink>
    </div>
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
.almanac { margin-top: 18px; border-color: color-mix(in srgb, var(--mint) 35%, transparent); }
.alm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 14px;
}
.alm-item {
  padding: 13px 15px;
  background: rgba(30, 26, 69, 0.55);
  border: 1.5px solid color-mix(in srgb, var(--lavender) 25%, transparent);
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
.hex-note { font-family: var(--pixel); font-size: 0.55rem; letter-spacing: 0.1em; opacity: 0.8; }
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

/* ---------- 人气榜 ---------- */
.hall-panel { margin-top: 26px; border-color: color-mix(in srgb, var(--gold) 40%, transparent); }
.hall-en { font-family: var(--pixel); font-size: 0.55rem; letter-spacing: 0.25em; color: var(--ink-dim); margin-left: 8px; vertical-align: middle; }
.podium {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  align-items: end;
  margin-top: 18px;
}
@media (max-width: 760px) { .podium { grid-template-columns: 1fr; align-items: stretch; } }
.podium-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 7px;
  text-decoration: none;
  padding: 20px 18px 16px;
  background: linear-gradient(165deg, var(--void-3), var(--void-1));
  border: 2.5px solid color-mix(in srgb, var(--lavender) 45%, transparent);
  clip-path: polygon(
    0 9px, 4px 9px, 4px 4px, 9px 4px, 9px 0,
    calc(100% - 9px) 0, calc(100% - 9px) 4px, calc(100% - 4px) 4px, calc(100% - 4px) 9px, 100% 9px,
    100% calc(100% - 9px), calc(100% - 4px) calc(100% - 9px), calc(100% - 4px) calc(100% - 4px), calc(100% - 9px) calc(100% - 4px), calc(100% - 9px) 100%,
    9px 100%, 9px calc(100% - 4px), 4px calc(100% - 4px), 4px calc(100% - 9px), 0 calc(100% - 9px)
  );
  filter: drop-shadow(5px 5px 0 rgba(10, 8, 30, 0.75));
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.25s, box-shadow 0.25s;
}
.podium-card:hover { transform: translateY(-6px); border-color: var(--gold); box-shadow: 0 10px 30px rgba(245, 200, 110, 0.14); }
.podium-card.champion { padding-top: 28px; padding-bottom: 24px; border-color: color-mix(in srgb, var(--gold) 65%, transparent); }
.medal {
  position: absolute;
  top: -16px;
  left: 50%;
  translate: -50% 0;
  font-size: 2rem;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.5));
  animation: medal-float 3s ease-in-out infinite;
}
@keyframes medal-float { 50% { transform: translateY(-5px) rotate(-6deg); } }
.rank-line { font-family: var(--pixel); font-size: 0.55rem; letter-spacing: 0.14em; color: var(--gold-bright); opacity: 0.85; }
.podium-card .glyph { font-size: 2.6rem; line-height: 1; animation: floaty 4.5s ease-in-out infinite; }
.podium-card h4 { margin: 0; font-size: 1.35rem; color: var(--ink); }
.podium-card.champion h4 { color: var(--gold-bright); text-shadow: 0 0 16px color-mix(in srgb, var(--gold) 60%, transparent); }
.p-desc { margin: 0; color: var(--ink-dim); font-size: 0.85rem; line-height: 1.7; }
.p-enter { font-family: var(--pixel); font-size: 0.58rem; letter-spacing: 0.12em; color: var(--pink-soft); margin-top: auto; }
.podium-card:hover .p-enter { color: var(--pink); }

/* 热度条：v-reveal 揭晓后从 0 长到目标宽度 */
.heat {
  position: relative;
  height: 6px;
  margin-top: 6px;
  background: color-mix(in srgb, var(--lavender) 18%, transparent);
  overflow: visible;
}
.heat i {
  position: absolute;
  inset: 0 auto 0 0;
  width: 0;
  background: linear-gradient(90deg, var(--gold), var(--pink));
  box-shadow: 0 0 8px color-mix(in srgb, var(--pink) 60%, transparent);
  transition: width 1.15s cubic-bezier(0.22, 0.61, 0.36, 1) 0.25s;
}
.revealed .heat i, .wo-auto-revealed .heat i { width: var(--w); }
.heat b {
  position: absolute;
  right: 0;
  top: -17px;
  font-family: var(--pixel);
  font-weight: 400;
  font-size: 0.55rem;
  color: var(--gold-bright);
  letter-spacing: 0.08em;
}
@media (prefers-reduced-motion: reduce) {
  .heat i { width: var(--w); transition: none; }
}

/* ---------- 分组区块 ---------- */
.group-section { margin-top: 34px; }
.group-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 14px;
  border-bottom: 1.5px dashed color-mix(in srgb, var(--lavender) 40%, transparent);
  padding-bottom: 10px;
}
.g-icon { font-size: 1.6rem; align-self: center; animation: floaty 5s ease-in-out infinite; }
.g-titles h3 { margin: 0; font-size: 1.25rem; color: var(--gold-bright); }
.g-titles small { color: var(--ink-dim); font-size: 0.78rem; }
.g-en {
  margin-left: auto;
  font-family: var(--pixel);
  font-size: 0.55rem;
  letter-spacing: 0.3em;
  color: var(--ink-dim);
  opacity: 0.65;
}
.group-grid { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }

/* 模块卡片上的排名徽标 / 热门标签 / 热度条 */
.mod-card { display: flex; flex-direction: column; }
.mod-card .rank-chip {
  position: absolute;
  top: 10px;
  right: 12px;
  font-family: var(--pixel);
  font-size: 0.56rem;
  letter-spacing: 0.06em;
  color: var(--void-0);
  background: linear-gradient(135deg, var(--gold), var(--gold-bright));
  padding: 3px 7px;
  z-index: 2;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}
.hot-tag {
  position: absolute;
  top: 10px;
  left: 12px;
  font-family: var(--pixel);
  font-size: 0.52rem;
  letter-spacing: 0.1em;
  color: var(--pink-soft);
  background: rgba(13, 11, 32, 0.72);
  border: 1px solid color-mix(in srgb, var(--pink) 55%, transparent);
  padding: 3px 7px;
  z-index: 2;
  animation: hot-pulse 1.8s ease-in-out infinite;
}
@keyframes hot-pulse { 50% { transform: scale(1.07); } }
</style>
