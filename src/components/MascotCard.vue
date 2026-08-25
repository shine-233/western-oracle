<script setup lang="ts">
/** 模块吉祥物卡片：体素小人 + 名牌 + 点击换一句的小知识 */
import { computed, ref } from 'vue'
import VoxelMascot from './VoxelMascot.vue'
import { MASCOTS } from '../data/mascots'
import { sfx } from '../lib/sfx'
import { sparkleFromEvent } from '../lib/sparkle'
import { t, locale } from '../lib/i18n'

const props = withDefaults(defineProps<{ id: string; height?: number }>(), { height: 205 })

const inner = ref<InstanceType<typeof VoxelMascot> | null>(null)
const tipIndex = ref(0)
const TIPS_PER_PET = 2

const def = computed(() => MASCOTS[props.id])
const name = computed(() =>
  locale.value === 'zh' ? def.value?.nameCn ?? props.id : def.value?.nameEn ?? props.id,
)
const glyph = computed(() => def.value?.satelliteColor ?? '#ffd76e')

function nextTip(e?: MouseEvent): void {
  tipIndex.value = (tipIndex.value + 1) % TIPS_PER_PET
  sfx.blip()
  if (e) sparkleFromEvent(e, 5)
}

defineExpose({ celebrate: (): void => inner.value?.celebrate() })
</script>

<template>
  <section class="panel pet-card">
    <div class="pet-info">
      <h3 class="pet-name"><i class="pet-dot" :style="{ background: glyph }" />✦ {{ t('pet.title.' + props.id) }}</h3>
      <p v-if="def" class="pet-en">{{ name }} · Oracle Pet</p>
      <p class="pet-tip" title="" @click="nextTip($event)">
        {{ t(`pet.${props.id}.tip${tipIndex + 1}`) }}
        <span class="tip-next">↻ {{ t('pet.nextTip') }}</span>
      </p>
    </div>
    <VoxelMascot ref="inner" :id="props.id" :height="props.height" />
  </section>
</template>

<style scoped>
.pet-card {
  margin-top: 18px;
  display: grid;
  grid-template-columns: minmax(200px, 0.9fr) minmax(240px, 1.1fr);
  gap: 16px;
  align-items: stretch;
  border-color: rgba(179, 166, 247, 0.35);
}
@media (max-width: 720px) {
  .pet-card { grid-template-columns: 1fr; }
}
.pet-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
}
.pet-name {
  margin: 0;
  font-family: var(--cute);
  color: var(--gold-bright);
  font-size: 1.15rem;
  display: flex;
  align-items: center;
  gap: 8px;
}
.pet-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
  box-shadow: 0 0 10px currentColor;
  animation: dot-breathe 2.6s ease-in-out infinite;
}
@keyframes dot-breathe { 50% { transform: scale(1.3); } }
.pet-en {
  margin: 0;
  color: var(--ink-dim);
  font-family: var(--pixel);
  font-size: 0.55rem;
  letter-spacing: 0.14em;
}
.pet-tip {
  margin: auto 0;
  padding: 12px 14px;
  background: rgba(13, 11, 32, 0.6);
  border: 1.5px dashed rgba(245, 200, 110, 0.4);
  border-radius: 10px;
  line-height: 1.85;
  font-size: 0.88rem;
  cursor: pointer;
  transition: border-color 0.2s, transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.pet-tip:hover { border-color: var(--gold); transform: translateY(-2px); }
.tip-next {
  display: block;
  margin-top: 6px;
  color: var(--lavender-soft);
  font-size: 0.72rem;
  opacity: 0.75;
}
</style>
