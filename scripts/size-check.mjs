#!/usr/bin/env node
/**
 * 构建产物体积预算检查：`npm run size`（build 之后跑）。
 * 预算定义见 vite.config.ts 顶注释；本脚本按"原始字节"近似执行同一套闸门
 * （原始 ≈ gzip×2.5~3，阈值已按倍率换算）。
 *
 * 白名单：懒加载的大语料/3D vendor，允许超过常规单包上限：
 *   dreamsMiller / three-vendor / three-scenes / index(首屏单独预算)
 */
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const dist = join(process.cwd(), 'dist', 'assets')
const ALLOW_OVER_500 = /dreamsMiller|three-vendor|three-scenes/
const INDEX_BUDGET = 1_000_000 // index.js 原始 ≤ ~1MB（≈360KB gz）
const NORMAL_BUDGET = 1_500_000 // 常规 chunk 原始 ≤ ~1.5MB（≈500KB gz）
const DREAMS_BUDGET = 3_200_000 // dreamsMiller 原始上限 ≈896KB 源码编译后余量

let fail = false
const rows = []

for (const f of readdirSync(dist)) {
  if (!f.endsWith('.js')) continue
  const bytes = statSync(join(dist, f)).size
  const isIndex = /^index[.-]/.test(f)
  const isDreams = /dreamsMiller/.test(f)
  let budget = NORMAL_BUDGET
  if (isIndex) budget = INDEX_BUDGET
  else if (isDreams) budget = DREAMS_BUDGET
  else if (ALLOW_OVER_500.test(f)) budget = Infinity
  const over = bytes > budget
  if (over) fail = true
  rows.push({ f, kb: Math.round(bytes / 1024), budgetKB: Math.round(budget / 1024), over })
}

rows.sort((a, b) => b.kb - a.kb)
console.log('\n📦 dist/assets JS 体积预算表（前 12）')
for (const r of rows.slice(0, 12)) {
  const mark = r.over ? ' ❌ 超预算' : '  ok'
  console.log(`  ${String(r.kb).padStart(6)} KB / ${String(r.budgetKB).padStart(6)} KB  ${r.f}${mark}`)
}
if (fail) {
  console.error('\n❌ 有 chunk 超出体积预算 —— 先考虑懒加载/拆数据，不要直接调大 vite.config.ts 里的预算。')
  process.exit(1)
}
console.log('\n✅ 全部 chunk 在体积预算内。\n')
