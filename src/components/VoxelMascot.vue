<script setup lang="ts">
/**
 * 神谕宠物园：模块吉祥物体素小人。
 * 由 mascots.ts 的像素画拉伸成体素，互动：
 * 光标追踪（视线跟随）· 拖拽旋转 · 滚轮缩放 · 点击触发跳跃/旋转/wink/害羞
 * 自动眨眼 · 闲置自转 · 环绕卫星体素与星尘 · 戳一下的星屑爆裂。
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { MASCOTS, mascotVoxels } from '../data/mascots'
import { sfx } from '../lib/sfx'
import { t } from '../lib/i18n'
import { lowPowerActive } from '../lib/perf'
import { themeVar, onThemeChange } from '../lib/themeColors'
import { isLowEnd } from '../lib/perf'
import { addAffection, levelOf, getPoints, SECRET_LINES } from '../lib/affection'

const props = withDefaults(defineProps<{ id: string; height?: number }>(), { height: 230 })

const container = ref<HTMLDivElement | null>(null)
const hint = ref(true)

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let petGroup: THREE.Group | null = null
let starField: THREE.Points | null = null
let satellite: THREE.Mesh | null = null
let composer: EffectComposer | null = null
let bloomPass: UnrealBloomPass | null = null
let rimLight: THREE.DirectionalLight | null = null
let raf = 0
let disposed = false
let themeWatcher: { disconnect: () => void } | null = null

let dragging = false
let lastX = 0
let downX = 0
let downTime = 0
/** 基础朝向（拖拽/闲置自转累积）+ 光标偏移 */
let autoRotY = 0.45
let leanY = 0
let leanX = 0.08
let targetRotY = autoRotY
let targetRotX = leanX
let lastInteractAt = 0
let idleTimer: number | null = null
/** 抚摸累计行程（拖着蹭过一定距离算摸一次） */
let strokeAccum = 0
let petting = false
/** 闲置自言自语定时器（bindEvents 里安装） */
let chatterTimer: number | null = null

let eyeIndices: number[] = []
let eyeBaseY: number[] = []
let blinkUntil = 0
let nextBlinkAt = 0
let doubleBlinkPending = false
let jumpVel = 0
let jumpOffset = 0
let prevJumpOffset = 0
/** 落地挤压的截止时刻 */
let landSquashUntil = 0

/* ---- 生命感状态 ---- */
const asleep = ref(false)
let nextTrickAt = 0
let trickLeanY = 0
let wiggleUntil = 0

const moodText = ref('')
let moodTimer: number | null = null

