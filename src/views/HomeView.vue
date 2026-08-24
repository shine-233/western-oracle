<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { RouterLink } from 'vue-router'
import { dailyCard, cardImageUrl } from '../data/tarot'
import { dailyRune } from '../data/runes'
import { moonPhase } from '../lib/astrology'
import { loadJSON } from '../lib/storage'
import { vTilt } from '../lib/tilt'

const VoxelWitch3D = defineAsyncComponent(() => import('../components/VoxelWitch3D.vue'))

const today = dailyCard()
const rune = dailyRune()
const phase = moonPhase()

const modules = [
  { to: '/tarot', glyph: '✦', title: '塔罗牌阵', desc: '78 张韦特塔罗公版插图，单张 / 三张 / 十字五张 / 凯尔特十字大阵。' },
  { to: '/astrology', glyph: '☉', title: '西洋占星', desc: '浏览器内计算十大星体本命盘：星盘轮、宫位、相位、元素统计。' },
  { to: '/synastry', glyph: '☍', title: '合盘', desc: '双人星盘对照比较盘，交叉相位看缘分深浅与相处课题。' },
  { to: '/transits', glyph: '⟳', title: '行运', desc: '此刻天空×你的本命盘，看看星星今天在你生活里搞什么。' },
  { to: '/numerology', glyph: '∴', title: '生命灵数', desc: '生命路径、表达数等五组核心数字，外加今日流日运势。' },
  { to: '/runes', glyph: 'ᛟ', title: '卢恩符文', desc: '古弗萨克 24 符文抽取，维京人的智慧之石，正逆位皆可。' },
]

const savedName = loadJSON<{ name?: string }>('num-profile', {}).name
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 5) return '夜深了，星星都醒着'
  if (h < 11) return '早上好，今天的天空很新鲜'
  if (h < 14) return '午安，适合抽张牌歇一歇'
  if (h < 18) return '下午好，宇宙正在派送好运'
  return '晚上好，月亮上班啦'
})
</script>

<template>
  <div class="page-root">
    <section class="hero">
    <h1>星辰不语，自有答案</h1>
    <p class="sub">TAROT · ASTROLOGY · NUMEROLOGY · RUNES</p>
    <p class="hint" style="max-width: 580px; margin: 18px auto 0;">
      {{ greeting }}{{ savedName ? `，${savedName}！` : '！' }}
      一座纯浏览器端的西方占卜小站：无需注册、没有后端、数据不出本机。
      右下角的小巫女露娜知道很多星星的秘密，记得去戳戳她。
    </p>
  </section>

  <!-- 每日板块 -->
  <section class="daily-grid">
    <div class="daily-card">
      <span class="dc-label">DAILY CARD · 每日一牌</span>
      <img :src="cardImageUrl(today.card.id)" :alt="today.card.nameCn" :class="{ upside: today.reversed }" />
      <p class="dc-value">{{ today.card.nameCn }}{{ today.reversed ? ' · 逆位' : '' }}</p>
      <p class="dc-sub">{{ today.reversed ? today.card.reversed : today.card.upright }}</p>
    </div>
    <div class="daily-card">
      <span class="dc-label">DAILY RUNE · 每日符文</span>
      <p class="daily-rune-glyph" :class="{ upside: rune.reversed }">{{ rune.rune.glyph }}</p>
      <p class="dc-value">{{ rune.rune.nameCn }}{{ rune.reversed ? ' · 倒转' : '' }}</p>
      <p class="dc-sub">{{ rune.reversed ? rune.rune.reversed ?? rune.rune.upright : rune.rune.upright }}</p>
    </div>
    <div class="daily-card">
      <span class="dc-label">MOON PHASE · 今日月相</span>
      <p class="moon-emoji">{{ phase.emoji }}</p>
      <p class="dc-value">{{ phase.name }}</p>
      <p class="dc-sub">{{ phase.desc }}</p>
    </div>
    <div class="daily-card">
      <span class="dc-label">ORACLE SAYS · 露娜说</span>
      <p class="luna-face">🧙‍♀️</p>
      <p class="dc-value">{{ phase.index === 4 ? '满月之夜，愿望加倍灵！' : phase.index === 0 ? '新月许愿，正是时候～' : '今天也要闪闪发光哦' }}</p>
      <p class="dc-sub"><RouterLink to="/tarot" class="mini-link">去抽一张牌 →</RouterLink></p>
    </div>
  </section>

  <div class="divider-star">✦ ✦ ✦</div>

  <!-- 露娜的 3D 小屋 -->
  <section class="panel voxel-panel">
    <div class="voxel-head">
      <h3 style="margin: 0;">露娜的 3D 小屋</h3>
      <p class="hint" style="margin: 6px 0 0;">她从 2D 像素画被拉伸成了体素！拖拽她转圈圈，滚轮拉近看脸红。</p>
    </div>
    <VoxelWitch3D />
  </section>

  <div class="divider-star">✦ ✦ ✦</div>

  <section class="oracle-grid">
    <RouterLink v-for="m in modules" :key="m.to" :to="m.to" v-tilt="7" class="oracle-card">
      <span class="glyph">{{ m.glyph }}</span>
      <h3>{{ m.title }}</h3>
      <p>{{ m.desc }}</p>
    </RouterLink>
  </section>

  <section class="panel" style="margin-top: 40px;">
    <h3 style="margin-top: 0;">关于 AI 解读</h3>
    <p class="hint">
      默认提供本地规则文案解读；若你希望获得更个性化的 AI 解读，可在
      <RouterLink to="/settings">设置</RouterLink>
      中填入任意 OpenAI 兼容接口的 API Key。密钥仅保存在你的浏览器 localStorage 中，请求直接从你的设备发往你指定的服务商。
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
</style>
