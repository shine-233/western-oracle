<script setup lang="ts">
/** 手相阅览室：星座图风格的互动手掌——掌纹如星座，点亮即解读；附 Cheiro 1916 原典阅读器 */
import { computed, onMounted, ref } from 'vue'
import { LINE_PATHS, PALM_FEATURES, L, type PalmFeature } from '../data/palmistry'
import { CHEIRO_SECTIONS } from '../data/palmistrySections'
import { locale } from '../lib/i18n'
import { sparkleFromEvent } from '../lib/sparkle'
import { sfx } from '../lib/sfx'
import DecryptTitle from '../components/DecryptTitle.vue'
import ApprenticeReact from '../components/ApprenticeReact.vue'

const selected = ref<PalmFeature | null>(null)
const drawn = ref(false)

/** 特征 id → Cheiro 章节原文 */
const SECTION_OF: Record<string, string> = {
  heart: 'line_of_heart',
  head: 'line_of_head',
  life: 'line_of_life',
  fate: 'line_of_destiny',
  sun: 'line_of_sun',
  marriage: 'marriage',
  venus: 'mount_venus',
  jupiter: 'mount_jupiter',
  saturn: 'mount_saturn',
  apollo: 'mount_sun',
  mercury: 'mount_mercury',
}
const cheiroSection = computed(() => {
  const key = selected.value ? SECTION_OF[selected.value.id] : null
  return key ? CHEIRO_SECTIONS[key as keyof typeof CHEIRO_SECTIONS] : null
})
const cheiroOpen = ref(false)

/** 原典书架：全部章节 */
const chapterList = Object.entries(CHEIRO_SECTIONS).map(([id, s]) => ({ id, ...s }))
const activeChapter = ref<string | null>(null)
function openChapter(id: string): void {
  activeChapter.value = activeChapter.value === id ? null : id
  sfx.blip()
}
/** 章节标题中文化（阅读器小标签用） */
const CHAPTER_ZH: Record<string, string> = {
  line_of_head: '智慧线', line_of_life: '生命线', line_of_mars: '火星线', line_of_destiny: '命运线',
  line_of_sun: '太阳线', line_of_heart: '感情线', marriage: '婚姻线', children: '子女线',
  line_of_health: '健康线', girdle_of_venus: '金星带', line_of_intuition: '直觉线',
  mount_mars: '火星丘', mount_jupiter: '木星丘', mount_saturn: '土星丘', mount_sun: '太阳丘',
  mount_mercury: '水星丘', mount_moon: '月丘', mount_venus: '金星丘',
}

onMounted(() => {
  // 等下一帧再触发描边动画，保证 transition 生效
  requestAnimationFrame(() => (drawn.value = true))
})

function pick(f: PalmFeature, e?: MouseEvent): void {
  selected.value = f
  cheiroOpen.value = false
  sfx.ding()
  if (e) sparkleFromEvent(e, 6)
}

const lines = computed(() => PALM_FEATURES.filter((f) => f.kind === 'line'))
const mounts = computed(() => PALM_FEATURES.filter((f) => f.kind === 'mount'))
const zh = computed(() => locale.value === 'zh')

/** 六条掌纹各自的星座配色 */
const LINE_COLORS = ['#ff8fb8', '#7de8c3', '#ffb37a', '#b3a6f7', '#ffe3a8', '#ff9fce']

/** 掌丘坐标（viewBox） */
const MOUNT_POS: Record<string, { x: number; y: number; r: number }> = {
  venus: { x: 118, y: 250, r: 24 },
  jupiter: { x: 106, y: 172, r: 15 },
  saturn: { x: 139, y: 166, r: 16 },
  apollo: { x: 170, y: 168, r: 15 },
  mercury: { x: 196, y: 178, r: 13 },
}

/** 掌心星屑装饰点 */
const STARS = [
  [70, 120], [96, 96], [128, 78], [160, 88], [190, 108], [206, 140],
  [84, 210], [200, 224], [118, 288], [162, 292], [222, 196], [58, 170],
].map(([x, y], i) => ({ x, y, d: (i % 5) * 0.6 }))
</script>

