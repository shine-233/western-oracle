<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { dailyCard, cardImageUrl } from '../data/tarot'
import { cardMeaning } from '../data/tarotEn'
import { dailyRune } from '../data/runes'
import { moonPhase } from '../lib/astrology'
import { todayAlmanac } from '../lib/daily'
import { PLANETS } from '../data/corpus'
import { ZODIAC_FACTS } from '../data/zodiacFacts'
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
  /** 模块专属签名色（与当值学徒色系一致） */
  accent: string
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
      { to: '/tarot', glyph: '✦', title: 'nav.tarot', desc: 'mod.tarot.desc', heat: 98 , accent: '#ff9fce' },
      { to: '/astrology', glyph: '☉', title: 'nav.astrology', desc: 'mod.astrology.desc', heat: 96 , accent: '#a9c4e8' },
      { to: '/numerology', glyph: '∴', title: 'nav.numerology', desc: 'mod.numerology.desc', heat: 84 , accent: '#7de8c3' },
      { to: '/synastry', glyph: '☍', title: 'nav.synastry', desc: 'mod.synastry.desc', heat: 82 , accent: '#ff8fb8' },
      { to: '/gesture', glyph: '🖐', title: 'nav.gesture', desc: 'mod.gesture.desc', heat: 72 , accent: '#f5c86e' },
      { to: '/runes', glyph: 'ᛟ', title: 'nav.runes', desc: 'mod.runes.desc', heat: 66 , accent: '#8f8ac2' },
    ],
  },
  {
    id: 'soul',
    icon: '🖐',
    title: 'home.group.soul',
    sub: 'home.group.soul.sub',
    mods: [
      { to: '/palmistry', glyph: '🖐', title: 'nav.palmistry', desc: 'mod.palmistry.desc', heat: 78 , accent: '#c9a24f' },
      { to: '/dreams', glyph: '🌙', title: 'nav.dreams', desc: 'mod.dreams.desc', heat: 76 , accent: '#b48ab0' },
      { to: '/pendulum', glyph: '🜨', title: 'nav.pendulum', desc: 'mod.pendulum.desc', heat: 62 , accent: '#ffd76e' },
      { to: '/crystal', glyph: '🔮', title: 'nav.crystal', desc: 'mod.crystal.desc', heat: 58 , accent: '#b3a6f7' },
    ],
  },
  {
    id: 'sky',
    icon: '🪐',
    title: 'home.group.sky',
    sub: 'home.group.sky.sub',
    mods: [
      { to: '/transits', glyph: '⟳', title: 'nav.transits', desc: 'mod.transits.desc', heat: 64 , accent: '#ffb37a' },
      { to: '/orrery', glyph: '🪐', title: 'nav.orrery', desc: 'mod.orrery.desc', heat: 56 , accent: '#7ea6d6' },
      { to: '/biorhythm', glyph: '📈', title: 'nav.biorhythm', desc: 'mod.biorhythm.desc', heat: 54 , accent: '#6ee8a3' },
      { to: '/moonbreath', glyph: '🌕', title: 'nav.moonbreath', desc: 'mod.moonbreath.desc', heat: 52 , accent: '#efe6c8' },
      { to: '/hours', glyph: '⏳', title: 'nav.hours', desc: 'mod.hours.desc', heat: 50 , accent: '#d9b24a' },
    ],
  },
  {
    id: 'play',
    icon: '🎲',
    title: 'home.group.play',
    sub: 'home.group.play.sub',
    mods: [
      { to: '/arcade', glyph: '🎲', title: 'nav.arcade', desc: 'mod.arcade.desc', heat: 68 , accent: '#ff8f6e' },
      { to: '/memory', glyph: '🃏', title: 'nav.memory', desc: 'mod.memory.desc', heat: 58 , accent: '#8ee6d2' },
      { to: '/library', glyph: '📖', title: 'nav.library', desc: 'mod.library.desc', heat: 48 , accent: '#cfd6ff' },
      { to: '/musicbox', glyph: '✦', title: 'nav.musicbox', desc: 'mod.musicbox.desc', heat: 46 , accent: '#7db8ff' },
    ],
  },
  {
    id: 'east',
    icon: '🏮',
    title: 'home.group.east',
    sub: 'home.group.east.sub',
    mods: [
      { to: '/meihua', glyph: '☯', title: 'nav.meihua', desc: 'mod.meihua.desc', heat: 60 , accent: '#e05a4e' },
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

/** 今日太阳星座（corpora/zodiac CC0 数据层） */
const SIGN_ZH: Record<string, string> = {
  Aries: '白羊座', Taurus: '金牛座', Gemini: '双子座', Cancer: '巨蟹座',
  Leo: '狮子座', Virgo: '处女座', Libra: '天秤座', Scorpio: '天蝎座',
  Sagittarius: '射手座', Capricorn: '摩羯座', Aquarius: '水瓶座', Pisces: '双鱼座',
}
/** 各星座起始（月, 日），按年序扫描，最后一个已过的起点即当前太阳星座 */
const SIGN_STARTS: Array<[number, number, string]> = [
  [1, 20, 'Aquarius'], [2, 19, 'Pisces'], [3, 21, 'Aries'], [4, 20, 'Taurus'],
  [5, 21, 'Gemini'], [6, 21, 'Cancer'], [7, 23, 'Leo'], [8, 23, 'Virgo'],
  [9, 23, 'Libra'], [10, 23, 'Scorpio'], [11, 22, 'Sagittarius'], [12, 22, 'Capricorn'],
]
function sunSignKey(): string {
  const now = new Date()
  const m = now.getMonth() + 1
  const d = now.getDate()
  let current = 'Capricorn'
  for (const [sm, sd, sign] of SIGN_STARTS) {
    if (m > sm || (m === sm && d >= sd)) current = sign
  }
  return current
}
const zodiacToday = ZODIAC_FACTS[sunSignKey()] ?? null

const savedName = loadJSON<{ name?: string }>('num-profile', {}).name

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 5) return t('home.greeting.night')
  if (h < 11) return t('home.greeting.morning')
  if (h < 14) return t('home.greeting.noon')
  if (h < 18) return t('home.greeting.afternoon')
  return t('home.greeting.evening')
})

