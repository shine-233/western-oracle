<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header class="site-header">
    <RouterLink to="/" class="brand">神谕<span class="en">WESTERN ORACLE</span></RouterLink>
    <nav class="site-nav">
      <RouterLink to="/tarot">塔罗</RouterLink>
      <RouterLink to="/astrology">西洋占星</RouterLink>
      <RouterLink to="/numerology">生命灵数</RouterLink>
      <RouterLink to="/runes">卢恩符文</RouterLink>
      <RouterLink to="/settings">设置</RouterLink>
    </nav>
  </header>

  <main>
    <RouterView />
  </main>

  <footer class="site-footer">
    <p>✦ 所有计算均在你的浏览器本地完成，不上传任何数据 ✦</p>
    <p>本站内容用于文化与娱乐目的，请理性看待占卜结果。</p>
  </footer>
</template>
