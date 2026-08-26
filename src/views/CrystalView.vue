<script setup lang="ts">
/**
 * 水晶球 · 今日一问（体素 3D 版）
 * - Three.js：玻璃球内悬浮 ~150 颗体素星尘，整体可拖拽旋转、滚轮推拉
 * - 球体颜色实时读取当前主题变量，换肤即时换色
 * - 凝视时星尘加速旋舞再炸开，随后揭晓答案
 * - 答案按「日期 + 问题」稳定生成：同一天问同一件事，答案不变
 */
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue'
import { locale } from '../lib/i18n'
import { tt, OMENS, CRYSTAL_GOODFOR, hashSeed } from '../lib/i18nExtra'
import { BIRTHSTONES_BY_MONTH, BREASTPLATE_STONES, CRYSTAL_GAZING_PASSAGE } from '../data/kunzBirthstones'
import { sfx } from '../lib/sfx'
import { sparkleFromEvent } from '../lib/sparkle'
import DecryptTitle from '../components/DecryptTitle.vue'

/** 雾语 Mist——水晶门廊的住客，终于回家了 */
const MascotCard = defineAsyncComponent(() => import('../components/MascotCard.vue'))
const mistPet = ref<InstanceType<typeof MascotCard> | null>(null)

import type * as THREE_NS from 'three'
import { addHistory } from '../lib/history'

const question = ref('')
const gazing = ref(false)
const asked = ref(false)
const omenText = ref('')
const goodText = ref('')
const hourWin = ref('')
const askCount = ref(0)
const histList = ref<CrystalHistItem[]>([])
void histList

const zh = computed(() => locale.value === 'zh')

interface CrystalLog {
  date: string
  asks: Record<string, { omen: number; good: number; hour: number }>
  /** 跨天保留的解答历史（最新在前，最多 8 条） */
  history?: CrystalHistItem[]
}

interface CrystalHistItem {
  at: string
  q: string
  omen: number
}
const LOG_KEY = 'wo.crystal'

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function loadLog(): CrystalLog {
  try {
    const raw = JSON.parse(localStorage.getItem(LOG_KEY) ?? 'null') as CrystalLog | null
    if (raw && raw.date === todayKey() && raw.asks) {
      return { ...raw, history: Array.isArray(raw.history) ? raw.history : [] }
    }
    // 跨天：重置当日计数但保留历史
    const old = raw?.history ?? []
    return { date: todayKey(), asks: {}, history: old }
  } catch { /* ignore */ }
  return { date: todayKey(), asks: {}, history: [] }
}

function saveLog(log: CrystalLog): void {
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(log))
  } catch { /* ignore */ }
}

