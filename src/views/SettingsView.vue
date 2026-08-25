<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { askAI, getAiConfig, saveAiConfig } from '../lib/ai'
import { clearHistory, getHistory } from '../lib/history'
import { sfx, toggleSound, isSoundOn } from '../lib/sfx'
import { t } from '../lib/i18n'
import DecryptTitle from '../components/DecryptTitle.vue'
import ThemePicker from '../components/ThemePicker.vue'
import PixelArcanaCard from '../components/PixelArcanaCard.vue'
import { locale } from '../lib/i18n'

const LAB_CARDS = [
  { id: 0, cn: '愚者', en: 'The Fool' },
  { id: 1, cn: '魔术师', en: 'The Magician' },
  { id: 10, cn: '命运之轮', en: 'Wheel of Fortune' },
  { id: 13, cn: '死神', en: 'Death' },
  { id: 21, cn: '世界', en: 'The World' },
]

const baseUrl = ref(getAiConfig().baseUrl)
const apiKey = ref(getAiConfig().apiKey)
const model = ref(getAiConfig().model)

const saved = ref(false)
const testing = ref(false)
const testResult = ref<string | null>(null)
const soundOn = ref(isSoundOn())
const historyCount = ref(0)

onMounted(() => {
  const cfg = getAiConfig()
  baseUrl.value = cfg.baseUrl
  apiKey.value = cfg.apiKey
  model.value = cfg.model
  historyCount.value = getHistory().length
})

function save(): void {
  saveAiConfig({ baseUrl: baseUrl.value.trim(), apiKey: apiKey.value.trim(), model: model.value.trim() })
  saved.value = true
  sfx.blip()
  setTimeout(() => (saved.value = false), 2000)
}

async function test(): Promise<void> {
  if (testing.value) return
  save()
  testing.value = true
  testResult.value = null
  const res = await askAI('你是连通性测试助手。', '收到请只回复两个字：畅通')
  testResult.value = res === null ? t('set.testFail') : t('set.testOk', { r: res })
  testing.value = false
  res === null ? sfx.toggle() : sfx.ding()
}

function onToggleSound(): void {
  soundOn.value = toggleSound()
}

function onClearHistory(): void {
  if (!window.confirm(t('set.histConfirm'))) return
  clearHistory()
  historyCount.value = 0
  sfx.whoosh()
}
</script>

<template>
  <div class="page-root">
    <h2><DecryptTitle :text="t('set.title')" /></h2>
    <p class="hint">{{ t('set.hint') }}</p>

    <section class="panel stagger-in" style="margin-top: 18px; max-width: 640px;">
      <label class="field">
        <span>{{ t('set.base') }}</span>
        <input v-model="baseUrl" type="text" :placeholder="t('set.basePh')" />
      </label>
      <label class="field">
        <span>{{ t('set.key') }}</span>
        <input v-model="apiKey" type="password" :placeholder="t('set.keyPh')" autocomplete="off" />
      </label>
      <label class="field">
        <span>{{ t('set.model') }}</span>
        <input v-model="model" type="text" :placeholder="t('set.modelPh')" />
      </label>
      <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
        <button v-magnetic class="btn small" @click="save">{{ t('set.save') }}</button>
        <button v-magnetic class="btn ghost small" :disabled="testing || apiKey.trim() === ''" @click="test">
          {{ testing ? t('set.testing') : t('set.test') }}
        </button>
        <Transition name="pop-saved">
          <span v-if="saved" class="saved-flash">{{ t('set.saved') }}</span>
        </Transition>
      </div>
      <p v-if="testing" class="testing-wave"><i /><i /><i /></p>
      <p v-if="testResult" class="hint" :class="{ 'error-text': testResult.startsWith(t('set.testFail').slice(0, 4)) }">{{ testResult }}</p>
      <p class="hint" style="margin-top: 18px; font-style: italic;">{{ t('set.cors') }}</p>
    </section>

    <!-- 偏好设置 -->
    <section v-reveal class="panel stagger-in" style="margin-top: 20px; max-width: 640px;">
      <h3 style="margin-top: 0;">{{ t('set.prefs') }}</h3>
      <button class="pref-row" @click="onToggleSound">
        <span class="pref-icon">{{ soundOn ? '🔊' : '🔇' }}</span>
        <span class="pref-text">
          <strong>{{ t('set.sound') }}</strong>
          <small>{{ soundOn ? t('set.soundOnSmall') : t('set.soundOffSmall') }}</small>
        </span>
        <span class="switch" :class="{ on: soundOn }"><i /></span>
      </button>
      <button class="pref-row" @click="onClearHistory">
        <span class="pref-icon">🗑️</span>
        <span class="pref-text">
          <strong>{{ t('set.hist') }}</strong>
          <small>{{ t('set.histSmall', { n: historyCount }) }}</small>
        </span>
        <span class="switch danger-sw"><i>✕</i></span>
      </button>
    </section>

    <section v-reveal class="panel stagger-in" style="margin-top: 20px; max-width: 640px;">
      <h3 style="margin-top: 0;">{{ t('set.privacy') }}</h3>
      <p class="hint">{{ t('set.privacyBody') }}</p>
    </section>

    <ThemePicker />

    <section v-reveal class="panel" style="margin-top: 20px; max-width: 760px;">
      <h3 style="margin: 0 0 4px;">🃏 {{ locale === 'zh' ? '像素牌面实验室' : 'Pixel Arcana Lab' }}</h3>
      <p class="hint" style="margin: 0 0 14px;">
        {{
          locale === 'zh'
            ? '露娜画风的塔罗重绘计划：已完成大阿卡纳前五张样板，其余牌先用星阵占位。'
            : 'Tarot redrawn in Luna\'s style — five Major Arcana samples so far; the rest use starfield placeholders.'
        }}
      </p>
      <div class="arcana-lab">
        <PixelArcanaCard
          v-for="c in LAB_CARDS"
          :key="c.id"
          :id="c.id"
          :name-cn="c.cn"
          :name-en="c.en"
          :size="108"
        />
      </div>
    </section>
  </div>
