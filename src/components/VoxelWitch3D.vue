<script setup lang="ts">
/**
 * 露娜的 3D 体素模型：由 2D 像素画数据拉伸成体素。
 * 互动：拖拽旋转 / 滚轮缩放 / 闲置自转 / 环绕星尘粒子
 *      + 眨眼与 wink 表情 / 点击触发跳跃·旋转·害羞动作 / UnrealBloom 辉光后处理。
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { witchVoxels } from '../data/witchSprite'
import { sfx } from '../lib/sfx'
import { t } from '../lib/i18n'

const container = ref<HTMLDivElement | null>(null)
const hint = ref(true)

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let witchGroup: THREE.Group | null = null
let starField: THREE.Points | null = null
let moon: THREE.Mesh | null = null
let composer: EffectComposer | null = null
let raf = 0
let disposed = false

let dragging = false
let lastX = 0
let lastY = 0
let downX = 0
let downY = 0
let downTime = 0
let targetRotY = 0.5
let targetRotX = 0.12
let idleTimer: number | null = null

/** 眨眼状态 */
let eyeIndices: number[] = []
let eyeBaseY: number[] = []
let blinkUntil = 0
let nextBlinkAt = 0
/** 跳跃冲量 */
let jumpVel = 0
/** 动作气泡 */
const moodText = ref('')
let moodTimer: number | null = null

/* ---------- 戳一下的星屑爆裂 ---------- */
interface Burst {
  points: THREE.Points
  vels: Float32Array
  born: number
}
let bursts: Burst[] = []
const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function spawnBurst(): void {
  if (!scene || reducedMotion) return
  const N = 46
  const pos = new Float32Array(N * 3)
  const vels = new Float32Array(N * 3)
  for (let i = 0; i < N; i++) {
    pos[i * 3] = 0
    pos[i * 3 + 1] = 0.6
    pos[i * 3 + 2] = 1.4
    const a = Math.random() * Math.PI * 2
    const b = Math.acos(2 * Math.random() - 1)
    const sp = 0.07 + Math.random() * 0.13
    vels[i * 3] = Math.sin(b) * Math.cos(a) * sp
    vels[i * 3 + 1] = Math.abs(Math.cos(b)) * sp * 1.5 + 0.035
    vels[i * 3 + 2] = Math.sin(b) * Math.sin(a) * sp * 0.7 + 0.06
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const hue = [0.11, 0.9, 0.45][Math.floor(Math.random() * 3)]!
  const mat = new THREE.PointsMaterial({
    color: new THREE.Color().setHSL(hue, 0.85, 0.74),
    size: 0.24,
    transparent: true,
    opacity: 1,
  })
  const points = new THREE.Points(geo, mat)
  scene.add(points)
  bursts.push({ points, vels, born: clock.getElapsedTime() })
}

function tickBursts(t: number): void {
  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i]!
    const age = t - b.born
    const attr = b.points.geometry.getAttribute('position') as THREE.BufferAttribute
    const arr = attr.array as Float32Array
    for (let j = 0; j < arr.length; j += 3) {
      b.vels[j + 1]! -= 0.0045
      arr[j]! += b.vels[j]!
      arr[j + 1]! += b.vels[j + 1]!
      arr[j + 2]! += b.vels[j + 2]!
    }
    attr.needsUpdate = true
    ;(b.points.material as THREE.PointsMaterial).opacity = Math.max(0, 1 - age / 1.15)
    if (age > 1.15 && scene) {
      scene.remove(b.points)
      b.points.geometry.dispose()
      ;(b.points.material as THREE.PointsMaterial).dispose()
      bursts.splice(i, 1)
    }
  }
}

function showMood(text: string): void {
  moodText.value = text
  if (moodTimer !== null) window.clearTimeout(moodTimer)
  moodTimer = window.setTimeout(() => (moodText.value = ''), 1600)
}