/** 从主题 CSS 变量取颜色（three 不能直接用 var()） */
function cssVar(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

/* ---------- Three.js 场景 ---------- */
const mountRef = ref<HTMLDivElement | null>(null)
const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

let disposeScene: (() => void) | null = null
let setSpinBoost: ((v: number) => void) | null = null

async function initThree(): Promise<void> {
  const mount = mountRef.value
  if (!mount) return
  const THREE = await import('three')

  const W = () => mount.clientWidth
  const H = () => mount.clientHeight
  let disposed = false

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(38, W() / H(), 0.1, 100)
  camera.position.set(0, 0, 7.2)

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(W(), H())
  mount.appendChild(renderer.domElement)

  // 玻璃外壳：两层球，前层近透明 + 后层深色底
  const shellGeo = new THREE.SphereGeometry(2.05, 48, 48)
  const shellMat = new THREE.MeshPhongMaterial({
    color: new THREE.Color(cssVar('--lavender', '#b3a6f7')),
    transparent: true,
    opacity: 0.14,
    shininess: 90,
    specular: new THREE.Color('#ffffff'),
  })
  const shell = new THREE.Mesh(shellGeo, shellMat)

  const baseGeo = new THREE.SphereGeometry(1.98, 32, 32)
  const baseMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(cssVar('--void-1', '#151232')),
    transparent: true,
    opacity: 0.55,
    side: THREE.BackSide,
  })
  const base = new THREE.Mesh(baseGeo, baseMat)
  scene.add(base, shell)

  // 底座圆环
  const ringGeo = new THREE.TorusGeometry(1.62, 0.09, 12, 40)
  const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(cssVar('--gold', '#f5c86e')) })
  const ring = new THREE.Mesh(ringGeo, ringMat)
  ring.rotation.x = Math.PI / 2
  ring.position.y = -2.25
  scene.add(ring)

  // 体素星尘：小方块 InstancedMesh，球体内随机分布
  const COUNT = 150
  const cubeGeo = new THREE.BoxGeometry(0.085, 0.085, 0.085)
  const cubeMat = new THREE.MeshBasicMaterial({ vertexColors: false })
  const dust = new THREE.InstancedMesh(cubeGeo, cubeMat, COUNT)

  interface Star { pos: THREE_NS.Vector3; axis: THREE_NS.Vector3; speed: number }
  const dummy = new THREE.Object3D()
  const stars: Star[] = []
  const palette = (): THREE_NS.Color[] => [
    new THREE.Color(cssVar('--pink', '#ff9fce')),
    new THREE.Color(cssVar('--gold', '#f5c86e')),
    new THREE.Color(cssVar('--mint', '#7de8c3')),
    new THREE.Color(cssVar('--lavender-soft', '#cfc5ff')),
  ]
  let colors = palette()
  for (let i = 0; i < COUNT; i++) {
    // 球均匀采样
    const r = 1.72 * Math.cbrt(Math.random())
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const pos = new THREE.Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi),
    )
    stars.push({
      pos,
      axis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
      speed: 0.002 + Math.random() * 0.006,
    })
    dummy.position.copy(pos)
    dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0)
    dummy.scale.setScalar(0.6 + Math.random() * 1.1)
    dummy.updateMatrix()
    dust.setMatrixAt(i, dummy.matrix)
    dust.setColorAt(i, colors[i % colors.length]!)
  }
  scene.add(dust)

  // 灯光（玻璃高光需要）
  const keyLight = new THREE.DirectionalLight(0xffffff, 0.9)
  keyLight.position.set(3, 4, 5)
  scene.add(keyLight, new THREE.AmbientLight(0xffffff, 0.35))

  // 交互：拖拽旋转整团星尘 + 滚轮/双指推拉 + 双击换姿态
  const group = new THREE.Group()
  scene.add(group)
  group.add(dust)

  let dragging = false
  let lastX = 0
  let lastY = 0
  let velX = 0.003
  let velY = 0
  let camZ = 7.2
  const el = renderer.domElement
  // pan-y：竖向滚动还给页面；单指拖转/双指捏合仍走下面的 pointer 事件
  el.style.touchAction = 'pan-y'

  const pointers = new Map<number, { x: number; y: number }>()
  let pinchDist = 0

  function twoFingerDist(): number {
    const [a, b] = [...pointers.values()]
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0
  }

  const onDown = (e: PointerEvent): void => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    el.setPointerCapture(e.pointerId)
    if (pointers.size === 1) {
      dragging = true
      lastX = e.clientX
      lastY = e.clientY
    } else if (pointers.size === 2) {
      dragging = false
      pinchDist = twoFingerDist()
    }
  }
  const onMove = (e: PointerEvent): void => {
    if (!pointers.has(e.pointerId)) return
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.size === 2) {
      const d = twoFingerDist()
      if (pinchDist > 0) {
        camZ = Math.min(10.5, Math.max(4.6, camZ - (d - pinchDist) * 0.012))
      }
      pinchDist = d
      return
    }
    if (!dragging) return
    velY = (e.clientX - lastX) * 0.0045
    velX = (e.clientY - lastY) * 0.0045
    group.rotation.y += velY
    group.rotation.x += velX
    lastX = e.clientX
    lastY = e.clientY
  }
  const onUp = (e: PointerEvent): void => {
    pointers.delete(e.pointerId)
    if (pointers.size < 2) pinchDist = 0
    if (pointers.size === 1) {
      const p = [...pointers.values()][0]!
      lastX = p.x
      lastY = p.y
      dragging = true
    } else {
      dragging = false
    }
    if (el.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId)
  }
  const onWheel = (e: WheelEvent): void => {
    e.preventDefault()
    camZ = Math.min(10.5, Math.max(4.6, camZ + e.deltaY * 0.004))
  }
  /** 双击：随机换个姿态 */
  const onDbl = (): void => {
    group.rotation.y += Math.PI * (0.6 + Math.random())
    group.rotation.x = (Math.random() - 0.5) * 0.9
    velY = 0.06 * (Math.random() < 0.5 ? -1 : 1)
    sfx.pop()
  }
  el.addEventListener('pointerdown', onDown)
  el.addEventListener('pointermove', onMove)
  el.addEventListener('pointerup', onUp)
  el.addEventListener('pointercancel', onUp)
  el.addEventListener('wheel', onWheel, { passive: false })
  el.addEventListener('dblclick', onDbl)

  // 换肤联动：监听 <html data-theme> 变化重取色
  const mo = new MutationObserver(() => {
    colors = palette()
    shellMat.color.set(cssVar('--lavender', '#b3a6f7'))
    baseMat.color.set(cssVar('--void-1', '#151232'))
    ringMat.color.set(cssVar('--gold', '#f5c86e'))
    for (let i = 0; i < COUNT; i++) dust.setColorAt(i, colors[i % colors.length]!)
    if (dust.instanceColor) dust.instanceColor.needsUpdate = true
  })
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

  // 主循环
  let spinBoost = 1
  setSpinBoost = (v) => {
    spinBoost = v
  }
  let raf = 0
  let inView = true
  const tickIO = new IntersectionObserver(
    (es) => {
      inView = es[0]?.isIntersecting ?? true
    },
    { threshold: 0.02 },
  )
  tickIO.observe(el)
  const tick = (): void => {
    if (disposed) return
    raf = requestAnimationFrame(tick)
    // 离屏/后台挂起：不渲染省 GPU
    if (!inView || document.hidden) return
    if (!dragging && !reducedMotion) {
      group.rotation.y += 0.0035 * spinBoost + velY
      group.rotation.x = Math.min(1.1, Math.max(-1.1, group.rotation.x + velX))
      // 惯性衰减回默认自转
      velY *= 0.94
      velX *= 0.9
    }
    camera.position.z += (camZ - camera.position.z) * 0.08
    // 呼吸缩放
    const breathe = 1 + Math.sin(performance.now() * 0.0011) * 0.02 * spinBoost
    dust.scale.setScalar(breathe)
    renderer.render(scene, camera)
  }

  const onResize = (): void => {
    camera.aspect = W() / H()
    camera.updateProjectionMatrix()
    renderer.setSize(W(), H())
  }
  window.addEventListener('resize', onResize)

  if (reducedMotion) {
    renderer.render(scene, camera)
  } else {
    raf = requestAnimationFrame(tick)
  }

  disposeScene = (): void => {
    disposed = true
    cancelAnimationFrame(raf)
    tickIO.disconnect()
    window.removeEventListener('resize', onResize)
    mo.disconnect()
    el.removeEventListener('pointerdown', onDown)
    el.removeEventListener('pointermove', onMove)
    el.removeEventListener('pointerup', onUp)
    el.removeEventListener('pointercancel', onUp)
    el.removeEventListener('wheel', onWheel)
    el.removeEventListener('dblclick', onDbl)
    shellGeo.dispose()
    baseGeo.dispose()
    ringGeo.dispose()
    cubeGeo.dispose()
    shellMat.dispose()
    baseMat.dispose()
    ringMat.dispose()
    cubeMat.dispose()
    dust.dispose()
    renderer.dispose()
    el.remove()
  }
}

