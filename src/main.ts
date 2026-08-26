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
import { installReactPopups } from './lib/reactPopups'
import { installViewTransitions } from './lib/viewTrans'

installViewTransitions(router)
const app = createApp(App).use(router)
app.directive('reveal', vReveal)
app.directive('magnetic', vMagnetic)
initThemes()
app.mount('#app')
installKonami()
installOverlays()
installMotionGlobal()
installReactPopups()