<template>
  <div class="page-root">
    <h2><DecryptTitle :text="L(['手相阅览室', 'Palm Reading Room'])" /></h2>
    <p class="hint">{{ L([
      '把左手当成一张星空图：每条掌纹是一条"星座连线"，每个掌丘是一片"星域"。点一点，听听它们想说什么。',
      'Treat your left hand as a star chart: lines are constellations, mounts are nebulae. Tap around and listen.',
    ]) }}</p>

    <div class="palm-layout">
      <!-- 手掌星图 -->
      <section class="panel palm-stage">
        <svg viewBox="0 0 280 340" class="hand-svg" role="img" :aria-label="L(['手掌互动图', 'Interactive hand chart'])">
          <defs>
            <radialGradient id="skinGlow" cx="50%" cy="45%" r="65%">
              <stop offset="0%" stop-color="#3a3268" />
              <stop offset="100%" stop-color="#241d52" />
            </radialGradient>
            <radialGradient id="mountGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#ffd76e" stop-opacity="0.32" />
              <stop offset="100%" stop-color="#ffd76e" stop-opacity="0" />
            </radialGradient>
          </defs>

          <!-- 掌形剪影 -->
          <g class="silhouette">
            <rect x="92" y="52" width="27" height="126" rx="13.5" fill="url(#skinGlow)" stroke="#6b5bd6" stroke-width="1.6" />
            <rect x="124" y="38" width="28" height="140" rx="14" fill="url(#skinGlow)" stroke="#6b5bd6" stroke-width="1.6" />
            <rect x="156" y="52" width="27" height="126" rx="13.5" fill="url(#skinGlow)" stroke="#6b5bd6" stroke-width="1.6" />
            <rect x="187" y="82" width="24" height="96" rx="12" fill="url(#skinGlow)" stroke="#6b5bd6" stroke-width="1.6" />
            <rect x="60" y="196" width="66" height="30" rx="15" transform="rotate(-38 60 196)" fill="url(#skinGlow)" stroke="#6b5bd6" stroke-width="1.6" />
            <rect x="86" y="158" width="130" height="122" rx="42" fill="url(#skinGlow)" stroke="#6b5bd6" stroke-width="1.8" />
          </g>

          <!-- 掌中星屑 -->
          <circle v-for="(s, i) in STARS" :key="'st' + i" :cx="s.x" :cy="s.y" r="1.6" fill="#ffe3a8" class="twinkle" :style="{ animationDelay: s.d + 's' }" />

          <!-- 掌丘星域 -->
          <g v-for="m in mounts" :key="m.id" class="mount" @click="pick(m, $event)">
            <circle :cx="MOUNT_POS[m.id]!.x" :cy="MOUNT_POS[m.id]!.y" :r="MOUNT_POS[m.id]!.r * 1.9" fill="url(#mountGlow)" />
            <circle
              :cx="MOUNT_POS[m.id]!.x" :cy="MOUNT_POS[m.id]!.y" :r="MOUNT_POS[m.id]!.r"
              fill="transparent" stroke="#ffd76e" stroke-width="1.2" stroke-dasharray="3 5" class="mount-ring"
            />
            <text :x="MOUNT_POS[m.id]!.x" :y="MOUNT_POS[m.id]!.y + 1" text-anchor="middle" dominant-baseline="central" class="mount-glyph">{{ m.glyph }}</text>
          </g>

          <!-- 掌纹星座线 -->
          <g v-for="(f, i) in lines" :key="f.id" class="line-hot" @click="pick(f, $event)">
            <path :d="LINE_PATHS[f.id]" fill="none" stroke="transparent" stroke-width="14" />
            <path
              :d="LINE_PATHS[f.id]"
              fill="none"
              class="line-path"
              :class="{ lit: selected?.id === f.id }"
              :stroke="LINE_COLORS[i]"
              :style="{ strokeDasharray: 320, strokeDashoffset: drawn ? 0 : 320 }"
              stroke-linecap="round"
            />
          </g>
        </svg>
        <ApprenticeReact module="palmistry" :score="selected ? 90 : 62" />
        <p class="stage-hint">{{ L(['✧ 点亮任意一条纹路或一片星域 ✧', '✧ tap any line or nebula ✧']) }}</p>
      </section>

      <!-- 解读面板 -->
      <section class="panel reading-panel">
        <Transition name="slide-fade" mode="out-in">
          <div v-if="selected" :key="selected.id">
            <h3 class="rp-title"><span class="rp-glyph">{{ selected.glyph }}</span> {{ L([selected.nameZh, selected.nameEn]) }}</h3>
            <p class="rp-essence">{{ L([selected.zhEssence, selected.enEssence]) }}</p>
            <p class="rp-detail">{{ L([selected.zhDetail, selected.enDetail]) }}</p>
            <div class="rp-tip">✧ {{ L([selected.zhTip, selected.enTip]) }}</div>
            <!-- Cheiro 原典对照 -->
            <Transition name="cheiro">
              <details v-if="cheiroSection" :open="cheiroOpen" class="cheiro-box" @toggle="cheiroOpen = ($event.target as HTMLDetailsElement).open">
                <summary class="cheiro-summary" @click.prevent="cheiroOpen = !cheiroOpen; sfx.blip()">
                  📜 {{ zh ? 'Cheiro 原典对照' : 'Cheiro’s original text' }}
                  <span class="cheiro-ch">· {{ zh ? CHAPTER_ZH[selected.id] ?? cheiroSection.title : cheiroSection.title }} · Ch.{{ cheiroSection.chapter }}</span>
                </summary>
                <p class="cheiro-title">{{ cheiroSection.title }}</p>
                <p class="cheiro-text">{{ cheiroSection.text }}</p>
                <p class="cheiro-note">{{ L([
                  '——摘自 Cheiro《Palmistry for All》（1916 公版），百年前的口吻，读个趣味。',
                  '— from Cheiro’s “Palmistry for All” (1916, public domain). Read it as period flavour, not medical advice.',
                ]) }}</p>
              </details>
            </Transition>
          </div>
          <div v-else key="empty">
            <h3 class="rp-title">{{ L(['先从感情线开始？', 'Start with the heart line?']) }}</h3>
            <p class="rp-detail">
              {{ L([
                '左手代表"与生俱来的部分"，右手代表"后来活成的样子"。传统读法是两只对照着看——不过在这里，先随便点亮一条，就当认识一下。',
                'The left hand is said to show what you were born with, the right what you made of it. Here, just light one up and say hello.',
              ]) }}
            </p>
          </div>
        </Transition>
      </section>
    </div>

    <!-- Cheiro 原典书架 -->
    <section class="panel shelf-panel">
      <div class="shelf-head">
        <h3 class="shelf-title">📜 {{ L(['Cheiro 原典书架 · 1916', 'The Cheiro Shelf · 1916']) }}</h3>
        <small class="hint">{{ L([`${chapterList.length} 个章节全文，点开即读`, `${chapterList.length} chapters, full text`]) }}</small>
      </div>
      <div class="shelf-chips">
        <button
          v-for="(c, i) in chapterList"
          :key="c.id"
          class="chip-book"
          :class="{ active: activeChapter === c.id }"
          :style="{ animationDelay: (i * 40) + 'ms' }"
          @click="openChapter(c.id); sparkleFromEvent($event, 4)"
        >
          <span class="chip-zh">{{ zh ? CHAPTER_ZH[c.id] ?? c.title.slice(0, 18) : c.title.replace('THE ', '').slice(0, 22) }}</span>
          <span class="chip-no">Ch.{{ c.chapter }}</span>
        </button>
      </div>
      <Transition name="chapter">
        <article v-if="activeChapter" :key="activeChapter" class="chapter-reader">
          <p class="cheiro-title">{{ CHEIRO_SECTIONS[activeChapter as keyof typeof CHEIRO_SECTIONS].title }}</p>
          <p class="cheiro-text">{{ CHEIRO_SECTIONS[activeChapter as keyof typeof CHEIRO_SECTIONS].text }}</p>
        </article>
      </Transition>
    </section>
  </div>
