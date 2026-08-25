<script setup lang="ts">
/**
 * 水晶球 · 今日一问（体素 3D 版）
 * - Three.js：玻璃球内悬浮 ~150 颗体素星尘，整体可拖拽旋转、滚轮推拉
 * - 球体颜色实时读取当前主题变量，换肤即时换色
 * - 凝视时星尘加速旋舞再炸开，随后揭晓答案
 * - 答案按「日期 + 问题」稳定生成：同一天问同一件事，答案不变
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { locale } from '../lib/i18n'
import { tt, OMENS, CRYSTAL_GOODFOR, hashSeed } from '../lib/i18nExtra'
import { sfx } from '../lib/sfx'
import { sparkleFromEvent } from '../lib/sparkle'
import DecryptTitle from '../components/DecryptTitle.vue'

import type * as THREE_NS from 'three'

const question = ref('')
const gazing = ref(false)
const asked = ref(false)
const omenText = ref('')
const goodText = ref('')
const hourWin = ref('')
const askCount = ref(0)

const zh = computed(() => locale.value === 'zh')

interface CrystalLog {
  date: string
  asks: Record<string, { omen: number; good: number; hour: number }>
}
const LOG_KEY = 'wo.crystal'

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function loadLog(): CrystalLog {
  try {
    const raw = JSON.parse(localStorage.getItem(LOG_KEY) ?? 'null') as CrystalLog | null
    if (raw && raw.date === todayKey() && raw.asks) return raw
  } catch { /* ignore */ }
  return { date: todayKey(), asks: {} }
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

  // 交互：拖拽旋转整团星尘 + 滚轮推拉
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
  el.style.touchAction = 'none'

  const onDown = (e: PointerEvent): void => {
    dragging = true
    lastX = e.clientX
    lastY = e.clientY
    el.setPointerCapture(e.pointerId)
  }
  const onMove = (e: PointerEvent): void => {
    if (!dragging) return
    velY = (e.clientX - lastX) * 0.0045
    velX = (e.clientY - lastY) * 0.0045
    group.rotation.y += velY
    group.rotation.x += velX
    lastX = e.clientX
    lastY = e.clientY
  }
  const onUp = (e: PointerEvent): void => {
    dragging = false
    el.releasePointerCapture(e.pointerId)
  }
  const onWheel = (e: WheelEvent): void => {
    e.preventDefault()
    camZ = Math.min(10.5, Math.max(4.6, camZ + e.deltaY * 0.004))
  }
  el.addEventListener('pointerdown', onDown)
  el.addEventListener('pointermove', onMove)
  el.addEventListener('pointerup', onUp)
  el.addEventListener('wheel', onWheel, { passive: false })

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
  const tick = (): void => {
    if (disposed) return
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
    raf = requestAnimationFrame(tick)
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
    window.removeEventListener('resize', onResize)
    mo.disconnect()
    el.removeEventListener('pointerdown', onDown)
    el.removeEventListener('pointermove', onMove)
    el.removeEventListener('pointerup', onUp)
    el.removeEventListener('wheel', onWheel)
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
  saveLog(log)
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
    if (e) sparkleFromEvent(e, 14)
  }, delay)
}

onMounted(() => {
  initThree()
})
onBeforeUnmount(() => {
  disposeScene?.()
})

const askLabel = computed(() => (gazing.value ? tt('crystal.gazing') : tt('crystal.ask')))
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
      </div>
    </section>
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

.omen-pop-enter-active { transition: all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1); }
.omen-pop-enter-from { opacity: 0; transform: translateY(14px) scale(0.92); }
</style>
