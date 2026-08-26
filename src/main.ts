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

installViewTransitions(router)
const app = createApp(App).use(router)
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
