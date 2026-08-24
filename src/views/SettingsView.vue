<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { askAI, getAiConfig, saveAiConfig } from '../lib/ai'

const baseUrl = ref(getAiConfig().baseUrl)
const apiKey = ref(getAiConfig().apiKey)
const model = ref(getAiConfig().model)

const saved = ref(false)
const testing = ref(false)
const testResult = ref<string | null>(null)

onMounted(() => {
  const cfg = getAiConfig()
  baseUrl.value = cfg.baseUrl
  apiKey.value = cfg.apiKey
  model.value = cfg.model
})

function save(): void {
  saveAiConfig({ baseUrl: baseUrl.value.trim(), apiKey: apiKey.value.trim(), model: model.value.trim() })
  saved.value = true
  setTimeout(() => (saved.value = false), 2000)
}

async function test(): Promise<void> {
  if (testing.value) return
  save()
  testing.value = true
  testResult.value = null
  const res = await askAI('你是连通性测试助手。', '收到请只回复两个字：畅通')
  testResult.value = res === null ? '连接失败：请检查地址、密钥、模型名，或浏览器到该接口的网络/CORS。' : `连接成功，模型回复：${res}`
  testing.value = false
}
</script>

<template>
  <h2>设置 · AI 解读</h2>
  <p class="hint">
    本站默认使用内置的本地规则文案进行解读。若想获得更个性化的 AI 解读，可配置任意 OpenAI 兼容接口
    （OpenAI、DeepSeek、Moonshot、本地 Ollama 等）。密钥只保存在你浏览器的 localStorage 中，
    请求从你的设备直接发往你填写的服务商，本站不经手任何数据。
  </p>

  <section class="panel" style="margin-top: 18px; max-width: 640px;">
    <label class="field">
      <span>接口地址（Base URL）</span>
      <input v-model="baseUrl" type="text" placeholder="https://api.openai.com/v1" />
    </label>
    <label class="field">
      <span>API Key</span>
      <input v-model="apiKey" type="password" placeholder="sk-..." autocomplete="off" />
    </label>
    <label class="field">
      <span>模型名称</span>
      <input v-model="model" type="text" placeholder="gpt-4o-mini / deepseek-chat / qwen-plus ..." />
    </label>
    <div style="display: flex; gap: 12px; align-items: center;">
      <button class="btn small" @click="save">保存配置</button>
      <button class="btn ghost small" :disabled="testing || apiKey.trim() === ''" @click="test">
        {{ testing ? '测试中…' : '测试连接' }}
      </button>
      <span v-if="saved" class="hint" style="color: var(--gold-bright);">已保存 ✓</span>
    </div>
    <p v-if="testResult" class="hint" :class="{ 'error-text': testResult.startsWith('连接失败') }">{{ testResult }}</p>
    <p class="hint" style="margin-top: 18px; font-style: italic;">
      提示：浏览器直连第三方 API 需要对方允许跨域（CORS）。若测试失败但配置无误，通常是该服务商不支持浏览器端调用。
    </p>
  </section>

  <section class="panel" style="margin-top: 20px; max-width: 640px;">
    <h3 style="margin-top: 0;">隐私说明</h3>
    <p class="hint">
      除「你主动配置并使用的 AI 接口」外，本站不发起任何网络请求：没有统计、没有埋点、没有账号系统。
      你的出生信息与抽牌历史仅存在于本机。
    </p>
  </section>
</template>
