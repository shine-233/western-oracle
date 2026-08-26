<script setup lang="ts">
import { computed, ref } from 'vue'
import { TYPE_META, clearHistory, getHistory, removeHistory, type HistoryEntry, type HistoryType } from '../lib/history'
import { generateShareCard } from '../lib/share'
import { locale } from '../lib/i18n'
import { sfx } from '../lib/sfx'
import { useEscClose } from '../lib/useEsc'
import { t } from '../lib/i18n'
import DecryptTitle from '../components/DecryptTitle.vue'

const zh = computed(() => locale.value === 'zh')

const entries = ref<HistoryEntry[]>(getHistory())
const filter = ref<'all' | HistoryType>('all')
const expanded = ref<string | null>(null)
const keyword = ref('')

const filtered = computed(() => {
  let list = filter.value === 'all' ? entries.value : entries.value.filter((e) => e.type === filter.value)
  const kw = keyword.value.trim().toLowerCase()
  if (kw) {
    list = list.filter((e) =>
      e.label.toLowerCase().includes(kw) ||
      e.summary.toLowerCase().includes(kw) ||
      (e.question ?? '').toLowerCase().includes(kw) ||
      (e.detail ?? '').toLowerCase().includes(kw),
    )
  }
  return list
})

const counts = computed(() => {
  const map: Record<string, number> = { all: entries.value.length }
  for (const e of entries.value) map[e.type] = (map[e.type] ?? 0) + 1
  return map
})

/* ---------- 占卜统计仪表盘 ---------- */
function dayKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

/** 最近 14 天每日次数（旧→新） */
const dailyBars = computed(() => {
  const buckets = new Map<string, number>()
  for (const e of entries.value) {
    const k = dayKey(e.createdAt)
    buckets.set(k, (buckets.get(k) ?? 0) + 1)
  }
  const out: Array<{ label: string; count: number }> = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    out.push({ label: `${d.getMonth() + 1}/${d.getDate()}`, count: buckets.get(k) ?? 0 })
  }
  return out
})
const maxDaily = computed(() => Math.max(1, ...dailyBars.value.map((b) => b.count)))

/** 连续占卜天数（截至今天或昨天都算连续中） */
const streakDays = computed(() => {
  if (entries.value.length === 0) return 0
  const days = new Set(entries.value.map((e) => dayKey(e.createdAt)))
  let streak = 0
  const cursor = new Date()
  // 今天还没占过就从昨天起算
  if (!days.has(dayKey(cursor.getTime()))) cursor.setDate(cursor.getDate() - 1)
  for (;;) {
    if (days.has(dayKey(cursor.getTime()))) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    } else break
  }
  return streak
})

const weekCount = computed(() => {
  const weekAgo = Date.now() - 7 * 86400000
  return entries.value.filter((e) => e.createdAt >= weekAgo).length
})

/** 最常去的模块 */
const topModule = computed(() => {
  let best: { type: HistoryType; n: number } | null = null
  for (const e of entries.value) {
    const n = (counts.value[e.type] ?? 0) + 1 - 1
    const cur = best?.n ?? -1
    if (n > cur) best = { type: e.type, n }
  }
  return best
})

/** 模块分布（降序，用于条形图） */
const typeDist = computed(() => {
  const rows = (Object.keys(TYPE_META) as HistoryType[])
    .map((k) => ({ key: k, n: counts.value[k] ?? 0 }))
    .filter((r) => r.n > 0)
    .sort((a, b) => b.n - a.n)
  const max = Math.max(1, ...rows.map((r) => r.n))
  return rows.map((r) => ({ ...r, pct: Math.round((r.n / max) * 100) }))
})

const hasStats = computed(() => entries.value.length > 0)

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

    <!-- 占卜统计仪表盘 -->
    <section v-if="hasStats" class="panel stats-panel stagger-in" style="margin-top: 18px;">
      <div class="stat-cards">
        <div class="sc-card">
          <small>{{ zh ? '总记录' : 'Total readings' }}</small>
          <strong>{{ entries.length }}</strong>
        </div>
        <div class="sc-card fire">
          <small>{{ zh ? '连续天数' : 'Day streak' }}</small>
          <strong>🔥 {{ streakDays }}</strong>
        </div>
        <div class="sc-card mint">
          <small>{{ zh ? '本周' : 'This week' }}</small>
          <strong>{{ weekCount }}</strong>
        </div>
        <div v-if="topModule" class="sc-card lav">
          <small>{{ zh ? '最常去' : 'Favourite' }}</small>
          <strong>{{ TYPE_META[topModule.type].glyph }} {{ t(`type.${topModule.type}`) }}</strong>
        </div>
      </div>

      <!-- 14 天活动 -->
      <div class="dash-block">
        <p class="dash-title">{{ zh ? '近十四天 · 占卜热度' : 'Last 14 days · activity' }}</p>
        <div class="spark-row">
          <div
            v-for="(b, i) in dailyBars"
            :key="b.label"
            class="spark-col"
            :title="`${b.label} — ${b.count}`"
          >
            <i
              class="spark-bar"
              :class="{ zero: b.count === 0, today: i === dailyBars.length - 1 }"
              :style="{ height: b.count === 0 ? '3px' : Math.max(12, (b.count / maxDaily) * 100) + '%', animationDelay: i * 45 + 'ms' }"
            />
            <small>{{ b.label.split('/')[1] }}</small>
          </div>
        </div>
      </div>

      <!-- 模块分布 -->
      <div v-if="typeDist.length > 1" class="dash-block">
        <p class="dash-title">{{ zh ? '你在哪些屋子待得最久' : 'Where you linger most' }}</p>
        <div class="dist-rows">
          <div v-for="(r, i) in typeDist" :key="r.key" class="dist-row">
            <span class="dist-glyph">{{ TYPE_META[r.key].glyph }}</span>
            <span class="dist-name">{{ t(`type.${r.key}`) }}</span>
            <span class="dist-track">
              <i class="dist-fill" :style="{ width: r.pct + '%', background: TYPE_META[r.key].color, animationDelay: i * 70 + 'ms' }" />
            </span>
            <b class="dist-n">{{ r.n }}</b>
          </div>
        </div>
      </div>
    </section>

    <!-- 搜索 + 过滤 -->
    <div class="filter-row stagger-in">
      <input
        v-model="keyword"
        type="text"
        class="kw-input"
        :placeholder="zh ? '🔍 搜问题、结果、任何字……' : '🔍 Search questions, results…'"
      >
      <button
        v-for="f in FILTERS"
        :key="f.key"
        class="filter-chip"
        :class="{ active: filter === f.key }"
        @click="setFilter(f.key)"
      >{{ f.glyph }} {{ t(f.keyName) }}<span class="cnt">{{ counts[f.key] ?? 0 }}</span></button>
    </div>

    <TransitionGroup v-reveal name="hist" tag="section" class="hist-list">
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
      {{ entries.length === 0
        ? (zh ? '还没有任何记录。去问点什么吧，星星在等你的第一个问题。✧' : 'No records yet. Go ask something — the stars are waiting for your first question. ✧')
        : (zh ? '这个组合下没有匹配的记录，换个关键词试试。' : 'Nothing matches here — try another keyword.') }}
    </p>

    <div v-if="entries.length > 0" style="margin-top: 22px;">
      <button v-magnetic class="btn ghost small danger" @click="onClear">{{ t('his.clear') }}</button>
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
              <a v-magnetic class="btn small" :href="sharePreview" download="western-oracle.png">⬇ PNG</a>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* ---------- 统计仪表盘 ---------- */
