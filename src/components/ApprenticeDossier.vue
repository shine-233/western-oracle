<script setup lang="ts">
/**
 * 学徒图鉴：六位小小学徒的人物档案——性格、来历、口头禅、关系网、
 * 以及对占卜结果的情绪反应。点击头像切换角色。
 */
import { computed, ref } from 'vue'
import { APPRENTICES, type MoodKey } from '../data/apprenticeProfiles'
import { MASCOTS, mascotVoxels } from '../data/mascots'
import { locale } from '../lib/i18n'
import { sfx } from '../lib/sfx'
import { sparkleFromEvent } from '../lib/sparkle'
import { getPoints, levelOf, pointsToNext, LEVEL_TITLES_ZH, LEVEL_TITLES_EN, SECRET_LINES } from '../lib/affection'

/** 当前学徒的羁绊状态 */
const bond = computed(() => {
  const pts = getPoints(who.value.id)
  const lv = levelOf(pts)
  const next = pointsToNext(who.value.id)
  const zh = locale.value === 'zh'
  return {
    pts,
    lv,
    title: zh ? LEVEL_TITLES_ZH[lv - 1]! : LEVEL_TITLES_EN[lv - 1]!,
    next,
    pct: next === null ? 100 : Math.min(100, Math.round((pts / (pts + next)) * 100)),
    secret: SECRET_LINES[who.value.id],
    unlocked: lv >= 3,
  }
})

/** 当前角色的像素预览块（与体素模型同一份精灵数据） */
const spritePixels = computed(() => {
  const def = MASCOTS[who.value.id]
  if (!def) return []
  return mascotVoxels(def)
})
const spriteW = computed(() => {
  const def = MASCOTS[who.value.id]
  return def ? Math.max(...def.sprite.map((r) => r.length)) : 20
})
const spriteH = computed(() => {
  const def = MASCOTS[who.value.id]
  return def ? def.sprite.length : 22
})

const activeId = ref(APPRENTICES[0]!.id)
const moodFilter = ref<MoodKey | null>(null)

const MOODS: Array<{ key: MoodKey; glyph: string; zh: string; en: string }> = [
  { key: 'great', glyph: '🌟', zh: '大吉', en: 'Great' },
  { key: 'good', glyph: '🌤️', zh: '平稳', en: 'Good' },
  { key: 'meh', glyph: '🌫️', zh: '平平', en: 'Meh' },
  { key: 'oops', glyph: '🌧️', zh: '翻车', en: 'Oops' },
]

const who = computed(() => APPRENTICES.find((a) => a.id === activeId.value) ?? APPRENTICES[0]!)
const zh = computed(() => locale.value === 'zh')

function pick(id: string, e?: MouseEvent): void {
  if (activeId.value === id) return
  activeId.value = id
  moodFilter.value = null
  sfx.blip()
  if (e) sparkleFromEvent(e, 6)
}

function toggleMood(k: MoodKey): void {
  moodFilter.value = moodFilter.value === k ? null : k
  sfx.toggle()
}
</script>