/* ---------- 提问 ---------- */
function pickAnswer(seedStr: string): { omen: number; good: number; hour: number } {
  let h = hashSeed(seedStr)
  const omen = h % OMENS.length
  h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0
  const good = h % CRYSTAL_GOODFOR.length
  h = Math.imul(h ^ (h >>> 13), 3266489917) >>> 0
  const startHour = 9 + (h % 12)
  return { omen, good, hour: startHour }
}

function ask(e?: MouseEvent): void {
  if (gazing.value || asked.value) return
  gazing.value = true
  sfx.whoosh()
  setSpinBoost?.(reducedMotion ? 1 : 8)

  const q = question.value.trim().toLowerCase()
  const seedStr = `${todayKey()}|${q}`
  const key = hashSeed(seedStr).toString(36)
  const log = loadLog()
  const res = log.asks[key] ?? pickAnswer(seedStr)
  log.asks[key] = res
  log.history = [
    { at: new Date().toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }), q: question.value.trim() || (zh.value ? '（没写问题）' : '(no question)'), omen: res.omen },
    ...(log.history ?? []),
  ].slice(0, 8)
  saveLog(log)
  addHistory({
    type: 'crystal',
    label: zh.value ? '水晶球 · 问事' : 'Crystal Ball · Asking',
    summary: `${question.value.trim() || (zh.value ? '（没写问题）' : '(no question)')} → ${zh.value ? OMENS[res.omen]![0] : OMENS[res.omen]![1]}`,
    detail: zh.value ? OMENS[res.omen]![0] : OMENS[res.omen]![1],
  })
  histList.value = log.history
  askCount.value = Object.keys(log.asks).length

  const delay = reducedMotion ? 250 : 2200
  window.setTimeout(() => {
    const po = OMENS[res.omen]!
    const pg = CRYSTAL_GOODFOR[res.good]!
    omenText.value = zh.value ? po[0] : po[1]
    goodText.value = zh.value ? pg[0] : pg[1]
    hourWin.value = `${res.hour}:00 – ${(res.hour + 2) % 24}:00`
    asked.value = true
    gazing.value = false
    setSpinBoost?.(1)
    sfx.ding()
    mistPet.value?.celebrate()
    if (e) sparkleFromEvent(e, 14)
  }, delay)
}

