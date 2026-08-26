<script setup lang="ts">
/** 解梦词典：搜索 + 分类浏览 + 挑三个元素组合解梦 + Miller 公版扩展词典（懒加载） */
import { computed, ref, watch } from 'vue'
import {
  DREAM_CATEGORY_CN,
  VIBE_CN,
  searchDreams,
  type DreamCategory,
  type DreamEntry,
} from '../data/dreams'
import { locale } from '../lib/i18n'
import { loadJSON, saveJSON } from '../lib/storage'
import { sparkleFromEvent } from '../lib/sparkle'
import { sfx } from '../lib/sfx'
import DecryptTitle from '../components/DecryptTitle.vue'

const zh = computed(() => locale.value === 'zh')

const keyword = ref('')
const category = ref<DreamCategory | 'all'>('all')

/* ---------- Miller 扩展词典（1901 公版，2250 词条，动态 import 懒加载） ---------- */
interface MillerEntry { term: string; meanings: string[] }
const miller = ref<MillerEntry[] | null>(null)
const millerLoading = ref(false)
let millerRequested = false

async function loadMiller(): Promise<void> {
  millerRequested = true
  millerLoading.value = true
  try {
    const mod = await import('../data/dreamsMiller')
    miller.value = mod.MILLER_DREAMS
  } finally {
    millerLoading.value = false
  }
}

watch(keyword, (kw) => {
  if (!millerRequested && kw.trim().length >= 2) void loadMiller()
})

const filtered = computed(() => {
  const list = searchDreams(keyword.value)
  if (category.value === 'all') return list
  return list.filter((d) => d.category === category.value)
})

const cats: Array<{ key: DreamCategory | 'all'; label: string }> = [
  { key: 'all', label: '全部' },
  ...Object.entries(DREAM_CATEGORY_CN).map(([key, label]) => ({ key: key as DreamCategory, label })),
]

function catLabel(key: DreamCategory | 'all'): string {
  return key === 'all' ? (zh.value ? '全部' : 'All') : zh.value ? DREAM_CATEGORY_CN[key] : key
}

/* ---------- 组合解梦 ---------- */
const picked = ref<DreamEntry[]>([])

function togglePick(d: DreamEntry, e?: MouseEvent): void {
  const at = picked.value.findIndex((p) => p.id === d.id)
  if (at >= 0) picked.value.splice(at, 1)
  else if (picked.value.length < 3) {
    picked.value.push(d)
    sfx.blip()
    if (e) sparkleFromEvent(e, 5)
  } else {
    // 超过三个，替换最早的
    picked.value.shift()
    picked.value.push(d)
    sfx.blip()
  }
}

function isPicked(id: string): boolean {
  return picked.value.some((p) => p.id === id)
}

const reading = computed(() => {
  if (picked.value.length === 0) return ''
  const counts = new Map<string, number>()
  for (const p of picked.value) counts.set(p.vibe, (counts.get(p.vibe) ?? 0) + 1)
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]![0]
  const lines = picked.value.map((p) => (zh.value ? `· ${p.zh}——${p.zhMeaning}` : `· ${p.en} — ${p.enMeaning}`))

  if (!zh.value) {
    const openers: Record<string, string> = {
      growth: 'This dream leans toward growth.',
      warning: 'This dream carries a nudge.',
      love: 'This dream smells like feelings.',
      wealth: 'This dream checks your pockets.',
      change: 'This dream sits at a doorway.',
      rest: 'This dream asks for a softer pace.',
    }
    return [openers[top]!, ...lines, 'One thread runs through all three: be a little kinder to yourself this week.'].join('\n')
  }

  const openers: Record<string, string> = {
    growth: '这个梦整体在往上走。',
    warning: '这个梦带着一点小提醒。',
    love: '这个梦有点心动的味道。',
    wealth: '这个梦在帮你盘账。',
    change: '这个梦站在一扇门口。',
    rest: '这个梦想让你慢一点。',
  }
  const closers: Record<string, string> = {
    growth: '三样东西指向同一句话：最近播的种子，记得浇水。',
    warning: '把梦里那个小刺拔了，这周会顺很多。',
    love: '想说的那句话，找个不赶时间的场合说。',
    wealth: '该对的对一遍，该省的省一点，心里就有底了。',
    change: '变化已经开始了，与其拽着旧的，不如给新的腾个位置。',
    rest: '允许自己歇一会儿，这不是偷懒，是保养。',
  }
  return [openers[top]!, ...lines, closers[top]!].join('\n')
})