<template>
  <section class="panel" style="margin-top: 20px; max-width: 760px;">
    <h3 style="margin: 0 0 4px;">🧙‍♀️ {{ zh ? '学徒图鉴 · 小屋关系网' : 'Apprentice Dossier' }}</h3>
    <p class="hint" style="margin: 0 0 14px;">
      {{ zh
        ? '露娜的六位小小学徒：点头像看他们的来历、口头禅，以及看到你的占卜结果时会说什么。'
        : 'Luna\'s six little apprentices — their stories, catchphrases, and what they say when they see your reading.' }}
    </p>

    <!-- 头像选择器 -->
    <div class="ap-tabs">
      <button
        v-for="a in APPRENTICES"
        :key="a.id"
        class="ap-tab"
        :class="{ on: a.id === activeId }"
        :style="{ '--ac': a.color }"
        @click="pick(a.id, $event)"
      >
        <span class="ap-glyph">{{ a.glyph }}</span>
        <span>{{ zh ? a.nameZh : a.nameEn }}</span>
      </button>
    </div>

        <!-- 档案卡 -->
        <Transition name="ap-swap" mode="out-in">
          <article :key="who.id" class="ap-card">
            <header class="ap-head">
              <svg
                class="ap-sprite"
                :viewBox="`0 0 ${spriteW} ${spriteH}`"
                role="img"
                :aria-label="zh ? who.nameZh : who.nameEn"
              >
                <rect
                  v-for="(p, i) in spritePixels"
                  :key="i"
                  :x="p.x + 0.02"
                  :y="p.y + 0.02"
                  width="0.96"
                  height="0.96"
                  :fill="p.color"
                />
              </svg>
              <div>
                <strong class="ap-name">{{ zh ? who.nameZh : who.nameEn }}</strong>
                <small>{{ zh ? who.roleZh : who.roleEn }}</small>
                <span class="ap-glyph-note">{{ who.glyph }} · {{ zh ? '露娜同门' : 'Luna\'s coven' }}</span>
              </div>
            </header>

        <p class="ap-trait">✧ {{ zh ? who.traitZh : who.traitEn }}</p>

        <!-- 羁绊等级 -->
        <div class="ap-bond">
          <span class="bond-badge">Lv{{ bond.lv }} · {{ bond.title }}</span>
          <span class="bond-track"><i :style="{ width: bond.pct + '%' }" /></span>
          <small>{{ bond.next === null ? 'MAX' : `${bond.pts}/${bond.pts + bond.next}` }}</small>
        </div>

        <p class="ap-story">{{ zh ? who.storyZh : who.storyEn }}</p>
        <p class="ap-catch">「{{ zh ? who.catchZh : who.catchEn }}」</p>

        <!-- 关系网 -->
        <div class="ap-sec-title">{{ zh ? '🔗 关系网' : '🔗 Bonds' }}</div>
        <ul class="ap-bonds">
          <li v-for="(b, i) in who.bonds" :key="i">
            <strong>{{ b.who }}</strong>——{{ zh ? b.zh : b.en }}
          </li>
        </ul>

        <!-- 对占卜结果的情绪 -->
        <div class="ap-sec-title">{{ zh ? '🎭 看到占卜结果时……（点分类切换）' : '🎭 When they see your result… (tap to switch)' }}</div>
        <div class="ap-moods">
          <button
            v-for="m in MOODS"
            :key="m.key"
            class="ap-mood-tab"
            :class="{ on: moodFilter === m.key || (!moodFilter && m.key === 'great') }"
            @click="toggleMood(m.key)"
          >
            {{ m.glyph }} {{ zh ? m.zh : m.en }}
          </button>
        </div>
        <Transition name="ap-swap" mode="out-in">
          <p :key="moodFilter ?? 'great'" class="ap-mood-line">
            {{ who.moods[moodFilter ?? 'great'][zh ? 'zh' : 'en'] }}
          </p>
        </Transition>

        <!-- 秘密台词：Lv3 解锁 -->
        <div class="ap-sec-title">{{ zh ? '🔒 羁绊秘密' : '🔒 Bond Secret' }}</div>
        <p v-if="bond.unlocked" class="ap-secret">🤫 「{{ zh ? bond.secret!.zh : bond.secret!.en }}」</p>
        <p v-else class="hint" style="margin: 0;">{{ zh ? '继续抚摸这位学徒，到 Lv3「心意相通」时会告诉你一个秘密……' : 'Keep petting this apprentice — at Lv3 Kindred they\'ll let a secret slip…' }}</p>
      </article>
    </Transition>
  </section>
</template>

