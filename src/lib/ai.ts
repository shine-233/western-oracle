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

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/**
 * 调用 OpenAI 兼容的 chat/completions 接口（一次性返回）。
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

/**
 * 流式调用（SSE）。每收到一段增量文本就调用 onDelta。
 * 返回完整文本；失败返回 null。可通过 AbortSignal 中断。
 */
export async function streamChat(
  messages: ChatMessage[],
  onDelta: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<string | null> {
  const cfg = getAiConfig()
  if (cfg.apiKey.trim() === '') return null

  let res: Response
  try {
    res = await fetch(`${cfg.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        messages,
        temperature: 0.8,
        stream: true,
      }),
    })
  } catch {
    return null
  }
  if (!res.ok || !res.body) return null

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  let full = ''

  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })

      // 按 SSE 事件切分
      let nl: number
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim()
        buf = buf.slice(nl + 1)
        if (line === '' || line.startsWith(':')) continue
        if (!line.startsWith('data:')) continue
        const data = line.slice(5).trim()
        if (data === '[DONE]') continue
        try {
          const json = JSON.parse(data) as {
            choices?: Array<{ delta?: { content?: unknown } }>
          }
          const piece = json.choices?.[0]?.delta?.content
          if (typeof piece === 'string' && piece.length > 0) {
            full += piece
            onDelta(piece)
          }
        } catch {
          /* 忽略无法解析的心跳/杂项行 */
        }
      }
    }
  } catch {
    if (full === '') return null
    // 中途断流：已收到的内容仍然可用
  }

  return full.trim() === '' ? null : full.trim()
}

/** 各模块共用的系统提示词 */
export function oracleSystemPrompt(): string {
  return [
    '你是一位博学而温和的西方神秘学解读师，精通塔罗、西洋占星、生命灵数与卢恩符文。',
    '请用简体中文回答：语言优美但克制，先给出核心洞见，再给具体建议，最后用一句诗意的话收尾。',
    '不要危言耸听，不做医疗/法律/投资方面的断言。',
  ].join('\n')
}
