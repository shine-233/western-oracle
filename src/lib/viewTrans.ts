/**
 * View Transitions API 路由过渡（2026 基线）。
 * - 支持且未开启减少动效时：导航包裹 document.startViewTransition，
 *   GPU 加速的整页快照动画，同时抑制 Vue <Transition name="page"> 避免双重动画
 * - 不支持/降级：保持原有 page 过渡
 */

import { ref } from 'vue'

/** VT 快照期间为 true：App 的 <Transition> 据此切换到无动画名，避免双重动画 */
export const vtActive = ref(false)

function supported(): boolean {
  return (
    typeof document !== 'undefined' &&
    'startViewTransition' in document &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

type NavFn = (...args: never[]) => Promise<unknown>

/** 包裹 router 的 push/replace；须在 app.mount 之前调用 */
export function installViewTransitions(router: unknown): void {
  if (!supported()) return
  const r = router as { push: NavFn; replace: NavFn }
  for (const method of ['push', 'replace'] as const) {
    const orig = r[method].bind(r)
    ;(r as unknown as Record<string, unknown>)[method] = (...args: unknown[]) => {
      // 页面被遮蔽/切后台时 rAF 不再触发，VT 快照会永久挂起（视图冻结在旧页），
      // 此时直接走普通导航兜底
      if (document.visibilityState !== 'visible') return orig(...(args as never[]))
      if (vtActive.value) return orig(...(args as never[]))
      vtActive.value = true
      const nav = document.startViewTransition!(async () => {
        try {
          await orig(...(args as never[]))
        } finally {
          // 等新页面渲染一帧再解除快照；rAF 挂起时 260ms 后强制放行
          await new Promise<void>((res) => {
            const bail = window.setTimeout(res, 260)
            requestAnimationFrame(() => {
              window.clearTimeout(bail)
              res()
            })
          })
        }
      })
      void nav.finished.finally(() => {
        vtActive.value = false
      })
      return nav.finished as unknown as Promise<unknown>
    }
  }
}