interface Burst {
  points: THREE.Points
  vels: Float32Array
  born: number
}
let bursts: Burst[] = []
const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** 简易亮度估算（hex → 0~1），判断当前皮肤是否浅色底 */
function luminanceOf(hex: string): number {
  const m = hex.trim().match(/^#?([0-9a-f]{6})$/i)
  if (!m) return 0
  const n = parseInt(m[1]!, 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

function showMood(text: string): void {
  moodText.value = text
  if (moodTimer !== null) window.clearTimeout(moodTimer)
  moodTimer = window.setTimeout(() => (moodText.value = ''), 1700)
}

function spawnBurst(): void {
  if (!scene || reducedMotion) return
  const N = 34
  const pos = new Float32Array(N * 3)
  const vels = new Float32Array(N * 3)
  for (let i = 0; i < N; i++) {
    pos[i * 3] = 0
    pos[i * 3 + 1] = 0.5
    pos[i * 3 + 2] = 0.9
    const a = Math.random() * Math.PI * 2
    const b = Math.acos(2 * Math.random() - 1)
    const sp = 0.06 + Math.random() * 0.11
    vels[i * 3] = Math.sin(b) * Math.cos(a) * sp
    vels[i * 3 + 1] = Math.abs(Math.cos(b)) * sp * 1.4 + 0.03
    vels[i * 3 + 2] = Math.sin(b) * Math.sin(a) * sp * 0.7 + 0.05
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const hue = [0.11, 0.9, 0.45][Math.floor(Math.random() * 3)]!
  const mat = new THREE.PointsMaterial({
    color: new THREE.Color().setHSL(hue, 0.85, 0.74),
    size: 0.2,
    transparent: true,
    opacity: 1,
  })
  const points = new THREE.Points(geo, mat)
  scene.add(points)
  bursts.push({ points, vels, born: clock.getElapsedTime() })
}

function tickBursts(now: number): void {
  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i]!
    const age = now - b.born
    const attr = b.points.geometry.getAttribute('position') as THREE.BufferAttribute
    const arr = attr.array as Float32Array
    for (let j = 0; j < arr.length; j += 3) {
      b.vels[j + 1]! -= 0.004
      arr[j]! += b.vels[j]!
      arr[j + 1]! += b.vels[j + 1]!
      arr[j + 2]! += b.vels[j + 2]!
    }
    attr.needsUpdate = true
    ;(b.points.material as THREE.PointsMaterial).opacity = Math.max(0, 1 - age / 1.05)
    if (age > 1.05 && scene) {
      scene.remove(b.points)
      b.points.geometry.dispose()
      ;(b.points.material as THREE.PointsMaterial).dispose()
      bursts.splice(i, 1)
    }
  }
}

/** 每只吉祥物的专属卫星道具：形状即身份 */
function makeSatGeo(id: string): THREE.BufferGeometry {
  switch (id) {
    case 'cat':
      return new THREE.BoxGeometry(0.62, 0.88, 0.08) // 悬浮塔罗牌
    case 'owl':
      return new THREE.SphereGeometry(0.36, 14, 12) // 小行星
    case 'numi':
      return new THREE.OctahedronGeometry(0.44) // 八面命运骰
    case 'golem':
      return new THREE.IcosahedronGeometry(0.4) // 符文宝石
    case 'twins':
      return new THREE.TorusGeometry(0.3, 0.12, 10, 20) // 爱心光环
case 'comet':
return new THREE.ConeGeometry(0.32, 0.72, 8) // 彗核
case 'mist':
return new THREE.SphereGeometry(0.36, 14, 10) // 雾中水晶球
default:
return new THREE.BoxGeometry(0.5, 0.5, 0.5)
  }
}

function build(): void {
  const low = lowPowerActive()
  const el = container.value
  const def = MASCOTS[props.id]
  if (!el || !def) return

  scene = new THREE.Scene()
  scene.background = new THREE.Color(themeVar('--void-1', '#141132'))

  camera = new THREE.PerspectiveCamera(40, el.clientWidth / Math.max(1, el.clientHeight), 0.1, 100)
  camera.position.set(0, 0.7, 12)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, low ? 1.5 : 2))
  renderer.setSize(el.clientWidth, el.clientHeight)
  el.appendChild(renderer.domElement)

  scene.add(new THREE.AmbientLight(0xbfb3ff, 1.35))
  const dir = new THREE.DirectionalLight(0xfff2d0, 2)
  dir.position.set(4, 7, 6)
  scene.add(dir)
  const rim = new THREE.DirectionalLight(0xff9fce, 0.85)
  rim.position.set(-6, -2, -4)
  scene.add(rim)
  rimLight = rim

  // ---- 体素宠物 ----
  const voxels = mascotVoxels(def)
  const COLS = Math.max(...def.sprite.map((r) => r.length))
  const ROWS = def.sprite.length
  const S = Math.min(0.62, 8 / Math.max(COLS, ROWS))
    const SUB = low ? 2 : 4 // 高配 4×4/像素 ≈ 68-92 列网格
  const s2 = S / SUB
  const geo = new THREE.BoxGeometry(s2, s2, S)

  petGroup = new THREE.Group()
  const count = voxels.length * SUB * SUB * 2 // 前后两层深塑 × 像素细分
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial(), count)
  const m = new THREE.Matrix4()
  const color = new THREE.Color()

  const filled = new Set(voxels.map((v) => `${v.x},${v.y}`))
  const outlineColor = themeVar('--void-0', '#151232')
  const hashN = (a: number, b: number): number => {
    let h = (a * 374761393 + b * 668265263) >>> 0
    h = (h ^ (h >>> 13)) * 1274126177
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295
  }
  let idx = 0
  voxels.forEach((v) => {
    for (let sx = 0; sx < SUB; sx++) {
      for (let sy = 0; sy < SUB; sy++) {
        const px = (v.x - COLS / 2 + 0.5) * S + (sx - (SUB - 1) / 2) * s2
        const py = (ROWS / 2 - v.y - 0.5) * S + ((SUB - 1 - sy) - (SUB - 1) / 2) * s2
        for (let layer = 0; layer < 2; layer++) {
          m.setPosition(px, py, (layer - 0.5) * S * 1.1)
          mesh.setMatrixAt(idx, m)
          // 邻空描边：轮廓利落；内部哈希噪声打破色块感
          const onEdge =
            (sx === 0 && !filled.has(`${v.x - 1},${v.y}`)) ||
            (sx === SUB - 1 && !filled.has(`${v.x + 1},${v.y}`)) ||
            (sy === 0 && !filled.has(`${v.x},${v.y - 1}`)) ||
            (sy === SUB - 1 && !filled.has(`${v.x},${v.y + 1}`))
          if (onEdge && !v.isEye) {
            mesh.setColorAt(idx, color.set(outlineColor))
          } else {
            const jitter = v.isEye ? 1 : 0.94 + hashN(v.x * SUB + sx, v.y * SUB + sy) * 0.12
            mesh.setColorAt(idx, color.set(v.color).multiplyScalar((layer === 0 ? 1 : 0.74) * jitter))
          }
          if (v.isEye && layer === 0) {
            eyeIndices.push(idx)
            eyeBaseY.push(py)
          }
          idx++
        }
      }
    }
  })
  mesh.instanceMatrix.needsUpdate = true
  petGroup.add(mesh)
  petGroup.rotation.y = targetRotY
  petGroup.rotation.x = targetRotX
  scene.add(petGroup)

  // ---- 环绕星尘 ----
  const starCount = low ? 24 : 56
  const positions = new Float32Array(starCount * 3)
  for (let i = 0; i < starCount; i++) {
    const angle = Math.random() * Math.PI * 2
    const radius = 3.6 + Math.random() * 1.3
    positions[i * 3] = Math.cos(angle) * radius
    positions[i * 3 + 1] = (Math.random() - 0.4) * 5
    positions[i * 3 + 2] = Math.sin(angle) * radius
  }
  const starGeo = new THREE.BufferGeometry()
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  starField = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({ color: def.satelliteColor, size: 0.13 }),
  )
  scene.add(starField)

  // ---- 环绕卫星体素 ----
  satellite = new THREE.Mesh(makeSatGeo(props.id), new THREE.MeshLambertMaterial({ color: def.satelliteColor }))
  scene.add(satellite)

  // ---- 地面光晕 ----
  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(3.4, 36),
    new THREE.MeshBasicMaterial({ color: def.glowColor, transparent: true, opacity: 0.15 }),
  )
  glow.rotation.x = -Math.PI / 2
  glow.position.y = (-ROWS * S) / 2 - 0.35
  scene.add(glow)

  // ---- 辉光后处理（与首页露娜同款，尊重 reduced-motion；低端机跳过）----
  if (!reducedMotion && !isLowEnd()) {
    composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(el.clientWidth, el.clientHeight),
      0.45,
      0.6,
      0.8,
    )
    composer.addPass(bloom)
    bloomPass = bloom
    composer.addPass(new OutputPass())
    composer.setPixelRatio(Math.min(window.devicePixelRatio, low ? 1.5 : 2))
    composer.setSize(el.clientWidth, el.clientHeight)
  }

  // 皮肤切换：重涂舞台底色；浅色皮肤下提亮轮廓光、压低辉光，宠物才不发灰
  const applyTheme = (): void => {
    const bg = themeVar('--void-1', '#141132')
    if (scene) scene.background = new THREE.Color(bg)
    const lum = luminanceOf(bg)
    const light = lum > 0.55
    if (rimLight) rimLight.intensity = light ? 1.6 : 0.85
    if (bloomPass) bloomPass.strength = light ? 0.22 : 0.45
  }
  themeWatcher = onThemeChange(applyTheme)
  applyTheme()

  nextBlinkAt = clock.getElapsedTime() + 2 + Math.random() * 3
  bindEvents(el)
  animate()
}

