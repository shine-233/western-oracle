import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import TarotView from '../views/TarotView.vue'
import AstrologyView from '../views/AstrologyView.vue'
import SynastryView from '../views/SynastryView.vue'
import TransitsView from '../views/TransitsView.vue'
import NumerologyView from '../views/NumerologyView.vue'
import RunesView from '../views/RunesView.vue'
import SettingsView from '../views/SettingsView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/tarot', component: TarotView },
    { path: '/astrology', component: AstrologyView },
    { path: '/synastry', component: SynastryView },
    { path: '/transits', component: TransitsView },
    { path: '/numerology', component: NumerologyView },
    { path: '/runes', component: RunesView },
    { path: '/settings', component: SettingsView },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

export default router
