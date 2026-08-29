<script setup lang="ts">
/**
 * 真·3D 天象仪（three.js）：九星真实球体 + 土星环 + 轨道拖尾 + 星野。
 * 拖拽旋转视角（带惯性阻尼）· 滚轮缩放 · 点星球选中 · UnrealBloom 辉光。
 * 行星黄经由父组件的星历计算驱动，本组件只负责"演"。
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { MAX_DPR } from '../lib/device'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { isLowEnd } from '../lib/perf'
import { createClock } from '../lib/clock'

export interface OrreryBody {
  key: string
  glyph: string
  /** 展示轨道半径（像素域，内部会换算成世界坐标） */
  orbit: number
  color: string
  lon: number
}

const props = defineProps<{ bodies: OrreryBody[]; selected?: string | null }>()
const emit = defineEmits<{ pick: [key: string] }>()

const container = ref<HTMLDivElement | null>(null)

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let composer: EffectComposer | null = null
let rig: THREE.Group | null = null // 整体俯仰/偏航
let raf = 0
let disposed = false

interface PlanetNode {
  key: string
  mesh: THREE.Mesh
  label: THREE.Sprite
  trail: THREE.Line
  trailPos: Float32Array
  trailCount: number
  radius: number
  spin: number
  inc: number
}
let planets: PlanetNode[] = []
let halo: THREE.Sprite | null = null
let latestBodies: OrreryBody[] = []

/* 相机与操控状态 */
let rotY = 0.5
let rotX = -0.62
let velY = 0
let velX = 0
let camZ = 34
let camZTarget = 34
let dragging = false
let downX = 0
let downY = 0
let lastX = 0
let lastY = 0
let downTime = 0
let lastInteract = 0

const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** 像素轨道半径 → 世界半径 */
function worldOrbit(px: number): number {
  return px / 13
}

const SIZE: Record<string, number> = {
  Sun: 0.62,
  Moon: 0.14,
  Mercury: 0.16,
  Venus: 0.23,
  Mars: 0.19,
  Jupiter: 0.4,
  Saturn: 0.34,
  Uranus: 0.26,
  Neptune: 0.25,
}

function makeLabel(text: string, color: string): THREE.Sprite {
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 64
  const g = c.getContext('2d')!
  g.font = 'bold 44px serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.shadowColor = 'rgba(0,0,0,.65)'
  g.shadowBlur = 8
  g.fillStyle = color
  g.fillText(text, 64, 32)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  const sp = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }),
  )
  sp.scale.set(1.5, 0.75, 1)
  return sp
}

function makeGlowTex(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 128
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 62)
  grad.addColorStop(0, 'rgba(255,225,150,0.95)')
  grad.addColorStop(0.4, 'rgba(255,205,110,0.35)')
  grad.addColorStop(1, 'rgba(255,205,110,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}

function circlePoints(r: number, n = 160): THREE.Vector3[] {
  const pts: THREE.Vector3[] = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r))
  }
  return pts
}

