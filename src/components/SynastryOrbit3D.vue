<script setup lang="ts">
/**
 * 合盘 3D 星轨：A 方行星走内环（金），B 方行星走外环（粉），
 * 有交叉相位的两颗星之间拉一条光弧——两个人的天空叠在同一片夜里。
 * 拖拽旋转 / 滚轮缩放 / 闲置自转；相位线可按类型过滤。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { sfx } from '../lib/sfx'
import { locale } from '../lib/i18n'

export interface OrbitPlanet {
  name: string
  cn: string
  lon: number
}
export interface OrbitAspect {
  body1: string
  body2: string
  type: string
  orb: number
}

const props = defineProps<{
  aPlanets: OrbitPlanet[]
  bPlanets: OrbitPlanet[]
  aspects: OrbitAspect[]
}>()

const mountRef = ref<HTMLDivElement | null>(null)
const showAspects = ref(true)
const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** 相位类型 → 颜色与中文 */
const ASPECT_META: Record<string, { color: string; zh: string }> = {
  conjunction: { color: '#f5c86e', zh: '合' },
  sextile: { color: '#7de8c3', zh: '六合' },
  square: { color: '#ff8a8a', zh: '刑' },
  trine: { color: '#b3a6f7', zh: '拱' },
  opposition: { color: '#ff9fce', zh: '冲' },
}
function metaOf(type: string) {
  return ASPECT_META[type] ?? { color: '#b3a6f7', zh: type }
}

const aspectTypes = computed(() => {
  const set = new Set(props.aspects.map((a) => a.type))
  return [...set]
})
const enabledTypes = ref<Set<string>>(new Set())
watch(
  aspectTypes,
  (types) => {
    enabledTypes.value = new Set(types)
  },
  { immediate: true },
)
function toggleType(ty: string): void {
  const next = new Set(enabledTypes.value)
  if (next.has(ty)) next.delete(ty)
  else next.add(ty)
  enabledTypes.value = next
  sfx.blip()
}

const zh = computed(() => locale.value === 'zh')

let disposeScene: (() => void) | null = null

/** 行星在环上的三维坐标（lon 为黄经，逆时针） */
function ringPos(lon: number, radius: number): [number, number, number] {
  const rad = ((360 - lon) * Math.PI) / 180
  return [Math.cos(rad) * radius, 0, Math.sin(rad) * radius]
}

async function initThree(): Promise<void> {
  const mount = mountRef.value
  if (!mount) return
  const THREE = await import('three')
  let disposed = false

  const W = () => mount.clientWidth
  const H = () => mount.clientHeight

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(42, W() / H(), 0.1, 100)
  camera.position.set(0, 7.5, 9)
  camera.lookAt(0, 0, 0)

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(W(), H())
  mount.appendChild(renderer.domElement)

  const group = new THREE.Group()
  scene.add(group)
  group.rotation.x = 0.16

  /* 中央核心：两人的"共同引力" */
  const coreGeo = new THREE.SphereGeometry(0.52, 20, 20)
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xf5e2b8 })
  const core = new THREE.Mesh(coreGeo, coreMat)
  group.add(core)

  /* 两道轨道环 */
  const R_A = 2.4
  const R_B = 4.1
  const mkRing = (radius: number, color: number, opacity: number): THREE.Mesh => {
    const geo = new THREE.TorusGeometry(radius, 0.02, 8, 128)
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity })
    const ring = new THREE.Mesh(geo, mat)
    ring.rotation.x = Math.PI / 2
    return ring
  }
  group.add(mkRing(R_A, 0xf5c86e, 0.5))
  group.add(mkRing(R_B, 0xff9fce, 0.42))

  /* 行星小球 */
  interface OrbBody {
    mesh: THREE.Mesh
    base: [number, number, number]
    phase: number
    cn: string
  }
  const bodies: OrbBody[] = []
  const sphereGeo = new THREE.SphereGeometry(0.17, 12, 12)

  const addRing = (planets: OrbitPlanet[], radius: number, color: number): void => {
    for (const p of planets) {
      const mat = new THREE.MeshBasicMaterial({ color })
      const mesh = new THREE.Mesh(sphereGeo, mat)
      const base = ringPos(p.lon, radius)
      mesh.position.set(...base)
      group.add(mesh)
      bodies.push({ mesh, base, phase: Math.random() * Math.PI * 2, cn: p.cn })
    }
  }
  addRing(props.aPlanets, R_A, 0xffd98f)
  addRing(props.bPlanets, R_B, 0xffa8cd)

  /* 相位光弧：两点间的贝塞尔弧线 */
  interface ArcLine {
    line: THREE.Line
    body1: string
    body2: string
    type: string
    mat: THREE.LineBasicMaterial
  }
  const arcs: ArcLine[] = []
  const posOf = (bodyName: string, side: 'a' | 'b'): [number, number, number] | null => {
    const list = side === 'a' ? props.aPlanets : props.bPlanets
    const p = list.find((x) => x.name === bodyName)
    if (!p) return null
    return ringPos(p.lon, side === 'a' ? R_A : R_B)
  }
  for (const asp of props.aspects) {
    const p1 = posOf(asp.body1, 'a')
    const p2 = posOf(asp.body2, 'b')
    if (!p1 || !p2) continue
    const mid = [(p1[0] + p2[0]) / 2, 1.15, (p1[2] + p2[2]) / 2] as [number, number, number]
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...p1),
      new THREE.Vector3(...mid),
      new THREE.Vector3(...p2),
    )
    const color = parseInt(metaOf(asp.type).color.slice(1), 16)
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.75 })
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(40)), mat)
    group.add(line)
    arcs.push({ line, body1: asp.body1, body2: asp.body2, type: asp.type, mat })
  }

  /* 星尘 */
  const starCount = 220
  const starGeo = new THREE.BufferGeometry()
  const starPos = new Float32Array(starCount * 3)
  for (let i = 0; i < starCount; i++) {
    starPos[i * 3] = (Math.random() - 0.5) * 26
    starPos[i * 3 + 1] = (Math.random() - 0.5) * 14
    starPos[i * 3 + 2] = (Math.random() - 0.5) * 26
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xcfc5ff, size: 0.05, transparent: true, opacity: 0.7 }))
  scene.add(stars)

  /* 交互：拖拽旋转 + 滚轮缩放 */
  let dragging = false
  let lastX = 0
  let velY = 0.0022
  let camR = Math.hypot(camera.position.x, camera.position.z)
  const el = renderer.domElement
  el.style.touchAction = 'pan-y' // 竖向滚动还给页面（移动端修复）
  el.style.cursor = 'grab'
  el.addEventListener('pointerdown', (e) => {
    dragging = true
    lastX = e.clientX
    el.setPointerCapture(e.pointerId)
    el.style.cursor = 'grabbing'
  })
  el.addEventListener('pointermove', (e) => {
    if (!dragging) return
    velY = (e.clientX - lastX) * 0.005
    group.rotation.y += velY
    lastX = e.clientX
  })
  const endDrag = (): void => {
    dragging = false
    el.style.cursor = 'grab'
  }
  el.addEventListener('pointerup', endDrag)
  el.addEventListener('pointercancel', endDrag)
  el.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault()
      camR = Math.min(20, Math.max(6.5, camR + e.deltaY * 0.01))
    },
    { passive: false },
  )

  const onResize = (): void => {
    camera.aspect = W() / H()
    camera.updateProjectionMatrix()
    renderer.setSize(W(), H())
  }
  window.addEventListener('resize', onResize)

  /* 主循环 */
  let raf = 0
  const tick = (): void => {
    if (disposed) return
    const now = performance.now() * 0.001
    if (!dragging && !reducedMotion) {
      group.rotation.y += velY
      velY *= 0.96
      velY += (0.0022 - velY) * 0.005 // 回归基础自转
    }
    // 核心呼吸
    core.scale.setScalar(1 + Math.sin(now * 1.6) * 0.06)
    // 行星上下浮游
    for (const b of bodies) {
      b.mesh.position.y = Math.sin(now * 0.9 + b.phase) * 0.22
    }
    // 弧线透明度按过滤状态呼吸
    for (const arc of arcs) {
      const on = enabledTypes.value.has(arc.type) && showAspects.value
      const target = on ? 0.55 + Math.sin(now * 2.1) * 0.18 : 0.04
      arc.mat.opacity += (target - arc.mat.opacity) * 0.08
    }
    stars.rotation.y = now * 0.012
    const camLen = Math.hypot(camera.position.x, camera.position.z)
    if (Math.abs(camLen - camR) > 0.01) {
      const k = camR / camLen
      camera.position.x *= k
      camera.position.z *= k
    }
    camera.lookAt(0, 0, 0)
    renderer.render(scene, camera)
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)

  disposeScene = (): void => {
    disposed = true
    cancelAnimationFrame(raf)
    window.removeEventListener('resize', onResize)
    renderer.dispose()
    el.remove()
  }
}

