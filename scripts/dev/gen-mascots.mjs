// 吉祥物像素画生成器：代码化绘制 → 自动描边 → 输出 TS + BMP 预览
// 用法: node scripts/dev/gen-mascots.mjs
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const W = 48, H = 52
const PALETTE = {
  K: '#2e2650', E: '#3a2e5c', S: '#ffdcc5', B: '#ff9fce', W: '#fff6ec',
  G: '#ffd76e', H: '#6b5bd6', D: '#5a4bbf', L: '#b3a6f7', O: '#8a5a3b',
  F: '#453a72', P: '#ff9fce', C: '#a9c4e8', N: '#5fb8a5', M: '#8f8ac2',
  V: '#7de8c3', R: '#ff8fb8', T: '#f5c86e',
}

const newCanvas = () => Array.from({ length: H }, () => Array(W).fill('.'))
const P = (c, x, y, ch) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && x < W && y >= 0 && y < H) c[y][x] = ch }
const R = (c, x, y, w, h, ch) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) P(c, x + i, y + j, ch) }
const E4 = (c, x, y, w, h, ch) => {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const dx = (i - (w - 1) / 2) / (w / 2), dy = (j - (h - 1) / 2) / (h / 2)
    if (dx * dx + dy * dy <= 1.08) P(c, x + i, y + j, ch)
  }
}
const ERING = (c, cx, cy, rx, ry, ch) => {
  for (let a = 0; a < 360; a += 2) {
    const t = (a * Math.PI) / 180
    P(c, cx + Math.cos(t) * rx, cy + Math.sin(t) * ry, ch)
    if (rx > 2 && ry > 2) P(c, cx + Math.cos(t) * (rx - 1), cy + Math.sin(t) * (ry - 1), ch)
  }
}
const LN = (c, x0, y0, x1, y1, ch) => {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1)
  for (let i = 0; i <= n; i++) P(c, x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, ch)
}
function outline(c) {
  const src = c.map((r) => r.slice())
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (src[y][x] !== '.') continue
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy
      if (nx >= 0 && nx < W && ny >= 0 && ny < H && src[ny][nx] !== '.') { c[y][x] = 'K'; break }
    }
  }
}
/* ---------- 共享身体 ---------- */
// cx=24 中心。头 y8-27，躯干 y27-30，裙 y30-hemRow，腿/靴到 y50
function face(c, cx = 24) { // 五官（头饰覆盖脸后需重画）
  R(c, cx - 8, 16, 3, 3, 'E'); P(c, cx - 6, 17, 'W') // 左眼
  R(c, cx + 5, 16, 3, 3, 'E'); P(c, cx + 7, 17, 'W') // 右眼
  R(c, cx - 11, 20, 3, 1, 'B'); R(c, cx + 9, 20, 3, 1, 'B') // 腮红
  P(c, cx - 1, 21, 'K'); P(c, cx, 21, 'K'); P(c, cx + 1, 21, 'K') // 嘴
}
function body(c, { robe = 'D', apron = true, hemRow = 46, sleeve = 'F', skirtW = 34, bangs = 'L' } = {}) {
  const cx = 24
  E4(c, cx - 12, 8, 25, 20, 'S') // 脸
  if (bangs) { // 锯齿刘海
    R(c, cx - 10, 10, 20, 2, bangs)
    for (let i = 0; i < 10; i++) R(c, cx - 10 + i * 2 + (i % 2), 12, 1, 2, bangs)
  }
  face(c)
  R(c, cx - 10, 27, 20, 3, sleeve)   // 肩
  R(c, cx - 14, 29, 28, 4, sleeve)
  R(c, cx - 15, 31, 4, 8, sleeve); R(c, cx + 11, 31, 4, 8, sleeve) // 垂袖
  R(c, cx - 15, 38, 4, 2, 'S'); R(c, cx + 11, 38, 4, 2, 'S')       // 手
  const rows = hemRow - 30
  for (let j = 0; j <= rows; j++) {
    const wdt = Math.round(22 + ((skirtW - 22) * j) / rows)
    R(c, cx - wdt / 2, 30 + j, wdt, 1, robe)
  }
  if (apron) {
    R(c, cx - 6, 29, 12, 6, 'W')
    R(c, cx - 9, 32, 18, 3, 'W')
    P(c, cx, 29, robe); P(c, cx - 1, 29, robe); P(c, cx + 1, 29, robe)
  }
  R(c, cx - 5, 35, 2, 2, 'G'); R(c, cx + 4, 35, 2, 2, 'G') // 金扣
  R(c, cx - skirtW / 2 + 1, hemRow - 1, skirtW - 2, 2, 'W') // 白裙摆
  R(c, cx - 9, hemRow + 1, 5, 3, robe); R(c, cx + 5, hemRow + 1, 5, 3, robe) // 腿
  boot(c, cx - 11); boot(c, cx + 7)
  function boot(c, bx) { R(c, bx, hemRow + 4, 6, 2, 'O'); R(c, bx, hemRow + 6, 7, 1, 'K') }
}
function star4(c, x, y, ch) { P(c, x, y - 1, ch); P(c, x, y + 1, ch); P(c, x - 1, y, ch); P(c, x + 1, y, ch); P(c, x, y, ch) }

