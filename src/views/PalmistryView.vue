<script setup lang="ts">
/** 手相阅览室：星座图风格的互动手掌——掌纹如星座，点亮即解读 */
import { computed, onMounted, ref } from 'vue'
import { LINE_PATHS, PALM_FEATURES, L, type PalmFeature } from '../data/palmistry'
import { sparkleFromEvent } from '../lib/sparkle'
import { sfx } from '../lib/sfx'
import DecryptTitle from '../components/DecryptTitle.vue'

const selected = ref<PalmFeature | null>(null)
const drawn = ref(false)

onMounted(() => {
  // 等下一帧再触发描边动画，保证 transition 生效
  requestAnimationFrame(() => (drawn.value = true))
})

function pick(f: PalmFeature, e?: MouseEvent): void {
  selected.value = f
  sfx.ding()
  if (e) sparkleFromEvent(e, 6)
}

const lines = computed(() => PALM_FEATURES.filter((f) => f.kind === 'line'))
const mounts = computed(() => PALM_FEATURES.filter((f) => f.kind === 'mount'))

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

@media (prefers-reduced-motion: reduce) {
  .line-path { transition: none; stroke-dashoffset: 0 !important; }
  .twinkle, .stage-hint { animation: none; }
}
</style>
