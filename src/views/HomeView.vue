<script setup lang="ts">
import { RouterLink } from 'vue-router'

const modules = [
  { to: '/tarot', glyph: '✦', title: '塔罗牌阵', desc: '78 张韦特塔罗，单张指引、三张时序与十字五张牌阵，正逆位全解。' },
  { to: '/astrology', glyph: '☉', title: '西洋占星', desc: '输入出生信息，浏览器内计算十大星体本命盘，绘制星盘轮与相位网络。' },
  { to: '/numerology', glyph: '∴', title: '生命灵数', desc: '生命路径、生日数、表达数等五组核心数字，毕达哥拉斯体系解读。' },
  { to: '/runes', glyph: 'ᛟ', title: '卢恩符文', desc: '古弗萨克 24 符文抽签，维京人的智慧之石，正逆位皆可启用。' },
]
</script>

<template>
  <section class="hero">
    <h1>星辰不语，自有答案</h1>
    <p class="sub">TAROT · ASTROLOGY · NUMEROLOGY · RUNES</p>
    <p class="hint" style="max-width: 560px; margin: 18px auto 0;">
      一座纯浏览器端的西方占卜小站：无需注册、没有后端、数据不出本机。
      选一种你喜欢的语言，向宇宙提问。
    </p>
  </section>

  <div class="divider-star">✦ ✦ ✦</div>

  <section class="oracle-grid">
    <RouterLink v-for="m in modules" :key="m.to" :to="m.to" class="oracle-card">
      <span class="glyph">{{ m.glyph }}</span>
      <h3>{{ m.title }}</h3>
      <p>{{ m.desc }}</p>
    </RouterLink>
  </section>

  <section class="panel" style="margin-top: 40px;">
    <h3 style="margin-top: 0;">关于 AI 解读</h3>
    <p class="hint">
      默认提供本地规则文案解读；若你希望获得更个性化的 AI 解读，可在
      <RouterLink to="/settings">设置</RouterLink>
      中填入任意 OpenAI 兼容接口的 API Key。密钥仅保存在你的浏览器 localStorage 中，请求直接从你的设备发往你指定的服务商。
    </p>
  </section>
</template>