/* ---------- 1. 墨墨：猫耳兜帽 + 怀里牌堆 + 尾巴 ---------- */
function drawCat() {
  const c = newCanvas()
  body(c, {})
  const cx = 24
  E4(c, cx - 13, 6, 27, 23, 'F')            // 兜帽包住脸
  E4(c, cx - 11, 9, 23, 18, 'S')
  R(c, cx - 10, 10, 20, 2, 'F'); for (let i = 0; i < 10; i++) R(c, cx - 10 + i * 2, 12, 1, 1, 'F') // 帽沿压发
  face(c)
  // 猫耳（左右大三角）
  tri(c, cx - 13, 2, 10, 'F', 'P'); tri(c, cx + 3, 2, 10, 'F', 'P')
  function tri(c, x0, y0, wdt, fill, inner) {
    for (let j = 0; j < wdt; j++) {
      const seg = wdt - j * 2
      if (seg <= 0) break
      R(c, x0 + j, y0 + j, seg, 1, fill)
      if (j > 2 && seg > 4) R(c, x0 + j + 2, y0 + j, seg - 4, 1, inner)
    }
  }
  // 怀里牌堆（胸前，加大加高）
  cardStack(c, cx - 8, 32)
  function cardStack(c, x, y) {
    R(c, x, y, 16, 9, 'K')          // 牌框
    R(c, x + 1, y + 1, 14, 7, 'W')
    R(c, x + 2, y + 2, 12, 1, 'D'); R(c, x + 2, y + 5, 12, 1, 'D') // 牌背纹
    R(c, x + 3, y + 1, 10, 4, 'W')  // 上层翻开的牌
    star4(c, x + 8, y + 2, 'G')
    P(c, x + 4, y + 3, 'G'); P(c, x + 11, y + 3, 'G')
  }
  // 尾巴（左外侧翘起，避开裙摆）
  const tp = [[8, 45], [5, 42], [3, 38], [3, 34], [5, 30], [8, 28]]
  for (let i = 0; i < tp.length - 1; i++) {
    LN(c, tp[i][0], tp[i][1], tp[i + 1][0], tp[i + 1][1], 'F')
    LN(c, tp[i][0] + 1, tp[i][1] + 1, tp[i + 1][0] + 1, tp[i + 1][1] + 1, 'F')
  }
  R(c, 7, 26, 4, 3, 'P'); P(c, 10, 27, 'P') // 尾尖粉团
  outline(c)
  return c
}

