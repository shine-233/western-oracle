import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import JourneyView from '../views/JourneyView.vue'
import { locale } from '../lib/i18n'

/**
 * 路由表：仅首页随首屏加载，其余全部懒加载分包；
 * scrollBehavior 保证切页回顶（浏览器前进/后退保留原位）。
 */
const routes = [
  { path: '/', component: HomeView },
  { path: '/tarot', component: () => import('../views/TarotView.vue') },
  { path: '/journey', component: JourneyView },
  { path: '/astrology', component: () => import('../views/AstrologyView.vue') },
  { path: '/synastry', component: () => import('../views/SynastryView.vue') },
  { path: '/transits', component: () => import('../views/TransitsView.vue') },
  { path: '/numerology', component: () => import('../views/NumerologyView.vue') },
  { path: '/runes', component: () => import('../views/RunesView.vue') },
  { path: '/library', component: () => import('../views/LibraryView.vue') },
  { path: '/crystal', component: () => import('../views/CrystalView.vue') },
  { path: '/hours', component: () => import('../views/HoursView.vue') },
  { path: '/arcade', component: () => import('../views/ArcadeView.vue') },
  { path: '/dreams', component: () => import('../views/DreamView.vue') },
  { path: '/palmistry', component: () => import('../views/PalmistryView.vue') },
  { path: '/musicbox', component: () => import('../views/MusicBoxView.vue') },
  { path: '/pendulum', component: () => import('../views/PendulumView.vue') },
  { path: '/orrery', component: () => import('../views/OrreryView.vue') },
  { path: '/moonbreath', component: () => import('../views/MoonBreathView.vue') },
  { path: '/biorhythm', component: () => import('../views/BioRhythmView.vue') },
  { path: '/meihua', component: () => import('../views/MeihuaView.vue') },
  { path: '/gesture', component: () => import('../views/GestureView.vue') },
  { path: '/history', component: () => import('../views/HistoryView.vue') },
  { path: '/settings', component: () => import('../views/SettingsView.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const TITLES: Record<string, [string, string]> = {
  '/': ['神谕 · 星辰不语，自有答案', 'ORACLE · The stars answer'],
  '/tarot': ['塔罗占卜', 'Tarot'],
  '/journey': ['愚人之旅', 'The Fool\'s Journey'],
  '/astrology': ['西洋占星', 'Natal Chart'],
  '/synastry': ['合盘缘分', 'Synastry'],
  '/transits': ['行运天象', 'Transits'],
  '/numerology': ['生命灵数', 'Numerology'],
  '/runes': ['卢恩符文', 'Runes'],
  '/library': ['牌库图鉴', 'Deck Library'],
  '/crystal': ['水晶球', 'Crystal Ball'],
  '/hours': ['行星时刻', 'Planetary Hours'],
  '/arcade': ['奇趣占卜坊', 'Oracle Arcade'],
  '/dreams': ['解梦词典', 'Dream Dictionary'],
  '/palmistry': ['手相阅览', 'Palmistry'],
  '/musicbox': ['星光八音盒', 'Music Box'],
  '/pendulum': ['灵摆占卜', 'Pendulum'],
  '/orrery': ['实时天象仪', 'Live Orrery'],
  '/moonbreath': ['月相呼吸房', 'Moon Breath'],
  '/biorhythm': ['生物节律', 'Biorhythm'],
  '/meihua': ['梅花易数', 'Plum Blossom'],
  '/gesture': ['手势占卜', 'Gesture Oracle'],
  '/history': ['魔法书 · 历史', 'Grimoire'],
  '/settings': ['设置', 'Settings'],
}

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    // 前进：回顶；后退：浏览器记住的位置
    return savedPosition ?? { top: 0 }
  },
})

router.afterEach((to) => {
  const pair = TITLES[to.path]
  if (pair) {
    document.title = `${pair[locale.value === 'zh' ? 0 : 1]} · 神谕 Western Oracle`
  } else {
    document.title = '神谕 Western Oracle'
  }
})

export default router
