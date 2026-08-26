<script setup lang="ts">
/**
 * 愚人之旅 · The Fool's Journey —— 全站招牌滚动叙事页。
 * 二十二张大牌按三幕（觉醒 0-7 / 试炼 8-14 / 归返 15-21）排成一条向下的路：
 * 滚动即前进，粘性舞台逐章换景，右侧星轨记录你走到哪了。
 * 纯 rAF + transform 驱动，尊重 prefers-reduced-motion（降级为纵向长卷）。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { locale } from '../lib/i18n'
import { sfx } from '../lib/sfx'
import { sparkleFromEvent } from '../lib/sparkle'
import { cardImageUrl } from '../data/tarot'
import DecryptTitle from '../components/DecryptTitle.vue'

interface Stage {
  id: string
  num: string
  zh: string
  en: string
  lineZh: string
  lineEn: string
}

const STAGES: Stage[] = [
  { id: 'fool', num: '0', zh: '愚人', en: 'The Fool', lineZh: '一切从一步之差开始。包袱是轻的，狗是兴奋的，你不知道悬崖对面有什么——这正是出发的最好理由。', lineEn: 'It begins with a step off the edge. The pack is light, the dog thrilled, and not knowing is the best reason to go.' },
  { id: 'magician', num: 'I', zh: '魔术师', en: 'The Magician', lineZh: '桌上摆齐了四样元素，手指天指地。你第一次发现：原来工具一直都在，缺的只是那句"我来"。', lineEn: 'Four elements on the table, one hand up, one down. The tools were always there — all you lacked was saying "I will."' },
  { id: 'high-priestess', num: 'II', zh: '女祭司', en: 'High Priestess', lineZh: '帷幕后面有东西在等你，但它不说。有些答案要靠安静才能听见，问得太急它就装睡。', lineEn: 'Something waits behind the veil, and it won\'t be rushed. Some answers only surface when you stop demanding them.' },
  { id: 'empress', num: 'III', zh: '女皇', en: 'The Empress', lineZh: '麦子熟了，花园不用命令就自己生长。你学会的第一课是：丰饶不是抓来的，是养出来的。', lineEn: 'Wheat ripens; gardens grow without orders. First lesson of abundance: it cannot be grabbed, only tended.' },
  { id: 'emperor', num: 'IV', zh: '皇帝', en: 'The Emperor', lineZh: '石头王座又冷又硬，但边界立起来了。你说"不"的时候，世界才第一次认真听你说话。', lineEn: 'The stone throne is cold, but boundaries stand. The first time you say no, the world starts taking notes.' },
  { id: 'hierophant', num: 'V', zh: '教皇', en: 'The Hierophant', lineZh: '传统递给你一本现成的答案册。抄近道很方便——直到你发现钥匙串里没有自己那把。', lineEn: 'Tradition hands you a ready answer book. Convenient shortcuts — until you notice none of the keys are yours.' },
  { id: 'lovers', num: 'VI', zh: '恋人', en: 'The Lovers', lineZh: '这不是关于遇见谁，而是关于选择成为谁。每一次心动背后，都藏着一道价值观的选择题。', lineEn: 'Less about who you meet than who you choose to be. Behind every flutter hides a values exam.' },
  { id: 'chariot', num: 'VII', zh: '战车', en: 'The Chariot', lineZh: '两匹方向相反的兽拉着同一辆车。出发不难，难的是一路上不让它们把你撕成两种人生。', lineEn: 'Two beasts pull one chariot in opposite directions. Departing is easy; not being torn into two lives is the work.' },
  // ─── 第二幕 · 试炼 ───
  { id: 'strength', num: 'VIII', zh: '力量', en: 'Strength', lineZh: '狮子不需要被打败，只需要被理解。你收起拳头，轻轻合上兽口——温柔原来是最重的那只手。', lineEn: 'The lion needn\'t be beaten, only understood. You close its jaws gently — softness turns out to be the heaviest hand.' },
  { id: 'hermit', num: 'IX', zh: '隐士', en: 'The Hermit', lineZh: '上山的人自带灯笼。人群散了以后你才发现，那些安静的日子才是真正往前走的日子。', lineEn: 'Hermits carry their own lanterns. When the crowd thins out, you find the quiet days were the ones that moved you.' },
  { id: 'wheel-of-fortune', num: 'X', zh: '命运之轮', en: 'Wheel of Fortune', lineZh: '轮子转起来的那一刻，好坏都留不住。你唯一能选的是姿势：被甩下来，还是骑上去。', lineEn: 'Once the wheel spins, neither fortune nor ruin stays. Your only move is posture: flung off, or riding.' },
  { id: 'justice', num: 'XI', zh: '正义', en: 'Justice', lineZh: '天平两端各放一个事实，剑竖在中间。这一站不看你的心情，只看你的账。', lineEn: 'One fact on each pan, sword upright between. This station reads your ledger, not your mood.' },
  { id: 'hanged-man', num: 'XII', zh: '倒吊人', en: 'The Hanged Man', lineZh: '倒挂着的人看起来输了，其实他在换眼睛。有些路口，停九天比走九步离答案更近。', lineEn: 'The hanging man looks defeated — he\'s changing eyes. At some crossroads, nine days still beats nine steps.' },
  { id: 'death', num: 'XIII', zh: '死神', en: 'Death', lineZh: '别怕，这站没人真的死。死的是那个不肯更新的版本的你——而新的一集已经排好档期了。', lineEn: 'Nobody actually dies here. What ends is the version of you that refused updates — the next season is already scheduled.' },
  // ─── 第三幕 · 归返 ───
  { id: 'temperance', num: 'XIV', zh: '节制', en: 'Temperance', lineZh: '两只杯子之间来回倒水，永远差一点才能对味。原来"刚刚好"是一种练出来的手艺。', lineEn: 'Water poured between two cups, never quite right on the first pass. "Just right" turns out to be a craft.' },
  { id: 'devil', num: 'XV', zh: '恶魔', en: 'The Devil', lineZh: '链子其实没锁死，低头一看是松的。让你留下的从来不是铁链，是"习惯了"。', lineEn: 'Look down: the chain was never locked. What keeps you isn\'t iron — it\'s "used to it."' },
  { id: 'tower', num: 'XVI', zh: '高塔', en: 'The Tower', lineZh: '雷劈下来的瞬间，假发的确很难看。但地基露出来那天，你终于知道哪些是真的。', lineEn: 'Yes, the lightning strike looks undignified. But the day the facade peels, you finally learn which parts were real.' },
  { id: 'star', num: 'XVII', zh: '星星', en: 'The Star', lineZh: '塔塌之后的水边，有人安静地倒水浇灌。希望不是大喊大叫的东西，它是灾后还愿意浇水的那个人。', lineEn: 'After the tower, someone quietly waters the shore. Hope doesn\'t shout — it\'s whoever still waters things after ruins.' },
  { id: 'moon', num: 'XVIII', zh: '月亮', en: 'The Moon', lineZh: '月光把每条路都照得像对的。深夜里的疑心多半不是真相，是雾——天亮再判断也不迟。', lineEn: 'Moonlight makes every road look right. Late-night doubts are mostly fog, not truth — let daylight do the judging.' },
  { id: 'sun', num: 'XIX', zh: '太阳', en: 'The Sun', lineZh: '没有谜语、没有考验，小孩骑着白马经过。原来走到最后，奖励是"可以简单"。', lineEn: 'No riddles, no trials — a child rides past on a white horse. The final reward turns out to be simplicity.' },
  { id: 'judgement', num: 'XX', zh: '审判', en: 'Judgement', lineZh: '号角响起，过去所有版本的你自己从坑里爬出来听你总结陈词。这一站，你要对自己诚实一次。', lineEn: 'The horn sounds and every version of you climbs out to hear your closing statement. Time to be honest — once, fully.' },
  { id: 'world', num: 'XXI', zh: '世界', en: 'The World', lineZh: '花环闭合，舞步完成。但这不是终点站——愚人之旅最好的部分，是你可以随时买一张回程的 0 号票。', lineEn: 'The wreath closes; the dance completes. Not an ending though — the best part of this ride is that seat zero is always on sale again.' },
]

const ACTS = [
  { name: ['第一幕 · 觉醒', 'Act I · Awakening'], range: [0, 7], tint: '#b3a6f7' },
  { name: ['第二幕 · 试炼', 'Act II · Trials'], range: [8, 14], tint: '#ff9fce' },
  { name: ['第三幕 · 归返', 'Act III · Return'], range: [15, 21], tint: '#f5c86e' },
] as const

function actOf(idx: number) {
  return ACTS.find((a) => idx >= a.range[0] && idx <= a.range[1]) ?? ACTS[0]!
}

/* ---------- 滚动进度引擎 ---------- */
const stageCount = STAGES.length
/** 每章占用的视口高度倍数 */
const VH_PER_STAGE = 105
const spacerHeight = `${stageCount * VH_PER_STAGE}vh`