/* ---------- 2. 阿斯特拉：缀星尖帽 + 单片镜 + 星图 ---------- */
function drawOwl() {
  const c = newCanvas()
  body(c, {})
  const cx = 24
  // 尖帽（H 紫）塔形，帽尖微歪
  for (let j = 0; j < 12; j++) {
    const wdt = 4 + Math.round(j * 2.1)
    R(c, cx - wdt / 2 + (j > 8 ? 1 : 0), 1 + j, wdt, 1, 'H')
  }
  R(c, cx - 14, 13, 29, 2, 'H')          // 帽檐
  R(c, cx - 14, 15, 29, 1, 'T')          // 檐口金边
  star4(c, cx - 4, 6, 'G'); star4(c, cx + 5, 9, 'G'); P(c, cx + 1, 4, 'G'); P(c, cx - 8, 10, 'G')
  // 单片镜（右眼细金环 + 链）
  ringThin(c, cx + 6.5, 17.5, 4, 'T')
  function ringThin(c, ccx, cy, r, ch) {
    for (let a = 0; a < 360; a += 10) {
      const t = (a * Math.PI) / 180
      P(c, ccx + Math.cos(t) * r, cy + Math.sin(t) * r * 1.05, ch)
    }
  }
  P(c, cx + 10, 21, 'T'); P(c, cx + 10, 22, 'K'); P(c, cx + 9, 23, 'K') // 镜链
  R(c, cx - 10, 27, 20, 2, 'F'); R(c, cx - 14, 29, 28, 2, 'F') // 披肩领座补齐
  star4(c, cx, 30, 'T') // 星形扣
  // 手持摊开星图
  R(c, cx - 8, 36, 17, 6, 'K'); R(c, cx - 7, 37, 15, 4, 'W')
  LN(c, cx, 37, cx, 40, 'K')             // 书脊
  star4(c, cx - 4, 39, 'G'); P(c, cx + 4, 38, 'C'); P(c, cx + 5, 39, 'C')
  outline(c)
  return c
}
/* ---------- 3. Numi：薄荷尖帽 + 荧光双马尾 + 大骰子 ---------- */
function drawNumi() {
  const c = newCanvas()
  body(c, {})
  const cx = 24
  // 薄荷尖帽（帽尖垂向右）
  for (let j = 0; j < 11; j++) {
    const wdt = 4 + Math.round(j * 2.0)
    R(c, cx - wdt / 2, 2 + j, wdt, 1, 'N')
  }
  LN(c, cx + 4, 4, cx + 9, 2, 'N'); P(c, cx + 9, 2, 'N'); P(c, cx + 10, 2, 'G') // 帽尖折垂+铃铛
  R(c, cx - 13, 12, 27, 2, 'N'); R(c, cx - 13, 14, 27, 1, 'T')
  // 双马尾（V 绿，垂在身侧）
  tails(c, cx - 15); tails(c, cx + 12)
  function tails(c, x0) {
    for (let j = 0; j < 26; j++) {
      const wob = Math.round(Math.sin(j * 0.35) * 2)
      R(c, x0 + wob, 13 + j, 3, 1, 'V')
      if (j % 6 === 5) P(c, x0 + wob + (j > 12 ? -1 : 3), 13 + j, 'C') // 高光
    }
    R(c, x0 - 1, 20, 5, 2, 'T') // 发绳
  }
  // 手捧大骰子（菱形 d8，细线少点）
  die(c, cx, 37)
  function die(c, ccx, cy) {
    for (let j = -6; j <= 6; j++) {
      const seg = 7 - Math.abs(j)
      if (seg > 0) R(c, ccx - seg, cy + j, seg * 2, 1, 'W')
    }
    LN(c, ccx - 7, cy, ccx, cy - 7, 'K'); LN(c, ccx + 7, cy, ccx, cy - 7, 'K')
    LN(c, ccx - 7, cy, ccx, cy + 7, 'K'); LN(c, ccx + 7, cy, ccx, cy + 7, 'K')
    star4(c, ccx, cy - 3, 'G') // 顶面星
    P(c, ccx - 3, cy + 3, 'G'); P(c, ccx + 3, cy + 3, 'G') // 柔和点数
  }
  outline(c)
  return c
}

