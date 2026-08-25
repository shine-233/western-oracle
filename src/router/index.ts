import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import TarotView from '../views/TarotView.vue'
import AstrologyView from '../views/AstrologyView.vue'
import SynastryView from '../views/SynastryView.vue'
import TransitsView from '../views/TransitsView.vue'
import NumerologyView from '../views/NumerologyView.vue'
import RunesView from '../views/RunesView.vue'
import SettingsView from '../views/SettingsView.vue'
import HistoryView from '../views/HistoryView.vue'
import LibraryView from '../views/LibraryView.vue'
import CrystalView from '../views/CrystalView.vue'
import HoursView from '../views/HoursView.vue'
import ArcadeView from '../views/ArcadeView.vue'
import DreamView from '../views/DreamView.vue'
import PalmistryView from '../views/PalmistryView.vue'
import MusicBoxView from '../views/MusicBoxView.vue'
import PendulumView from '../views/PendulumView.vue'
import OrreryView from '../views/OrreryView.vue'

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
    { path: '/library', component: LibraryView },
    { path: '/crystal', component: CrystalView },
    { path: '/hours', component: HoursView },
    { path: '/arcade', component: ArcadeView },
    { path: '/dreams', component: DreamView },
    { path: '/palmistry', component: PalmistryView },
    { path: '/musicbox', component: MusicBoxView },
    { path: '/pendulum', component: PendulumView },
    { path: '/orrery', component: OrreryView },
    { path: '/history', component: HistoryView },
    { path: '/settings', component: SettingsView },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

export default router