const progress = ref(0)          // 0..1 总进度
const stageIdx = ref(0)          // 当前章
const stageFrac = ref(0)         // 章内进度 0..1
let ticking = false

function onScroll(): void {
  if (ticking) return
  ticking = true
  requestAnimationFrame(() => {
    const wrap = wrapEl.value
    if (!wrap) return
    const rect = wrap.getBoundingClientRect()
    const total = wrap.offsetHeight - window.innerHeight
    const passed = Math.min(Math.max(-rect.top, 0), total)
    progress.value = total > 0 ? passed / total : 0
    const raw = progress.value * stageCount
    stageIdx.value = Math.min(stageCount - 1, Math.floor(raw))
    stageFrac.value = raw - stageIdx.value
    ticking = false
  })
}

/** 章内淡入淡出：前 18% 浮现，后 18% 退场 */
const stageAlpha = computed(() => {
  const f = stageFrac.value
  if (stageIdx.value === 0 && f < 0.82) return 1
  if (stageIdx.value === stageCount - 1 && f > 0.18) return 1
  if (f < 0.18) return f / 0.18
  if (f > 0.82) return (1 - f) / 0.18
  return 1
})
const stageShift = computed(() => {
  const f = stageFrac.value
  const drift = (f < 0.5 ? -1 : 1) * (1 - Math.abs(f - 0.5) * 2)
  return Math.round(drift * 26)
})