/* ---------- 4. Runa：石斗篷苔藓 + 符文杖 ---------- */
function drawGolem() {
  const c = newCanvas()
  const cx = 24
  body(c, { robe: 'M', apron: false, sleeve: 'M', hemRow: 47 })
  E4(c, cx - 13, 6, 27, 23, 'M')            // 兜帽
  E4(c, cx - 11, 9, 23, 18, 'S')
  R(c, cx - 10, 10, 20, 2, 'M')
  LN(c, cx + 9, 6, cx + 13, 2, 'M'); P(c, cx + 13, 2, 'M') // 帽尖歪
  face(c)
  // 苔藓点
  for (const [mx, my] of [[cx - 12, 7], [cx - 9, 6], [cx + 11, 8], [cx - 14, 30], [cx + 13, 31], [cx - 6, 44], [cx + 8, 45]]) {
    P(c, mx, my, 'N'); P(c, mx + 1, my, 'N')
  }
  // 胸前符文 ᛉ（Algiz，守护）
  const rx = cx
  LN(c, rx, 31, rx, 37, 'V')
  LN(c, rx, 34, rx - 3, 31, 'V'); LN(c, rx, 34, rx + 3, 31, 'V')
  // 法杖（右手边竖杖 + V 宝石）
  R(c, cx + 14, 10, 2, 40, 'O')
  R(c, cx + 13, 34, 4, 2, 'O') // 握把
  R(c, cx + 12, 39, 4, 2, 'S') // 扶杖手
  gem(c, cx + 14, 6)
  function gem(c, gx, gy) {
    for (let j = -4; j <= 4; j++) {
      const seg = 5 - Math.abs(j)
      if (seg > 0) R(c, gx - seg, gy + j, seg * 2, 1, 'V')
    }
    P(c, gx - 1, gy - 2, 'W'); P(c, gx, gy - 2, 'W')
    P(c, gx - 4, gy, 'K'); P(c, gx + 4, gy, 'K')
  }
  outline(c)
  return c
}