onMounted(() => {
  initThree()
  // 恢复历史记录展示
  histList.value = loadLog().history ?? []
})
onBeforeUnmount(() => {
  disposeScene?.()
})

const askLabel = computed(() => (gazing.value ? tt('crystal.gazing') : tt('crystal.ask')))

/* ---------- Kunz 生辰石志（1913 公版） ---------- */
const MONTH_KEYS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const
const MONTH_ZH = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
const activeMonth = ref(new Date().getMonth())

/** 同名石头跨榜单合并票数，按票数降序 */
const monthStones = computed(() => {
  const merged = new Map<string, number>()
  for (const it of BIRTHSTONES_BY_MONTH[MONTH_KEYS[activeMonth.value]!] ?? []) {
    merged.set(it.stone, (merged.get(it.stone) ?? 0) + it.lists)
  }
  return [...merged.entries()].map(([stone, lists]) => ({ stone, lists })).sort((a, b) => b.lists - a.lists)
})
const maxVotes = computed(() => Math.max(1, ...monthStones.value.map((s) => s.lists)))
const topStone = computed(() => monthStones.value[0]?.stone ?? '')

const STONE_ZH: Record<string, string> = {
  Garnet: '石榴石', Amethyst: '紫水晶', Hyacinth: '风信子石', Pearl: '珍珠', Jasper: '碧玉',
  Bloodstone: '血石', Sapphire: '蓝宝石', Diamond: '钻石', Agate: '玛瑙', Emerald: '祖母绿',
  Chalcedony: '玉髓', Carnelian: '红玉髓', Turquoise: '绿松石', Onyx: '缟玛瑙', Sardonyx: '缠丝玛瑙',
  Ruby: '红宝石', Moonstone: '月光石', Topaz: '黄玉', Beryl: '绿柱石', Aquamarine: '海蓝宝',
  Opal: '蛋白石', Chrysolite: '橄榄石', Chrysoprase: '绿玉髓', "Cat's-eye": '猫眼石',
}
const STONE_HUE: Record<string, string> = {
  Garnet: '#d3544e', Amethyst: '#a06cd5', Hyacinth: '#e8896b', Pearl: '#efe6da', Jasper: '#8a6f4a',
  Bloodstone: '#4a7d55', Sapphire: '#4a6fb8', Diamond: '#dfe8f2', Agate: '#b08d57', Emerald: '#3fae7a',
  Chalcedony: '#9fc4d8', Carnelian: '#c96b45', Turquoise: '#4ab8a8', Onyx: '#3a3a44', Sardonyx: '#a8623f',
  Ruby: '#c92a4e', Moonstone: '#cfd8ee', Topaz: '#e0a83f', Beryl: '#7dc0a8', Aquamarine: '#63c3d8',
  Opal: '#c9b8e8', Chrysolite: '#9ab84a', Chrysoprase: '#7dc95e', "Cat's-eye": '#c8b26a',
}
function stoneName(s: string): string {
  return zh.value ? STONE_ZH[s] ?? s : s
}
function stoneHue(s: string): string {
  return STONE_HUE[s] ?? '#b3a6f7'
}
function pickMonth(i: number, e?: MouseEvent): void {
  activeMonth.value = i
  sfx.blip()
  if (e) sparkleFromEvent(e, 4)
}
const showBreastplate = ref(false)
</script>