const currentStage = computed(() => STAGES[stageIdx.value]!)
const currentAct = computed(() => actOf(stageIdx.value))

/** 点星轨跳章 */
const wrapEl = ref<HTMLElement | null>(null)
function jumpTo(idx: number, e?: MouseEvent): void {
  const wrap = wrapEl.value
  if (!wrap) return
  const top = wrap.offsetTop + (idx + 0.5) * (wrap.offsetHeight - window.innerHeight) / stageCount
  window.scrollTo({ top, behavior: 'smooth' })
  sfx.blip()
  if (e) sparkleFromEvent(e, 6)
}

function onKey(e: KeyboardEvent): void {
  if (e.key === 'ArrowDown' || e.key === 'PageDown') {
    jumpTo(Math.min(stageCount - 1, stageIdx.value + 1))
    e.preventDefault()
  } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
    jumpTo(Math.max(0, stageIdx.value - 1))
    e.preventDefault()
  }
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  onScroll()
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  document.removeEventListener('keydown', onKey)
})

const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** 静态降级模式（reduced-motion）：全部章节纵排 */
const staticMode = reducedMotion
</script>

<template>
  <div class="page-root journey-page">
    <h2><DecryptTitle :text="locale === 'zh' ? '愚人之旅' : 'The Fool\'s Journey'" /></h2>
    <p class="hint">
      {{ locale === 'zh'
        ? '二十二张大牌是一条完整的路：从纵身一跃的愚人，到跳完最后一支舞的世界。慢慢往下滚——这条路是用你的滚动铺出来的。'
        : 'Twenty-two majors make one whole road: from the leap of faith to the final dance. Scroll slowly — the road paves itself beneath you.' }}
    </p>

    <!-- 静态降级：全部章节纵排 -->
    <div v-if="staticMode" class="static-list">
      <article v-for="(s, i) in STAGES" :key="s.id" class="panel st-card-static">
        <img :src="cardImageUrl(s.id)" :alt="s.zh" loading="lazy" />
        <div>
          <p class="st-num">{{ s.num }} · {{ actOf(i).name[locale === 'zh' ? 0 : 1].split('·')[1]?.trim() ?? '' }}</p>
          <h3>{{ locale === 'zh' ? s.zh : s.en }}</h3>
          <p class="st-line">{{ locale === 'zh' ? s.lineZh : s.lineEn }}</p>
        </div>
      </article>
    </div>

    <!-- 滚动叙事 -->
    <template v-else>
      <div ref="wrapEl" class="journey-wrap" :style="{ height: spacerHeight }">
        <div class="journey-stage" :style="{ '--act-tint': currentAct.tint }">
          <!-- 幕标题 -->
          <Transition name="act-swap" mode="out-in">
            <p :key="currentAct.name[0]" class="act-label">{{ currentAct.name[locale === 'zh' ? 0 : 1] }}</p>
          </Transition>

          <!-- 主舞台 -->
          <div
            class="stage-inner"
            :style="{ opacity: stageAlpha, transform: `translateY(${stageShift}px)` }"
          >
            <div class="card-side">
              <img
                :key="currentStage.id"
                :src="cardImageUrl(currentStage.id)"
                :alt="currentStage.zh"
                class="stage-card"
                @load="sfx.tick()"
              />
              <span class="card-glow" aria-hidden="true" />
            </div>
            <div class="text-side">
              <Transition name="act-swap" mode="out-in">
                <span :key="currentStage.num" class="roman">{{ currentStage.num }}</span>
              </Transition>
              <h3 class="stage-name">
                {{ locale === 'zh' ? currentStage.zh : currentStage.en }}
                <small>{{ locale === 'zh' ? currentStage.en : currentStage.zh }}</small>
              </h3>
              <p class="stage-line">{{ locale === 'zh' ? currentStage.lineZh : currentStage.lineEn }}</p>
            </div>
          </div>

          <!-- 星轨进度 -->
          <nav class="rail" aria-label="chapter rail">
            <button
              v-for="(s, i) in STAGES"
              :key="'r' + s.id"
              class="rail-dot"
              :class="{ on: i === stageIdx, past: i < stageIdx }"
              :aria-label="`${i} ${s.zh}`"
              @click="jumpTo(i, $event)"
            >
              <i v-if="i === stageIdx" class="rail-you">你</i>
            </button>
          </nav>

          <p class="km">{{ locale === 'zh' ? `第 ${stageIdx + 1} / ${stageCount} 站` : `Stop ${stageIdx + 1} / ${stageCount}` }} · ↓ {{ locale === 'zh' ? '继续滚' : 'keep scrolling' }}</p>
        </div>
      </div>

      <!-- 终点卡 -->
      <section class="panel finale bounce-in">
        <h3 style="margin-top: 0;">✦ {{ locale === 'zh' ? '旅程没有终点站' : 'No Terminus Here' }}</h3>
        <p style="line-height: 2;">
          {{ locale === 'zh'
            ? '二十一章走完，愚人回到起点，但他已经不是出发时的那个人了。想亲自抽一张看看你今天在哪一站？'
            : 'Twenty-one stops later, the fool circles home — changed. Want to see where you stand today? Draw one.' }}
        </p>
        <RouterLink v-magnetic to="/tarot" class="btn" @click="sparkleFromEvent($event, 10)">
          ✦ {{ locale === 'zh' ? '去抽一张牌' : 'Draw a card' }}
        </RouterLink>
      </section>
    </template>
  </div>
