<script setup lang="ts">
/**
 * 连击徽章：展示当前连续占卜天数与最佳纪录。
 * 自包含组件，数据来自 lib/streak；今天已占卜时点亮。
 */
import { computed, onMounted, ref } from 'vue'
import { getStreak } from '../lib/streak'
import { locale } from '../lib/i18n'

const days = ref(0)
const best = ref(0)
const litToday = ref(false)

onMounted(() => {
  const s = getStreak()
  days.value = s.days
  best.value = s.best
  try {
    const k = new Date()
    litToday.value = s.last === `${k.getFullYear()}-${k.getMonth() + 1}-${k.getDate()}`
  } catch {
    litToday.value = false
  }
})

const label = computed(() =>
  locale.value === 'zh' ? `🔥 连续占卜 ${days.value} 天` : `🔥 ${days.value}-day streak`,
)
const bestLabel = computed(() =>
  locale.value === 'zh' ? `最佳 ${best.value} 天` : `best ${best.value}`,
)
const tip = computed(() => {
  if (litToday.value) {
    return locale.value === 'zh' ? '今天的星星已经打过招呼啦' : "You've greeted today's stars"
  }
  return locale.value === 'zh' ? '去抽一张牌，点亮今天' : 'Draw a card to light up today'
})
</script>

<template>
  <div class="streak-badge" :class="{ lit: litToday }" :title="tip">
    <span class="flame" aria-hidden="true">{{ days > 0 ? '🔥' : '🕯️' }}</span>
    <span class="txt">
      <strong>{{ days > 0 ? label : locale === 'zh' ? '尚未开炉' : 'No streak yet' }}</strong>
      <small v-if="best > 0">{{ bestLabel }} · {{ tip }}</small>
      <small v-else>{{ tip }}</small>
    </span>
  </div>
</template>

<style scoped>
.streak-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 9px 16px;
  border-radius: 999px;
  background: rgba(30, 26, 69, 0.6);
  border: 2px solid rgba(179, 166, 247, 0.35);
  transition:
    transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
    border-color 0.25s,
    box-shadow 0.3s;
}
.streak-badge:hover { transform: translateY(-2px); }
.streak-badge.lit {
  border-color: var(--gold);
  box-shadow: 0 0 18px rgba(245, 200, 110, 0.4);
}
.flame {
  font-size: 1.25rem;
  animation: flame-flicker 1.8s ease-in-out infinite;
}
@keyframes flame-flicker {
  0%, 100% { transform: scale(1) rotate(-2deg); }
  50% { transform: scale(1.14) rotate(3deg); }
}
.txt { display: flex; flex-direction: column; gap: 2px; text-align: left; }
.txt strong {
  font-family: var(--cute);
  font-weight: 400;
  color: var(--gold-bright);
  letter-spacing: 0.04em;
}
.txt small { color: var(--ink-dim); font-size: 0.72rem; }
@media (prefers-reduced-motion: reduce) {
  .flame { animation: none; }
}
</style>