<template>
  <div class="page-root">
    <h2><DecryptTitle :text="tt('crystal.title')" /></h2>
    <p class="hint">{{ tt('crystal.hint') }}</p>

    <section class="panel crystal-layout" style="margin-top: 20px;">
      <div class="orb-side">
        <div ref="mountRef" class="orb3d" />
        <p class="drag-hint">✧ {{ tt('crystal.drag') }}</p>
      </div>

      <div class="ask-side">
        <label class="field">
          <span>{{ zh ? '你的问题' : 'Your question' }}</span>
          <input
            v-model="question"
            type="text"
            :placeholder="tt('crystal.placeholder')"
            :disabled="asked || gazing"
            maxlength="60"
          />
        </label>
        <button v-if="!asked" v-magnetic class="btn gold" :disabled="gazing" @click="ask($event)">
          🔮 {{ askLabel }}
        </button>

        <Transition name="omen-pop">
          <div v-if="asked" class="omen-box bounce-in">
            <p class="omen-main">{{ omenText }}</p>
            <p class="omen-sub">✧ {{ tt('crystal.lucky') }}：{{ goodText }}</p>
            <p class="omen-sub">⏳ {{ tt('crystal.hour') }}：{{ hourWin }}</p>
            <p class="omen-hint">{{ tt('crystal.againTomorrow') }}</p>
          </div>
        </Transition>

        <p v-if="askCount > 0" class="hint count-hint">
          {{ tt('crystal.count', { n: askCount }) }}
        </p>

        <p v-if="histList.length > 0" class="hist-title">✦ {{ tt('crystal.hist') }}</p>
        <TransitionGroup v-if="histList.length > 0" name="omen-pop" tag="ul" class="hist-list">
          <li v-for="(it, i) in histList" :key="it.at + i" class="hist-row">
            <small class="hr-at">{{ it.at }}</small>
            <span class="hr-q">{{ it.q }}</span>
            <em class="hr-a">{{ zh ? OMENS[it.omen]![0] : OMENS[it.omen]![1] }}</em>
          </li>
        </TransitionGroup>
      </div>
    </section>

    <!-- Kunz 生辰石志 -->
    <section class="panel stone-panel">
      <div class="stone-head">
        <h3 class="stone-title">💎 {{ zh ? '生辰石志 · 1913' : 'Birthstone Lore · 1913' }}</h3>
        <small class="hint">{{ zh ? 'Kunz《奇石传说》汇总八份传统榜单的投票 · 点月份换页' : 'Kunz’s tally across eight historic lists · tap a month' }}</small>
      </div>

      <div class="month-chips">
        <button
          v-for="(m, i) in MONTH_KEYS"
          :key="m"
          class="m-chip"
          :class="{ active: activeMonth === i }"
          @click="pickMonth(i, $event)"
        >
          {{ zh ? MONTH_ZH[i] : m.slice(0, 3) }}
        </button>
      </div>

      <Transition name="stone-swap" mode="out-in">
        <ul :key="activeMonth" class="stone-bars">
          <li
            v-for="(s, i) in monthStones"
            :key="s.stone"
            class="stone-row"
            :style="{ animationDelay: (i * 70) + 'ms' }"
          >
            <span class="sb-glyph" :style="{ color: stoneHue(s.stone), textShadow: `0 0 8px ${stoneHue(s.stone)}` }">◆</span>
            <span class="sb-name" :class="{ top: s.stone === topStone }">{{ stoneName(s.stone) }}</span>
            <span class="sb-track">
              <i class="sb-fill" :style="{ width: (s.lists / maxVotes * 100) + '%', background: `linear-gradient(90deg, ${stoneHue(s.stone)}55, ${stoneHue(s.stone)})` }" />
            </span>
            <small class="sb-votes">{{ s.lists }}/{{ maxVotes }}</small>
          </li>
        </ul>
      </Transition>
      <p v-if="topStone" class="stone-verdict">
        ✧ {{ zh ? `${MONTH_ZH[activeMonth]}的传统榜首是` : `The traditional favourite for ${MONTH_KEYS[activeMonth]} is` }}
        <b :style="{ color: stoneHue(topStone) }">{{ stoneName(topStone) }}</b>。
        {{ zh ? '——1913 年以前的旧俗，图个讲究。' : '— lore from before 1913, taken with a pinch of glitter.' }}
      </p>

      <details class="bp-box" @toggle="showBreastplate = ($event.target as HTMLDetailsElement).open; sfx.blip()">
        <summary class="bp-summary">🛡️ {{ zh ? '大祭司胸甲十二石对照（出埃及记）' : 'The Breastplate’s twelve stones (Exodus)' }}</summary>
        <TransitionGroup v-if="showBreastplate" name="omen-pop" tag="ol" class="bp-list">
          <li v-for="(row, i) in BREASTPLATE_STONES" :key="row.no" class="bp-row" :style="{ transitionDelay: (i * 30) + 'ms' }">
            <span class="bp-no">{{ row.no }}</span>
            <span>{{ row.authorizedVersion }}</span>
            <em v-if="row.laterCorrection">→ {{ row.laterCorrection }}</em>
          </li>
        </TransitionGroup>
        <p class="gazing-quote">“{{ CRYSTAL_GAZING_PASSAGE }}”</p>
        <p class="gazing-src">{{ zh ? '—— Pausanias 记载的水晶凝视古法，转引自 Kunz，1913' : '— crystal gazing as recorded by Pausanias, via Kunz, 1913' }}</p>
      </details>
    </section>

    <!-- 雾语的 3D 小舞台 -->
    <MascotCard ref="mistPet" id="mist" />
  </div>
