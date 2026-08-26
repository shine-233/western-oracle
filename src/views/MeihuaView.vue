<script setup lang="ts">
/** 梅花易数：心中数字 × 出生年月日时 起卦。六爻逐条显现，动爻高亮，附完整推演过程。 */
import { computed, ref } from 'vue'
import { TRIGRAMS, HEX, castMeihua, type MeihuaCast } from '../data/meihua'
import { L } from '../data/oracleArcade'
import { sparkleFromEvent } from '../lib/sparkle'
import { sfx } from '../lib/sfx'
import DecryptTitle from '../components/DecryptTitle.vue'

const question = ref('')
const picked = ref<number | ''>('')
const birthDate = ref('')
const birthHour = ref<number | ''>('')

const cast = ref<MeihuaCast | null>(null)
const revealed = ref(false)

function canCast(): boolean {
  return picked.value !== '' && !!birthDate.value && birthHour.value !== ''
}

function doCast(e?: MouseEvent): void {
  if (!canCast()) return
  const [y, m, d] = birthDate.value.split('-').map(Number)
  cast.value = castMeihua({
    picked: Number(picked.value),
    year: y!,
    month: m!,
    day: d!,
    hour: Number(birthHour.value),
  })
  revealed.value = false
  sfx.riffle()
  // 六爻自下而上逐条显现，最后亮出断语
  window.setTimeout(() => {
    revealed.value = true
    sfx.ding()
  }, 6 * 260)
  if (e) sparkleFromEvent(e, 12)
}

/** 第 i 爻（0=初爻）的阴阳：true 为阳 */
function isYang(i: number): boolean {
  const c = cast.value!
  const bits = i < 3 ? c.lower.bits : c.upper.bits
  const b = i < 3 ? bits[i] : bits[i - 3]
  return b === '1'
}

interface YaoView {
  yang: boolean
  moving: boolean
}

const yaos = computed<YaoView[]>(() => {
  if (!cast.value) return []
  return Array.from({ length: 6 }, (_, i) => ({
    yang: isYang(i),
    moving: cast.value!.moving === i + 1,
  }))
})

/** 变卦：动爻翻转后的那一卦 */
const changedName = computed(() => {
  if (!cast.value) return null
  const lo = cast.value.lower.bits.split('')
  const up = cast.value.upper.bits.split('')
  const mv = cast.value.moving - 1
  const flip = (s: string): string => (s === '1' ? '0' : '1')
  if (mv < 3) lo[mv] = flip(lo[mv]!)
  else up[mv - 3] = flip(up[mv - 3]!)
  const find = (bits: string[]) => TRIGRAMS.find((t) => t.bits === bits.join(''))!
  const upT = find(up)
  const loT = find(lo)
  return HEX[upT.name]?.[loT.name]?.zh ?? null
})

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => h)
</script>

<template>
  <div class="page-root">
    <h2><DecryptTitle :text="L(['梅花易数', 'Plum Blossom Cast'])" /></h2>
    <p class="hint">{{ L([
      '心里想好要问的事，让一个数字自己浮上来（1~999）。写下你的出生年月日和时辰——古人相信这些一起决定了卦象。方法全程公开，算给你看。',
      'Hold your question, let a number surface (1–999). Add your birth date and hour — the old way turns all of it into a hexagram, shown step by step.',
    ]) }}</p>

    <section class="panel form-panel">
      <div class="form-row">
        <label class="field">
          <span>{{ L(['心中浮现的数字', 'The number that surfaced']) }}</span>
          <input v-model.number="picked" type="number" min="1" max="999" :placeholder="L(['比如 7', 'e.g. 7'])" />
        </label>
        <label class="field">
          <span>{{ L(['出生日期', 'Birth date']) }}</span>
          <input v-model="birthDate" type="date" />
        </label>
        <label class="field">
          <span>{{ L(['出生时辰（24小时制）', 'Birth hour (24h)']) }}</span>
          <select v-model.number="birthHour">
            <option :value="''" disabled>{{ L(['选择时辰', 'pick']) }}</option>
            <option v-for="h in HOUR_OPTIONS" :key="h" :value="h">{{ String(h).padStart(2, '0') }}:00</option>
          </select>
        </label>
      </div>
      <label class="field" style="margin-top: 4px;">
        <span>{{ L(['你想问的事（可不填）', 'Your question (optional)']) }}</span>
        <input v-model="question" type="text" maxlength="60" :placeholder="L(['比如：这份工作要不要接？', 'e.g. Should I take this job?'])" />
      </label>
      <button class="btn" style="margin-top: 14px;" :disabled="!canCast()" @click="doCast($event)">
        ☯ {{ L(['起 卦', 'Cast the hexagram']) }}
      </button>
    </section>

    <!-- 卦象 -->
    <section v-if="cast" class="panel result-panel bounce-in">
      <div class="cast-layout">
        <!-- 六爻 -->
        <div class="yaos">
          <div
            v-for="(y, i) in [...yaos].reverse()"
            :key="i"
            class="yao-row"
            :style="{ animationDelay: (5 - i) * 0.26 + 's' }"
          >
            <span class="yao-label">{{ ['上爻','五爻','四爻','三爻','二爻','初爻'][i] }}</span>
            <div class="yao" :class="{ yang: y.yang, yin: !y.yang, moving: y.moving }">
              <template v-if="y.yang"><i class="bar solid" /></template>
              <template v-else><i class="bar half" /><i class="bar half gap" /></template>
              <span v-if="y.moving" class="moving-mark">{{ y.yang ? '○' : '✕' }}</span>
            </div>
          </div>
        </div>

        <!-- 断语 -->
        <Transition name="pop">
          <div v-if="revealed" class="verdict">
            <h3 class="hex-name">「{{ cast.hexa.zh }}」<small>{{ cast.hexa.en }}</small></h3>
            <p class="hex-word">{{ L([cast.hexa.zhWord, cast.hexa.enWord]) }}</p>
            <dl class="meta">
              <div><dt>{{ L(['上卦', 'Upper']) }}</dt><dd>{{ cast.upper.sym }} {{ cast.upper.name }}（{{ L([cast.upper.nature[0], cast.upper.nature[1]]) }}）</dd></div>
              <div><dt>{{ L(['下卦', 'Lower']) }}</dt><dd>{{ cast.lower.sym }} {{ cast.lower.name }}（{{ L([cast.lower.nature[0], cast.lower.nature[1]]) }}）</dd></div>
              <div><dt>{{ L(['动爻', 'Moving']) }}</dt><dd>{{ L(['第', 'Line']) }} {{ cast.moving }} {{ L(['爻动', 'moves']) }}</dd></div>
              <div v-if="changedName"><dt>{{ L(['变卦', 'Changes to']) }}</dt><dd>「{{ changedName }}」</dd></div>
            </dl>
            <p v-if="question.trim()" class="asked">「{{ question.trim() }}」</p>
          </div>
        </Transition>
      </div>

      <!-- 推演过程 -->
      <details class="steps-box">
        <summary>{{ L(['🧮 看看这卦是怎么算出来的', '🧮 How this was computed']) }}</summary>
        <div v-for="(s, i) in cast.steps" :key="i" class="step-line">
          <strong>{{ L(s.label) }}</strong>
          <code>{{ s.formula }}</code>
        </div>
        <p class="hint" style="margin-top: 8px;">
          {{ L([
            '先天八卦数：乾一兑二离三震四巽五坎六艮七坤八；除尽取八，动爻除尽取六。',
            'Trigram numbers: Qian1 Dui2 Li3 Zhen4 Xun5 Kan6 Gen7 Kun8; zero wraps to eight, lines wrap to six.',
          ]) }}
        </p>
      </details>
    </section>
  </div>
