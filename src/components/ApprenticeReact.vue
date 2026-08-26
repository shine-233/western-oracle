<script setup lang="ts">
/**
 * 学徒现场点评：占卜出结果后，当值学徒的像素小人冒出一句情绪台词。
 * 用法：<ApprenticeReact module="tarot" mood="great" />
 *      或 <ApprenticeReact module="synastry" :score="reading.score" />
 * 台词来自 apprenticeProfiles 的 moods 库；精灵与 3D 模型同源。
 */
import { computed, ref, watch } from 'vue'
import { APPRENTICES } from '../data/apprenticeProfiles'
import { MASCOTS, mascotVoxels } from '../data/mascots'
import { MODULE_APPRENTICE, moodFromScore } from '../lib/reactMood'
import type { MoodKey } from '../data/apprenticeProfiles'
import { locale } from '../lib/i18n'

const props = defineProps<{
  module: string
  /** 直接指定情绪（优先） */
  mood?: MoodKey
  /** 或给 0-100 分自动换算 */
  score?: number
}>()

const zh = computed(() => locale.value === 'zh')

const who = computed(() => {
  const id = MODULE_APPRENTICE[props.module] ?? 'cat'
  return APPRENTICES.find((a) => a.id === id) ?? APPRENTICES[0]!
})

const mood = computed<MoodKey>(() => {
  if (props.mood) return props.mood
  if (typeof props.score === 'number') return moodFromScore(props.score)
  return 'good'
})

const line = computed(() => who.value.moods[mood.value][zh.value ? 'zh' : 'en'])

/* 像素小人（与体素同源）+ 邻接微着色 */
const pixels = computed(() => {
  const def = MASCOTS[who.value.id]
  if (!def) return []
  const out: Array<{ x: number; y: number; color: string }> = []
  const rows = def.sprite
  const same = (y: number, x: number, ch: string): boolean => rows[y]?.[x] === ch
  mascotVoxels(def).forEach((v) => {
    let f = 1
    if (!same(v.y + 1, v.x, def.sprite[v.y]?.[v.x] ?? '')) f = 0.86
    else if (!same(v.y - 1, v.x, v.color === def.sprite[v.y]?.[v.x] ? def.sprite[v.y]![v.x]! : '\0')) f = 1.07
    out.push({ x: v.x, y: v.y, color: f === 1 ? v.color : shadeHex(v.color, f) })
  })
  return out
})
const gridW = computed(() => {
  const def = MASCOTS[who.value.id]
  return def ? Math.max(...def.sprite.map((r) => r.length)) : 20
})
/** 各精灵行数不同（22~24），硬编码 24 会让矮精灵被等比缩小、基线漂移 */
const gridH = computed(() => {
  const def = MASCOTS[who.value.id]
  return def ? def.sprite.length : 24
})

/** 气泡入场重放 */
const bubbleKey = ref(0)
watch(
  () => [props.module, props.mood, props.score],
  () => {
    bubbleKey.value++
  },
)

const MOOD_FACE: Record<MoodKey, string> = { great: '🌟', good: '🌤️', meh: '🌫️', oops: '🌧️' }
</script>

<template>
  <div class="react-wrap">
    <svg class="react-sprite" :viewBox="`0 0 ${gridW} ${gridH}`" role="img" :aria-label="zh ? who.nameZh : who.nameEn">
      <rect
        v-for="(p, i) in pixels"
        :key="i"
        :x="p.x + 0.03"
        :y="p.y + 0.03"
        width="0.94"
        height="0.94"
        :fill="p.color"
      />
    </svg>
    <Transition name="bubble-pop" mode="out-in">
      <div :key="bubbleKey" class="react-bubble" :style="{ '--ac': who.color }">
        <span class="rb-head"
          >{{ MOOD_FACE[mood] }} {{ zh ? who.nameZh : who.nameEn }}
          <small>{{ zh ? '现场点评' : 'live take' }}</small></span
        >
        <p class="rb-line">{{ line }}</p>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.react-wrap {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  margin-top: 20px;
}
.react-sprite {
  width: 76px;
  flex-shrink: 0;
  image-rendering: pixelated;
  filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.4));
  animation: react-bounce 3.2s ease-in-out infinite;
}
@keyframes react-bounce {
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  50% { transform: translateY(-4px) rotate(2.5deg); }
}
.react-bubble {
  position: relative;
  flex: 1;
  min-width: 0;
  padding: 10px 15px 11px;
  background: rgba(30, 26, 69, 0.72);
  border: 2px solid var(--ac);
  border-radius: 13px;
  border-bottom-left-radius: 4px;
}
.rb-head {
  display: block;
  font-family: var(--cute);
  color: var(--gold-bright);
  margin-bottom: 3px;
}
.rb-head small {
  font-family: var(--pixel);
  font-size: 0.46rem;
  letter-spacing: 0.12em;
  color: var(--ink-dim);
  margin-left: 7px;
}
.rb-line { margin: 0; line-height: 1.75; color: var(--ink); font-size: 0.92rem; }
.bubble-pop-enter-active { transition: all 0.32s cubic-bezier(0.34, 1.56, 0.64, 1); }
.bubble-pop-leave-active { transition: all 0.14s ease; }
.bubble-pop-enter-from { opacity: 0; transform: translateY(10px) scale(0.92); }
.bubble-pop-leave-to { opacity: 0; transform: translateY(-6px); }
@media (prefers-reduced-motion: reduce) {
  .react-sprite { animation: none; }
  .bubble-pop-enter-active, .bubble-pop-leave-active { transition: none; }
}
</style>
