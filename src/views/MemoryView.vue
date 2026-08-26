<script setup lang="ts">
/**
 * 微游戏 · 塔罗记忆翻牌
 * - 6 对大阿卡纳，12 张牌背朝上；一次最多翻开两张，配对成功保持亮面
 * - 步数统计 + 本地最佳纪录；通关触发星屑庆祝与今日断语
 * - 翻牌为 CSS 3D flip，触屏/鼠标通用；尊重 prefers-reduced-motion
 */
import { computed, ref } from 'vue'
import { MAJOR_ARCANA, cardImageUrl } from '../data/tarot'
import { L } from '../data/oracleArcade'
import { sfx } from '../lib/sfx'
import { sparkleFromEvent } from '../lib/sparkle'
import DecryptTitle from '../components/DecryptTitle.vue'
import CardBackArt from '../components/CardBackArt.vue'

interface MemCard {
  cid: string
  nameCn: string
  img: string
  flipped: boolean
  matched: boolean
}

const PAIRS = 6

function deal(): MemCard[] {
  const pool = [...MAJOR_ARCANA]
  const picked: typeof MAJOR_ARCANA = []
  while (picked.length < PAIRS && pool.length) {
    picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]!)
  }
  const deck: MemCard[] = []
  for (const c of picked) {
    const base = { cid: c.id, nameCn: c.nameCn, img: cardImageUrl(c.id), flipped: false, matched: false }
    deck.push({ ...base }, { ...base })
  }
  // Fisher-Yates 洗牌
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j]!, deck[i]!]
  }
  return deck
}

const cards = ref<MemCard[]>(deal())
const moves = ref(0)
const matchedPairs = ref(0)
const lock = ref(false)
let firstIdx = -1

const BEST_KEY = 'wo-memory-best'
const best = ref<number | null>(null)
try {
  const raw = Number(localStorage.getItem(BEST_KEY))
  if (Number.isFinite(raw) && raw > 0) best.value = raw
} catch {
  /* ignore */
}

const done = computed(() => matchedPairs.value === PAIRS)
const newRecord = ref(false)

function reset(e?: MouseEvent): void {
  cards.value = deal()
  moves.value = 0
  matchedPairs.value = 0
  firstIdx = -1
  lock.value = false
  newRecord.value = false
  sfx.riffle()
  if (e) sparkleFromEvent(e, 6)
}

function flip(idx: number, e: MouseEvent): void {
  if (lock.value || done.value) return
  const c = cards.value[idx]!
  if (c.flipped || c.matched) return

  c.flipped = true
  sfx.flip()

  if (firstIdx < 0) {
    firstIdx = idx
    return
  }

  // 第二张
  moves.value++
  const a = cards.value[firstIdx]!
  firstIdx = -1

  if (a.cid === c.cid) {
    a.matched = true
    c.matched = true
    matchedPairs.value++
    sfx.ding()
    sparkleFromEvent(e, 8)
    if (done.value) celebrate(e)
    return
  }

  // 不匹配：短暂展示后盖回
  lock.value = true
  window.setTimeout(() => {
    a.flipped = false
    c.flipped = false
    lock.value = false
    sfx.blip()
  }, 720)
}

function celebrate(e: MouseEvent): void {
  sparkleFromEvent(e, 24)
  if (best.value === null || moves.value < best.value) {
    best.value = moves.value
    newRecord.value = true
    try {
      localStorage.setItem(BEST_KEY, String(moves.value))
    } catch {
      /* ignore */
    }
    sfx.ding()
    window.setTimeout(() => sfx.riffle(), 200)
  } else {
    sfx.ding()
  }
}
</script>