function setEyeScale(scaleY: number): void {
  if (!petGroup) return
  const mesh = petGroup.children[0] as THREE.InstancedMesh | undefined
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

/** 点击动作：38% 概率触发学徒专属小动作，否则跳跃 / 转圈 / wink / 害羞 */
let pokeCount = 0

function doAction(): void {
  pokeCount++
  if (pokeCount % 5 === 0) {
    // 羁绊彩蛋：连戳五次的专属回应
    sfx.ding()
    spawnBurst()
    spawnBurst()
    if (container.value) spawnHearts(container.value)
    jumpVel = 0.17
    showMood(t(`pet.${props.id}.bond`))
    return
  }
  if (Math.random() < 0.38) {
    specialAction()
    return
  }
  const actions = ['jump', 'spin', 'wink', 'shy'] as const
  const action = actions[Math.floor(Math.random() * actions.length)]!
  sfx.pop()
  spawnBurst()

  switch (action) {
    case 'jump':
      jumpVel = 0.15
      showMood(t(`pet.${props.id}.jump`))
      break
    case 'spin':
      autoRotY += Math.PI * 2
      showMood(t(`pet.${props.id}.spin`))
      break
    case 'wink':
      setEyeScale(0.08)
      window.setTimeout(() => setEyeScale(1), 400)
      showMood(t(`pet.${props.id}.wink`))
      break
    case 'shy':
      showMood(t(`pet.${props.id}.shy`))
      break
  }
}

/** 学徒专属小动作：每只都有独门戏法 */
function specialAction(): void {
  const el = container.value
  if (!el) return
  switch (props.id) {
    case 'cat': {
      // 墨墨抛牌：一张小牌翻着跃起再落回
      const card = document.createElement('span')
      card.className = 'mascot-fx fx-card-toss'
      card.textContent = '🂠'
      el.appendChild(card)
      window.setTimeout(() => card.remove(), 1150)
      sfx.flip()
      showMood('🂠 ✦')
      break
    }
    case 'owl': {
      // 阿斯特拉：星环绕帽一周
      const ring = document.createElement('div')
      ring.className = 'mascot-fx fx-star-ring'
      for (let i = 0; i < 6; i++) {
        const s = document.createElement('i')
        s.textContent = '✦'
        s.style.setProperty('--a', `${i * 60}deg`)
        ring.appendChild(s)
      }
      el.appendChild(ring)
      window.setTimeout(() => ring.remove(), 1700)
      sfx.ding()
      showMood('✦ ✧ ✦')
      break
    }
    case 'numi': {
      // Numi：数字喷泉
      for (let i = 0; i < 7; i++) {
        const n = document.createElement('span')
        n.className = 'mascot-fx fx-num-pop'
        n.textContent = String(1 + Math.floor(Math.random() * 9))
        n.style.left = `${28 + Math.random() * 44}%`
        n.style.animationDelay = `${i * 90}ms`
        el.appendChild(n)
        window.setTimeout(() => n.remove(), 1000 + i * 90)
      }
      sfx.blip()
      window.setTimeout(() => sfx.blip(), 180)
      showMood('1 2 3 ✧')
      break
    }
    case 'golem': {
      // Runa：符文震地
      el.classList.remove('fx-thud')
      void el.offsetWidth
      el.classList.add('fx-thud')
      const g = document.createElement('span')
      g.className = 'mascot-fx fx-rune-flash'
      g.textContent = 'ᚱ'
      el.appendChild(g)
      window.setTimeout(() => {
        g.remove()
        el.classList.remove('fx-thud')
      }, 720)
      sfx.pop()
      showMood('ᚱ ⩨')
      break
    }
    case 'twins': {
      // Cupie：双心弧线飞向两侧
      for (const side of [-1, 1]) {
        const h = document.createElement('span')
        h.className = 'mascot-fx fx-heart-arc'
        h.textContent = '💗'
        h.style.setProperty('--dx', `${side * 74}px`)
        h.style.animationDelay = side < 0 ? '0ms' : '110ms'
        el.appendChild(h)
        window.setTimeout(() => h.remove(), 950)
      }
      sfx.ding()
      showMood('💗 ➹ 💗')
      break
    }
    case 'comet': {
      // Comet：拖尾加速自旋
      autoRotY += Math.PI * 4.5
      for (let i = 0; i < 3; i++) window.setTimeout(() => spawnBurst(), i * 130)
      sfx.whoosh()
      showMood('☄️ ～')
      break
    }
    case 'mist': {
      // Mist：雾气升腾 + 水晶微光
      const fogs = ['🌫️', '☁️', '✧', '🌫️', '✧']
      for (let i = 0; i < fogs.length; i++) {
        const f = document.createElement('span')
        f.className = 'mascot-fx fx-mist-rise'
        f.textContent = fogs[i]!
        f.style.left = `${18 + Math.random() * 64}%`
        f.style.animationDelay = `${i * 130}ms`
        el.appendChild(f)
        window.setTimeout(() => f.remove(), 1500 + i * 130)
      }
      sfx.ding()
      window.setTimeout(() => sfx.blip(), 260)
      showMood('🌫 ✧ 🌫')
      break
    }
  }
}

/** 供宿主页面在关键事件时调用：开心跳一下 */
function celebrate(): void {
  jumpVel = 0.17
  spawnBurst()
  showMood(t(`pet.${props.id}.cheer`))
}

defineExpose({ celebrate })

/* ---------- 抚摸（长按 600ms）：爱心上浮 + 分物种叫声 ---------- */
const PET_SOUND: Record<string, () => void> = {
  cat: () => { sfx.blip(); window.setTimeout(() => sfx.blip(), 90) },
  owl: () => sfx.toggle(),
  numi: () => { sfx.blip(); window.setTimeout(() => sfx.ding(), 70) },
  golem: () => { sfx.pop(); window.setTimeout(() => sfx.pop(), 150) },
  twins: () => { sfx.blip(); window.setTimeout(() => sfx.ding(), 80) },
  comet: () => sfx.whoosh(),
  mist: () => { sfx.ding(); window.setTimeout(() => sfx.toggle(), 160) },
}

function spawnHearts(el: HTMLElement): void {
  for (let i = 0; i < 5; i++) {
    const h = document.createElement('span')
    h.className = 'pet-heart'
    h.textContent = Math.random() < 0.5 ? '❤' : '💗'
    h.style.left = `${34 + Math.random() * 32}%`
    h.style.top = `${26 + Math.random() * 20}%`
    h.style.fontSize = `${11 + Math.random() * 9}px`
    h.style.animationDelay = `${i * 75}ms`
    el.appendChild(h)
    window.setTimeout(() => h.remove(), 1100)
  }
}

function startPetting(el: HTMLElement): void {
  if (petting || !dragging) return
  petting = true
  const zh = !navigator.language.toLowerCase().startsWith('en')
  const aff = addAffection(props.id, 1)
  const secretUnlocked = levelOf(getPoints(props.id)) >= 3 && SECRET_LINES[props.id]
  showMood(
    aff.leveledUp
      ? zh
        ? `❤✦ 羁绊升到 Lv${aff.level}！`
        : `❤✦ Bond reached Lv${aff.level}!`
      : zh
        ? '❤ 被摸摸头…好开心'
        : '❤ head pats… so happy',
  )
  if (aff.leveledUp) window.setTimeout(() => spawnBurst(), 300)
  spawnHearts(el)
  ;(PET_SOUND[props.id] ?? sfx.blip)()
  // Lv3 且有秘密：偶尔抚摸时说漏嘴
  if (secretUnlocked && Math.random() < 0.35) {
    const s = SECRET_LINES[props.id]!
    window.setTimeout(() => {
      if (!disposed) showMood(zh ? `🤫 ${s.zh}` : `🤫 ${s.en}`)
    }, 1400)
  }
  window.setTimeout(() => {
    if (petting) spawnHearts(el)
  }, 380)
}

function bindEvents(el: HTMLElement): void {
  el.addEventListener('pointerdown', (e) => {
    dragging = true
    downX = e.clientX
    downTime = performance.now()
    lastX = e.clientX
    hint.value = false
    markInteract()
    if (idleTimer !== null) window.clearTimeout(idleTimer)
    el.setPointerCapture(e.pointerId)
  })
  el.addEventListener('pointermove', (e) => {
    markInteract()
    const rect = el.getBoundingClientRect()
    if (dragging) {
      autoRotY += (e.clientX - lastX) * 0.012
      lastX = e.clientX
      // 拖着蹭：累计行程够长就算一次抚摸
      strokeAccum += Math.abs(e.movementX ?? 0) + Math.abs(e.movementY ?? 0)
      if (strokeAccum > 120 && !petting && !asleep.value) {
        strokeAccum = 0
        startPetting(el)
      }
      return
    }
    // 光标追踪：视线跟随
    leanY = ((e.clientX - rect.left) / rect.width - 0.5) * 0.85
    leanX = 0.08 + ((e.clientY - rect.top) / rect.height - 0.5) * 0.35
  })
  const endDrag = (): void => {
    if (dragging && performance.now() - downTime < 320 && Math.abs(lastX - downX) < 8) {
      doAction()
    }
    dragging = false
    strokeAccum = 0
    window.setTimeout(() => (petting = false), 500)
    if (idleTimer !== null) window.clearTimeout(idleTimer)
    idleTimer = window.setTimeout(() => (hint.value = true), 4000)
  }
  el.addEventListener('pointerup', endDrag)
  el.addEventListener('pointercancel', endDrag)
  // 双击彩蛋：庆祝 + 双份星屑
  el.addEventListener('dblclick', () => {
    celebrate()
    spawnBurst()
    window.setTimeout(() => spawnBurst(), 160)
  })
  // 闲置自言自语：每 26 秒概率冒一句 tips；Lv3 后偶尔说漏秘密
  chatterTimer = window.setInterval(() => {
    if (disposed || dragging || document.visibilityState !== 'visible') return
    if (moodText.value || Math.random() < 0.55) return
    const secret = levelOf(getPoints(props.id)) >= 3 ? SECRET_LINES[props.id] : undefined
    if (secret && Math.random() < 0.25) {
      const zh = !navigator.language.toLowerCase().startsWith('en')
      showMood(zh ? `🤫 ${secret.zh}` : `🤫 ${secret.en}`)
      return
    }
    showMood(t(`pet.${props.id}.tip${1 + (Math.random() < 0.5 ? 0 : 1)}`))
  }, 26000)
  el.addEventListener('pointerleave', () => {
    leanY = 0
    leanX = 0.08
  })
  el.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault()
      if (!camera) return
      const z = camera.position.z + e.deltaY * 0.01
      camera.position.z = Math.max(7, Math.min(16, z))
    },
    { passive: false },
  )
  window.addEventListener('resize', onResize)
  if (renderer) viewIO.observe(renderer.domElement)
}

