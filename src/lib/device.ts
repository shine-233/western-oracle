/** 低端设备探测：核心数少 / 内存小 / 移动端 —— 用于渲染降级（DPR、bloom 强度等） */
export const LOW_END: boolean =
  (typeof navigator !== 'undefined' &&
    (((navigator.hardwareConcurrency ?? 8) <= 4) ||
      ((navigator as unknown as { deviceMemory?: number }).deviceMemory !== undefined &&
        (navigator as unknown as { deviceMemory?: number }).deviceMemory! <= 4)))

/** 渲染像素比上限：低端机压到 1，省 4 倍填充率 */
export const MAX_DPR = LOW_END ? 1 : 2

/** bloom 辉光强度系数（低端机减半，糊一点但不卡） */
export const BLOOM_SCALE = LOW_END ? 0.5 : 1
