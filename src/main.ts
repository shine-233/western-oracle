import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import '@fontsource/zcool-kuaile'
import '@fontsource/press-start-2p'
import './styles/global.css'
import { vReveal } from './lib/reveal'
import { vMagnetic } from './lib/magnetic'
import { installKonami } from './lib/konami'
import { installOverlays } from './lib/overlays'
import { initThemes } from './lib/themes'
import { initSkinFlair } from './lib/skinFlair'
import { installMouseReveal } from './lib/mouseReveal'
import { installMotionGlobal } from './lib/motionGlobal'
import { installReactPopups } from './lib/reactPopups'
import { installViewTransitions } from './lib/viewTrans'
import { installConstella } from './lib/constella'
import { installParadeEgg } from './lib/paradeEgg'

installViewTransitions(router)
const app = createApp(App).use(router)
// 全局错误兜底：组件异常时不白屏，控制台可见
app.config.errorHandler = (err, _instance, info) => {
  console.error('[oracle] unhandled error:', info, err)
}
app.directive('reveal', vReveal)
app.directive('magnetic', vMagnetic)
initThemes()
initSkinFlair()
installMouseReveal()
app.mount('#app')
installKonami()
installOverlays()
installConstella()
installMotionGlobal()
installReactPopups()
installParadeEgg()

// PWA：离线缓存注册（sw.js 位于 public/，随构建拷贝到 dist 根）
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {})
  })
}
