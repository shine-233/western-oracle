import { loadJSON, saveJSON } from './storage'

export interface AiConfig {
  baseUrl: string
  apiKey: string
  model: string
}

const DEFAULT_CONFIG: AiConfig = {
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o-mini',
}

export function getAiConfig(): AiConfig {
  return { ...DEFAULT_CONFIG, ...loadJSON<Partial<AiConfig>>('ai-config', {}) }
}

export function saveAiConfig(cfg: AiConfig): void {
  saveJSON('ai-config', cfg)
}

export function isAiEnabled(): boolean {
  return getAiConfig().apiKey.trim() !== ''
}

/**
 * 调用 OpenAI 兼容的 chat/completions 接口。
 * 未配置 key、请求失败或返回异常时返回 null，调用方应回退到本地规则文案。
 */
export async function askAI(system: string, user: string): Promise<string | null> {
  const cfg = getAiConfig()
  if (cfg.apiKey.trim() === '') return null

  try {
    const res = await fetch(`${cfg.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.8,
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const content: unknown = data?.choices?.[0]?.message?.content
    return typeof content === 'string' && content.trim() !== '' ? content.trim() : null
  } catch {
    return null
  }
}

/** 各模块共用的系统提示词 */
export function oracleSystemPrompt(): string {
  return [
    '你是一位博学而温和的西方神秘学解读师，精通塔罗、西洋占星、生命灵数与卢恩符文。',
    '请用简体中文回答：语言优美但克制，先给出核心洞见，再给具体建议，最后用一句诗意的话收尾。',
    '不要危言耸听，不做医疗/法律/投资方面的断言。全文控制在 300 字以内。',
  ].join('\n')
}
