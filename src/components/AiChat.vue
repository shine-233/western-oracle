<script setup lang="ts">
/**
 * 通用 AI 解读面板：流式输出 + 打字机效果 + 多轮追问。
 * 未配置 API Key 时显示引导提示；本地规则解读由各页面自行提供，本组件只管 AI。
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { isAiEnabled, oracleSystemPrompt, streamChat, type ChatMessage } from '../lib/ai'
import { sfx } from '../lib/sfx'
import { t } from '../lib/i18n'

const props = defineProps<{
  /** 首条用户消息：把占卜数据喂给 AI */
  context: string
  title?: string
  /** 面板副标题/引导语 */
  intro?: string
}>()

interface Bubble {
  role: 'user' | 'assistant'
  /** 完整文本（打字机渲染目标） */
  text: string
  /** 已渲染长度 */
  shown: number
}

const messages = ref<Bubble[]>([])
const status = ref<'idle' | 'waiting' | 'streaming' | 'error'>('idle')
const input = ref('')
const enabled = computed(() => isAiEnabled())

let aborter: AbortController | null = null
// 打字机队列：网络分片先入队，按固定节奏逐字吐出
let queue = ''
let revealTimer: number | null = null
let tail: Bubble | null = null

function startReveal(): void {
  if (revealTimer !== null) return
  revealTimer = window.setInterval(() => {
    if (queue.length === 0) {
      if (status.value !== 'streaming' && status.value !== 'waiting') {
        stopReveal()
      }
      return
    }
    const step = Math.max(1, Math.ceil(queue.length / 40))
    queue = queue.slice(step)
    if (tail) tail.shown += step
  }, 28)
}

function stopReveal(): void {
  if (revealTimer !== null) {
    window.clearInterval(revealTimer)
    revealTimer = null
  }
}

/** 发起一轮对话。first 为 true 时把占卜数据作为开场上下文（不显示成气泡）。 */
async function run(userText: string, first = false): Promise<void> {
  if (!enabled.value || status.value === 'streaming' || status.value === 'waiting') return
  status.value = 'waiting'
  sfx.blip()
  if (!first) messages.value.push({ role: 'user', text: userText, shown: userText.length })
  tail = null

  const payload: ChatMessage[] = [
    { role: 'system', content: oracleSystemPrompt() },
  ]
  if (first) payload.push({ role: 'user', content: userText })
  else {
    payload.push({ role: 'user', content: props.context })
    for (const m of messages.value) payload.push({ role: m.role, content: m.text })
  }

  const bubble: Bubble = { role: 'assistant', text: '', shown: 0 }
  messages.value.push(bubble)
  tail = bubble

  aborter = new AbortController()
  const full = await streamChat(
    payload,
    (chunk) => {
      status.value = 'streaming'
      queue += chunk
      sfxTick()
    },
    aborter.signal,
  )
  startReveal()

  if (full === null) {
    // 用户主动点「停止」触发的 abort 不算连接故障，安静收场即可
    status.value = aborter?.signal.aborted ? 'idle' : 'error'
    if (tail.text === '') messages.value.pop()
  } else {
    // 确保完整文本最终完整呈现
    window.setTimeout(() => {
      if (tail && tail.shown < tail.text.length) {
        const finish = (): void => {
          if (tail && tail.shown < tail.text.length) {
            tail.shown = Math.min(tail.text.length, tail.shown + Math.ceil(tail.text.length / 20))
            window.setTimeout(finish, 24)
          } else {
            stopReveal()
          }
        }
        finish()
      }
    }, 400)
    status.value = 'idle'
    sfx.ding()
  }
  aborter = null
}

let lastTick = 0
function sfxTick(): void {
  const now = performance.now()
  if (now - lastTick > 110) {
    lastTick = now
    sfx.tick?.()
  }
}

function ask(): void {
  const q = input.value.trim()
  if (q === '') return
  input.value = ''
  if (messages.value.length === 0) {
    void run(props.context, true)
  } else if (status.value === 'idle' || status.value === 'error') {
    if (status.value === 'error') {
      // 上一次失败的空气泡已移除，直接续聊
      status.value = 'idle'
    }
    void run(q)
  }
}

function retry(): void {
  messages.value = []
  status.value = 'idle'
  stopReveal()
  queue = ''
  void run(props.context, true)
}

function begin(): void {
  void run(props.context, true)
}

function stop(): void {
  aborter?.abort()
  aborter = null
  status.value = 'idle'
  stopReveal()
}

onBeforeUnmount(() => {
  aborter?.abort()
  stopReveal()
})
</script>

