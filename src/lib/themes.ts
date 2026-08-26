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
    descZh: '默认的紫金夜空，露娜出生的地方：面板镀着金色微尘。',
    descEn: 'The default violet-gold night sky where Luna was born — panels dusted with gold.',
    swatch: ['#1e1a45', '#f5c86e', '#ff9fce'],
    vars: {},
    extras: `
[data-theme='midnight'] .panel {
  background-image:
    radial-gradient(140px 70px at 88% 0%, rgba(245, 200, 110, 0.07), transparent 72%),
    radial-gradient(90px 50px at 6% 100%, rgba(255, 159, 206, 0.05), transparent 70%),
    linear-gradient(160deg, var(--void-2), var(--void-1));
}
[data-theme='midnight'] body::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image:
    radial-gradient(1.5px 1.5px at 12% 22%, rgba(245, 200, 110, 0.5), transparent 100%),
    radial-gradient(1.5px 1.5px at 64% 8%, rgba(255, 159, 206, 0.4), transparent 100%),
    radial-gradient(1.5px 1.5px at 84% 52%, rgba(245, 200, 110, 0.4), transparent 100%),
    radial-gradient(1.5px 1.5px at 30% 76%, rgba(179, 166, 247, 0.45), transparent 100%),
    radial-gradient(1.5px 1.5px at 52% 40%, rgba(245, 200, 110, 0.35), transparent 100%);
  animation: wo-midnight-dust 18s ease-in-out infinite alternate;
}
@keyframes wo-midnight-dust {
  from { opacity: 0.5; transform: translateY(0); }
  to { opacity: 1; transform: translateY(-14px); }
}
[data-theme='midnight'] ::selection { background: rgba(255, 159, 206, 0.45); }
@media (prefers-reduced-motion: reduce) {
  [data-theme='midnight'] body::after { animation: none; }
}
`,
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
  {
    id: 'noir',
    nameZh: '黑金塔罗',
    nameEn: 'Tarot Noir',
    descZh: '装饰艺术式的黑与金：发丝描线、鎏金衬线，牌桌上的高级感。',
    descEn: 'Art-deco black & brass — hairline gold frames and serif poise.',
    swatch: ['#141009', '#d9b96e', '#a8342a'],
    vars: {
      '--void-0': '#0c0a08',
      '--void-1': '#141009',
      '--void-2': '#1c160d',
      '--void-3': '#262013',
      '--gold': '#b08d3f',
      '--gold-bright': '#d9b96e',
      '--pink': '#a8342a',
      '--pink-soft': '#c25045',
      '--mint': '#6e7d4f',
      '--lavender': '#8a7a55',
      '--lavender-soft': '#b3a37c',
      '--ink': '#f2e8d0',
      '--ink-dim': '#a5946f',
      '--danger': '#d4503f',
    },
    extras: `
[data-theme='noir'] body {
  background:
    radial-gradient(900px 480px at 50% -12%, rgba(217, 185, 110, 0.09), transparent 60%),
    linear-gradient(175deg, #171209 0%, #0c0a08 70%, #070503 100%) !important;
}
[data-theme='noir'] .panel {
  box-shadow:
    inset 0 0 0 1px rgba(217, 185, 110, 0.30),
    inset 0 0 0 5px rgba(12, 10, 8, 0.92),
    inset 0 0 0 6px rgba(217, 185, 110, 0.16),
    6px 6px 0 rgba(5, 4, 2, 0.8);
}
[data-theme='noir'] h2, [data-theme='noir'] h3 { letter-spacing: 0.14em; }
[data-theme='noir'] .divider-star { color: var(--gold-bright); text-shadow: 0 0 14px rgba(217, 185, 110, 0.65); }
[data-theme='noir'] .starfield { filter: grayscale(0.55) brightness(0.85); }
[data-theme='noir'] ::selection { background: rgba(217, 185, 110, 0.42); }
`,
  },
  {
    id: 'sakura',
    nameZh: '夜樱物语',
    nameEn: 'Sakura Nights',
    descZh: '春夜庭院，花瓣乘着风落进星野里。',
    descEn: 'A spring-night garden where petals drift into the stars.',
    swatch: ['#20121e', '#f27ba0', '#86b28a'],
    vars: {
      '--void-0': '#170d15',
      '--void-1': '#20121e',
      '--void-2': '#2a1826',
      '--void-3': '#35202f',
      '--gold': '#e3a687',
      '--gold-bright': '#f4c1a4',
      '--pink': '#f27ba0',
      '--pink-soft': '#f79cbc',
      '--mint': '#86b28a',
      '--lavender': '#b48ab0',
      '--lavender-soft': '#d0aed0',
      '--ink': '#fbeef4',
      '--ink-dim': '#bd9cb4',
      '--danger': '#e06a7e',
    },
    extras: `
[data-theme='sakura'] body {
  background:
    radial-gradient(1000px 520px at 80% -10%, rgba(242, 123, 160, 0.14), transparent 58%),
    linear-gradient(174deg, #2a1626 0%, #170d15 70%, #0e0710 100%) !important;
}
[data-theme='sakura'] body::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image:
    radial-gradient(7px 5px at 8% 12%, rgba(255, 183, 206, 0.55), transparent 62%),
    radial-gradient(6px 4px at 32% 46%, rgba(255, 203, 222, 0.45), transparent 62%),
    radial-gradient(8px 5px at 58% 24%, rgba(255, 183, 206, 0.40), transparent 62%),
    radial-gradient(6px 4px at 78% 60%, rgba(255, 203, 222, 0.50), transparent 62%),
    radial-gradient(7px 5px at 91% 36%, rgba(255, 183, 206, 0.42), transparent 62%),
    radial-gradient(6px 4px at 18% 74%, rgba(255, 203, 222, 0.44), transparent 62%);
  animation: wo-sakura-fall 26s linear infinite;
}
@keyframes wo-sakura-fall {
  from { background-position: 0 0, 0 0, 0 0, 0 0, 0 0, 0 0; }
  to { background-position: -90px 1080px, 60px 1080px, -40px 1080px, 80px 1080px, -70px 1080px, 50px 1080px; }
}
[data-theme='sakura'] .starfield { filter: hue-rotate(-28deg) brightness(1.02); }
@media (prefers-reduced-motion: reduce) {
  [data-theme='sakura'] body::after { animation: none; }
}
`,
  },
  {
    id: 'aegean',
    nameZh: '爱琴海正午',
    nameEn: 'Aegean Noon',
    descZh: '第二套浅色皮肤：白墙、深蓝穹顶与正午的太阳光斑。',
    descEn: 'The second light skin: whitewash, sea-blue domes and noon sun.',
    swatch: ['#f6fbfd', '#1f7a94', '#e2647a'],
    vars: {
      '--void-0': '#eef6f8',
      '--void-1': '#f6fbfd',
      '--void-2': '#ffffff',
      '--void-3': '#ddeff4',
      '--gold': '#1f7a94',
      '--gold-bright': '#14586e',
      '--pink': '#e2647a',
      '--pink-soft': '#ef8296',
      '--mint': '#2fa08a',
      '--lavender': '#5a7fb5',
      '--lavender-soft': '#7d9cc9',
      '--ink': '#123039',
      '--ink-dim': '#527682',
      '--danger': '#cf4f42',
    },
    extras: `
[data-theme='aegean'] body {
  background:
    radial-gradient(1100px 520px at 78% -12%, rgba(31, 122, 148, 0.16), transparent 58%),
    linear-gradient(170deg, #eaf6fa 0%, #f6fbfd 55%, #dceff5 100%) !important;
  color-scheme: light;
}
[data-theme='aegean'] .starfield { opacity: 0.28; filter: hue-rotate(165deg) saturate(1.2); }
[data-theme='aegean'] .panel,
[data-theme='aegean'] .alm-item {
  background: rgba(255, 255, 255, 0.82) !important;
  border-color: rgba(90, 127, 181, 0.38) !important;
}
[data-theme='aegean'] .site-header {
  background: rgba(246, 251, 253, 0.92) !important;
}
[data-theme='aegean'] ::selection { background: rgba(47, 160, 138, 0.35); }
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
  // 各皮肤的签名级装饰：让每套主题拥有结构性的独特记号，而非仅换色
  parts.push(`
/* ---- 装饰定位基准：主题面板需要 relative ---- */
[data-theme] .panel { position: relative; }
/* ---- inkpaper：朱砂印章 ---- */
[data-theme='inkpaper'] .panel { position: relative; }
[data-theme='inkpaper'] .panel::before {
  content: '神';
  position: absolute; top: 10px; right: 12px;
  width: 26px; height: 26px;
  display: grid; place-items: center;
  font-family: var(--cute); font-size: 0.85rem; color: #f6ece0;
  background: #b03a2e; border-radius: 5px;
  transform: rotate(6deg);
  box-shadow: inset 0 0 0 1.5px rgba(246, 236, 224, 0.55);
  opacity: 0.85;
}
/* ---- cyber：扫描线 + 霓虹角标 ---- */
[data-theme='cyber'] .panel {
  background-image: repeating-linear-gradient(0deg, transparent 0 3px, rgba(0, 229, 255, 0.035) 3px 4px);
}
[data-theme='cyber'] .panel::before {
  content: '';
  position: absolute; inset: -2px;
  pointer-events: none;
  border-top: 2px solid var(--gold); border-left: 2px solid var(--gold);
  width: 18px; height: 18px;
  filter: drop-shadow(0 0 4px var(--gold));
}
/* ---- hanafuda：花札花角 ---- */
[data-theme='hanafuda'] .panel::before {
  content: '❀';
  position: absolute; top: 8px; left: 12px;
  color: var(--pink); font-size: 1rem; opacity: 0.8;
  text-shadow: 0 0 8px rgba(232, 81, 63, 0.5);
}
[data-theme='hanafuda'] .panel::after {
  content: '❀';
  position: absolute; bottom: 8px; right: 12px;
  color: var(--gold); font-size: 0.8rem; opacity: 0.65;
}
/* ---- goth：银烛光晕 + 花体角饰 ---- */
[data-theme='goth'] .panel {
  box-shadow: inset 0 0 34px rgba(179, 32, 60, 0.09), 0 0 20px rgba(184, 179, 196, 0.08);
}
[data-theme='goth'] .panel::before {
  content: '❦';
  position: absolute; top: 8px; right: 14px;
  color: var(--pink); font-size: 0.95rem; opacity: 0.7;
  animation: goth-flicker 3.4s ease-in-out infinite;
}
@keyframes goth-flicker { 0%, 100% { opacity: 0.7; } 42% { opacity: 0.32; } 47% { opacity: 0.75; } 73% { opacity: 0.45; } }
/* ---- abyss：上浮气泡 ---- */
[data-theme='abyss'] .panel {
  background-image:
    radial-gradient(circle at 88% 18%, rgba(125, 238, 195, 0.16) 0 3px, transparent 4px),
    radial-gradient(circle at 93% 38%, rgba(125, 238, 195, 0.11) 0 2px, transparent 3px),
    radial-gradient(circle at 84% 58%, rgba(159, 208, 232, 0.13) 0 2.5px, transparent 3.5px),
    radial-gradient(circle at 90% 78%, rgba(125, 238, 195, 0.09) 0 2px, transparent 3px);
}
/* ---- dunhuang：石青描边 + 飞天锦色内衬 ---- */
[data-theme='dunhuang'] .panel {
  border-color: rgba(217, 164, 65, 0.55) !important;
  background-image: linear-gradient(180deg, rgba(63, 111, 168, 0.07), transparent 30%);
  box-shadow: inset 0 0 0 1.5px rgba(79, 158, 120, 0.28);
}
/* ---- candy：波点马戏帐篷 ---- */
[data-theme='candy'] .panel {
  background-image: radial-gradient(rgba(255, 158, 203, 0.16) 2px, transparent 2.6px);
  background-size: 16px 16px;
}
/* ---- brass：铆钉双框（四角铆钉） ---- */
[data-theme='brass'] .panel {
  box-shadow:
    inset 0 0 0 2px rgba(201, 151, 63, 0.35),
    inset 0 0 0 5px rgba(23, 18, 8, 0.9),
    inset 0 0 0 6.5px rgba(201, 151, 63, 0.28);
}
[data-theme='brass'] .panel::before {
  content: '';
  position: absolute; inset: 10px;
  pointer-events: none;
  background-image:
    radial-gradient(circle at 7px 7px, #f0c469 0 1.6px, rgba(138, 106, 37, 0.85) 1.6px 3px, transparent 3.4px),
    radial-gradient(circle at calc(100% - 7px) 7px, #f0c469 0 1.6px, rgba(138, 106, 37, 0.85) 1.6px 3px, transparent 3.4px),
    radial-gradient(circle at 7px calc(100% - 7px), #f0c469 0 1.6px, rgba(138, 106, 37, 0.85) 1.6px 3px, transparent 3.4px),
    radial-gradient(circle at calc(100% - 7px) calc(100% - 7px), #f0c469 0 1.6px, rgba(138, 106, 37, 0.85) 1.6px 3px, transparent 3.4px);
}
/* ---- jade：藤蔓角饰 + 幽绿内晕 ---- */
[data-theme='jade'] .panel {
  box-shadow: inset 0 0 40px rgba(102, 217, 163, 0.07);
}
[data-theme='jade'] .panel::before {
  content: '☘';
  position: absolute; bottom: 8px; right: 12px;
  color: var(--mint); font-size: 0.9rem; opacity: 0.55;
}
/* ---- aurora：帐顶极光带 ---- */
[data-theme='aurora'] .panel {
  position: relative; overflow: hidden;
}
[data-theme='aurora'] .panel::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, #67e8f9, #86efac, #8ab8ff, #67e8f9);
  background-size: 300% 100%;
  animation: aurora-drift 7s linear infinite;
  opacity: 0.75;
}
@keyframes aurora-drift { to { background-position: 300% 0; } }
@media (prefers-reduced-motion: reduce) {
  [data-theme='goth'] .panel::before, [data-theme='aurora'] .panel::before { animation: none; }
}
`)
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