function markInteract(): void {
  lastInteractAt = performance.now()
  if (asleep.value) wakeUp()
}

/** 睡着了被吵醒：快速眨两下眼 */
function wakeUp(): void {
  asleep.value = false
  blinkUntil = 0
  setEyeScale(1)
  window.setTimeout(() => setEyeScale(0.12), 120)
  window.setTimeout(() => setEyeScale(1), 260)
  window.setTimeout(() => setEyeScale(0.12), 400)
  window.setTimeout(() => setEyeScale(1), 520)
}

function onResize(): void {
  const el = container.value
  if (!el || !camera || !renderer) return
  camera.aspect = el.clientWidth / Math.max(1, el.clientHeight)
  camera.updateProjectionMatrix()
  renderer.setSize(el.clientWidth, el.clientHeight)
  composer?.setSize(el.clientWidth, el.clientHeight)
}

const clock = new THREE.Clock()
let lastEyeScale = 1
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
// 离屏/后台挂起：跳过渲染但时钟保持新鲜
if (!inView || document.hidden) {
clock.getDelta()
return
}
const now = clock.getElapsedTime()

  // 自动眨眼（偶尔连眨两下）
  if (!asleep.value && now > nextBlinkAt && now > blinkUntil) {
    blinkUntil = now + 0.15
    if (doubleBlinkPending) {
      doubleBlinkPending = false
      nextBlinkAt = now + 0.42
    } else {
      doubleBlinkPending = Math.random() < 0.28
      nextBlinkAt = now + 2.4 + Math.random() * 3.2
    }
  }
  const closed = asleep.value || now < blinkUntil
  if ((closed ? 0.1 : 1) !== lastEyeScale) {
    setEyeScale(closed ? 0.1 : 1)
    lastEyeScale = closed ? 0.1 : 1
  }

  // 久坐入睡（40 秒没互动）
  if (!asleep.value && !dragging && performance.now() - lastInteractAt > 40000) {
    asleep.value = true
  }

  // 待机小动作池：左顾右盼 / 扭一扭 / 原地小跳
  const idleMs = performance.now() - lastInteractAt
  if (!asleep.value && !dragging && idleMs > 3000 && now > nextTrickAt) {
    nextTrickAt = now + 9 + Math.random() * 9
    const roll = Math.random()
    if (roll < 0.45) {
      trickLeanY = (Math.random() < 0.5 ? -1 : 1) * (0.4 + Math.random() * 0.3)
    } else if (roll < 0.75) {
      wiggleUntil = now + 0.65
    } else {
      jumpVel = Math.max(jumpVel, 0.055)
    }
  }
  trickLeanY *= 0.955

  if (petGroup) {
    // 闲置自转
    if (!dragging && !reducedMotion && idleMs > 2600) {
      autoRotY += asleep.value ? 0.0012 : 0.004
    }
    targetRotY = autoRotY + leanY + trickLeanY
    targetRotX = leanX * (asleep.value ? 1.6 : 1) // 睡着时头垂一点
    petGroup.rotation.y += (targetRotY - petGroup.rotation.y) * 0.1
  // 呼吸起伏 + 重心微摆：让体素小人"活"着
  petGroup.position.y = Math.sin(now * 1.15) * 0.04
  petGroup.rotation.z = Math.sin(now * 0.6) * 0.02
    petGroup.rotation.x += (targetRotX - petGroup.rotation.x) * 0.1
    // 睡着时轻轻左右摇
    petGroup.rotation.z =
      wiggleUntil > now ? Math.sin(now * 26) * 0.055 : asleep.value ? Math.sin(now * 0.9) * 0.04 : 0

    // 跳跃物理 + 落地挤压回弹
    jumpVel -= 0.011
    if (jumpVel < 0) jumpVel = Math.max(jumpVel, -0.28)
    prevJumpOffset = jumpOffset
    jumpOffset = Math.max(0, jumpOffset + jumpVel)
    if (prevJumpOffset > 0.001 && jumpOffset === 0 && landSquashUntil < now) {
      landSquashUntil = now + 0.18
    }

    // 呼吸挤压拉伸：清醒快浅、睡着慢深；跳跃时纵向拉伸，落地压扁
    const T = asleep.value ? 4.2 : 2.6
    const A = asleep.value ? 0.04 : 0.02
    const br = Math.sin((now * Math.PI * 2) / T)
    let sy = 1 + A * br
    let sx = 1 - (A / 2) * br
    if (jumpVel > 0) {
      sy *= 1 + Math.min(0.16, jumpVel * 1.15)
      sx *= 1 - Math.min(0.07, jumpVel * 0.5)
    }
    if (landSquashUntil > now) {
      sy *= 0.84
      sx *= 1.13
    }
    petGroup.scale.set(sx, sy, sx)
    if (!dragging && !asleep.value) petGroup.rotation.z = Math.sin(now * 0.9) * 0.02 // 醒着时轻轻摇
    petGroup.position.y = Math.sin(now * (asleep.value ? 0.8 : 1.5)) * (asleep.value ? 0.08 : 0.18) + jumpOffset
  }
  if (starField) starField.rotation.y = now * (asleep.value ? 0.05 : 0.14)
  if (satellite) {
    satellite.position.set(Math.cos(now * 0.7) * 3.4, Math.sin(now * 1.05) * 1.9 + 0.5, Math.sin(now * 0.7) * 3.4)
    switch (props.id) {
      case 'cat':
        satellite.rotation.set(now * 2.1, now * 0.6, 0) // 卡牌翻面
        break
      case 'owl':
        satellite.rotation.set(0.35, now * 0.9, 0) // 星球自转
        break
      case 'numi':
        satellite.rotation.set(now * 1.8, now * 1.3, now * 0.7) // 骰子乱翻
        break
      case 'golem':
        satellite.rotation.set(0, now * 0.5, Math.sin(now * 0.6) * 0.25) // 宝石沉稳
        break
case 'twins':
satellite.rotation.set(Math.sin(now * 1.2) * 0.5, now * 1.4, 0) // 光环摇摆
break
case 'mist':
satellite.rotation.set(Math.sin(now * 0.6) * 0.3, now * 0.45, Math.cos(now * 0.5) * 0.2) // 梦般慢旋
break
default:
satellite.rotation.set(now * 2.6, now * 0.9, 0.4) // 彗核疾旋
    }
  }
  tickBursts(now)

  if (composer) composer.render()
  else if (renderer && scene && camera) renderer.render(scene, camera)
}