<template>
  <section class="panel reading-panel ai-panel">
    <div class="ai-head">
      <h3 style="margin: 0;">{{ title ?? t('chat.defaultTitle') }}<span class="tag ai-tag">AI</span></h3>
      <div class="ai-actions">
        <button v-if="status === 'streaming' || status === 'waiting'" class="btn ghost small" @click="stop">{{ t('chat.stop') }}</button>
        <button v-else-if="messages.some((m) => m.role === 'assistant')" class="btn ghost small" @click="retry">{{ t('chat.retry') }}</button>
      </div>
    </div>

    <p v-if="!enabled" class="hint" style="margin-bottom: 0;">
      {{ intro ?? t('chat.disabled') }}
    </p>

    <template v-else>
      <div v-if="messages.length === 0" class="ai-empty">
        <button class="btn" @click="begin">{{ t('chat.begin') }}</button>
        <p class="hint">{{ intro ?? t('chat.beginHint') }}</p>
      </div>

      <TransitionGroup v-else name="bubble" tag="div" class="ai-thread">
        <div v-for="(m, i) in messages" :key="i" class="ai-msg" :class="m.role">
          <!-- 等待首个 token 的思考光球 -->
          <span v-if="m.role === 'assistant' && m.shown === 0 && (status === 'waiting' || status === 'streaming')" class="orb">
            <i /><i /><i />
          </span>
          <template v-else>{{ m.text.slice(0, m.shown) }}<span v-if="m.role === 'assistant' && m.shown < m.text.length" class="caret">▌</span></template>
        </div>
      </TransitionGroup>

      <div v-if="status === 'error'" class="error-text">{{ t('chat.error') }}</div>

      <form v-if="messages.length > 0 && status !== 'waiting'" class="ai-follow" @submit.prevent="ask">
        <input
          v-model="input"
          type="text"
          maxlength="200"
          :placeholder="t('chat.askPh')"
          :disabled="status === 'streaming'"
        />
        <button class="btn small" type="submit" :disabled="status === 'streaming' || input.trim() === ''">
          {{ status === 'streaming' ? t('chat.busy') : t('chat.send') }}
        </button>
      </form>
    </template>
  </section>
</template>

<style scoped>
.ai-panel { margin-top: 18px; }
.ai-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.ai-tag {
  background: linear-gradient(120deg, color-mix(in srgb, var(--lavender) 25%, transparent), color-mix(in srgb, var(--pink) 25%, transparent));
  border-color: color-mix(in srgb, var(--pink) 60%, transparent);
  margin-left: 8px;
}
.ai-empty { text-align: center; padding: 14px 0 4px; }
.ai-empty .btn { animation: empty-pulse 2.4s ease-in-out infinite; }
@keyframes empty-pulse {
  0%, 100% { box-shadow: 0 0 0 color-mix(in srgb, var(--gold) 0%, transparent); }
  50% { box-shadow: 0 0 22px color-mix(in srgb, var(--gold) 35%, transparent); }
}
.ai-thread { display: flex; flex-direction: column; gap: 12px; margin-top: 14px; }
.ai-msg {
  max-width: 92%;
  padding: 12px 16px;
  line-height: 1.9;
  font-size: 0.95rem;
  white-space: pre-wrap;
  word-break: break-word;
}
.ai-msg.user {
  align-self: flex-end;
  background: rgba(124, 107, 214, 0.28);
  border: 1px solid color-mix(in srgb, var(--lavender) 50%, transparent);
  border-radius: 14px 14px 3px 14px;
}
.ai-msg.assistant {
  align-self: flex-start;
  background: rgba(30, 26, 69, 0.72);
  border: 1px solid color-mix(in srgb, var(--gold) 35%, transparent);
  border-radius: 14px 14px 14px 3px;
}
.caret { color: var(--gold-bright); animation: caret-blink 0.85s steps(2) infinite; }
@keyframes caret-blink { 50% { opacity: 0; } }
.bubble-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.bubble-enter-from { opacity: 0; transform: translateY(10px) scale(0.97); }

/* 思考光球 */
.orb { display: inline-flex; align-items: center; gap: 7px; padding: 6px 2px; }
.orb i {
  width: 9px; height: 9px; border-radius: 50%;
  background: radial-gradient(circle at 32% 32%, #fff6d8, var(--gold-bright) 55%, #b98a2e);
  box-shadow: 0 0 10px color-mix(in srgb, var(--gold) 90%, transparent);
  animation: orb-glow 1s ease-in-out infinite;
}
.orb i:nth-child(2) { animation-delay: 0.16s; background: radial-gradient(circle at 32% 32%, #ffe9f4, var(--pink) 55%, #b04a7a); box-shadow: 0 0 10px color-mix(in srgb, var(--pink) 90%, transparent); }
.orb i:nth-child(3) { animation-delay: 0.32s; background: radial-gradient(circle at 32% 32%, #e9fff6, var(--mint) 55%, #2e8a6e); box-shadow: 0 0 10px color-mix(in srgb, var(--mint) 90%, transparent); }
@keyframes orb-glow {
  0%, 100% { transform: translateY(0) scale(0.85); opacity: 0.65; }
  50% { transform: translateY(-5px) scale(1.15); opacity: 1; }
}

.ai-follow { display: flex; gap: 10px; margin-top: 14px; }
.ai-follow input { flex: 1; }
.reading-panel { margin-top: 26px; }
</style>
