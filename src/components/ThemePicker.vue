<script setup lang="ts">
/**
 * 皮肤选择器：五套风格各自统一的整套皮肤，一键切换、即时生效、本地记忆。
 * 组件自包含（含标题文案与样式），不依赖全局 i18n 词条。
 */
import { ref } from 'vue'
import { THEMES, getThemeId, setTheme, type OracleTheme } from '../lib/themes'
import { sfx } from '../lib/sfx'
import { sparkleFromEvent } from '../lib/sparkle'
import { locale } from '../lib/i18n'

const current = ref(getThemeId())

function pick(t: OracleTheme, e: MouseEvent): void {
  if (current.value === t.id) return
  current.value = t.id
  setTheme(t.id)
  sfx.ding()
  sparkleFromEvent(e, 12)
}
</script>

<template>
  <section class="panel theme-panel">
    <h3 style="margin: 0 0 4px;">🎨 {{ locale === 'zh' ? '皮肤工坊' : 'Skin Atelier' }}</h3>
    <p class="hint" style="margin: 0 0 14px;">
      {{
        locale === 'zh'
          ? '八套完整皮肤，配色、质感、明暗各自统一。选择即刻生效并记住。'
          : 'Eight complete skins — each internally consistent in palette, texture and mood. Applies instantly and is remembered.'
      }}
    </p>
    <div class="theme-grid">
      <button
        v-for="(t, i) in THEMES"
        :key="t.id"
        v-reveal="i"
        class="theme-card"
        :class="{ active: current === t.id }"
        @click="pick(t, $event)"
      >
        <span class="swatch-row">
          <i v-for="(c, j) in t.swatch" :key="j" :style="{ background: c }" />
        </span>
        <strong>{{ locale === 'zh' ? t.nameZh : t.nameEn }}</strong>
        <small>{{ locale === 'zh' ? t.descZh : t.descEn }}</small>
        <span v-if="current === t.id" class="active-mark">✦</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.theme-panel { margin-top: 20px; max-width: 760px; }
.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 13px;
}
.theme-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 14px 15px;
  background: rgba(30, 26, 69, 0.55);
  border: 2px solid rgba(179, 166, 247, 0.28);
  border-radius: 14px;
  cursor: pointer;
  text-align: left;
  color: var(--ink);
  transition:
    transform 0.24s cubic-bezier(0.34, 1.56, 0.64, 1),
    border-color 0.2s,
    box-shadow 0.25s;
}
.theme-card:hover { transform: translateY(-4px); border-color: var(--pink-soft); }
.theme-card.active {
  border-color: var(--gold);
  box-shadow: 0 0 20px rgba(245, 200, 110, 0.35);
}
.swatch-row { display: flex; gap: 6px; }
.swatch-row i {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.25);
  box-shadow: inset 0 -3px 6px rgba(0, 0, 0, 0.25);
}
.theme-card strong {
  font-family: var(--cute);
  font-weight: 400;
  color: var(--gold-bright);
  letter-spacing: 0.04em;
}
.theme-card small { color: var(--ink-dim); line-height: 1.55; font-size: 0.78rem; }
.active-mark {
  position: absolute;
  top: 10px;
  right: 13px;
  color: var(--gold-bright);
  animation: mark-spin 3s ease-in-out infinite;
}
@keyframes mark-spin {
  0%, 100% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.25); }
}
@media (prefers-reduced-motion: reduce) {
  .theme-card, .active-mark { animation: none; transition: none; }
}
</style>