<template>
  <div class="page-root">
    <h2><DecryptTitle :text="L(['塔罗记忆 · 星下配对', 'Tarot Memory · Pair the Stars'])" /></h2>
    <p class="hint">
      {{ L([
        '12 张牌背朝天，找出 6 对大阿卡纳。步数越少，星星越佩服你。',
        'Twelve face-down cards hide six Major Arcana pairs. Fewer moves, more stellar respect.',
      ]) }}
    </p>

    <!-- 记分板 -->
    <div class="mem-stats">
      <span class="ms-item">{{ L(['步数', 'Moves']) }} <b>{{ moves }}</b></span>
      <span class="ms-item">{{ L(['配对', 'Pairs']) }} <b>{{ matchedPairs }}/{{ PAIRS }}</b></span>
      <span class="ms-item">
        {{ L(['最佳', 'Best']) }}
        <b>{{ best ?? L(['—', '—']) }}</b>
      </span>
      <button class="btn ghost small" @click="reset($event)">↻ {{ L(['重新洗牌', 'Reshuffle']) }}</button>
    </div>

    <!-- 牌阵 -->
    <div class="mem-grid" :class="{ done }">
      <button
        v-for="(c, i) in cards"
        :key="i"
        class="mem-card"
        :class="{ flipped: c.flipped || c.matched, matched: c.matched }"
        :aria-label="c.flipped || c.matched ? c.nameCn : L(['牌背', 'card back'])"
        @click="flip(i, $event)"
      >
        <span class="mc-inner">
          <span class="mc-face mc-back"><CardBackArt /></span>
          <img class="mc-face mc-front" :src="c.img" :alt="c.nameCn" draggable="false" />
        </span>
      </button>
    </div>

    <!-- 通关横幅 -->
    <Transition name="slide-fade">
      <div v-if="done" class="mem-done">
        <p class="md-title">{{ newRecord ? L(['✦ 新纪录！星象为你鼓掌', '✦ New record! The stars applaud']) : L(['✦ 全部配对完成', '✦ All pairs found']) }}</p>
        <p class="md-sub">{{ L(['用了', 'Finished in ']) }}<b>{{ moves }}</b>{{ L([' 步找到全部 6 对。', ' moves for all six pairs.']) }}</p>
        <button class="btn" @click="reset($event)">{{ L(['再来一局', 'Play again']) }}</button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.mem-stats {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 14px;
  font-size: 0.92rem;
  color: var(--ink-dim);
}
.ms-item b {
  color: var(--gold-bright);
  font-family: var(--pixel);
  font-size: 0.85rem;
  margin-left: 4px;
}

.mem-grid {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(6, minmax(74px, 110px));
  gap: 12px;
  justify-content: center;
}
@media (max-width: 640px) {
  .mem-grid { grid-template-columns: repeat(3, 1fr); }
}

.mem-card {
  position: relative;
  aspect-ratio: 118 / 186;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  perspective: 700px;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.mem-card:hover { transform: translateY(-4px); }
.mc-inner {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  transition: transform 0.55s cubic-bezier(0.4, 0.1, 0.2, 1.35);
}
.mem-card.flipped .mc-inner { transform: rotateY(180deg); }
.mc-face {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border-radius: 9px;
  backface-visibility: hidden;
  object-fit: cover;
}
.mc-back {
  background:
    radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--pink-soft) 26%, transparent), transparent 60%),
    linear-gradient(160deg, var(--void-3), var(--void-1));
  border: 2px solid var(--gold);
  overflow: hidden;
}
.mc-front {
  transform: rotateY(180deg);
  border: 2px solid var(--gold);
  background: var(--void-1);
}
.mem-card.matched { cursor: default; animation: mem-glow 1.6s ease-in-out infinite; }
.mem-card.matched .mc-front { border-color: color-mix(in srgb, var(--mint) 70%, transparent); }
@keyframes mem-glow {
  50% { filter: drop-shadow(0 0 10px color-mix(in srgb, var(--mint) 55%, transparent)); }
}
.mem-grid.done .mem-card { opacity: 0.85; }

.mem-done {
  margin-top: 22px;
  padding: 20px;
  text-align: center;
  border: 2px dashed color-mix(in srgb, var(--gold) 60%, transparent);
}
.md-title { margin: 0 0 6px; color: var(--gold-bright); font-family: var(--pixel); font-size: 0.7rem; letter-spacing: 0.16em; }
.md-sub { margin: 0 0 12px; color: var(--ink); }
.md-sub b { color: var(--gold-bright); font-family: var(--pixel); }

.slide-fade-enter-active { transition: all 0.4s cubic-bezier(0.34, 1.4, 0.64, 1); }
.slide-fade-enter-from { opacity: 0; transform: translateY(14px); }

@media (prefers-reduced-motion: reduce) {
  .mem-card, .mem-card:hover { transition: none; transform: none; }
  .mc-inner { transition-duration: 0.01s; }
  .mem-card.matched { animation: none; }
  .slide-fade-enter-active { transition: none; }
}
</style>