</template>

<style scoped>
.journey-page { padding-bottom: 40px; }

.journey-wrap { position: relative; }
.journey-stage {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.journey-stage::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 20% 30%, color-mix(in srgb, var(--act-tint) 12%, transparent), transparent 55%),
    radial-gradient(ellipse at 80% 70%, rgba(124, 107, 214, 0.08), transparent 60%);
  transition: background 1.2s ease;
  pointer-events: none;
}

.act-label {
  position: absolute;
  top: max(84px, env(safe-area-inset-top));
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--pixel);
  font-size: 0.62rem;
  letter-spacing: 0.3em;
  color: var(--act-tint);
  white-space: nowrap;
}
.act-swap-enter-active { transition: all 0.45s cubic-bezier(0.34, 1.4, 0.64, 1); }
.act-swap-leave-active { transition: all 0.2s ease; }
.act-swap-enter-from { opacity: 0; transform: translateX(-50%) translateY(10px); }
.act-swap-leave-to { opacity: 0; }

.stage-inner {
  display: grid;
  grid-template-columns: minmax(180px, 300px) minmax(280px, 460px);
  gap: clamp(24px, 6vw, 72px);
  align-items: center;
  width: min(920px, 92vw);
  transition: opacity 0.1s linear;
}
@media (max-width: 720px) {
  .stage-inner { grid-template-columns: 1fr; justify-items: center; text-align: center; gap: 18px; width: 94vw; }
  .text-side .stage-line { text-align: center; }
  .stage-card { max-width: 46vw; }
}

