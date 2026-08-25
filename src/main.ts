import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import '@fontsource/zcool-kuaile'
import '@fontsource/press-start-2p'
import './styles/global.css'
import { vReveal } from './lib/reveal'
import { vMagnetic } from './lib/magnetic'
import { installKonami } from './lib/konami'
import { initThemes } from './lib/themes'

const app = createApp(App).use(router)
app.directive('reveal', vReveal)
app.directive('magnetic', vMagnetic)
initThemes()
app.mount('#app')
installKonami()
