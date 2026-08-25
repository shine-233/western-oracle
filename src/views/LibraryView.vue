<script setup lang="ts">
import { computed, ref } from 'vue'
import { ALL_CARDS, cardImageUrl, type Suit, type TarotCard } from '../data/tarot'
import { sfx } from '../lib/sfx'
import { sparkleFromEvent } from '../lib/sparkle'
import { useEscClose } from '../lib/useEsc'
import { t } from '../lib/i18n'
import DecryptTitle from '../components/DecryptTitle.vue'

type FilterKey = 'all' | 'major' | Suit

const FILTERS: Array<{ key: FilterKey; keyName: string; glyph: string }> = [
  { key: 'all', keyName: 'lib.f.all', glyph: '✷' },
  { key: 'major', keyName: 'lib.f.major', glyph: '★' },
  { key: 'wands', keyName: 'lib.f.wands', glyph: '🪄' },
  { key: 'cups', keyName: 'lib.f.cups', glyph: '🏆' },
  { key: 'swords', keyName: 'lib.f.swords', glyph: '⚔️' },
  { key: 'pentacles', keyName: 'lib.f.pentacles', glyph: '🪙' },
]

const filter = ref<FilterKey>('all')
const keyword = ref('')
const detail = ref<TarotCard | null>(null)

useEscClose(() => {
  detail.value = null
})

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return ALL_CARDS.filter((c) => {
    if (filter.value === 'major' && c.arcana !== 'major') return false
    if (filter.value !== 'all' && filter.value !== 'major' && c.suit !== filter.value) return false
    if (kw && !c.nameCn.includes(kw) && !c.name.toLowerCase().includes(kw) && !c.keywords.some((k) => k.includes(kw))) return false
    return true
  })
})

const SUIT_COLOR: Record<string, string> = {
  major: '#f5c86e',
  wands: '#ff9f6e',
  cups: '#7db8ff',
  swords: '#b3a6f7',
  pentacles: '#7de8c3',
}

function open(c: TarotCard, e: MouseEvent): void {
  detail.value = c
  sfx.toggle()
  sparkleFromEvent(e, 5)
}
</script>