.card-side { position: relative; perspective: 900px; }
.stage-card {
  width: 100%;
  border-radius: 12px;
  border: 3px solid var(--gold);
  box-shadow:
    0 18px 48px rgba(0, 0, 0, 0.5),
    0 0 42px color-mix(in srgb, var(--act-tint) 35%, transparent);
  transform: rotateY(-6deg) rotateZ(-1.2deg);
  animation: card-bob 5.5s ease-in-out infinite;
  display: block;
}
@keyframes card-bob {
  0%, 100% { transform: rotateY(-6deg) rotateZ(-1.2deg) translateY(0); }
  50% { transform: rotateY(-4deg) rotateZ(-0.6deg) translateY(-10px); }
}
.card-glow {
  position: absolute;
  inset: -14%;
  background: radial-gradient(circle, color-mix(in srgb, var(--act-tint) 22%, transparent), transparent 65%);
  z-index: -1;
  animation: glow-pulse 3.4s ease-in-out infinite;
}
@keyframes glow-pulse { 50% { opacity: 0.5; transform: scale(1.08); } }

.text-side .roman {
  font-family: var(--serif);
  font-size: clamp(3rem, 8vw, 5.4rem);
  line-height: 1;
  background: linear-gradient(120deg, var(--gold-bright), #fff2d9 45%, var(--gold));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  display: block;
  margin-bottom: 8px;
}
.stage-name {
  margin: 0 0 16px;
  font-family: var(--cute);
  font-weight: 400;
  font-size: clamp(1.5rem, 3.4vw, 2.2rem);
  color: var(--ink);
}
.stage-name small { display: block; font-size: 0.85rem; letter-spacing: 0.28em; color: var(--ink-dim); margin-top: 6px; }
.stage-line { margin: 0; line-height: 2.15; font-size: clamp(0.95rem, 1.6vw, 1.08rem); color: var(--ink); opacity: 0.94; }

.rail {
  position: absolute;
  right: clamp(8px, 2vw, 26px);
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.rail-dot {
  position: relative;
  width: 11px;
  height: 11px;
  padding: 0;
  border-radius: 50%;
  border: 1.5px solid rgba(179, 166, 247, 0.5);
  background: transparent;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.rail-dot:hover { transform: scale(1.5); border-color: var(--gold-bright); }
.rail-dot.past { background: rgba(179, 166, 247, 0.55); border-color: transparent; }
.rail-dot.on {
  background: var(--gold-bright);
  border-color: var(--gold-bright);
  box-shadow: 0 0 12px color-mix(in srgb, var(--gold) 80%, transparent);
  transform: scale(1.35);
}
.rail-you {
  position: absolute;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
  font-style: normal;
  font-family: var(--cute);
  font-size: 0.78rem;
  color: var(--gold-bright);
  white-space: nowrap;
  text-shadow: 0 0 8px rgba(245, 200, 110, 0.6);
}

.km {
  position: absolute;
  bottom: max(20px, env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--pixel);
  font-size: 0.56rem;
  letter-spacing: 0.18em;
  color: var(--ink-dim);
  white-space: nowrap;
}

.finale { margin-top: 30px; text-align: center; }

.static-list { display: flex; flex-direction: column; gap: 18px; margin-top: 20px; }
.st-card-static { display: flex; gap: 18px; align-items: center; }
.st-card-static img { width: 110px; border-radius: 8px; border: 2px solid var(--gold); }
.st-card-static h3 { margin: 4px 0; font-family: var(--cute); font-weight: 400; color: var(--gold-bright); }
.st-num { margin: 0; font-family: var(--pixel); font-size: 0.58rem; letter-spacing: 0.14em; color: var(--lavender-soft); }
.st-line { margin: 0; line-height: 1.95; font-size: 0.9rem; color: var(--ink-dim); }

@media (prefers-reduced-motion: reduce) {
  .stage-card, .card-glow { animation: none; }
}
</style>
