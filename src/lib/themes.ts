/**
 * 皮肤/主题系统：五套风格各自统一的全套皮肤。
 * - 每套皮肤覆盖同一组设计令牌（CSS 变量），内部配色、质感、明暗保持一致
 * - 样式由本文件一次性注入 <style id="wo-themes">，不改动全局样式表
 * - 选择持久化在 localStorage；initThemes() 在应用挂载前调用避免闪色
 */
import { sfx } from './sfx'

export interface OracleTheme {
  id: string
  nameZh: string
  nameEn: string
  descZh: string
  descEn: string
  /** 预览用三色 */
  swatch: [string, string, string]
  vars: Record<string, string>
  /** 该皮肤专属的补充规则（背景、星野滤镜等） */
  extras?: string
}

export const THEMES: OracleTheme[] = [
  {
    id: 'midnight',
    nameZh: '午夜星野',
    nameEn: 'Midnight Starfield',
    descZh: '默认的紫金夜空，露娜出生的地方。',
    descEn: 'The default violet-gold night sky where Luna was born.',
    swatch: ['#1e1a45', '#f5c86e', '#ff9fce'],
    vars: {},
    extras: '',
  },
  {
    id: 'inkpaper',
    nameZh: '墨韵符箓',
    nameEn: 'Ink & Talisman',
    descZh: '宣纸、松墨与朱砂，老卦摊的一盏昏灯。',
    descEn: 'Rice paper, pine soot and cinnabar — a fortune teller\'s dim lantern.',
    swatch: ['#f4ead8', '#2b2620', '#b03a2e'],
    vars: {
      '--void-0': '#efe3cc',
      '--void-1': '#f4ead8',
      '--void-2': '#faf2e2',
      '--void-3': '#e5d7ba',
      '--gold': '#8a6d1d',
      '--gold-bright': '#6d5410',
      '--pink': '#b03a2e',
      '--pink-soft': '#c25a4e',
      '--mint': '#4a7c59',
      '--lavender': '#5b4a8a',
      '--lavender-soft': '#6d5ca0',
      '--ink': '#2b2620',
      '--ink-dim': '#6b6051',
      '--danger': '#a02818',
    },
    extras: `
[data-theme='inkpaper'] body {
  background:
    radial-gradient(1100px 500px at 75% -10%, rgba(176, 58, 46, 0.08), transparent 60%),
    linear-gradient(160deg, #f6eedd 0%, #efe3cc 55%, #e9dbbd 100%) !important;
  color-scheme: light;
}
[data-theme='inkpaper'] .starfield { opacity: 0.16; filter: sepia(0.7); }
[data-theme='inkpaper'] .panel,
[data-theme='inkpaper'] .alm-item {
  background: rgba(255, 250, 238, 0.72) !important;
  border-color: rgba(107, 96, 81, 0.35) !important;
}
[data-theme='inkpaper'] .site-header {
  background: rgba(244, 234, 216, 0.92) !important;
  border-bottom-color: rgba(107, 96, 81, 0.3) !important;
}
`,
  },
  {
    id: 'candy',
    nameZh: '糖果马戏团',
    nameEn: 'Candy Circus',
    descZh: '棉花糖粉与薄荷绿，露娜的马戏团巡游之夜。',
    descEn: 'Cotton-candy pink and mint — Luna\'s circus tour night.',
    swatch: ['#3b1f47', '#ff6fb0', '#5eead4'],
    vars: {
      '--void-0': '#2a1235',
      '--void-1': '#3b1f47',
      '--void-2': '#4b2a59',
      '--void-3': '#5d376c',
      '--gold': '#ffd166',
      '--gold-bright': '#ffe8a3',
      '--pink': '#ff6fb0',
      '--pink-soft': '#ff9ecb',
      '--mint': '#5eead4',
      '--lavender': '#c084fc',
      '--lavender-soft': '#ddaaf9',
      '--ink': '#fff3fa',
      '--ink-dim': '#dcb8d4',
      '--danger': '#ff7b7b',
    },
    extras: `
[data-theme='candy'] body {
  background:
    radial-gradient(900px 480px at 20% 0%, rgba(255, 111, 176, 0.22), transparent 55%),
    radial-gradient(800px 420px at 85% 15%, rgba(94, 234, 212, 0.14), transparent 55%),
    linear-gradient(165deg, #3b1f47 0%, #2a1235 60%, #200c2b 100%) !important;
}
[data-theme='candy'] .starfield { filter: hue-rotate(40deg) saturate(1.35); }
[data-theme='candy'] .panel { box-shadow: 0 10px 34px rgba(255, 111, 176, 0.18); }
`,
  },
  {
    id: 'brass',
    nameZh: '蒸汽天文台',
    nameEn: 'Brass Observatory',
    descZh: '黄铜齿轮与皮革座椅，维多利亚时代的观星室。',
    descEn: 'Brass gears and leather chairs — a Victorian stargazing room.',
    swatch: ['#211a12', '#c9973f', '#7fb069'],
    vars: {
      '--void-0': '#171208',
      '--void-1': '#211a12',
      '--void-2': '#2c2318',
      '--void-3': '#382d1e',
      '--gold': '#c9973f',
      '--gold-bright': '#e8bf74',
      '--pink': '#cd7f52',
      '--pink-soft': '#dfa075',
      '--mint': '#7fb069',
      '--lavender': '#a98fc9',
      '--lavender-soft': '#c4b0dd',
      '--ink': '#f3e9d2',
      '--ink-dim': '#b3a488',
      '--danger': '#e06c5a',
    },
    extras: `
[data-theme='brass'] body {
  background:
    radial-gradient(1000px 520px at 50% -10%, rgba(201, 151, 63, 0.12), transparent 60%),
    linear-gradient(170deg, #241c11 0%, #171208 65%, #100c05 100%) !important;
}
[data-theme='brass'] .starfield { filter: sepia(0.45) saturate(0.85); }
[data-theme='brass'] .panel { border-image: none; }
`,
  },
  {
    id: 'aurora',
    nameZh: '极光雪夜',
    nameEn: 'Aurora Snownight',
    descZh: '冰蓝雪原上空的绿色极光，安静得能听见星星。',
    descEn: 'Green auroras over an ice-blue snowfield, quiet enough to hear stars.',
    swatch: ['#0b1d2e', '#67e8f9', '#86efac'],
    vars: {
      '--void-0': '#081521',
      '--void-1': '#0b1d2e',
      '--void-2': '#12293d',
      '--void-3': '#1a3650',
      '--gold': '#9be7c4',
      '--gold-bright': '#c6f5de',
      '--pink': '#8ab8ff',
      '--pink-soft': '#b3d2ff',
      '--mint': '#67e8f9',
      '--lavender': '#93c5fd',
      '--lavender-soft': '#bdd7fe',
      '--ink': '#eaf6ff',
      '--ink-dim': '#9db8cc',
      '--danger': '#ff9d9d',
    },
    extras: `
[data-theme='aurora'] body {
  background:
    radial-gradient(1200px 600px at 70% -5%, rgba(103, 232, 249, 0.16), transparent 55%),
    radial-gradient(900px 500px at 15% 30%, rgba(134, 239, 172, 0.1), transparent 60%),
    linear-gradient(175deg, #0d2033 0%, #081521 70%, #050d16 100%) !important;
}
[data-theme='aurora'] .starfield { filter: hue-rotate(-30deg) brightness(1.1); }
`,
  },
  {
    id: 'cyber',
    nameZh: '赛博通灵',
    nameEn: 'Cyber Seance',
    descZh: '霓虹符咒在数据夜幕上闪烁：电子水晶球已上线。',
    descEn: 'Neon sigils flicker on a datanight sky: the e-crystal ball is online.',
    swatch: ['#0a0f22', '#00e5ff', '#ff2fb3'],
    vars: {
      '--void-0': '#060913',
      '--void-1': '#0a0f22',
      '--void-2': '#111a33',
      '--void-3': '#1a2647',
      '--gold': '#00e5ff',
      '--gold-bright': '#7dfaff',
      '--pink': '#ff2fb3',
      '--pink-soft': '#ff6fd8',
      '--mint': '#39ff9c',
      '--lavender': '#8b7bff',
      '--lavender-soft': '#b3a6ff',
      '--ink': '#e8f4ff',
      '--ink-dim': '#7f92b8',
      '--danger': '#ff5470',
    },
    extras: `
[data-theme='cyber'] body {
  background:
    radial-gradient(1000px 500px at 25% 0%, rgba(0, 229, 255, 0.12), transparent 55%),
    radial-gradient(900px 480px at 80% 20%, rgba(255, 47, 179, 0.12), transparent 55%),
    linear-gradient(178deg, #0a0f22 0%, #060913 70%, #04060c 100%) !important;
}
[data-theme='cyber'] .starfield { filter: saturate(1.45) hue-rotate(-15deg); }
[data-theme='cyber'] .panel { box-shadow: 0 0 26px rgba(0, 229, 255, 0.09); }
[data-theme='cyber'] ::selection { background: rgba(255, 47, 179, 0.55); }
`,
  },
  {
    id: 'dunhuang',
    nameZh: '敦煌星图',
    nameEn: 'Dunhuang Star Chart',
    descZh: '石窟壁画上的千年星图：石青、石绿与金箔一起发光。',
    descEn: 'A millennium-old star map on cave walls: azurite, malachite and gold leaf aglow.',
    swatch: ['#2e1d09', '#d9a441', '#3f6fa8'],
    vars: {
      '--void-0': '#241708',
      '--void-1': '#2e1d09',
      '--void-2': '#3a2610',
      '--void-3': '#47311a',
      '--gold': '#d9a441',
      '--gold-bright': '#f0c469',
      '--pink': '#c94f38',
      '--pink-soft': '#dd6f52',
      '--mint': '#4f9e78',
      '--lavender': '#3f6fa8',
      '--lavender-soft': '#6a93c4',
      '--ink': '#f2e4c8',
      '--ink-dim': '#b49b74',
      '--danger': '#c04430',
    },
    extras: `
[data-theme='dunhuang'] body {
  background:
    radial-gradient(1100px 520px at 30% 0%, rgba(217, 164, 65, 0.14), transparent 58%),
    radial-gradient(900px 460px at 78% 25%, rgba(63, 111, 168, 0.16), transparent 55%),
    linear-gradient(170deg, #33210c 0%, #241708 68%, #1a1005 100%) !important;
}
[data-theme='dunhuang'] .starfield { filter: sepia(0.5) saturate(1.15); }
[data-theme='dunhuang'] ::selection { background: rgba(201, 79, 56, 0.5); }
`,
  },
  {
    id: 'hanafuda',
    nameZh: '花札夜话',
    nameEn: 'Hanafuda Nights',
    descZh: '靛蓝纸面与朱红短册，牌桌上的一盏纸灯笼。',
    descEn: 'Indigo paper and vermilion ribbons — a paper lantern over the card table.',
    swatch: ['#1a2247', '#e8513f', '#d9b24a'],
    vars: {
      '--void-0': '#131a38',
      '--void-1': '#1a2247',
      '--void-2': '#232c56',
      '--void-3': '#2e3968',
      '--gold': '#e0a63f',
      '--gold-bright': '#f2c96b',
      '--pink': '#e8513f',
      '--pink-soft': '#ef6f5e',
      '--mint': '#5a9367',
      '--lavender': '#7f86c2',
      '--lavender-soft': '#a5aad6',
      '--ink': '#f3ead8',
      '--ink-dim': '#a49cc0',
      '--danger': '#d84a35',
    },
    extras: `
[data-theme='hanafuda'] body {
  background:
    radial-gradient(900px 460px at 78% 8%, rgba(232, 81, 63, 0.12), transparent 55%),
    linear-gradient(172deg, #20294f 0%, #131a38 68%, #0d1229 100%) !important;
}
[data-theme='hanafuda'] .starfield { filter: sepia(0.25) hue-rotate(-10deg); }
`,
  },
  {
    id: 'goth',
    nameZh: '玫瑰哥特',
    nameEn: 'Gothic Rose',
    descZh: '黑曜石教堂里的银烛台与血色玫瑰。',
    descEn: 'Silver candlesticks and blood roses in an obsidian chapel.',
    swatch: ['#190d16', '#b3203c', '#b8b3c4'],
    vars: {
      '--void-0': '#12090f',
      '--void-1': '#190d16',
      '--void-2': '#23121f',
      '--void-3': '#301828',
      '--gold': '#b8b3c4',
      '--gold-bright': '#d6d2e0',
      '--pink': '#b3203c',
      '--pink-soft': '#cf4560',
      '--mint': '#6e8f7c',
      '--lavender': '#8a6f9e',
      '--lavender-soft': '#ad95bd',
      '--ink': '#efe6ee',
      '--ink-dim': '#a08ea0',
      '--danger': '#d44848',
    },
    extras: `
[data-theme='goth'] body {
  background:
    radial-gradient(1000px 520px at 50% -10%, rgba(179, 32, 60, 0.14), transparent 58%),
    radial-gradient(700px 380px at 88% 80%, rgba(184, 179, 196, 0.07), transparent 60%),
    linear-gradient(175deg, #1d1019 0%, #12090f 70%, #0a060a 100%) !important;
}
[data-theme='goth'] .starfield { filter: saturate(0.7) brightness(0.92); }
`,
  },
  {
    id: 'abyss',
    nameZh: '深海遗城',
    nameEn: 'Abyssal Ruins',
    descZh: '沉入海底的星图神殿，发光的水母提灯游过窗前。',
    descEn: 'A drowned star-temple; bioluminescent jelly-lanterns drift past the window.',
    swatch: ['#06202e', '#37d3c0', '#ff7e6b'],
    vars: {
      '--void-0': '#04141f',
      '--void-1': '#06202e',
      '--void-2': '#0a2d40',
      '--void-3': '#0e3a52',
      '--gold': '#37d3c0',
      '--gold-bright': '#7ceee0',
      '--pink': '#ff7e6b',
      '--pink-soft': '#ff9f8f',
      '--mint': '#4de3c2',
      '--lavender': '#6fb3d9',
      '--lavender-soft': '#9fd0e8',
      '--ink': '#e4f6f4',
      '--ink-dim': '#8ab0bd',
      '--danger': '#ff6b5e',
    },
    extras: `
[data-theme='abyss'] body {
  background:
    radial-gradient(900px 480px at 20% 10%, rgba(55, 211, 192, 0.14), transparent 55%),
    radial-gradient(800px 420px at 82% 30%, rgba(255, 126, 107, 0.09), transparent 58%),
    linear-gradient(176deg, #07293a 0%, #04141f 72%, #020b12 100%) !important;
}
[data-theme='abyss'] .starfield { filter: hue-rotate(140deg) brightness(1.05); }
[data-theme='abyss'] ::selection { background: rgba(255, 126, 107, 0.5); }
`,
  },
  {
    id: 'jade',
    nameZh: '翡翠秘教',
    nameEn: 'Emerald Arcanum',
    descZh: '地下圣所的烛光与翡翠神像，秘密在苔藓下面。',
    descEn: 'Candlelit crypt and jade idols — secrets sleep beneath the moss.',
    swatch: ['#0a1c12', '#66d9a3', '#d8b24a'],
    vars: {
      '--void-0': '#06120c',
      '--void-1': '#0a1c12',
      '--void-2': '#10281a',
      '--void-3': '#173523',
      '--gold': '#d8b24a',
      '--gold-bright': '#efd68a',
      '--pink': '#b86fa0',
      '--pink-soft': '#cf8fba',
      '--mint': '#66d9a3',
      '--lavender': '#9fc4b7',
      '--lavender-soft': '#c0ddd2',
      '--ink': '#eef7ea',
      '--ink-dim': '#a3bda9',
      '--danger': '#e07a6a',
    },
    extras: `
[data-theme='jade'] body {
  background:
    radial-gradient(1000px 540px at 50% -8%, rgba(102, 217, 163, 0.12), transparent 58%),
    radial-gradient(800px 420px at 12% 35%, rgba(216, 178, 74, 0.09), transparent 60%),
    linear-gradient(172deg, #0c2015 0%, #06120c 72%, #040b07 100%) !important;
}
[data-theme='jade'] .starfield { filter: hue-rotate(60deg) brightness(0.96); }
`,
  },
]

