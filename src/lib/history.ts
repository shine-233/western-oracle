/** 占卜历史：localStorage 持久化，上限 200 条（新的在前） */
import { loadJSON, removeKey, saveJSON } from './storage'
import { recordDivination } from './streak'

export type HistoryType =
  | 'tarot'
  | 'rune'
  | 'numerology'
  | 'astrology'
  | 'synastry'
  | 'transit'
  | 'dream'
  | 'pendulum'
  | 'meihua'
  | 'palmistry'
  | 'crystal'
  | 'arcade'

export interface HistoryEntry {
  id: string
  type: HistoryType
  /** 展示名，如「塔罗 · 三张牌阵」 */
  label: string
  question?: string
  /** 结果摘要（分享图正文也用它） */
  summary: string
  /** 完整解读文本（可折叠查看） */
  detail?: string
  createdAt: number
}

const KEY = 'divination-history'
const MAX = 200

export function getHistory(): HistoryEntry[] {
  return loadJSON<HistoryEntry[]>(KEY, []).filter((e) => e && e.id && e.createdAt)
}

export function addHistory(entry: Omit<HistoryEntry, 'id' | 'createdAt'>): void {
  recordDivination()
  window.dispatchEvent(
    new CustomEvent('wo-divination', { detail: { type: entry.type, label: entry.label, summary: entry.summary } }),
  )
  const list = getHistory()
  list.unshift({
    ...entry,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
  })
  saveJSON(KEY, list.slice(0, MAX))
}

export function removeHistory(id: string): void {
  saveJSON(KEY, getHistory().filter((e) => e.id !== id))
}

export function clearHistory(): void {
  removeKey(KEY)
}

export const TYPE_META: Record<HistoryType, { cn: string; glyph: string; color: string }> = {
  tarot: { cn: '塔罗', glyph: '✦', color: '#f5c86e' },
  astrology: { cn: '占星', glyph: '☉', color: '#ffb37a' },
  synastry: { cn: '合盘', glyph: '☍', color: '#ff9fce' },
  transit: { cn: '行运', glyph: '⟳', color: '#7de8c3' },
  numerology: { cn: '灵数', glyph: '∴', color: '#b3a6f7' },
  rune: { cn: '符文', glyph: 'ᛟ', color: '#a9c4e8' },
  dream: { cn: '解梦', glyph: '☾', color: '#ff9fce' },
  pendulum: { cn: '灵摆', glyph: '☯', color: '#b3a6f7' },
  meihua: { cn: '梅花', glyph: '☯', color: '#e05d5d' },
  palmistry: { cn: '手相', glyph: '☽', color: '#ffd76e' },
  crystal: { cn: '水晶', glyph: '✧', color: '#7de8c3' },
  arcade: { cn: '神签', glyph: '🎲', color: '#ffe3a8' },
}