/* ---------- 5. Cupie：光环 + 卷发 + 翅膀 + 爱心 ---------- */
function drawTwins() {
  const c = newCanvas()
  const cx = 24
  body(c, { robe: 'R', apron: true, sleeve: 'R', skirtW: 32 })
  // 翅膀（身后上扬，画在裙子之后、收窄避开袖子）
  wing(c, cx - 12); wing(c, cx + 9)
  function wing(c, x0) {
    for (let j = 0; j < 3; j++) {
      const len = 9 - j * 3
      for (let i = 0; i < len; i++) {
        const yy = 24 + j * 3 + Math.round(i * 0.3)
        const xx = x0 + (x0 < cx ? -i - 2 : i + 2)
        R(c, xx, yy, 2, 2, 'W')
        if (i === len - 1) P(c, xx + (x0 < cx ? -1 : 2), yy - 1, 'W')
      }
    }
  }
  // 金色卷发（无帽）
  E4(c, cx - 12, 7, 25, 19, 'T')
  E4(c, cx - 10, 10, 21, 16, 'S')
  for (let i = 0; i < 10; i++) if (i !== 3 && i !== 6) R(c, cx - 10 + i * 2, 11, 2, 2, 'T') // 齐刘海卷
  curls(c, cx - 13); curls(c, cx + 11)   // 两颊发卷
  function curls(c, x0) { R(c, x0, 12, 3, 8, 'T'); E4(c, x0 - 1, 20, 4, 4, 'T'); E4(c, x0 + 1, 22, 4, 4, 'T') }
  face(c)
  R(c, cx - 11, 20, 3, 2, 'B'); R(c, cx + 9, 20, 3, 2, 'B')
  P(c, cx - 1, 21, 'K'); P(c, cx, 22, 'K'); P(c, cx + 1, 21, 'K') // w 嘴
  // 光环（头顶悬浮）
  ERING(c, cx, 3, 7, 2.4, 'G')
  P(c, cx - 7, 3, 'W'); P(c, cx + 6, 4, 'W') // 环上高光
  // 心口爱心（白描边防撞色）
  heart(c, cx, 33)
  function heart(c, hx, hy) {
    R(c, hx - 5, hy - 3, 11, 8, 'K')
    R(c, hx - 4, hy - 2, 3, 3, 'R'); R(c, hx + 2, hy - 2, 3, 3, 'R')
    R(c, hx - 4, hy + 1, 9, 2, 'R')
    LN(c, hx - 3, hy + 3, hx, hy + 4, 'R'); LN(c, hx + 3, hy + 3, hx, hy + 4, 'R')
    P(c, hx - 3, hy - 1, 'W') // 高光
  }
  outline(c)
  return c
}
/* ---------- 6. Comet：飞行帽风镜 + 围巾 + 骑扫帚 ---------- */
function drawComet() {
  const c = newCanvas()
  const cx = 24
  body(c, { robe: 'D', apron: true, hemRow: 42, skirtW: 30 })
  // 飞行帽（C 蓝）+ 风镜推在额前
  E4(c, cx - 12, 6, 25, 20, 'C')
  E4(c, cx - 10, 9, 21, 17, 'S')
  R(c, cx - 10, 9, 20, 3, 'C')            // 帽檐压发
  R(c, cx - 11, 7, 22, 2, 'K')            // 镜带
  goggle(c, cx - 5); goggle(c, cx + 4)
  function goggle(c, gx) { E4(c, gx - 3, 5, 7, 6, 'G'); E4(c, gx - 2, 6, 5, 4, 'W'); P(c, gx, 6, 'C') }
  earflap(c, cx - 13); earflap(c, cx + 11)
  function earflap(c, x0) { R(c, x0, 12, 3, 6, 'C'); P(c, x0 + (x0 < cx ? 0 : 2), 18, 'P') }
  face(c)
  // 玫瑰围巾（颈间绕一圈，尾端向右飘）
  R(c, cx - 8, 27, 16, 3, 'R')
  scarf(c)
  function scarf(c) {
    let y = 29
    for (let i = 0; i < 14; i++) {
      R(c, cx + 8 + i, y + Math.round(Math.sin(i * 0.8) * 1.6), 1, 2, 'R')
      if (i === 13) R(c, cx + 21, y, 1, 3, 'R')
      y += 0
    }
    R(c, cx + 19, 28, 2, 2, 'R'); R(c, cx + 21, 31, 2, 2, 'R') // 飘尾分叉
  }
  // 扫帚（横置脚下，靴底踩杆）+ 彗星尘
  R(c, 6, 49, 34, 2, 'O')                 // 杆：靴底正下方
  R(c, 13, 47, 3, 4, 'T')                 // 绑绳
  bristles(c)
  function bristles(c) {
    for (let j = 0; j < 6; j++) R(c, 3 + j, 40 + j, 2, 12 - j, 'T') // 左端帚尾扇形
  }
  R(c, 3, 44, 8, 2, 'T')
  for (const [sx, sy] of [[1, 36], [2, 32], [0, 40], [3, 28]]) P(c, sx, sy, 'C')
  star4(c, 1, 31, 'W'); star4(c, 4, 24, 'C')
  outline(c)
  return c
}