</template>

<style scoped>
.palm-layout {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(280px, 1fr);
  gap: 20px;
  margin-top: 18px;
  align-items: stretch;
}
@media (max-width: 800px) { .palm-layout { grid-template-columns: 1fr; } }

.palm-stage { display: flex; flex-direction: column; align-items: center; }
.hand-svg { width: 100%; max-width: 360px; }
.stage-hint {
  font-family: var(--pixel);
  font-size: 0.55rem;
  letter-spacing: 0.12em;
  color: var(--gold-bright);
  opacity: 0.85;
  animation: hint-bob 2s ease-in-out infinite;
}
@keyframes hint-bob { 50% { transform: translateY(-4px); } }

.twinkle { animation: twinkle 2.8s ease-in-out infinite; }
@keyframes twinkle { 0%, 100% { opacity: 0.25; } 50% { opacity: 1; } }

.mount { cursor: pointer; }
.mount-ring { transition: all 0.25s; }
.mount:hover .mount-ring { stroke-width: 2; stroke-dasharray: none; filter: drop-shadow(0 0 6px rgba(255, 215, 110, 0.8)); }
.mount-glyph { font-size: 15px; fill: var(--gold-bright); pointer-events: none; }

.line-hot { cursor: pointer; }
.line-path {
  stroke-width: 2.4;
  transition: stroke-dashoffset 1.6s cubic-bezier(0.4, 0, 0.2, 1), filter 0.25s, stroke-width 0.25s;
  opacity: 0.75;
}
.line-path.lit { opacity: 1; stroke-width: 3.6; filter: drop-shadow(0 0 7px currentColor); }