.stats-panel { border-color: color-mix(in srgb, var(--gold) 30%, transparent); }
.stat-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; }
.sc-card {
  padding: 13px 15px;
  border-radius: 12px;
  background: rgba(21, 18, 50, 0.6);
  border: 1.5px solid color-mix(in srgb, var(--lavender) 28%, transparent);
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.2s;
}
.sc-card:hover { transform: translateY(-3px); border-color: var(--lavender-soft); }
.sc-card.fire { border-color: color-mix(in srgb, var(--pink) 45%, transparent); }
.sc-card.mint { border-color: color-mix(in srgb, var(--mint) 45%, transparent); }
.sc-card.lav strong { font-size: 1rem; }
.sc-card small { display: block; font-family: var(--pixel); font-size: 0.52rem; letter-spacing: 0.12em; color: var(--ink-dim); margin-bottom: 6px; }
.sc-card strong { font-family: var(--cute); font-weight: 400; font-size: 1.7rem; color: var(--gold-bright); line-height: 1.1; }

.dash-block { margin-top: 20px; }
.dash-title { margin: 0 0 10px; font-family: var(--pixel); font-size: 0.58rem; letter-spacing: 0.14em; color: var(--lavender-soft); }

.spark-row { display: flex; align-items: flex-end; gap: 5px; height: 84px; }
.spark-col { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; gap: 4px; }
.spark-bar {
  width: 100%;
  max-width: 26px;
  border-radius: 4px 4px 2px 2px;
  background: linear-gradient(180deg, var(--gold), var(--pink));
  box-shadow: 0 0 8px color-mix(in srgb, var(--gold) 40%, transparent);
  animation: bar-grow 0.7s cubic-bezier(0.22, 1, 0.36, 1) backwards;
  transform-origin: bottom;
}
.spark-bar.zero { background: rgba(179, 166, 247, 0.16); box-shadow: none; }
.spark-bar.today { outline: 1.5px dashed var(--mint); outline-offset: 2px; }
.spark-col small { font-family: var(--pixel); font-size: 0.46rem; color: var(--ink-dim); white-space: nowrap; }
@keyframes bar-grow { from { transform: scaleY(0); opacity: 0; } }

.dist-rows { display: flex; flex-direction: column; gap: 8px; }
.dist-row { display: grid; grid-template-columns: auto minmax(72px, 130px) 1fr auto; align-items: center; gap: 10px; }
.dist-glyph { width: 20px; text-align: center; }
.dist-name { font-size: 0.85rem; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dist-track { height: 9px; border-radius: 5px; background: rgba(13, 11, 32, 0.7); overflow: hidden; }
.dist-fill { display: block; height: 100%; border-radius: 5px; opacity: 0.85; animation: dist-grow 0.8s cubic-bezier(0.22, 1, 0.36, 1) backwards; }
@keyframes dist-grow { from { width: 0 !important; } }
.dist-n { font-family: var(--pixel); font-size: 0.62rem; color: var(--gold-bright); min-width: 2ch; text-align: right; }

@media (prefers-reduced-motion: reduce) {
  .spark-bar, .dist-fill { animation: none; }
}

/* ---------- 搜索与列表 ---------- */
.kw-input {
  flex: 1 1 200px;
  max-width: 320px;
  padding: 7px 13px;
  border-radius: 999px;
  border: 1.5px solid rgba(179, 166, 247, 0.35);
  background: rgba(13, 11, 32, 0.6);
  color: var(--ink);
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.kw-input:focus { outline: none; border-color: var(--pink-soft); box-shadow: 0 0 0 3px rgba(255, 159, 206, 0.12); }

.filter-row { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0 20px; align-items: center; }
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
.empty-hint { text-align: center; margin-top: 40px; line-height: 2.2; }

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
  .spark-col:nth-child(odd) small { visibility: hidden; }
}
</style>
