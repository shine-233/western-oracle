/** 主题取色工具：让 three.js 舞台等非 CSS 部位跟随当前皮肤。
 *  用法：build 时用 themeVar() 取色；onThemeChange 注册重涂回调。 */

export function themeVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

interface Watcher {
  disconnect: () => void
}

/** 监听 data-theme 属性变化（皮肤切换即触发 cb） */
export function onThemeChange(cb: () => void): Watcher {
  if (typeof document === 'undefined' || !('MutationObserver' in window)) {
    return { disconnect: () => {} }
  }
  const obs = new MutationObserver(cb)
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return { disconnect: () => obs.disconnect() }
}