.reading-panel { min-height: 300px; }
.rp-title { margin: 0 0 10px; font-family: var(--cute); font-weight: 400; color: var(--gold-bright); font-size: 1.25rem; display: flex; align-items: center; gap: 10px; }
.rp-glyph { font-size: 1.5rem; }
.rp-essence { color: var(--lavender-soft); font-size: 0.95rem; margin: 0 0 12px; }
.rp-detail { line-height: 2; color: var(--ink); margin: 0 0 14px; white-space: pre-line; }
.rp-tip {
  padding: 11px 14px;
  border: 1.5px dashed rgba(245, 200, 110, 0.5);
  border-radius: 10px;
  color: var(--gold-bright);
  font-size: 0.88rem;
  line-height: 1.8;
}

.slide-fade-enter-active { transition: all 0.35s cubic-bezier(0.34, 1.4, 0.64, 1); }
.slide-fade-leave-active { transition: all 0.16s ease; }
.slide-fade-enter-from { opacity: 0; transform: translateX(18px); }
.slide-fade-leave-to { opacity: 0; transform: translateX(-10px); }

/* ---------- Cheiro 原典对照 ---------- */
.cheiro-box {
  margin-top: 14px;
  border: 1.5px solid rgba(179, 166, 247, 0.35);
  border-radius: 10px;
  background: rgba(179, 166, 247, 0.06);
  overflow: hidden;
}
.cheiro-summary {
  list-style: none;
  cursor: pointer;
  padding: 10px 13px;
  font-family: var(--cute);
  color: var(--lavender-soft);
  font-size: 0.9rem;
  transition: background 0.2s, color 0.2s;
}
.cheiro-summary::-webkit-details-marker { display: none; }
.cheiro-summary:hover { background: rgba(179, 166, 247, 0.12); color: var(--gold-bright); }
.cheiro-ch { font-family: var(--pixel); font-size: 0.6rem; letter-spacing: 0.08em; opacity: 0.8; margin-left: 6px; }
.cheiro-title { margin: 2px 14px 8px; font-family: var(--pixel); font-size: 0.62rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--gold-bright); }
.cheiro-text {
  margin: 0 14px 10px;
  max-height: 260px;
  overflow-y: auto;
  line-height: 1.95;
  font-size: 0.85rem;
  color: var(--ink);
  opacity: 0.92;
  padding-right: 6px;
}
.cheiro-note { margin: 0 14px 12px; font-size: 0.72rem; color: var(--ink-dim); font-style: italic; }
.cheiro-enter-active { transition: all 0.3s ease; }
.cheiro-enter-from { opacity: 0; transform: translateY(-6px); }

/* ---------- 原典书架 ---------- */
.shelf-panel { margin-top: 20px; }
.shelf-head { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.shelf-title { margin: 0; font-family: var(--cute); font-weight: 400; color: var(--gold-bright); font-size: 1.1rem; }
.shelf-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.chip-book {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 12px;
  border-radius: 999px;
  border: 1.5px solid rgba(245, 200, 110, 0.35);
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  font-size: 0.82rem;
  transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
  animation: book-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
}
@keyframes book-in { from { opacity: 0; transform: translateY(12px) rotate(-4deg); } }
.chip-book:hover { transform: translateY(-3px) rotate(1deg); border-color: var(--gold); box-shadow: 0 6px 16px rgba(245, 200, 110, 0.15); }
.chip-book.active {
  border-color: var(--gold);
  background: linear-gradient(140deg, rgba(245, 200, 110, 0.22), rgba(245, 200, 110, 0.08));
  color: var(--gold-bright);
  filter: drop-shadow(0 0 6px rgba(245, 200, 110, 0.4));
}
.chip-no { font-family: var(--pixel); font-size: 0.55rem; letter-spacing: 0.08em; opacity: 0.75; }
.chapter-reader { margin-top: 16px; padding-top: 14px; border-top: 1.5px dashed rgba(245, 200, 110, 0.3); max-height: 420px; overflow-y: auto; }
.chapter-enter-active { transition: all 0.4s cubic-bezier(0.34, 1.4, 0.64, 1); }
.chapter-enter-from { opacity: 0; transform: translateY(14px); }
.chapter-leave-active { transition: all 0.12s ease; position: absolute; opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .line-path { transition: none; stroke-dashoffset: 0 !important; }
  .twinkle, .stage-hint, .chip-book { animation: none; }
}
</style>
