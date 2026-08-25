<script setup lang="ts">
import { computed, ref } from 'vue'
import { TYPE_META, clearHistory, getHistory, removeHistory, type HistoryEntry, type HistoryType } from '../lib/history'
import { generateShareCard } from '../lib/share'
import { sfx } from '../lib/sfx'
import { useEscClose } from '../lib/useEsc'
import { t } from '../lib/i18n'
import DecryptTitle from '../components/DecryptTitle.vue'

const entries = ref<HistoryEntry[]>(getHistory())
const filter = ref<'all' | HistoryType>('all')
const expanded = ref<string | null>(null)

const filtered = computed(() =>
  filter.value === 'all' ? entries.value : entries.value.filter((e) => e.type === filter.value),
)

const counts = computed(() => {
  const map: Record<string, number> = { all: entries.value.length }
  for (const e of entries.value) map[e.type] = (map[e.type] ?? 0) + 1
  return map
})

function fmtDate(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function fmtTime(ts: number): string {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function toggle(id: string): void {
  expanded.value = expanded.value === id ? null : id
  sfx.toggle()
}

function onDelete(e: Event, id: string): void {
  e.stopPropagation()
  removeHistory(id)
  entries.value = getHistory()
  sfx.pop()
}

function onClear(): void {
  if (!window.confirm(t('his.confirm'))) return
  clearHistory()
  entries.value = []
  sfx.whoosh()
}

function onShare(entry: HistoryEntry): void {
  const canvas = generateShareCard({
    title: entry.label,
    subtitle: `${fmtDate(entry.createdAt)} ${fmtTime(entry.createdAt)}${entry.question ? ` · 「${entry.question}」` : ''}`,
    lines: entry.summary.split('\n').filter(Boolean),
    footer: 'WESTERN ORACLE',
  })
  sharePreview.value = canvas.toDataURL('image/png')
  sfx.ding()
}

const sharePreview = ref<string | null>(null)

useEscClose(() => {
  sharePreview.value = null
})

type FilterKey = 'all' | HistoryType
const FILTERS: Array<{ key: FilterKey; keyName: string; glyph: string }> = [
  { key: 'all', keyName: 'his.all', glyph: '✷' },
  ...(Object.keys(TYPE_META) as HistoryType[]).map((k) => ({
    key: k,
    keyName: `type.${k}`,
    glyph: TYPE_META[k].glyph,
  })),
]

function setFilter(k: FilterKey): void {
  filter.value = k
  sfx.blip()
}
</script>

<template>
  <div class="page-root">
    <h2><DecryptTitle :text="t('his.title')" /></h2>
    <p class="hint">{{ t('his.hint') }}</p>

    <div class="filter-row stagger-in">
      <button
        v-for="f in FILTERS"
        :key="f.key"
        class="filter-chip"
        :class="{ active: filter === f.key }"
        @click="setFilter(f.key)"
      >{{ f.glyph }} {{ t(f.keyName) }}<span class="cnt">{{ counts[f.key] ?? 0 }}</span></button>
    </div>

    <TransitionGroup name="hist" tag="section" class="hist-list">
      <article v-for="e in filtered" :key="e.id" class="panel hist-item" @click="toggle(e.id)">
        <header class="hist-head">
          <span class="type-badge" :style="{ color: TYPE_META[e.type].color, borderColor: TYPE_META[e.type].color }">
            {{ TYPE_META[e.type].glyph }} {{ t(`type.${e.type}`) }}
          </span>
          <strong class="hist-label">{{ e.label }}</strong>
          <span v-if="e.question" class="hist-q">「{{ e.question }}」</span>
          <span class="hist-time">{{ fmtDate(e.createdAt) }} {{ fmtTime(e.createdAt) }}</span>
          <span class="hist-chev">{{ expanded === e.id ? '▾' : '▸' }}</span>
        </header>

        <p class="hist-summary">{{ e.summary.split('\n')[0] }}</p>

        <div v-if="expanded === e.id" class="hist-detail bounce-in">
          <pre class="reading">{{ e.detail || e.summary }}</pre>
          <div class="hist-actions">
            <button class="btn small" @click.stop="onShare(e)">{{ t('his.share') }}</button>
            <button class="btn ghost small danger" @click.stop="onDelete($event, e.id)">{{ t('his.delete') }}</button>
          </div>
        </div>
      </article>
    </TransitionGroup>

    <p v-if="filtered.length === 0" class="hint empty-hint">
      {{ t('his.empty') }}
    </p>

    <div v-if="entries.length > 0" style="margin-top: 22px;">
      <button class="btn ghost small danger" @click="onClear">{{ t('his.clear') }}</button>
    </div>

    <!-- 分享图预览 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="sharePreview" class="modal-backdrop" @click.self="sharePreview = null">
          <div class="panel preview-panel bounce-in">
            <button class="modal-close btn small ghost" @click="sharePreview = null">{{ t('c.close') }}</button>
            <h3 style="margin: 0 0 14px;">✦ {{ t('his.share') }}</h3>
            <img :src="sharePreview" alt="share card" class="preview-img" />
            <div style="display: flex; gap: 10px; justify-content: center; margin-top: 16px;">
              <a class="btn small" :href="sharePreview" download="western-oracle.png">⬇ PNG</a>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.filter-row { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0 20px; }
.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
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
.filter-chip.active { background: rgba(124, 107, 214, 0.25); transform: translateY(-2px); }
.filter-chip .cnt {
  font-family: var(--pixel);
  font-size: 0.55rem;
  opacity: 0.75;
}

.hist-list { display: flex; flex-direction: column; gap: 12px; }
.hist-item { cursor: pointer; transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.2s; }
.hist-item:hover { transform: translateX(5px); }
.hist-head { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.type-badge {
  font-size: 0.78rem;
  border: 1.5px solid;
  border-radius: 999px;
  padding: 2px 10px;
  white-space: nowrap;
}
.hist-label { color: var(--gold-bright); font-weight: 400; }
.hist-q { color: var(--pink-soft); font-size: 0.85rem; }
.hist-time { margin-left: auto; color: var(--ink-dim); font-size: 0.8rem; white-space: nowrap; }
.hist-chev { color: var(--ink-dim); font-size: 0.8rem; }
.hist-summary {
  margin: 10px 0 0;
  color: var(--ink);
  line-height: 1.8;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.hist-detail { margin-top: 14px; border-top: 1px dashed rgba(179, 166, 247, 0.3); padding-top: 14px; }
.hist-actions { display: flex; gap: 10px; margin-top: 12px; }
.btn.danger { border-color: rgba(255, 138, 138, 0.6); color: #ff8a8a; }
.empty-hint { text-align: center; margin-top: 40px; }

.hist-enter-active, .hist-leave-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.hist-enter-from { opacity: 0; transform: translateY(14px) scale(0.98); }
.hist-leave-to { opacity: 0; transform: scale(0.96); }
.hist-move { transition: transform 0.3s ease; }

.preview-panel {
  max-width: 420px;
  width: 100%;
  position: relative;
  background: var(--void-1);
}
.preview-img {
  width: 100%;
  border-radius: 10px;
  border: 2px solid var(--gold);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  display: block;
}
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
.modal-close { position: absolute; top: 14px; right: 14px; }
.modal-enter-active { transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
.modal-leave-active { transition: all 0.18s ease; }
.modal-enter-from { opacity: 0; }
.modal-enter-from .preview-panel { transform: scale(0.85) translateY(20px); }
.modal-leave-to { opacity: 0; }

@media (max-width: 640px) {
  .hist-time { margin-left: 0; width: 100%; order: 9; }
}
</style>