</template>

<style scoped>
.crystal-layout {
  display: grid;
  grid-template-columns: minmax(240px, 360px) 1fr;
  gap: 26px;
  align-items: center;
}
@media (max-width: 760px) {
  .crystal-layout { grid-template-columns: 1fr; }
}
.orb-side { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.orb3d {
  width: 100%;
  aspect-ratio: 1;
  cursor: grab;
  filter: drop-shadow(0 14px 34px color-mix(in srgb, var(--lavender) 30%, transparent));
}
.orb3d:active { cursor: grabbing; }
.orb3d canvas { display: block; width: 100% !important; height: 100% !important; }
.drag-hint { margin: 0; color: var(--ink-dim); font-size: 0.75rem; font-family: var(--pixel); letter-spacing: 0.12em; }
.ask-side { display: flex; flex-direction: column; gap: 14px; }

.omen-box {
  padding: 16px 18px;
  background: color-mix(in srgb, var(--gold) 7%, var(--void-0));
  border: 2px dashed color-mix(in srgb, var(--gold) 55%, transparent);
  border-radius: 12px;
}
.omen-main {
  margin: 0 0 10px;
  font-family: var(--cute);
  font-size: 1.15rem;
  line-height: 1.9;
  color: var(--gold-bright);
}
.omen-sub { margin: 4px 0; color: var(--ink); font-size: 0.92rem; }
.omen-hint { margin: 10px 0 0; color: var(--ink-dim); font-size: 0.8rem; font-style: italic; }
.count-hint { margin-top: 4px; opacity: 0.75; }

.hist-title { margin: 14px 0 0; font-family: var(--cute); color: var(--lavender-soft); letter-spacing: 0.08em; }
.hist-list {
  list-style: none;
  margin: 6px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;
  max-height: 300px;
  overflow-y: auto;
}
.hist-row {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 3px 12px;
  padding: 9px 13px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--lavender) 6%, var(--void-0));
  border: 1.5px solid color-mix(in srgb, var(--lavender) 22%, transparent);
  transition: border-color 0.2s, transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.hist-row:hover { transform: translateX(4px); border-color: color-mix(in srgb, var(--lavender) 55%, transparent); }