onMounted(() => {
  initThree()
})
onBeforeUnmount(() => {
  disposeScene?.()
})
</script>

<template>
  <div class="orbit-wrap">
    <div class="orbit-toolbar">
      <button
        v-for="(m, ty) in ASPECT_META"
        :key="ty"
        class="asp-chip"
        :class="{ off: !enabledTypes.has(ty) }"
        :style="{ '--ac': m.color }"
        @click="toggleType(ty)"
      >
        <i class="asp-dot" :style="{ background: m.color }" />
        {{ m.zh }}
      </button>
      <button class="asp-chip toggle-all" :class="{ off: !showAspects }" @click="showAspects = !showAspects; sfx.toggle()">
        {{ showAspects ? (zh ? '🌌 光弧 开' : '🌌 Arcs on') : (zh ? '🌫 光弧 关' : '🌫 Arcs off') }}
      </button>
    </div>
    <div ref="mountRef" class="orbit-stage" />
    <p class="orbit-hint">✧ {{ zh ? '拖拽旋转 · 滚轮推拉 · 点图例筛选相位光弧' : 'drag to orbit · wheel to zoom · tap legend to filter arcs' }}</p>
  </div>
</template>

<style scoped>
.orbit-wrap { position: relative; }
.orbit-stage {
  width: 100%;
  aspect-ratio: 16 / 10;
  min-height: 300px;
  border-radius: 14px;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 50% 120%, rgba(124, 107, 214, 0.16), transparent 60%),
    rgba(13, 11, 32, 0.5);
  border: 1.5px solid color-mix(in srgb, var(--lavender) 25%, transparent);
}
.orbit-stage canvas { display: block; width: 100% !important; height: 100% !important; }
.orbit-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-bottom: 12px;
}
.asp-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 999px;
  border: 1.5px solid var(--ac, rgba(179, 166, 247, 0.5));
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  font-family: inherit;
  font-size: 0.82rem;
  transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.asp-chip:hover { transform: translateY(-2px); filter: drop-shadow(0 0 6px var(--ac)); }
.asp-chip.off { opacity: 0.35; filter: grayscale(0.8); }
.asp-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--ac); box-shadow: 0 0 6px currentColor; }
.asp-chip.toggle-all { border-color: var(--lavender-soft); color: var(--lavender-soft); }
.orbit-hint { margin: 10px 0 0; font-family: var(--pixel); font-size: 0.56rem; letter-spacing: 0.1em; color: var(--ink-dim); text-align: center; }
</style>