/* ---------- 7. Mist：垂纱兜帽 + 发光宝珠 + 足下雾 ---------- */
function drawMist() {
  const c = newCanvas()
  const cx = 24
  body(c, {})
  E4(c, cx - 13, 6, 27, 23, 'F')            // 深兜帽
  E4(c, cx - 11, 9, 23, 18, 'S')
  R(c, cx - 10, 10, 20, 2, 'F')
  face(c)
  P(c, cx - 2, 3, 'W'); P(c, cx - 5, 2, 'W'); P(c, cx + 3, 2, 'C'); P(c, cx + 6, 4, 'W') // 帽顶雾丝
  // 垂纱（两侧 W 幔帘）
  veil(c, cx - 13); veil(c, cx + 10)
  function veil(c, x0) {
    R(c, x0, 12, 4, 14, 'W')
    for (let j = 0; j < 14; j += 4) P(c, x0 + (j % 8 === 0 ? 0 : 3), 12 + j, 'C') // 纱纹
    R(c, x0, 26, 4, 2, 'C')
  }
  // 怀中宝珠（金核 + 稀疏荧光点）
  orb(c, cx, 37)
  function orb(c, ox, oy) {
    E4(c, ox - 5, oy - 5, 11, 11, 'G')
    E4(c, ox - 3, oy - 3, 6, 5, 'W')
    P(c, ox + 1, oy - 2, 'G')
    for (const [dx, dy] of [[-7, -2], [7, 2], [-2, -7], [2, 7]]) P(c, ox + dx, oy + dy, 'V')
  }
  // 双手托珠
  R(c, cx - 8, 42, 4, 2, 'S'); R(c, cx + 5, 42, 4, 2, 'S')
  // 足下雾团盖靴
  fog(c)
  function fog(c) {
    for (const [fx, fy, fw] of [[cx - 17, 47, 9], [cx - 9, 48, 10], [cx + 1, 47, 11], [cx + 10, 48, 8]]) {
      E4(c, fx, fy, fw, 4, 'W')
    }
  }
  outline(c)
  return c
}

/* ---------- 输出 ---------- */
function toTS(sprites) {
  const lines = []
  lines.push('/** 神谕宠物园：模块吉祥物——由 scripts/dev/gen-mascots.mjs 生成的像素画（48×52），共用一套调色板 */')
  lines.push('')
  lines.push('export const MASCOT_PALETTE: Record<string, string> = {')
  for (const [k, v] of Object.entries(PALETTE)) lines.push(`  ${k}: '${v}',`)
  lines.push('}')
  lines.push('')
  lines.push('export interface MascotDef {')
  lines.push('  id: string')
  lines.push('  nameCn: string')
  lines.push('  nameEn: string')
  lines.push('  sprite: string[]')
  lines.push("  /** 参与眨眼动作的调色板字母 */")
  lines.push('  eyeChars: string[]')
  lines.push('  /** 环绕卫星体的颜色 */')
  lines.push('  satelliteColor: string')
  lines.push('  /** 地面光晕颜色 */')
  lines.push('  glowColor: string')
  lines.push('}')
  const meta = [
    ['cat', '见习塔罗师 · 墨墨', 'Apprentice · Momo', '#ffd76e', '#ff9fce'],
    ['owl', '星象教授 · 阿斯特拉', 'Prof. Astraea', '#7de8c3', '#6b5bd6'],
    ['numi', '数字魔法使 · Numi', 'Numeria · Numi', '#b3a6f7', '#7de8c3'],
    ['golem', '符文萨满 · Runa', 'Rune Shaman · Runa', '#9fd8b4', '#5fb8a5'],
    ['twins', '小爱神 · Cupie', 'Cupid · Cupie', '#ff8fb8', '#ff8fb8'],
    ['comet', '彗星骑手 · Comet', 'Sky Rider · Comet', '#a9c4e8', '#a9c4e8'],
    ['mist', '雾语占卜师 · Mist', 'Mist Speaker · Mist', '#8fd0e8', '#7de8c3'],
  ]
  meta.forEach(([id, cn, en], i) => {
    const def = sprites[i]
    lines.push('')
    lines.push(`/* ---------- ${cn} ---------- */`)
    lines.push(`const ${id.toUpperCase()}: MascotDef = {`)
    lines.push(`  id: '${id}',`)
    lines.push(`  nameCn: '${cn}',`)
    lines.push(`  nameEn: '${en}',`)
    lines.push(`  satelliteColor: '${meta[i][3]}',`)
    lines.push(`  glowColor: '${meta[i][4]}',`)
    lines.push(`  eyeChars: ['E'],`)
    lines.push('  sprite: [')
    for (const row of def.map((r) => r.join('').replace(/\s+$/, ''))) lines.push(`    '${row}',`)
    lines.push('  ],')
    lines.push('}')
  })
  lines.push('')
  lines.push('export const MASCOTS: Record<string, MascotDef> = {')
  for (const m of meta) lines.push(`  ${m[0]}: ${m[0].toUpperCase()},`)
  lines.push('}')
  lines.push('')
  lines.push('export const MASCOT_IDS = Object.keys(MASCOTS)')
  lines.push('')
  lines.push('export interface MascotVoxel {')
  lines.push('  x: number')
  lines.push('  y: number')
  lines.push('  color: string')
  lines.push('  isEye: boolean')
  lines.push('}')
  lines.push('')
  lines.push('/** 把像素画展开成体素列表；短行自动补齐到最长行 */')
  lines.push('export function mascotVoxels(def: MascotDef): MascotVoxel[] {')
  lines.push('  const cols = Math.max(...def.sprite.map((r) => r.length))')
  lines.push('  const out: MascotVoxel[] = []')
  lines.push('  def.sprite.forEach((rawRow, y) => {')
  lines.push("    const row = rawRow.padEnd(cols, '.')")
  lines.push("    row.split('').forEach((ch, x) => {")
  lines.push('      const color = MASCOT_PALETTE[ch]')
  lines.push("      if (!color || ch === '.') return")
  lines.push('      out.push({ x, y, color, isEye: def.eyeChars.includes(ch) })')
  lines.push('    })')
  lines.push('  })')
  lines.push('  return out')
  lines.push('}')
  return lines.join('\n') + '\n'
}