function build(): void {
  const el = container.value
  if (!el) return

  scene = new THREE.Scene()
  scene.background = new THREE.Color('#0d0b20')

  camera = new THREE.PerspectiveCamera(46, el.clientWidth / Math.max(1, el.clientHeight), 0.1, 300)
  camera.position.set(0, 0, camZ)

  renderer = new THREE.WebGLRenderer({ antialias: true })

renderer.setPixelRatio(MAX_DPR)
  renderer.setSize(el.clientWidth, el.clientHeight)
  el.appendChild(renderer.domElement)

  scene.add(new THREE.AmbientLight(0x8f86c9, 0.75))
  const sunLight = new THREE.PointLight(0xffe9b0, 260, 0, 1.6)
  scene.add(sunLight)

  rig = new THREE.Group()
  rig.rotation.x = rotX
  rig.rotation.y = rotY
  scene.add(rig)

  /* ---- 太阳 ---- */
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(SIZE.Sun!, 32, 24),
    new THREE.MeshBasicMaterial({ color: '#ffd76e' }),
  )
  sun.userData.key = 'Sun'
  rig.add(sun)
  planets.push({
    key: 'Sun',
    mesh: sun,
    label: makeLabel('☉', '#ffe3a8'),
    trail: new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ transparent: true, opacity: 0 }),
    ),
    trailPos: new Float32Array(0),
    trailCount: 0,
    radius: SIZE.Sun!,
    spin: 0,
    inc: 0,
  })
  const sunLabel = planets[0]!.label
  sunLabel.position.set(0, 1.15, 0)
  rig.add(sunLabel)

  /* ---- 行星 ---- */
  const glowTex = makeGlowTex()
  let idx = 0
  for (const b of props.bodies) {
    if (b.key === 'Sun') continue
    const r = worldOrbit(b.orbit)
    const size = SIZE[b.key] ?? 0.2
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(size, 24, 18),
      new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.82, metalness: 0.06 }),
    )
    mesh.userData.key = b.key
    rig.add(mesh)

    if (b.key === 'Saturn') {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(size * 1.45, size * 2.15, 48),
        new THREE.MeshBasicMaterial({
          color: '#e8dcae',
          transparent: true,
          opacity: 0.65,
          side: THREE.DoubleSide,
        }),
      )
      ring.rotation.x = Math.PI / 2.25
      mesh.add(ring)
    }

    const label = makeLabel(b.glyph, b.color)
    label.position.set(0, size + 0.45, 0)
    mesh.add(label)

    // 轨道线
    const orbitPts = circlePoints(r)
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPts)
    rig.add(
      new THREE.LineLoop(
        orbitGeo,
        new THREE.LineBasicMaterial({ color: 0x7a6fd0, transparent: true, opacity: 0.2 }),
      ),
    )

    // 拖尾缓冲
    const MAXT = 90
    const trailPos = new Float32Array(MAXT * 3)
    const trailGeo = new THREE.BufferGeometry()
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3))
    trailGeo.setDrawRange(0, 0)
    const trail = new THREE.Line(
      trailGeo,
      new THREE.LineBasicMaterial({ color: b.color, transparent: true, opacity: 0.4 }),
    )
    trail.frustumCulled = false
    rig.add(trail)

    planets.push({
      key: b.key,
      mesh,
      label,
      trail,
      trailPos,
      trailCount: 0,
      radius: size,
      spin: 0.25 + (idx % 4) * 0.09,
      inc: ((idx % 3) - 1) * 0.035,
    })
    idx++
  }

  /* ---- 选中光环 ---- */
  halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTex,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  )
  halo.scale.set(2.6, 2.6, 1)
  halo.visible = false
  scene.add(halo)

  /* ---- 远景星野 ---- */
  const N = 520
  const pos = new Float32Array(N * 3)
  for (let i = 0; i < N; i++) {
    const rr = 46 + Math.random() * 40
    const th = Math.random() * Math.PI * 2
    const ph = Math.acos(2 * Math.random() - 1)
    pos[i * 3] = rr * Math.sin(ph) * Math.cos(th)
    pos[i * 3 + 1] = rr * Math.cos(ph) * 0.6
    pos[i * 3 + 2] = rr * Math.sin(ph) * Math.sin(th)
  }
  const starGeo = new THREE.BufferGeometry()
  starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const stars = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({ color: 0xcfc6ff, size: 0.42, transparent: true, opacity: 0.8 }),
  )
  scene.add(stars)

  /* ---- 辉光后处理（低端机/省流自动跳过）---- */
  if (!reducedMotion && !isLowEnd()) {
    composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(el.clientWidth, el.clientHeight),
      0.55,
      0.7,
      0.72,
    )
    composer.addPass(bloom)
    composer.addPass(new OutputPass())
    composer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    composer.setSize(el.clientWidth, el.clientHeight)
  }

  bindEvents(el)
  onResize()
  clock.start()
  animate()
}

watch(
  () => props.bodies,
  (b) => {
    latestBodies = b
  },
  { immediate: true },
)

watch(
  () => props.selected,
  (key) => {
    if (!halo || !scene) return
    if (!key) {
      halo.visible = false
      return
    }
    const p = planets.find((x) => x.key === key)
    if (!p) return
    halo.visible = true
    halo.position.copy(p.mesh.getWorldPosition(new THREE.Vector3()))
    halo.material.rotation = Math.random() * Math.PI
  },
)

const clock = createClock()

