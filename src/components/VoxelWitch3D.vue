<script setup lang="ts">
/**
 * 露娜的 3D 体素模型：由 2D 像素画数据拉伸成体素。
 * 互动：拖拽旋转 / 滚轮缩放 / 闲置自动旋转 / 环绕星尘粒子。
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import * as THREE from 'three'
import { witchVoxels } from '../data/witchSprite'

const container = ref<HTMLDivElement | null>(null)
const hint = ref(true)

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let witchGroup: THREE.Group | null = null
let starField: THREE.Points | null = null
let raf = 0
let disposed = false

let dragging = false
let lastX = 0
let lastY = 0
let targetRotY = 0.5
let targetRotX = 0.12
let idleTimer: number | null = null

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

  // ---- 地面光晕 ----
  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(4.4, 40),
    new THREE.MeshBasicMaterial({ color: '#7c6bd6', transparent: true, opacity: 0.16 }),
  )
  glow.rotation.x = -Math.PI / 2
  glow.position.y = -ROWS * S * 0.5 - 0.4
  scene.add(glow)

  bindEvents(el)
  animate()
}

function bindEvents(el: HTMLElement): void {
  el.addEventListener('pointerdown', (e) => {
    dragging = true
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
}

const clock = new THREE.Clock()
function animate(): void {
  if (disposed) return
  raf = requestAnimationFrame(animate)
  const t = clock.getElapsedTime()

  if (witchGroup) {
    if (!dragging) targetRotY += 0.0045
    witchGroup.rotation.y += (targetRotY - witchGroup.rotation.y) * 0.12
    witchGroup.rotation.x += (targetRotX - witchGroup.rotation.x) * 0.12
    witchGroup.position.y = Math.sin(t * 1.4) * 0.22
  }
  if (starField) starField.rotation.y = t * 0.12
  if (renderer && scene && camera) renderer.render(scene, camera)
}

onMounted(build)

onBeforeUnmount(() => {
  disposed = true
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', onResize)
  renderer?.dispose()
  renderer?.domElement.remove()
})
</script>

<template>
  <div class="voxel-wrap">
    <div ref="container" class="voxel-canvas" />
    <Transition name="fade">
      <span v-if="hint" class="drag-hint">✧ 拖拽旋转 · 滚轮缩放 ✧</span>
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
  border: 3px solid rgba(179, 166, 247, 0.35);
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
  border: 2px solid rgba(245, 200, 110, 0.5);
  pointer-events: none;
  animation: hint-bob 2s ease-in-out infinite;
}
@keyframes hint-bob {
  0%, 100% { transform: translate(-50%, 0); }
  50% { transform: translate(-50%, -5px); }
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
@media (max-width: 600px) {
  .voxel-canvas { height: 300px; }
}
</style>
