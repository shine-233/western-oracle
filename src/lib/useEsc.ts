/** 全局 Esc 关闭弹窗组合式函数 */
import { onBeforeUnmount, onMounted } from 'vue'

export function useEscClose(onEsc: () => void): void {
  const handler = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') onEsc()
  }
  onMounted(() => window.addEventListener('keydown', handler))
  onBeforeUnmount(() => window.removeEventListener('keydown', handler))
}
