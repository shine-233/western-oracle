export function shuffle<T>(items: readonly T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(i + 1)
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
  return arr
}

export function pick<T>(items: readonly T[]): T {
  return items[randInt(items.length)]!
}

/** [0, n) 的随机整数，基于 crypto */
export function randInt(n: number): number {
  if (n <= 0) throw new RangeError('randInt requires n > 0')
  const max = Math.floor(0xffffffff / n) * n
  const buf = new Uint32Array(1)
  let v = 0
  do {
    crypto.getRandomValues(buf)
    v = buf[0]!
  } while (v >= max)
  return v % n
}