function build(): void {
  const el = container.value
  if (!el) return

  scene = new THREE.Scene()
  scene.background = new THREE.Color('#141132')

  camera = new THREE.PerspectiveCamera(42, el.clientWidth / el.clientHeight, 0.1, 100)
  camera.position.set(0, 0.8, 14.5)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(el.clientWidth, el.clientHeight)
  el.appendChild(renderer.domElement)

  scene.add(new THREE.AmbientLight(0xbfb3ff, 1.4))
  const dir = new THREE.DirectionalLight(0xfff2d0, 2.2)
  dir.position.set(4, 7, 6)
  scene.add(dir)
  const rim = new THREE.DirectionalLight(0xff9fce, 0.9)
  rim.position.set(-6, -2, -4)
  scene.add(rim)

  // ---- 体素女巫 ----
  const voxels = witchVoxels()
  const COLS = 20
  const ROWS = 23
  const S = 0.52
  const geo = new THREE.BoxGeometry(S, S, S)

  witchGroup = new THREE.Group()
  const count = voxels.length * 2 // 前后两层，有厚度
  const material = new THREE.MeshLambertMaterial()
  const mesh = new THREE.InstancedMesh(geo, material, count)
  const m = new THREE.Matrix4()
  const color = new THREE.Color()

  voxels.forEach((v, i) => {
    const px = (v.x - COLS / 2 + 0.5) * S
    const py = (ROWS / 2 - v.y - 0.5) * S
    for (let layer = 0; layer < 2; layer++) {
      const idx = i * 2 + layer
      m.setPosition(px, py, (layer - 0.5) * S * 1.1)
      mesh.setMatrixAt(idx, m)
      mesh.setColorAt(idx, color.set(v.color).multiplyScalar(layer === 0 ? 1 : 0.72))
      // 记录眼睛体素（E 色），用于眨眼动画
      if (v.color.toLowerCase() === '#3a2e5c') {
        eyeIndices.push(idx)
        eyeBaseY.push(py)
      }
    }
  })
  mesh.instanceMatrix.needsUpdate = true
  witchGroup.add(mesh)
  witchGroup.rotation.y = targetRotY
  witchGroup.rotation.x = targetRotX
  scene.add(witchGroup)

  // ---- 环绕星尘 ----
  const starCount = 90
  const positions = new Float32Array(starCount * 3)
  for (let i = 0; i < starCount; i++) {
    const angle = Math.random() * Math.PI * 2
    const radius = 4.6 + Math.random() * 1.6
    positions[i * 3] = Math.cos(angle) * radius
    positions[i * 3 + 1] = (Math.random() - 0.4) * 6.5
    positions[i * 3 + 2] = Math.sin(angle) * radius
  }
  const starGeo = new THREE.BufferGeometry()
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  starField = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xf5c86e, size: 0.14 }))
  scene.add(starField)

  // ---- 环绕体素月球 ----
  moon = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.7, 0.7),
    new THREE.MeshLambertMaterial({ color: 0xffe3a8 }),
  )
  scene.add(moon)

  // ---- 地面光晕 ----
  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(4.4, 40),
    new THREE.MeshBasicMaterial({ color: '#7c6bd6', transparent: true, opacity: 0.16 }),
  )
  glow.rotation.x = -Math.PI / 2
  glow.position.y = -ROWS * S * 0.5 - 0.4
  scene.add(glow)

  // ---- 辉光后处理（尊重 reduced-motion）----
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    const bloom = new UnrealBloomPass(new THREE.Vector2(el.clientWidth, el.clientHeight), 0.5, 0.65, 0.78)
    composer.addPass(bloom)
    composer.addPass(new OutputPass())
    composer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    composer.setSize(el.clientWidth, el.clientHeight)
  }

  nextBlinkAt = clock.getElapsedTime() + 2 + Math.random() * 3
  bindEvents(el)
  animate()
}

/** 把眼睛实例按给定缩放写入矩阵 */
function setEyeScale(scaleY: number): void {
  if (!witchGroup) return
  const mesh = witchGroup.children[0] as THREE.InstancedMesh | undefined
  if (!mesh) return
  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const pos = new THREE.Vector3()
  const scl = new THREE.Vector3(1, 1, 1)
  eyeIndices.forEach((idx, k) => {
    mesh.getMatrixAt(idx, m)
    m.decompose(pos, q, scl)
    scl.y = scaleY
    pos.y = eyeBaseY[k]! * (scaleY < 1 ? 0.985 : 1)
    m.compose(pos, q, scl)
    mesh.setMatrixAt(idx, m)
  })
  mesh.instanceMatrix.needsUpdate = true
}

/** 点击动作 */
function doAction(): void {
  const actions = ['jump', 'spin', 'wink', 'shy'] as const
  const action = actions[Math.floor(Math.random() * actions.length)]!
  sfx.pop()
  spawnBurst()

  switch (action) {
    case 'jump':
      jumpVel = 0.16
      showMood(t('mood.jump'))
      break
    case 'spin':
      targetRotY += Math.PI * 2
      showMood(t('mood.spin'))
      break
    case 'wink':
      setEyeScale(0.08)
      window.setTimeout(() => setEyeScale(1), 420)
      showMood(t('mood.wink'))
      break
    case 'shy':
      showMood(t('mood.shy'))
      break
  }
}

function bindEvents(el: HTMLElement): void {
  el.addEventListener('pointerdown', (e) => {
    dragging = true
    downX = e.clientX
    downY = e.clientY
    downTime = performance.now()
    lastX = e.clientX
    lastY = e.clientY
    hint.value = false
    if (idleTimer !== null) window.clearTimeout(idleTimer)
    el.setPointerCapture(e.pointerId)
  })
  el.addEventListener('pointermove', (e) => {
    if (!dragging) return
    targetRotY += (e.clientX - lastX) * 0.012
    targetRotX = Math.max(-0.6, Math.min(0.6, targetRotX + (e.clientY - lastY) * 0.008))
    lastX = e.clientX
    lastY = e.clientY
  })
  const endDrag = (): void => {
    if (dragging && performance.now() - downTime < 320 && Math.hypot(lastX - downX, lastY - downY) < 7) {
      doAction()
    }
    dragging = false
    if (idleTimer !== null) window.clearTimeout(idleTimer)
    idleTimer = window.setTimeout(() => hint.value = true, 4000)
  }
  el.addEventListener('pointerup', endDrag)
  el.addEventListener('pointercancel', endDrag)
  el.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault()
      if (!camera) return
      const z = camera.position.z + e.deltaY * 0.01
      camera.position.z = Math.max(7, Math.min(18, z))
    },
    { passive: false },
  )
  window.addEventListener('resize', onResize)
}

