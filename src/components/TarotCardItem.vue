<script setup lang="ts">
import type { TarotCard } from '../data/tarot'
import { cardImageUrl } from '../data/tarot'
import { vTilt } from '../lib/tilt'
import { t } from '../lib/i18n'

defineProps<{
  card: TarotCard
  reversed: boolean
  revealed: boolean
}>()

defineEmits<{ flip: [e: MouseEvent] }>()
</script>

<template>
  <div v-tilt="12" class="tci-wrap" :class="{ revealed }" @click="$emit('flip', $event)">
    <div class="tci-inner" :class="{ flipped: revealed, rev: reversed }">
      <!-- 牌背 -->
      <div class="tci-face tci-back">
        <div class="tci-back-pattern">
          <span class="star-big">✦</span>
          <span class="star-small">✧</span>
        </div>
      </div>
      <!-- 牌面：1909 公版 RWS 插图 -->
      <div class="tci-face tci-front">
        <img
          class="tci-img"
          :src="cardImageUrl(card.id)"
          :alt="`${card.nameCn} ${card.name}`"
          loading="lazy"
          draggable="false"
        />
        <span class="tci-plate">{{ card.nameCn }}</span>
      </div>
    </div>
    <p v-if="revealed" class="tci-caption">
      {{ card.nameCn }}<template v-if="reversed">（{{ t('c.reversed') }}）</template>
    </p>
    <p v-else class="tci-caption dim">{{ t('tarot.flipHint') }}</p>
  </div>
</template>

<style scoped>
.tci-wrap { cursor: pointer; text-align: center; user-select: none; }
.tci-inner {
  position: relative;
  width: 118px;
  height: 190px;
  margin: 0 auto;
  transform-style: preserve-3d;
  transition: transform 0.7s cubic-bezier(0.4, 0.1, 0.2, 1.4);
}
.tci-wrap:hover .tci-inner { transform: translateY(-6px); }
.tci-inner.flipped { transform: rotateY(180deg); }
.tci-wrap:hover .tci-inner.flipped { transform: rotateY(180deg) translateY(-6px); }

.tci-face {
  position: absolute;
  inset: 0;
  border-radius: 10px;
  backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.tci-back {
  background:
    radial-gradient(circle at 50% 42%, color-mix(in srgb, var(--pink-soft) 28%, transparent), transparent 55%),
    radial-gradient(circle at 50% 58%, color-mix(in srgb, var(--gold) 20%, transparent), transparent 50%),
    repeating-linear-gradient(45deg, #221d4e 0 8px, #191542 8px 16px);
  border: 3px solid #2e2650;
  box-shadow: inset 0 0 0 3px #151232, inset 0 0 0 5px color-mix(in srgb, var(--pink) 50%, transparent);
  transition: box-shadow 0.3s;
}
.tci-wrap:hover .tci-back {
  box-shadow: inset 0 0 0 5px #151232, inset 0 0 0 7px color-mix(in srgb, var(--pink-soft) 60%, transparent), 0 0 22px color-mix(in srgb, var(--pink-soft) 25%, transparent);
}
.tci-back-pattern { position: relative; width: 100%; height: 100%; }
.tci-back-pattern .star-big {
  position: absolute;
  top: 42%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 2rem;
  color: var(--gold-bright);
  animation: back-star 2.6s ease-in-out infinite;
}
.tci-back-pattern .star-small {
  position: absolute;
  bottom: 10px;
  right: 12px;
  font-size: 0.8rem;
  color: var(--pink-soft);
  opacity: 0.8;
}
@keyframes back-star {
  0%, 100% { opacity: 0.7; text-shadow: 0 0 4px color-mix(in srgb, var(--gold-bright) 40%, transparent); }
  50% { opacity: 1; text-shadow: 0 0 14px color-mix(in srgb, var(--gold-bright) 95%, transparent); }
}

.tci-front {
  transform: rotateY(180deg);
  background: #efe6d0;
  border: 3px solid #2e2650;
  padding: 0;
}
.tci-front::after {
  content: '';
  position: absolute;
  inset: 4px;
  border: 2px solid color-mix(in srgb, var(--gold) 85%, transparent);
  pointer-events: none;
}
.tci-inner.rev .tci-front { transform: rotateY(180deg) rotate(180deg); }
.tci-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.tci-plate {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(21, 18, 50, 0.82);
  color: var(--gold-bright);
  font-family: var(--cute);
  font-size: 0.8rem;
  letter-spacing: 0.15em;
  padding: 4px 0 5px;
}
.tci-caption { margin: 10px 0 0; font-size: 0.88rem; color: var(--gold-bright); min-height: 1.3em; }
.tci-caption.dim { color: var(--ink-dim); opacity: 0.6; font-size: 0.78rem; }
</style>