/* ---------- 解梦手账（本机保存） ---------- */
interface JournalEntry {
  date: string
  items: string[]
  text: string
}
const JOURNAL_KEY = 'dream-journal'
const journal = ref<JournalEntry[]>(loadJSON<JournalEntry[]>(JOURNAL_KEY, []))
const showJournal = ref(false)

function saveReading(): void {
  if (!reading.value || picked.value.length === 0) return
  const entry: JournalEntry = {
    date: new Date().toLocaleString(locale.value === 'zh' ? 'zh-CN' : 'en-US', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
    items: picked.value.map((p) => (locale.value === 'zh' ? p.zh : p.en)),
    text: reading.value,
  }
  journal.value = [entry, ...journal.value].slice(0, 50)
  saveJSON(JOURNAL_KEY, journal.value)
  sfx.ding()
}

function removeJournal(i: number): void {
  journal.value.splice(i, 1)
  saveJSON(JOURNAL_KEY, journal.value)
}
</script>

<template>
  <div class="page-root">
    <h2><DecryptTitle :text="zh ? '解梦词典' : 'Dream Dictionary'" /></h2>
    <p class="hint">
      {{ zh
        ? '昨晚的梦有点怪？搜搜看。也可以挑最多三个元素，拼一个属于你的解读。'
        : 'Last night was weird? Search it — or pick up to three elements for your own blend.' }}
    </p>

    <!-- 搜索与筛选 -->
    <section class="panel" style="margin-top: 18px;">
      <input
        v-model="keyword"
        class="dream-search"
        type="text"
        :placeholder="zh ? '输入梦境元素，比如：蛇、飞、掉牙…' : 'Search an element: snake, flying, teeth…'"
      />
      <div class="cat-row">
        <button
          v-for="c in cats"
          :key="c.key"
          class="cat-chip"
          :class="{ active: category === c.key }"
          @click="category = c.key; sfx.blip()"
        >{{ catLabel(c.key) }}</button>
      </div>
    </section>

    <!-- 组合解梦台 -->
    <section class="panel dream-mixer stagger-in">
      <div class="mixer-head">
        <h3 style="margin: 0;">{{ zh ? '🧪 组合解梦' : '🧪 Dream Blender' }}<span class="tag">{{ picked.length }}/3</span></h3>
        <div style="display: flex; gap: 8px;">
          <button v-if="reading" class="btn ghost small" @click="saveReading">{{ zh ? '📒 存入手账' : '📒 Save' }}</button>
          <button v-if="picked.length" class="btn ghost small" @click="picked = []">{{ zh ? '清空' : 'Clear' }}</button>
        </div>
      </div>
      <TransitionGroup name="pick" tag="div" class="picked-row">
        <span v-for="p in picked" :key="p.id" class="picked-chip" @click="togglePick(p)">
          {{ zh ? p.zh : p.en }} ✕
        </span>
        <span v-if="picked.length === 0" class="hint" style="margin: 0;">
          {{ zh ? '点下面任意词条加进来' : 'Tap any entry below to add it here' }}
        </span>
      </TransitionGroup>
      <Transition name="pop">
        <pre v-if="reading" class="reading mixer-reading">{{ reading }}</pre>
      </Transition>
    </section>

    <!-- 解梦手账 -->
    <section v-if="journal.length" class="panel stagger-in journal-panel">
      <button class="btn ghost small journal-toggle" @click="showJournal = !showJournal; sfx.blip()">
        📒 {{ zh ? `解梦手账（${journal.length}）` : `Dream journal (${journal.length})` }} {{ showJournal ? '▲' : '▼' }}
      </button>
      <TransitionGroup v-if="showJournal" name="pick" tag="div" class="journal-list">
        <article v-for="(j, i) in journal" :key="j.date + i" class="journal-item">
          <header>
            <small>{{ j.date }} · {{ j.items.join(' × ') }}</small>
            <button class="jr-del" @click="removeJournal(i)">✕</button>
          </header>
          <pre class="reading">{{ j.text }}</pre>
        </article>
      </TransitionGroup>
    </section>

    <!-- 词条网格 -->
    <div class="dream-grid">
      <article
        v-for="(d, i) in filtered"
        :key="d.id"
        class="panel dream-card drop-in"
        :class="{ picked: isPicked(d.id) }"
        :style="{ animationDelay: `${Math.min(i * 40, 400)}ms` }"
        @click="togglePick(d)"
      >
        <header class="dc-head">
          <strong>{{ zh ? d.zh : d.en }}</strong>
          <span class="dc-cat">{{ catLabel(d.category) }}</span>
        </header>
        <small class="dc-vibe">{{ zh ? '信号' : 'Signal' }}：{{ zh ? VIBE_CN[d.vibe] : d.vibe }}</small>
        <p>{{ zh ? d.zhMeaning : d.enMeaning }}</p>
      </article>
    </div>
    <p v-if="filtered.length === 0" class="hint" style="text-align: center; margin-top: 30px;">
      {{ zh ? '词典里还没收这个梦——不过没被记录的梦，多半也不算凶。' : 'Not in the book yet — but unrecorded dreams are rarely bad omens.' }}
    </p>
  </div>
</template>

<style scoped>
.dream-search {
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  border: 2px solid rgba(179, 166, 247, 0.4);
  background: rgba(13, 11, 32, 0.75);
  color: var(--ink);
  font-size: 1rem;
}
.dream-search:focus { outline: none; border-color: var(--gold); }
.cat-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
.cat-chip {
  font-size: 0.85rem;
  padding: 5px 14px;
  border-radius: 999px;
  border: 1.5px solid rgba(179, 166, 247, 0.35);
  background: transparent;
  color: var(--ink-dim);
  cursor: pointer;
  transition: all 0.2s;
}
.cat-chip:hover { color: var(--gold-bright); border-color: var(--gold); }
.cat-chip.active { background: rgba(245, 200, 110, 0.15); border-color: var(--gold); color: var(--gold-bright); }

.dream-mixer { margin-top: 16px; }
.mixer-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.picked-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; align-items: center; min-height: 34px; }
.picked-chip {
  font-family: var(--cute);
  padding: 5px 14px;
  border-radius: 999px;
  background: rgba(255, 159, 206, 0.16);
  border: 1.5px solid var(--pink);
  color: var(--pink);
  cursor: pointer;
  animation: chip-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes chip-pop { from { transform: scale(0.6); opacity: 0; } }
.pick-leave-active { transition: all 0.18s ease; }
.pick-leave-to { opacity: 0; transform: scale(0.7); }
.mixger-reading, .mixer-reading {
  margin: 14px 0 0;
  white-space: pre-wrap;
  font-family: inherit;
  line-height: 1.95;
  padding: 14px 16px;
  background: rgba(13, 11, 32, 0.6);
  border-left: 3px solid var(--mint);
  border-radius: 8px;
}

.dream-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 14px;
  margin-top: 16px;
}
.dream-card { margin: 0; cursor: pointer; transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.2s; }
.dream-card:hover { transform: translateY(-4px); border-color: var(--gold); }
.dream-card.picked { border-color: var(--pink); box-shadow: 0 0 16px rgba(255, 159, 206, 0.25); }
.dc-head { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
.dc-head strong { color: var(--gold-bright); font-family: var(--cute); font-weight: 400; font-size: 1.05rem; }
.dc-cat { font-family: var(--pixel); font-size: 0.55rem; letter-spacing: 0.12em; color: var(--lavender-soft); opacity: 0.8; }
.dc-vibe { display: block; color: var(--ink-dim); font-size: 0.75rem; margin: 4px 0 8px; }
.dream-card p { margin: 0; font-size: 0.88rem; line-height: 1.85; color: var(--ink); }

.pop-enter-active { transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
.pop-enter-from { opacity: 0; transform: translateY(10px) scale(0.96); }
.pop-leave-active { transition: all 0.15s ease; }
.pop-leave-to { opacity: 0; }

.journal-panel { margin-top: 16px; }
.journal-toggle { border: none; }
.journal-list { display: flex; flex-direction: column; gap: 12px; margin-top: 12px; }
.journal-item {
  padding: 12px 14px;
  background: rgba(13, 11, 32, 0.6);
  border-left: 3px solid var(--pink);
  border-radius: 8px;
}
.journal-item header { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 6px; }
.journal-item small { color: var(--ink-dim); font-family: var(--pixel); font-size: 0.55rem; letter-spacing: 0.1em; }
.jr-del {
  border: none;
  background: transparent;
  color: var(--ink-dim);
  cursor: pointer;
  transition: color 0.2s, transform 0.2s;
}
.jr-del:hover { color: var(--danger); transform: scale(1.2); }
.journal-item pre {
  margin: 0;
  white-space: pre-wrap;
  font-family: inherit;
  line-height: 1.9;
  font-size: 0.86rem;
}
</style>
