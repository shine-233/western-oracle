/**
 * 皮肤风味层（Skin Flair）：让公共部件在每套皮肤下有"形状级"差异。
 * 覆盖五类此前全皮肤同款的元素：
 *   ① .divider-star 分隔符 ② .btn 按钮形态 ③ .tag 标签胶囊
 *   ④ 标题笔触(h1/h2) ⑤ 滚动条。
 * 只追加 CSS，不改令牌；由 main.ts 调用 initSkinFlair() 注入一次。
 */

const FLAIR = String.raw`
/* ============ 午夜星野（默认）：圆润金边，微光呼吸 ============ */
html:not([data-theme]) .divider-star { letter-spacing: 0.9em; text-shadow: 0 0 12px rgba(245,200,110,0.55); }
html:not([data-theme]) .btn { box-shadow: 0 3px 0 rgba(245,200,110,0.35); }
html:not([data-theme]) ::-webkit-scrollbar-thumb { background: linear-gradient(var(--gold), var(--lavender)); }

/* ============ 墨韵符箓：直角朱砂印，竖排意趣 ============ */
[data-theme='inkpaper'] .btn { border-radius: 4px; box-shadow: 2px 2px 0 rgba(176,58,46,0.45); }
[data-theme='inkpaper'] .divider-star { content: '◆'; letter-spacing: 1.4em; color: var(--pink); }
[data-theme='inkpaper'] .tag { border-radius: 3px; transform: rotate(-1.5deg); }
[data-theme='inkpaper'] ::-webkit-scrollbar { width: 10px; }
[data-theme='inkpaper'] ::-webkit-scrollbar-track { background: var(--void-3); }
[data-theme='inkpaper'] ::-webkit-scrollbar-thumb { background: var(--pink); border: 2px solid var(--void-3); }

/* ============ 糖果糖果屋：全圆胶囊+奶昔描边 ============ */
[data-theme='candy'] .btn { border-radius: 999px; border-width: 3px; box-shadow: 0 4px 0 rgba(0,0,0,0.18); }
[data-theme='candy'] .btn:hover { transform: translateY(-3px) rotate(-1deg); }
[data-theme='candy'] .divider-star { letter-spacing: 0.4em; filter: drop-shadow(0 2px 0 rgba(255,255,255,0.65)); }
[data-theme='candy'] .tag { border-radius: 999px; border-width: 2px; }
[data-theme='candy'] ::-webkit-scrollbar-thumb { background: var(--pink); border-radius: 999px; border: 2px solid #fff; }

/* ============ 黄铜机械：铆钉方钮，双线框 ============ */
[data-theme='brass'] .btn {
  border-radius: 8px;
  border-style: double;
  border-width: 4px;
  box-shadow: inset 0 0 0 2px rgba(0,0,0,0.25), 0 3px 0 rgba(0,0,0,0.4);
}
[data-theme='brass'] .divider-star { letter-spacing: 1.1em; opacity: 0.85; }
[data-theme='brass'] .tag { border-radius: 6px; border-style: double; }
[data-theme='brass'] ::-webkit-scrollbar-thumb { background: var(--gold); border-radius: 0; }

/* ============ 极光长廊：柔雾胶囊+渐变流光 ============ */
[data-theme='aurora'] .btn {
  border-radius: 999px;
  background-image: linear-gradient(120deg, color-mix(in srgb, var(--mint) 22%, transparent), color-mix(in srgb, var(--pink) 18%, transparent));
}
[data-theme='aurora'] .divider-star { letter-spacing: 1.6em; filter: blur(0.3px); }
[data-theme='aurora'] ::-webkit-scrollbar-thumb { background: linear-gradient(var(--mint), var(--pink)); border-radius: 999px; }

/* ============ 赛博终端：切角+扫描线+故障字距 ============ */
[data-theme='cyber'] .btn {
  border-radius: 0;
  clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
  letter-spacing: 0.18em;
}
[data-theme='cyber'] .divider-star { letter-spacing: 0.2em; color: var(--mint); text-decoration: overline; }
[data-theme='cyber'] .tag { border-radius: 0; clip-path: polygon(6px 0, 100% 0, 100% 100%, 0 100%, 0 6px); }
[data-theme='cyber'] h2 { text-shadow: 2px 0 var(--pink), -2px 0 var(--mint); }
[data-theme='cyber'] ::-webkit-scrollbar { width: 8px; }
[data-theme='cyber'] ::-webkit-scrollbar-thumb { background: var(--mint); border-radius: 0; }

/* ============ 敦煌壁彩：圆角藻井纹意，宽字距 ============ */
[data-theme='dunhuang'] .btn { border-radius: 14px 4px 14px 4px; border-width: 2px; }
[data-theme='dunhuang'] .divider-star { letter-spacing: 1.8em; }
[data-theme='dunhuang'] .tag { border-radius: 10px 2px 10px 2px; }
[data-theme='dunhuang'] ::-webkit-scrollbar-thumb { background: var(--gold); border-radius: 10px 2px 10px 2px; }

/* ============ 花札花筵：花瓣圆钮 ============ */
[data-theme='hanafuda'] .btn { border-radius: 18px 6px 18px 6px; }
[data-theme='hanafuda'] .divider-star { letter-spacing: 0.7em; }
[data-theme='hanafuda'] .tag { border-radius: 12px 4px 12px 4px; }
[data-theme='hanafuda'] ::-webkit-scrollbar-thumb { background: var(--pink); border-radius: 12px 4px 12px 4px; }

/* ============ 哥特夜礼：尖角+双描线+暗红衬光 ============ */
[data-theme='goth'] .btn {
  border-radius: 0;
  border-width: 3px;
  border-color: var(--danger);
  box-shadow: inset 0 0 0 1.5px rgba(255,255,255,0.08), 0 0 14px rgba(0,0,0,0.6);
}
[data-theme='goth'] .divider-star { letter-spacing: 2em; color: var(--danger); }
[data-theme='goth'] .tag { border-radius: 0; border-color: var(--danger); }
[data-theme='goth'] h2 { font-style: italic; letter-spacing: 0.24em; }
[data-theme='goth'] ::-webkit-scrollbar-thumb { background: var(--danger); border-radius: 0; }

/* ============ 深渊之底：幽幽窄条，气泡圆钮 ============ */
[data-theme='abyss'] .btn { border-radius: 50% / 38%; padding-inline: 26px; }
[data-theme='abyss'] .divider-star { letter-spacing: 1.2em; opacity: 0.6; filter: blur(0.4px); }
[data-theme='abyss'] .tag { border-radius: 50% / 60%; }
[data-theme='abyss'] ::-webkit-scrollbar-thumb { background: rgba(125,232,195,0.4); border-radius: 999px; }

/* ============ 玉色青瓷：釉面细框，内敛 ============ */
[data-theme='jade'] .btn { border-radius: 10px; border-width: 1.5px; box-shadow: inset 0 0 10px rgba(255,255,255,0.08); }
[data-theme='jade'] .divider-star { letter-spacing: 1.35em; opacity: 0.8; }
[data-theme='jade'] .tag { border-radius: 8px; }
[data-theme='jade'] ::-webkit-scrollbar-thumb { background: var(--mint); border-radius: 8px; }

/* ============ 黑白 Noir：硬朗粗衬线感，反白 hover ============ */
[data-theme='noir'] .btn { border-radius: 2px; border-width: 2px; letter-spacing: 0.22em; }
[data-theme='noir'] .btn:hover { filter: invert(0.92); }
[data-theme='noir'] .divider-star { letter-spacing: 2.4em; font-weight: bold; }
[data-theme='noir'] .tag { border-radius: 2px; border-width: 2px; }
[data-theme='noir'] ::-webkit-scrollbar { width: 12px; }
[data-theme='noir'] ::-webkit-scrollbar-thumb { background: var(--ink); border: 3px solid var(--void-1); }

/* ============ 樱花前线：樱色柔角+花瓣悬停 ============ */
[data-theme='sakura'] .btn { border-radius: 16px 16px 16px 4px; }
[data-theme='sakura'] .btn:hover::after { content: ' ❀'; }
[data-theme='sakura'] .divider-star { letter-spacing: 0.8em; }
[data-theme='sakura'] .tag { border-radius: 14px 14px 14px 4px; }
[data-theme='sakura'] ::-webkit-scrollbar-thumb { background: var(--pink); border-radius: 14px 4px 14px 4px; }

/* ============ 爱琴海白墙：蓝白方圆折中，海浪分隔 ============ */
[data-theme='aegean'] .btn { border-radius: 6px 18px 6px 18px; box-shadow: 0 3px 0 color-mix(in srgb, var(--mint) 45%, transparent); }
[data-theme='aegean'] .divider-star { letter-spacing: 1em; }
[data-theme='aegean'] .tag { border-radius: 6px 14px 6px 14px; }
[data-theme='aegean'] ::-webkit-scrollbar-thumb { background: var(--mint); border-radius: 6px 14px 6px 14px; }
`

let injected = false

/** 注入皮肤风味层（幂等），在 main.ts 初始化阶段调用 */
export function initSkinFlair(): void {
  if (injected || typeof document === 'undefined') return
  const style = document.createElement('style')
  style.id = 'wo-skin-flair'
  style.textContent = FLAIR
  document.head.append(style)
  injected = true
}
