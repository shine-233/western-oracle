<script setup lang="ts">
/** 标题组件（曾用名「解码入场」）。
 *  特效减负：乱码动画只保留在导航 hover 那一下（motionGlobal 的 navScramble），
 *  页面标题挂载即显示真文字——加载后第一秒不再是一排占星符号。
 *  text 变化时直接跟随（切语言立即刷新）。 */
import { ref, watch } from 'vue'

const props = withDefaults(defineProps<{ text: string; speed?: number }>(), { speed: 34 })

const display = ref(props.text)
watch(() => props.text, () => (display.value = props.text))
</script>

<template>
  <span class="decrypt-title">{{ display }}</span>
</template>

<style scoped>
.decrypt-title { white-space: pre-wrap; }
</style>
