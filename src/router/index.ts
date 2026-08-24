import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: () => import('../views/HomeView.vue') },
    { path: '/tarot', component: () => import('../views/TarotView.vue') },
    { path: '/astrology', component: () => import('../views/AstrologyView.vue') },
    { path: '/numerology', component: () => import('../views/NumerologyView.vue') },
    { path: '/runes', component: () => import('../views/RunesView.vue') },
    { path: '/settings', component: () => import('../views/SettingsView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

export default router