.hr-at { grid-column: 1 / -1; font-family: var(--pixel); font-size: 0.5rem; letter-spacing: 0.1em; color: var(--ink-dim); }
.hr-q { font-size: 0.86rem; color: var(--lavender-soft); }
.hr-a { grid-column: 1 / -1; font-style: normal; font-size: 0.82rem; line-height: 1.7; color: var(--ink-dim); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

.omen-pop-enter-active { transition: all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1); }
.omen-pop-enter-from { opacity: 0; transform: translateY(14px) scale(0.92); }

/* ---------- 生辰石志 ---------- */
.stone-panel { margin-top: 22px; }
.stone-head { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.stone-title { margin: 0; font-family: var(--cute); font-weight: 400; color: var(--gold-bright); font-size: 1.1rem; }
.month-chips { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 13px; }
.m-chip {
  padding: 6px 12px;
  border-radius: 999px;
  border: 1.5px solid color-mix(in srgb, var(--lavender) 30%, transparent);
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  font-family: inherit;
  font-size: 0.8rem;
  transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.m-chip:hover { transform: translateY(-2px); border-color: var(--lavender-soft); }
.m-chip.active {
  border-color: var(--gold);
  color: var(--gold-bright);
  background: color-mix(in srgb, var(--gold) 12%, transparent);
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--gold) 40%, transparent));
}
.stone-bars { list-style: none; margin: 16px 0 0; padding: 0; display: flex; flex-direction: column; gap: 9px; }
.stone-row {
  display: grid;
  grid-template-columns: auto minmax(90px, 150px) 1fr auto;
  align-items: center;
  gap: 10px;
  animation: sb-in 0.55s cubic-bezier(0.34, 1.4, 0.64, 1) backwards;
}
@keyframes sb-in { from { opacity: 0; transform: translateX(-14px); } }
.sb-glyph { font-size: 0.95rem; }
.sb-name { font-size: 0.88rem; color: var(--ink); }
.sb-name.top { color: var(--gold-bright); font-family: var(--cute); }
.sb-track { height: 9px; border-radius: 5px; background: color-mix(in srgb, var(--void-1) 60%, transparent); overflow: hidden; }
.sb-fill { display: block; height: 100%; border-radius: 5px; transition: width 0.8s cubic-bezier(0.22, 1, 0.36, 1); }
.sb-votes { font-family: var(--pixel); font-size: 0.55rem; letter-spacing: 0.08em; color: var(--ink-dim); }
.stone-verdict { margin: 14px 0 0; line-height: 1.9; color: var(--ink-dim); font-size: 0.86rem; }
.bp-box { margin-top: 16px; border: 1.5px solid color-mix(in srgb, var(--gold) 30%, transparent); border-radius: 10px; overflow: hidden; }
.bp-summary {
  list-style: none;
  cursor: pointer;
  padding: 10px 13px;
  font-family: var(--cute);
  color: var(--lavender-soft);
  font-size: 0.9rem;
  transition: background 0.2s;
}
.bp-summary::-webkit-details-marker { display: none; }
.bp-summary:hover { background: color-mix(in srgb, var(--gold) 8%, transparent); }
.bp-list { margin: 4px 18px 8px; padding-left: 20px; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 6px 14px; }
.bp-row { font-size: 0.82rem; color: var(--ink); line-height: 1.8; }
.bp-no { font-family: var(--pixel); color: var(--gold-bright); margin-right: 6px; }
.bp-row em { color: var(--ink-dim); font-size: 0.76rem; margin-left: 5px; }
.gazing-quote { margin: 10px 16px 2px; font-style: italic; line-height: 1.9; color: var(--ink-dim); font-size: 0.84rem; }
.gazing-src { margin: 2px 16px 12px; text-align: right; font-size: 0.72rem; color: var(--ink-dim); opacity: 0.85; }
.stone-swap-enter-active { transition: all 0.35s ease; }
.stone-swap-enter-from { opacity: 0; transform: translateY(10px); }
.stone-swap-leave-active { transition: all 0.15s ease; }
.stone-swap-leave-to { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .stone-row { animation: none; }
}
</style>
