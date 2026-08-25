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
import { installMotionGlobal } from './lib/motionGlobal'

const app = createApp(App).use(router)
app.directive('reveal', vReveal)
app.directive('magnetic', vMagnetic)
initThemes()
app.mount('#app')
installKonami()
installOverlays()
installMotionGlobal()

// PWA：生产环境注册 Service Worker（离线缓存 + 可安装）
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {})
  })
}