function placePlanets(): void {
  for (const p of planets) {
    const b = latestBodies.find((x) => x.key === p.key)
    if (!b) continue
    const rad = ((b.lon - 90) * Math.PI) / 180
    const wr = p.key === 'Sun' ? 0 : worldOrbit(b.orbit)
    const x = Math.cos(rad) * wr
    const z = Math.sin(rad) * wr
    const y = Math.sin(rad) * wr * p.inc
    p.mesh.position.set(x, y, z)

    // 拖尾：满 90 点后整体前移一格（O(90)，九星无压力）
    if (wr > 0 && p.trailPos.length >= 3) {
      const MAXT = p.trailPos.length / 3
      if (p.trailCount < MAXT) {
        p.trailPos[p.trailCount * 3] = x
        p.trailPos[p.trailCount * 3 + 1] = y
        p.trailPos[p.trailCount * 3 + 2] = z
        p.trailCount++
      } else {
        p.trailPos.copyWithin(0, 3)
        p.trailPos[(MAXT - 1) * 3] = x
        p.trailPos[(MAXT - 1) * 3 + 1] = y
        p.trailPos[(MAXT - 1) * 3 + 2] = z
      }
      ;(p.trail.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true
      p.trail.geometry.setDrawRange(0, p.trailCount)
    }
  }
}

let haloPulse = 0
let inView = true
const viewIO = new IntersectionObserver(
  (es) => {
    inView = es[0]?.isIntersecting ?? true
  },
  { threshold: 0.02 },
)
function animate(): void {
if (disposed) return
raf = requestAnimationFrame(animate)
// 离屏/后台挂起：跳过渲染但时钟保持新鲜（回来不跳帧）
if (!inView || document.hidden) {
clock.getDelta()
return
}
const dt = Math.min(clock.getDelta(), 0.05)

  placePlanets()

  // 自转
  for (const p of planets) p.mesh.rotation.y += p.spin * dt

  // 惯性 + 闲置自转
  if (!dragging) {
    rotY += velY
    rotX += velX
    velY *= 0.93
    velX *= 0.93
    if (!reducedMotion && performance.now() - lastInteract > 4000) rotY += 0.0011
  }
  rotX = Math.max(-1.25, Math.min(0.4, rotX))
  if (rig) {
    rig.rotation.y = rotY
    rig.rotation.x = rotX
  }

  // 缩放平滑
  camZ += (camZTarget - camZ) * 0.08
  if (camera) camera.position.z = camZ

  // 选中光环脉动
  if (halo && halo.visible) {
    haloPulse += dt
    const s = 2.4 + Math.sin(haloPulse * 3.4) * 0.5
    halo.scale.set(s, s, 1)
    const p = planets.find((x) => x.key === props.selected)
    if (p) halo.position.copy(p.mesh.getWorldPosition(new THREE.Vector3()))
  }

  if (composer) composer.render()
  else if (renderer && scene && camera) renderer.render(scene, camera)
}

/* ---------- 交互 ---------- */
function bindEvents(el: HTMLElement): void {
  el.addEventListener('pointerdown', (e) => {
    dragging = true
    downX = lastX = e.clientX
    downY = lastY = e.clientY
    downTime = performance.now()
    lastInteract = performance.now()
    velX = velY = 0
    el.setPointerCapture(e.pointerId)
  })
  el.addEventListener('pointermove', (e) => {
    lastInteract = performance.now()
    if (!dragging) return
    rotY += (e.clientX - lastX) * 0.0052
    rotX += (e.clientY - lastY) * 0.0042
    velY = (e.clientX - lastX) * 0.0052
    velX = (e.clientY - lastY) * 0.0042
    lastX = e.clientX
    lastY = e.clientY
  })
  el.addEventListener('pointerup', (e) => {
    if (!dragging) return
    dragging = false
    const dx = e.clientX - downX
    const dy = e.clientY - downY
    if (performance.now() - downTime < 350 && Math.hypot(dx, dy) < 7) {
      raycastPick(e, el)
    }
  })
  // 触控被系统接管（来电/通知）时复位，否则拖拽状态卡死
  el.addEventListener('pointercancel', () => {
    dragging = false
    lastInteract = performance.now()
  })
  el.addEventListener('wheel', (e) => {
    e.preventDefault()
    lastInteract = performance.now()
    camZTarget = Math.max(13, Math.min(52, camZTarget + e.deltaY * 0.02))
  }, { passive: false })
  window.addEventListener('resize', onResize)
viewIO.observe(el)
}

const raycaster = new THREE.Raycaster()
const ndc = new THREE.Vector2()
function raycastPick(e: PointerEvent, el: HTMLElement): void {
  if (!camera) return
  const rect = el.getBoundingClientRect()
  ndc.set(
    ((e.clientX - rect.left) / rect.width) * 2 - 1,
    -((e.clientY - rect.top) / rect.height) * 2 + 1,
  )
  raycaster.setFromCamera(ndc, camera)
  const hits = raycaster.intersectObjects(planets.map((p) => p.mesh), false)
  if (hits.length > 0) {
    const key = (hits[0]!.object.userData as { key?: string }).key
    if (key) emit('pick', key)
  }
}

function onResize(): void {
  const el = container.value
  if (!el || !camera || !renderer) return
  camera.aspect = el.clientWidth / Math.max(1, el.clientHeight)
  camera.updateProjectionMatrix()
  renderer.setSize(el.clientWidth, el.clientHeight)
  composer?.setSize(el.clientWidth, el.clientHeight)
}

onMounted(build)

onBeforeUnmount(() => {
disposed = true
cancelAnimationFrame(raf)
window.removeEventListener('resize', onResize)
viewIO.disconnect()
  scene?.traverse((o) => {
    const m = o as THREE.Mesh
    if (m.geometry) m.geometry.dispose()
    const mat = m.material as THREE.Material | THREE.Material[] | undefined
    const mats = Array.isArray(mat) ? mat : mat ? [mat] : []
    for (const x of mats) {
      // Sprite/Points 的贴图（标签、辉光）也要释放，否则每次进出页面泄漏 GPU 纹理
      const withMap = x as THREE.Material & { map?: THREE.Texture | null }
      withMap.map?.dispose()
      x.dispose()
    }
  })
  composer?.dispose()
  renderer?.dispose()
  renderer?.domElement.remove()
})
</script>

<template>
  <div ref="container" class="orr3d" />
</template>

<style scoped>
.orr3d {
  width: 100%;
  height: 480px;
  max-width: 620px;
  border-radius: 12px;
  overflow: hidden;
  cursor: grab;
  touch-action: pan-y;
  background: #0d0b20;
}
.orr3d:active { cursor: grabbing; }
@media (max-width: 640px) { .orr3d { height: 360px; } }
</style>
