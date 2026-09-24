// Min-heap theo (at, n): sự kiện sớm nhất ra trước; cùng giờ thì cái vào trước ra trước.
export type Timed = { at: number; n: number }

export class Heap<T extends Timed> {
  private a: T[] = []
  get size() {
    return this.a.length
  }
  peek(): T | undefined {
    return this.a[0]
  }
  push(e: T) {
    const a = this.a
    a.push(e)
    for (let i = a.length - 1; i > 0;) {
      const p = (i - 1) >> 1
      if (!before(a[i], a[p])) break
      ;[a[i], a[p]] = [a[p], a[i]]
      i = p
    }
  }
  pop(): T | undefined {
    const a = this.a
    const top = a[0]
    const last = a.pop()
    if (a.length && last) {
      a[0] = last
      for (let i = 0; ;) {
        const l = 2 * i + 1,
          r = l + 1
        let m = i
        if (l < a.length && before(a[l], a[m])) m = l
        if (r < a.length && before(a[r], a[m])) m = r
        if (m === i) break
        ;[a[i], a[m]] = [a[m], a[i]]
        i = m
      }
    }
    return top
  }
}
const before = (x: Timed, y: Timed) => x.at < y.at || (x.at === y.at && x.n < y.n)