</template>

<style scoped>
.form-panel { margin-top: 18px; }

.result-panel { margin-top: 16px; }
.cast-layout {
  display: grid;
  grid-template-columns: minmax(240px, 320px) 1fr;
  gap: 26px;
  align-items: start;
}
@media (max-width: 720px) { .cast-layout { grid-template-columns: 1fr; } }

/* 六爻 */
.yaos { display: flex; flex-direction: column-reverse; gap: 12px; }
.yao-row { display: flex; align-items: center; gap: 12px; animation: yao-in 0.45s cubic-bezier(0.34, 1.5, 0.64, 1) both; }
@keyframes yao-in { from { opacity: 0; transform: translateY(-14px) scale(0.85); } }
.yao-label {
  width: 38px;
  text-align: right;
  font-family: var(--pixel);
  font-size: 0.55rem;
  color: var(--ink-dim);
}
.yao { position: relative; flex: 1; height: 22px; display: flex; gap: 10px; }
.bar {
  display: block;
  height: 100%;
  border-radius: 6px;
  background: linear-gradient(180deg, #ffe3a8, #c9a24f);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}
.bar.solid { flex: 1; }
.bar.half { flex: 1; }
.bar.half.gap { margin-left: auto; }
.yao.moving .bar { background: linear-gradient(180deg, #ffb3c8, #e0483e); box-shadow: 0 0 16px rgba(255, 143, 174, 0.75); animation: moving-pulse 1.4s ease-in-out infinite; }
@keyframes moving-pulse { 50% { filter: brightness(1.35); } }
.moving-mark {
  position: absolute;
  right: -26px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--pink);
  font-family: var(--cute);
  font-size: 1.1rem;
}

.verdict .hex-name { margin: 0 0 10px; font-family: var(--cute); font-weight: 400; font-size: 1.5rem; color: var(--gold-bright); }
.hex-name small { font-size: 0.85rem; color: var(--ink-dim); margin-left: 8px; }
.hex-word { line-height: 2; color: var(--ink); margin: 0 0 14px; font-size: 1.02rem; }
.meta { margin: 0 0 12px; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; }
.meta dt { font-size: 0.75rem; color: var(--ink-dim); letter-spacing: 0.15em; }
.meta dd { margin: 2px 0 0; color: var(--ink); font-size: 0.92rem; }
.asked {
  padding: 9px 13px;
  border-left: 3px solid var(--gold);
  background: rgba(13, 11, 32, 0.55);
  border-radius: 6px;
  font-style: italic;
  color: var(--lavender-soft);
  margin: 0;
}

.steps-box {
  margin-top: 18px;
  border: 1.5px dashed rgba(245, 200, 110, 0.45);
  border-radius: 10px;
  padding: 11px 14px;
}
.steps-box summary { cursor: pointer; color: var(--lavender-soft); font-size: 0.82rem; user-select: none; }
.steps-box summary:hover { color: var(--gold-bright); }
.step-line { margin-top: 9px; display: flex; gap: 10px; flex-wrap: wrap; align-items: baseline; }
.step-line strong { color: var(--gold-bright); font-weight: 400; font-family: var(--cute); min-width: 64px; }
.step-line code { font-family: ui-monospace, monospace; font-size: 0.8rem; color: var(--mint); word-break: break-all; }

.pop-enter-active { transition: all 0.4s cubic-bezier(0.34, 1.4, 0.64, 1); }
.pop-enter-from { opacity: 0; transform: translateY(12px); }
.pop-leave-active { transition: all 0.15s ease; }
.pop-leave-to { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .yao-row, .yao.moving .bar { animation: none !important; }
}
</style>
