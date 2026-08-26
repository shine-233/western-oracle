import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: './',
  plugins: [vue()],
  build: {
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