<style scoped>
.ap-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.ap-tab {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 14px;
  border-radius: 999px;
  background: rgba(30, 26, 69, 0.55);
  border: 2px solid rgba(179, 166, 247, 0.3);
  color: var(--ink);
  cursor: pointer;
  font-size: 0.88rem;
  transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.ap-tab:hover { transform: translateY(-2px); border-color: var(--ac); }
.ap-tab.on { border-color: var(--ac); background: rgba(124, 107, 214, 0.22); color: var(--gold-bright); }
.ap-glyph { font-size: 1.05rem; }

.ap-head { display: flex; align-items: center; gap: 16px; margin-bottom: 10px; }
.ap-sprite {
  width: 74px;
  flex-shrink: 0;
  image-rendering: pixelated;
  filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.4));
}
.ap-glyph-note {
  display: inline-block;
  margin-top: 4px;
  font-family: var(--pixel);
  font-size: 0.5rem;
  letter-spacing: 0.12em;
  color: var(--ac, var(--lavender-soft));
}
.ap-name {
  display: block;
  font-family: var(--cute);
  font-weight: 400;
  color: var(--gold-bright);
  font-size: 1.25rem;
}
.ap-head small { color: var(--ink-dim); }
.ap-trait { color: var(--lavender-soft); margin: 0 0 8px; }
.ap-bond {
  display: flex; align-items: center; gap: 10px;
  margin: 0 0 10px; flex-wrap: wrap;
}
.bond-badge {
  font-family: var(--pixel);
  font-size: 0.5rem;
  letter-spacing: 0.08em;
  color: var(--gold-bright);
  border: 1.5px solid var(--gold);
  border-radius: 999px;
  padding: 4px 10px;
  white-space: nowrap;
}
.bond-track {
  flex: 1; min-width: 90px; height: 8px;
  background: rgba(13, 11, 32, 0.75);
  border-radius: 999px;
  overflow: hidden;
  border: 1px solid rgba(245, 200, 110, 0.3);
}
.bond-track i {
  display: block; height: 100%;
  background: linear-gradient(90deg, var(--gold), var(--pink));
  border-radius: 999px;
  box-shadow: 0 0 8px rgba(245, 200, 110, 0.5);
}
.bond-track + small { font-family: var(--pixel); font-size: 0.46rem; color: var(--ink-dim); }
.ap-secret {
  margin: 0;
  padding: 11px 14px;
  background: rgba(124, 107, 214, 0.14);
  border-left: 3px solid var(--pink);
  border-radius: 8px;
  line-height: 1.85;
  font-style: italic;
}
.ap-story {
  color: var(--ink);
  line-height: 1.9;
  background: rgba(13, 11, 32, 0.45);
  border-left: 3px solid var(--gold);
  padding: 11px 14px;
  border-radius: 8px;
  margin: 0 0 10px;
}
.ap-catch {
  color: var(--pink-soft);
  font-style: italic;
  margin: 0 0 14px;
  letter-spacing: 0.02em;
}
.ap-sec-title {
  font-family: var(--pixel);
  font-size: 0.55rem;
  letter-spacing: 0.1em;
  color: var(--ink-dim);
  margin: 14px 0 8px;
}
.ap-bonds { list-style: none; margin: 0 0 4px; padding: 0; display: flex; flex-direction: column; gap: 7px; }
.ap-bonds li { line-height: 1.75; font-size: 0.9rem; }
.ap-bonds strong { color: var(--mint); font-weight: 400; }
.ap-moods { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 10px; }
.ap-mood-tab {
  padding: 5px 12px;
  border-radius: 999px;
  background: rgba(13, 11, 32, 0.55);
  border: 1.5px solid rgba(179, 166, 247, 0.3);
  color: var(--ink-dim);
  cursor: pointer;
  font-size: 0.82rem;
  transition: all 0.2s;
}
.ap-mood-tab:hover { color: var(--ink); }
.ap-mood-tab.on { border-color: var(--gold); color: var(--gold-bright); }
.ap-mood-line {
  min-height: 3em;
  line-height: 1.9;
  color: var(--gold);
  background: rgba(30, 26, 69, 0.4);
  border-radius: 10px;
  padding: 10px 14px;
  margin: 0;
}

.ap-swap-enter-active { transition: all 0.28s cubic-bezier(0.34, 1.4, 0.64, 1); }
.ap-swap-leave-active { transition: all 0.15s ease; }
.ap-swap-enter-from { opacity: 0; transform: translateY(8px) scale(0.98); }
.ap-swap-leave-to { opacity: 0; transform: translateY(-6px); }
@media (prefers-reduced-motion: reduce) {
  .ap-swap-enter-active, .ap-swap-leave-active { transition: none; }
}
</style>
