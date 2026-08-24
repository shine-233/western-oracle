<script setup lang="ts">
import type { TarotCard } from '../data/tarot'

defineProps<{
  card: TarotCard
  reversed: boolean
  revealed: boolean
}>()

defineEmits<{ flip: [] }>()
</script>

<template>
  <div class="tci-wrap" :class="{ revealed }" @click="$emit('flip')">
    <div class="tci-inner" :class="{ flipped: revealed, rev: reversed }">
      <!-- 牌背 -->
      <div class="tci-face tci-back">
        <div class="tci-back-pattern">
          <span>✦</span>
        </div>
      </div>
      <!-- 牌面 -->
      <div class="tci-face tci-front">
        <span class="tci-rank">{{ card.rankLabel }}</span>
        <span class="tci-name-cn">{{ card.nameCn }}</span>
        <span class="tci-name-en">{{ card.name }}</span>
      </div>
    </div>
    <p v-if="revealed" class="tci-caption">
      {{ card.nameCn }}<template v-if="reversed">（逆位）</template>
    </p>
    <p v-else class="tci-caption dim">点击翻开</p>
  </div>
</template>

<style scoped>
.tci-wrap { cursor: pointer; text-align: center; user-select: none; }
.tci-inner {
  position: relative;
  width: 118px;
  height: 186px;
  margin: 0 auto;
  transform-style: preserve-3d;
  transition: transform 0.7s cubic-bezier(0.4, 0.1, 0.2, 1.4);
}
.tci-inner.flipped { transform: rotateY(180deg); }
.tci-face {
  position: absolute;
  inset: 0;
  border-radius: 10px;
  backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.tci-back {
  background:
    radial-gradient(circle at 50% 50%, rgba(212, 175, 106, 0.25), transparent 60%),
    repeating-linear-gradient(45deg, #1a1738 0 8px, #14122e 8px 16px);
  border: 1px solid rgba(212, 175, 106, 0.5);
  box-shadow: inset 0 0 0 5px #12102a, inset 0 0 0 6px rgba(212, 175, 106, 0.35);
}
.tci-back-pattern span {
  font-size: 2rem;
  color: var(--gold);
  opacity: 0.85;
}
.tci-front {
  transform: rotateY(180deg);
  background: linear-gradient(170deg, #f4ecd9 0%, #e8d9b8 100%);
  color: #3a2f18;
  border: 1px solid var(--gold);
  padding: 10px;
  gap: 6px;
}
.tci-inner.rev .tci-front { transform: rotateY(180deg) rotate(180deg); }
.tci-rank { font-family: var(--serif); font-size: 0.95rem; letter-spacing: 0.15em; opacity: 0.75; }
.tci-name-cn { font-size: 1.35rem; font-weight: 600; letter-spacing: 0.2em; text-indent: 0.2em; }
.tci-name-en { font-size: 0.62rem; font-style: italic; letter-spacing: 0.08em; opacity: 0.65; }
.tci-caption { margin: 10px 0 0; font-size: 0.88rem; color: var(--gold-bright); min-height: 1.3em; }
.tci-caption.dim { color: var(--ink-dim); opacity: 0.6; font-size: 0.78rem; }
</style>