onMounted(build)

onBeforeUnmount(() => {
disposed = true
cancelAnimationFrame(raf)
window.removeEventListener('resize', onResize)
viewIO.disconnect()
  if (moodTimer !== null) window.clearTimeout(moodTimer)
  if (idleTimer !== null) window.clearTimeout(idleTimer)
  if (chatterTimer !== null) window.clearInterval(chatterTimer)
  chatterTimer = null
  themeWatcher?.disconnect()
  themeWatcher = null
  for (const b of bursts) {
    b.points.geometry.dispose()
    ;(b.points.material as THREE.PointsMaterial).dispose()
  }
  bursts = []
  composer?.dispose()
  renderer?.dispose()
  renderer?.domElement.remove()
})
</script>

<template>
  <div class="pet-wrap" :style="{ height: props.height + 'px' }">
    <div ref="container" class="pet-canvas" />
    <Transition name="fade">
      <span v-if="hint" class="pet-hint">{{ t('pet.hint') }}</span>
    </Transition>
    <Transition name="pop">
      <span v-if="moodText" class="pet-bubble">{{ moodText }}</span>
    </Transition>
    <!-- 睡着的 Zzz -->
    <div v-if="asleep" class="zzz-layer" aria-hidden="true">
      <i v-for="n in 3" :key="n" class="zzz" :style="{ animationDelay: n * 0.9 + 's' }">Z</i>
    </div>
  </div>