/* ---------- 隐秘星笺：mask 跟随指针（rAF 节流） ---------- */
const letterEl = ref<HTMLElement | null>(null)
const mx = ref(50)
const my = ref(42)
let letterRaf = 0
let lx = 50
let ly = 42
function onLetterMove(e: PointerEvent): void {
  const el = letterEl.value
  if (!el || letterRaf) return
  const rect = el.getBoundingClientRect()
  lx = ((e.clientX - rect.left) / rect.width) * 100
  ly = ((e.clientY - rect.top) / rect.height) * 100
  letterRaf = requestAnimationFrame(() => {
    mx.value = Math.max(0, Math.min(100, lx))
    my.value = Math.max(0, Math.min(100, ly))
    letterRaf = 0
  })
}
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
    <!-- 今日太阳星座（corpora/zodiac 数据层） -->
    <div v-if="zodiacToday" class="daily-card zodiac-card" v-reveal="4">
      <span class="dc-label">{{ locale === 'zh' ? '今日太阳' : 'Sun today' }}</span>
      <p class="zodiac-sym">{{ zodiacToday.unicodeSymbol }}</p>
      <p class="dc-value">{{ locale === 'zh' ? SIGN_ZH[zodiacToday.sign] : zodiacToday.sign }} · {{ zodiacToday.gloss }}</p>
      <p class="dc-sub">
        {{ locale === 'zh' ? '元素' : 'Element' }} {{ zodiacToday.element }} ·
        {{ locale === 'zh' ? '古典守护' : 'classic ruler' }} {{ zodiacToday.rulerClassic }}
        <span class="zf-dates">{{ zodiacToday.approximateDates }}</span>
        <span class="zf-keywords">
          <i v-for="k in zodiacToday.keywords" :key="k">{{ k }}</i>
        </span>
      </p>
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
        :style="{ '--ac': m.accent }"
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

  <!-- 🌙 隐秘星笺：mouse-reveal 月光显影 -->
  <section ref="letterEl" class="panel secret-letter" @pointermove="onLetterMove" @pointerdown="onLetterMove">
    <div class="sl-base">
      <h3 style="margin: 0">🌙 {{ locale === 'zh' ? '隐秘星笺' : 'SECRET LETTER' }} <span class="hall-en">{{ locale === 'zh' ? 'MOUSE REVEAL' : '' }}</span></h3>
      <p class="hint" style="margin: 8px 0 0">
        {{ locale === 'zh'
            ? '月光只照亮你指尖的位置——移动指针（触屏划过），读出今晚的密语。'
            : 'Moonlight only lights where you point — move to read tonight\'s secret.' }}
      </p>
      <p class="sl-ghost" aria-hidden="true">✦ ✧ ⋆ ✦ ✧ ⋆ ✦ ✧ ⋆ ✦ ✧ ⋆</p>
    </div>
    <div class="sl-hidden" :style="{ '--mx': mx + '%', '--my': my + '%' }" aria-hidden="false">
      <p class="sl-rune">{{ rune.rune.glyph }}</p>
      <p class="sl-line">
        {{ locale === 'zh' ? '今夜符文 · ' : 'Tonight\'s rune · ' }}
        <strong>{{ locale === 'zh' ? rune.rune.nameCn : rune.rune.name }}</strong>
        {{ rune.reversed ? (locale === 'zh' ? '（倒转）' : ' (reversed)') : '' }}
      </p>
      <p class="sl-sub">{{ rune.reversed ? rune.rune.reversed ?? rune.rune.upright : rune.rune.upright }}</p>
      <p class="sl-num">{{ locale === 'zh' ? '幸运数字' : 'Lucky number' }} · <b>{{ almanac.luckyNumber }}</b></p>
    </div>
  </section>

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
        :style="{ '--ac': m.accent }"
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
.zodiac-sym { font-size: 3rem; margin: 6px 0 10px; line-height: 1; color: #bfeaf5; text-shadow: 0 0 18px rgba(143, 211, 232, 0.45); animation: floaty 4.5s ease-in-out infinite; }
.zf-dates { display: block; font-family: var(--pixel); font-size: 0.55rem; letter-spacing: 0.08em; color: var(--ink-dim); margin-top: 6px; }
.zf-keywords { display: flex; gap: 5px; flex-wrap: wrap; justify-content: center; margin-top: 7px; }
.zf-keywords i {
  font-style: normal;
  font-size: 0.72rem;
  color: #bfeaf5;
  padding: 3px 9px;
  border-radius: 999px;
  border: 1px solid rgba(143, 211, 232, 0.4);
}
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

/* ---------- 隐秘星笺（mouse-reveal） ---------- */
.secret-letter {
  position: relative;
  margin-top: 26px;
  overflow: hidden;
  min-height: 210px;
  cursor: crosshair;
}
.sl-base { position: relative; z-index: 1; pointer-events: none; }
.sl-ghost {
  margin: 18px 0 0;
  letter-spacing: 0.6em;
  color: var(--ink-dim);
  opacity: 0.35;
  user-select: none;
}
.sl-hidden {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 26px;
  text-align: center;
  background:
    radial-gradient(420px 200px at 50% 0%, color-mix(in srgb, var(--gold) 10%, transparent), transparent 70%),
    linear-gradient(165deg, color-mix(in srgb, var(--void-3) 92%, transparent), var(--void-1));
  -webkit-mask-image: radial-gradient(circle 140px at var(--mx, 50%) var(--my, 42%), #000 32%, transparent 74%);
  mask-image: radial-gradient(circle 140px at var(--mx, 50%) var(--my, 42%), #000 32%, transparent 74%);
  pointer-events: none;
}
.sl-rune {
  margin: 0;
  font-size: 2.6rem;
  line-height: 1;
  color: #f0e6c8;
  text-shadow: 0 0 20px rgba(240, 230, 200, 0.55);
}
.sl-line { margin: 8px 0 4px; color: var(--gold-bright); }
.sl-line strong { font-weight: 400; }
.sl-sub { margin: 0; color: var(--ink); font-size: 0.9rem; line-height: 1.75; max-width: 560px; margin-inline: auto; }
.sl-num { margin: 8px 0 0; font-family: var(--pixel); font-size: 0.58rem; letter-spacing: 0.12em; color: var(--pink-soft); }
.sl-num b { color: var(--pink); }

/* 模块卡片上的排名徽标 / 热门标签 / 热度条 */
.mod-card { display: flex; flex-direction: column; }
.mod-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--ac, var(--gold)), transparent 78%);
  opacity: 0.9;
  z-index: 1;
}
.mod-card .glyph {
  color: var(--ac, var(--ink));
  text-shadow: 0 0 14px color-mix(in srgb, var(--ac, var(--gold)) 45%, transparent);
}
.mod-card:hover { border-color: color-mix(in srgb, var(--ac, var(--pink)) 60%, transparent); }
.podium-card { --ac: var(--gold); }
.podium-card .glyph {
  color: var(--ac);
  text-shadow: 0 0 16px color-mix(in srgb, var(--ac) 50%, transparent);
}
.mod-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--ac, var(--gold)), transparent 78%);
  opacity: 0.9;
  z-index: 1;
}
.mod-card .glyph {
  color: var(--ac, var(--ink));
  text-shadow: 0 0 14px color-mix(in srgb, var(--ac, var(--gold)) 45%, transparent);
}
.mod-card:hover { border-color: color-mix(in srgb, var(--ac, var(--pink)) 60%, transparent); }
.podium-card { --ac: var(--gold); }
.podium-card .glyph {
  color: var(--ac);
  text-shadow: 0 0 16px color-mix(in srgb, var(--ac) 50%, transparent);
}
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