function onResize(): void {
  const el = container.value
  if (!el || !camera || !renderer) return
  camera.aspect = el.clientWidth / el.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(el.clientWidth, el.clientHeight)
  composer?.setSize(el.clientWidth, el.clientHeight)
}

const clock = new THREE.Clock()
function animate(): void {
  if (disposed) return
  raf = requestAnimationFrame(animate)
  const t = clock.getElapsedTime()

  // 自动眨眼
  if (t > nextBlinkAt && t > blinkUntil) {
    blinkUntil = t + 0.16
    nextBlinkAt = t + 2.2 + Math.random() * 3.4
  }
  const eyesClosed = t < blinkUntil
  setEyeScaleLive(eyesClosed ? 0.1 : 1)

  if (witchGroup) {
    if (!dragging) targetRotY += 0.0045
    witchGroup.rotation.y += (targetRotY - witchGroup.rotation.y) * 0.12
    witchGroup.rotation.x += (targetRotX - witchGroup.rotation.x) * 0.12
    // 悬浮 + 跳跃物理
    jumpVel -= 0.012
    if (jumpVel < 0) jumpVel = Math.max(jumpVel, -0.3)
    jumpOffset = Math.max(0, jumpOffset + jumpVel)
    witchGroup.position.y = Math.sin(t * 1.4) * 0.22 + jumpOffset
  }
  if (starField) starField.rotation.y = t * 0.12
  if (moon) {
    moon.position.set(Math.cos(t * 0.55) * 5.4, Math.sin(t * 0.85) * 2.4 + 0.6, Math.sin(t * 0.55) * 5.4)
    moon.rotation.y = t * 1.4
    moon.rotation.x = t * 0.7
  }
  tickBursts(t)

  if (composer) composer.render()
  else if (renderer && scene && camera) renderer.render(scene, camera)
}

let jumpOffset = 0
let lastEyeScale = 1
function setEyeScaleLive(s: number): void {
  if (s !== lastEyeScale) {
    setEyeScale(s)
    lastEyeScale = s
  }
}

onMounted(build)

onBeforeUnmount(() => {
  disposed = true
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', onResize)
  if (moodTimer !== null) window.clearTimeout(moodTimer)
  for (const b of bursts) {
    b.points.geometry.dispose()
    ;(b.points.material as THREE.PointsMaterial).dispose()
  }
  bursts = []
  renderer?.dispose()
  renderer?.domElement.remove()
})
</script>

<template>
  <div class="voxel-wrap">
    <div ref="container" class="voxel-canvas" />
    <Transition name="fade">
      <span v-if="hint" class="drag-hint">{{ t('voxel.hint') }}</span>
    </Transition>
    <Transition name="pop">
      <span v-if="moodText" class="mood-bubble">{{ moodText }}</span>
    </Transition>
  </div>
</template>

<style scoped>
.voxel-wrap { position: relative; }
.voxel-canvas {
  width: 100%;
  height: 380px;
  cursor: grab;
  touch-action: none;
  border: 3px solid color-mix(in srgb, var(--lavender) 35%, transparent);
  image-rendering: pixelated;
}
.voxel-canvas:active { cursor: grabbing; }
.drag-hint {
  position: absolute;
  left: 50%;
  bottom: 14px;
  transform: translateX(-50%);
  font-family: var(--pixel);
  font-size: 0.55rem;
  letter-spacing: 0.12em;
  color: var(--gold-bright);
  background: rgba(21, 18, 50, 0.85);
  padding: 8px 14px;
  border: 2px solid color-mix(in srgb, var(--gold) 50%, transparent);
  pointer-events: none;
  animation: hint-bob 2s ease-in-out infinite;
}
@keyframes hint-bob {
  0%, 100% { transform: translate(-50%, 0); }
  50% { transform: translate(-50%, -5px); }
}
.mood-bubble {
  position: absolute;
  top: 26px;
  right: 22px;
  background: #fff6ec;
  color: #2e2650;
  font-family: var(--cute);
  font-size: 0.95rem;
  padding: 8px 14px;
  border-radius: 14px 14px 14px 3px;
  border: 2px solid var(--gold);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
  animation: bubble-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  pointer-events: none;
}
@keyframes bubble-in {
  from { opacity: 0; transform: translateY(-8px) scale(0.8); }
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.pop-enter-active, .pop-leave-active { transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: translateY(-8px) scale(0.85); }
@media (max-width: 600px) {
  .voxel-canvas { height: 300px; }
}
</style>