const STORAGE_KEY = 'wo-theme'
let styleInjected = false

function injectStyles(): void {
  if (styleInjected) return
  styleInjected = true
  const parts: string[] = []
  for (const t of THEMES) {
    if (!t.id || t.id === 'midnight') continue
    const varLines = Object.entries(t.vars)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n')
    parts.push(`[data-theme='${t.id}'] {\n${varLines}\n}\n${t.extras ?? ''}`)
  }
  const tag = document.createElement('style')
  tag.id = 'wo-themes'
  tag.textContent = parts.join('\n')
  document.head.appendChild(tag)
}

export function getThemeId(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? 'midnight'
  } catch {
    return 'midnight'
  }
}

export function setTheme(id: string): void {
  const theme = THEMES.find((t) => t.id === id) ?? THEMES[0]!
  injectStyles()
  if (theme.id === 'midnight') {
    delete document.documentElement.dataset.theme
  } else {
    document.documentElement.dataset.theme = theme.id
  }
  // PWA 浏览器状态栏跟随皮肤底色
  try {
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'theme-color'
      document.head.appendChild(meta)
    }
    meta.content = theme.vars['--void-1'] ?? '#151232'
  } catch {
    /* noop */
  }
  try {
    localStorage.setItem(STORAGE_KEY, theme.id)
  } catch {
    /* noop */
  }
}

/** 按顺序循环到下一套皮肤（供快捷切换） */
export function cycleTheme(): OracleTheme {
  const idx = THEMES.findIndex((t) => t.id === getThemeId())
  const next = THEMES[(idx + 1) % THEMES.length]!
  setTheme(next.id)
  sfx.pop()
  return next
}

/** 应用启动时调用：注入样式并恢复上次选择（须在 mount 前，避免闪色） */
export function initThemes(): void {
  injectStyles()
  const saved = getThemeId()
  if (saved !== 'midnight') setTheme(saved)
}
