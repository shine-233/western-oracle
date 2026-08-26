import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: './',
  plugins: [vue()],
  build: {
    /*
     * 体积预算（gzip 后，`npm run size` 可复核）：
     * - 首屏入口 index.js        ≤ 360 KB gz —— 超了先查新依赖是否进了主包
     * - three-vendor / three-scenes 懒加载，不计入首屏
     * - dreamsMiller.js          ≤ 300 KB gz —— 2250 词条解梦词典，
     *   必须保持"输入≥2字符才动态 import"的懒加载策略，禁止改为静态引用
     * - 其余单 chunk            ≤ 500 KB gz
     * 超预算的处理顺序：懒加载 → 拆数据 → 压缩语料结构 → 再考虑加白名单。
     */
    rollupOptions: {
      output: {
        advancedChunks: {
          groups: [
            { name: 'three-vendor', test: /node_modules[\\/]+three[\\/]/ },
            {
              name: 'three-scenes',
              test: /[\\/]+src[\\/]+(components|views)[\\/]+(VoxelMascot|VoxelWitch3D|Orrery3D|CrystalView|OrreryView)[.]/,
            },
          ],
        },
      },
    },
  },
  test: {
    environment: 'happy-dom',
  },
})