</template>

<style scoped>
.arcana-lab { display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; }

.saved-flash {
  color: var(--gold-bright);
  animation: saved-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes saved-bounce {
  from { transform: scale(0.4) rotate(-10deg); opacity: 0; }
}
.pop-saved-leave-active { transition: opacity 0.3s; }
.pop-saved-leave-to { opacity: 0; }

.testing-wave { display: inline-flex; gap: 5px; margin: 8px 0 0; }
.testing-wave i {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: var(--mint);
  animation: wave-jump 0.9s ease-in-out infinite;
}
.testing-wave i:nth-child(2) { animation-delay: 0.14s; background: var(--gold); }
.testing-wave i:nth-child(3) { animation-delay: 0.28s; background: var(--pink); }
@keyframes wave-jump {
  0%, 100% { transform: translateY(0); opacity: 0.5; }
  50% { transform: translateY(-7px); opacity: 1; }
}

.pref-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(30, 26, 69, 0.55);
  border: 2px solid rgba(179, 166, 247, 0.25);
  border-radius: 14px;
  padding: 13px 18px;
  margin-bottom: 12px;
  cursor: pointer;
  color: var(--ink);
  transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
  text-align: left;
}
.pref-row:hover { transform: translateX(5px); border-color: var(--pink-soft); }
.pref-row:last-child { margin-bottom: 0; }
.pref-icon { font-size: 1.5rem; }
.pref-text { flex: 1; display: flex; flex-direction: column; gap: 3px; }
.pref-text strong { color: var(--gold-bright); font-family: var(--cute); font-weight: 400; letter-spacing: 0.06em; }
.pref-text small { color: var(--ink-dim); font-size: 0.78rem; }

.switch {
  width: 46px; height: 24px;
  border-radius: 999px;
  background: rgba(13, 11, 32, 0.9);
  border: 2px solid rgba(179, 166, 247, 0.4);
  position: relative;
  transition: background 0.25s, border-color 0.25s;
  flex-shrink: 0;
}
.switch i {
  position: absolute;
  top: 2px; left: 3px;
  width: 15px; height: 15px;
  border-radius: 50%;
  background: var(--ink-dim);
  transition: all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
  font-size: 0;
}
.switch.on { background: rgba(125, 232, 195, 0.25); border-color: var(--mint); }
.switch.on i { left: 23px; background: var(--mint); box-shadow: 0 0 10px var(--mint); }
.danger-sw i { color: #ff8a8a; font-style: normal; font-weight: bold; line-height: 15px; text-align: center; font-size: 10px !important; }
</style>