function bmpPreview(canvases, path) {
  const SC = 5, GAP = 2
  const gw = (W + GAP) * canvases.length - GAP
  const rowBytes = Math.ceil((gw * SC * 3) / 4) * 4
  const imgSize = rowBytes * H * SC
  const fileSize = 54 + imgSize
  const buf = Buffer.alloc(fileSize)
  buf.write('BM', 0); buf.writeUInt32LE(fileSize, 2); buf.writeUInt32LE(54, 10)
  buf.writeUInt32LE(40, 14); buf.writeInt32LE(gw * SC, 18); buf.writeInt32LE(H * SC, 22)
  buf.writeUInt16LE(1, 26); buf.writeUInt16LE(24, 28); buf.writeUInt32LE(0, 30); buf.writeUInt32LE(imgSize, 34)
  const px = (x, y, [r, g, b]) => {
    if (x < 0 || y < 0 || x >= gw * SC || y >= H * SC) return
    const off = 54 + (H * SC - 1 - y) * rowBytes + x * 3
    buf[off] = b; buf[off + 1] = g; buf[off + 2] = r
  }
  const rgbOf = {}
  for (const [k, v] of Object.entries(PALETTE)) rgbOf[k] = [parseInt(v.slice(1, 3), 16), parseInt(v.slice(3, 5), 16), parseInt(v.slice(5, 7), 16)]
  const BG = [248, 245, 255]
  for (let y = 0; y < H * SC; y++) for (let x = 0; x < gw * SC; x++) px(x, y, BG)
  canvases.forEach((cv, idx) => {
    const baseX = idx * (W + GAP) * SC
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const ch = cv[y][x]
      const col = ch === '.' ? BG : rgbOf[ch]
      for (let sy = 0; sy < SC; sy++) for (let sx = 0; sx < SC; sx++) px(baseX + x * SC + sx, y * SC + sy, col)
    }
  })
  writeFileSync(path, buf)
}

const builders = [drawCat, drawOwl, drawNumi, drawGolem, drawTwins, drawComet, drawMist]
const sprites = builders.map((fn) => fn())
mkdirSync(dirname(fileURLToPath(import.meta.url)), { recursive: true })
const repoRoot = fileURLToPath(new URL('../../', import.meta.url))
writeFileSync(repoRoot + 'src/data/mascots.ts', toTS(sprites))
bmpPreview(sprites, repoRoot + 'scripts/dev/mascots-preview.bmp')
console.log('OK: mascots.ts regenerated,', sprites.length, 'sprites @', W + 'x' + H)
// __APPEND__