<template>
  <div class="page-root">
    <h2><DecryptTitle :text="t('lib.title')" /></h2>
    <p class="hint">{{ t('lib.hint') }}</p>

    <div class="lib-toolbar stagger-in">
      <div class="filter-row">
        <button
          v-for="f in FILTERS"
          :key="f.key"
          class="filter-chip"
          :class="{ active: filter === f.key }"
          @click="filter = f.key; sfx.blip()"
        >{{ f.glyph }} {{ t(f.keyName) }}</button>
      </div>
      <input v-model="keyword" class="lib-search" type="text" :placeholder="t('lib.searchPh')" />
    </div>

    <p v-reveal class="hint lib-count">{{ t('lib.count', { n: filtered.length }) }}</p>

    <TransitionGroup v-reveal="1" name="lib" tag="section" class="lib-grid">
      <button
        v-for="(c, i) in filtered"
        :key="c.id"
        class="lib-card"
        :style="{ '--d': `${Math.min(i % 24, 12) * 28}ms`, '--accent': SUIT_COLOR[c.suit ?? 'major'] }"
        @click="open(c, $event)"
      >
        <img :src="cardImageUrl(c.id)" :alt="`${c.nameCn} ${c.name}`" loading="lazy" draggable="false" />
        <span class="lib-name">{{ c.nameCn }}</span>
        <span class="lib-en">{{ c.rankLabel }} · {{ c.name }}</span>
      </button>
    </TransitionGroup>

    <!-- 详情弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="detail" class="modal-backdrop" @click.self="detail = null">
          <div class="modal-panel panel bounce-in">
            <button class="modal-close btn small ghost" @click="detail = null">{{ t('c.close') }}</button>
            <div class="modal-body">
              <img :src="cardImageUrl(detail.id)" :alt="detail.nameCn" />
              <div class="modal-info">
                <span class="dc-label">{{ detail.rankLabel }} · {{ detail.name }}</span>
                <h3 style="margin: 6px 0;">{{ detail.nameCn }}</h3>
                <p class="hint">{{ t('c.keywords') }}：{{ detail.keywords.join(' / ') }}</p>
                <div class="modal-sec">
                  <strong>{{ t('c.upright') }}</strong>
                  <p class="reading">{{ detail.upright }}</p>
                </div>
                <div class="modal-sec">
                  <strong>{{ t('c.reversed') }}</strong>
                  <p class="reading">{{ detail.reversed }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.lib-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-top: 18px;
}
.filter-row { display: flex; flex-wrap: wrap; gap: 8px; }
.filter-chip {
  background: rgba(30, 26, 69, 0.6);
  border: 1.5px solid rgba(179, 166, 247, 0.35);
  color: var(--ink-dim);
  padding: 6px 13px;
  font-size: 0.88rem;
  cursor: pointer;
  border-radius: 999px;
  transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.filter-chip:hover { transform: translateY(-2px); border-color: var(--pink-soft); }
.filter-chip.active { background: rgba(124, 107, 214, 0.25); color: var(--gold-bright); transform: translateY(-2px); }
.lib-search {
  flex: 1 1 220px;
  max-width: 320px;
}
.lib-count { margin-top: 10px; }

.lib-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(128px, 1fr));
  gap: 16px;
  margin-top: 12px;
}
.lib-card {
  position: relative;
  background: var(--void-2);
  border: 2px solid rgba(179, 166, 247, 0.25);
  border-radius: 12px;
  padding: 8px 8px 10px;
  cursor: pointer;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s, border-color 0.25s;
  animation: card-in 0.5s cubic-bezier(0.34, 1.4, 0.64, 1) both;
  animation-delay: var(--d);
}
@keyframes card-in {
  from { opacity: 0; transform: translateY(16px) scale(0.94); }
}
.lib-card:hover {
  transform: translateY(-7px) rotate(-1.2deg) scale(1.03);
  border-color: var(--accent);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.5), 0 0 20px color-mix(in srgb, var(--accent) 35%, transparent);
}
.lib-card img {
  width: 100%;
  border-radius: 8px;
  display: block;
}
.lib-name {
  display: block;
  margin-top: 8px;
  color: var(--gold-bright);
  font-size: 0.92rem;
  text-align: center;
}
.lib-en {
  display: block;
  color: var(--ink-dim);
  font-size: 0.68rem;
  font-family: var(--pixel);
  text-align: center;
  margin-top: 4px;
  opacity: 0.75;
}

.lib-enter-active, .lib-leave-active { transition: all 0.3s ease; }
.lib-enter-from { opacity: 0; transform: scale(0.9); }
.lib-leave-to { opacity: 0; transform: scale(0.9); }
.lib-move { transition: transform 0.35s ease; }

.dc-label { font-family: var(--pixel); font-size: 0.55rem; letter-spacing: 0.15em; color: var(--pink-soft); }

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(10, 8, 30, 0.78);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.modal-panel {
  max-width: 620px;
  width: 100%;
  max-height: 86vh;
  overflow: auto;
  position: relative;
  background: var(--void-1);
}
.modal-close { position: absolute; top: 14px; right: 14px; }
.modal-body { display: flex; gap: 22px; flex-wrap: wrap; align-items: flex-start; }
.modal-body > img {
  width: 190px;
  border: 3px solid var(--gold);
  filter: drop-shadow(5px 5px 0 rgba(10, 8, 30, 0.6));
}
.modal-info { flex: 1 1 260px; }
.modal-sec {
  margin-top: 12px;
  padding: 10px 14px;
  background: rgba(13, 11, 32, 0.6);
  border-left: 3px solid var(--pink);
}
.modal-sec strong { color: var(--gold-bright); font-family: var(--cute); font-weight: 400; }
.modal-enter-active { transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
.modal-leave-active { transition: all 0.18s ease; }
.modal-enter-from { opacity: 0; }
.modal-enter-from .modal-panel { transform: scale(0.85) translateY(20px); }
.modal-leave-to { opacity: 0; }
</style>