</template>

<style scoped>
.pet-wrap { position: relative; }
.pet-canvas {
  width: 100%;
  height: 100%;
  min-height: 180px;
  cursor: grab;
  touch-action: pan-y;
  border-radius: 12px;
  overflow: hidden;
}
.pet-canvas:active { cursor: grabbing; }
.pet-hint {
  position: absolute;
  left: 50%;
  bottom: 10px;
  transform: translateX(-50%);
  font-family: var(--pixel);
  font-size: 0.52rem;
  letter-spacing: 0.1em;
  color: var(--gold-bright);
  background: rgba(21, 18, 50, 0.85);
  padding: 6px 12px;
  border: 2px solid color-mix(in srgb, var(--gold) 50%, transparent);
  border-radius: 8px;
  pointer-events: none;
  white-space: nowrap;
  animation: hint-bob 2s ease-in-out infinite;
}
@keyframes hint-bob {
  0%, 100% { transform: translate(-50%, 0); }
  50% { transform: translate(-50%, -4px); }
}
.pet-bubble {
  position: absolute;
  top: 14px;
  right: 16px;
  background: #fff6ec;
  color: #2e2650;
  font-family: var(--cute);
  font-size: 0.9rem;
  padding: 7px 13px;
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
@media (prefers-reduced-motion: reduce) {
  .pet-hint { animation: none; }
}

/* 睡着的 Zzz：右上角错拍上浮渐隐 */
.zzz-layer {
  position: absolute;
  top: 10px;
  right: 14px;
  pointer-events: none;
}
.zzz {
  position: absolute;
  right: 0;
  top: 0;
  font-family: var(--cute);
  font-style: normal;
  color: var(--lavender-soft);
  text-shadow: 0 0 8px color-mix(in srgb, var(--lavender) 60%, transparent);
  opacity: 0;
  animation: zzz-rise 2.7s ease-out infinite;
}
.zzz:nth-child(1) { font-size: 0.8rem; }
.zzz:nth-child(2) { font-size: 1.05rem; }
.zzz:nth-child(3) { font-size: 1.3rem; }
@keyframes zzz-rise {
  0% { opacity: 0; transform: translate(0, 6px) rotate(-8deg) scale(0.7); }
  25% { opacity: 0.95; }
  100% { opacity: 0; transform: translate(14px, -30px) rotate(14deg) scale(1.15); }
}

/* 抚摸爱心：拖着蹭过时从身上冒出上飘（元素由 spawnHearts 动态插入） */
.pet-heart {
  position: absolute;
  z-index: 3;
  color: var(--pink);
  text-shadow: 0 0 10px rgba(255, 159, 206, 0.85);
  font-size: 1rem;
  pointer-events: none;
  opacity: 0;
  animation: pet-heart-rise 0.9s ease-out forwards;
}
@keyframes pet-heart-rise {
  0% { opacity: 0; transform: translate(0, 6px) scale(0.5); }
  22% { opacity: 1; transform: translate(3px, -10px) scale(1.15); }
  100% { opacity: 0; transform: translate(-5px, -42px) scale(0.85); }
}
@media (prefers-reduced-motion: reduce) {
  .zzz, .zzz-layer { display: none; }
}
</style>

<style>
/* mascot-fx: DOM overlay effects (unscoped so injected spans match) */
.pet-heart {
  position: absolute;
  pointer-events: none;
  z-index: 5;
  animation: pet-heart-float 0.95s ease-out forwards;
}
@keyframes pet-heart-float {
  from { opacity: 1; transform: translateY(0) scale(0.7); }
  to { opacity: 0; transform: translateY(-48px) scale(1.3); }
}
.mascot-fx { position: absolute; pointer-events: none; z-index: 6; }
.fx-card-toss {
  left: 50%; bottom: 46%;
  font-size: 1.7rem; color: var(--gold-bright);
  animation: card-toss-up 1.1s cubic-bezier(0.3, 0.9, 0.4, 1) forwards;
}
@keyframes card-toss-up {
  0% { transform: translateY(0) rotate(0deg); opacity: 0; }
  15% { opacity: 1; }
  60% { transform: translateY(-58px) rotate(360deg); }
  100% { transform: translateY(6px) rotate(720deg); opacity: 0; }
}
.fx-star-ring {
  left: 50%; top: 30%; width: 0; height: 0;
  animation: ring-spin 1.6s linear forwards;
}
.fx-star-ring i {
  position: absolute;
  color: var(--lavender-soft);
  font-size: 0.8rem;
  transform: rotate(var(--a)) translateX(46px);
  animation: star-pulse 1.6s ease-in-out infinite;
}
@keyframes ring-spin { to { transform: rotate(360deg); } }
@keyframes star-pulse { 50% { opacity: 0.35; } }
.fx-num-pop {
  bottom: 40%;
  font-family: var(--pixel);
  color: var(--mint);
  animation: num-rise 0.95s ease-out forwards;
}
@keyframes num-rise {
  from { opacity: 0; transform: translateY(10px) scale(0.6); }
  25% { opacity: 1; }
  to { opacity: 0; transform: translateY(-44px) scale(1.15); }
}
.fx-thud { animation: ground-shake 0.55s ease-in-out; }
@keyframes ground-shake {
  20% { transform: translateX(-3px); } 45% { transform: translateX(3px); }
  70% { transform: translateX(-2px); } 100% { transform: none; }
}
.fx-rune-flash {
  left: 50%; bottom: 8%; transform: translateX(-50%);
  font-size: 2.2rem; color: var(--mint);
  text-shadow: 0 0 16px var(--mint);
  animation: rune-flash 0.68s ease-out forwards;
}
@keyframes rune-flash {
  0% { opacity: 0; transform: translateX(-50%) scale(2.2); }
  35% { opacity: 1; transform: translateX(-50%) scale(1); }
  100% { opacity: 0; transform: translateX(-50%) scale(1.4); }
}
.fx-heart-arc {
  left: 50%; top: 42%;
  animation: heart-arc-fly 0.9s cubic-bezier(0.25, 0.8, 0.4, 1) forwards;
}
@keyframes heart-arc-fly {
  from { opacity: 0; transform: translate(0, 0) scale(0.6); }
  25% { opacity: 1; }
  to { opacity: 0; transform: translate(var(--dx), -34px) scale(1.2); }
}
/* Mist：雾气升腾 */
.fx-mist-rise {
  position: absolute;
  bottom: 18%;
  font-size: 1rem;
  opacity: 0;
  pointer-events: none;
  filter: blur(0.4px);
  animation: mist-rise 1.4s ease-out forwards;
}
@keyframes mist-rise {
  0% { opacity: 0; transform: translateY(14px) scale(0.7); }
  30% { opacity: 0.9; }
  100% { opacity: 0; transform: translateY(-46px) scale(1.5); }
}
@media (prefers-reduced-motion: reduce) {
  .pet-heart, .mascot-fx { animation-duration: 0.01s !important; }
}
</style>
