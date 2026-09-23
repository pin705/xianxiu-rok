// Nhạc nền cổ phong sinh bằng WebAudio (PLAN mục 6: cổ cầm, sáo trúc) — không file, không thêm dung lượng tải.
// Đàn tranh gảy giai điệu đi ngẫu nhiên trên thang ngũ cung Rê (Rê Mi Fa# La Si), đầu mỗi đoạn vuốt dây;
// thỉnh thoảng sáo trúc thổi nốt dài có rung và tiếng hơi; trầm nền đổi Rê–La như sương. Không đoạn nào lặp y hệt.
// Rất nhẹ: ~2 nốt mỗi giây, mỗi nốt vài node, lên lịch trước cả đoạn 8 phách.
import { audio } from './lib'

const BEAT = 60 / 66
// Đo bằng OfflineAudioContext: đỉnh ~0,13, RMS ~0,018 — dưới chuông "xong" (~0,18) để hiệu ứng vẫn nổi
const VOLUME = 0.6
const PHRASE = 8 * BEAT
const SCALE = [146.83, 164.81, 185, 220, 246.94] // Rê3 Mi3 Fa#3 La3 Si3
const hz = (deg: number) => SCALE[((deg % 5) + 5) % 5] * 2 ** Math.floor(deg / 5) // bậc 0 = Rê3, 5 = Rê4…
const RHYTHMS = [
  [0, 1, 1.5, 2, 3, 4, 6],
  [0, 0.5, 1, 2, 4, 5],
  [0, 2, 3, 4, 6, 7],
  [0, 1, 2, 3, 4, 5, 6],
  [0, 1.5, 2, 4, 4.5, 5, 6],
]

type Bus = { input: GainNode; out: GainNode; noise: AudioBuffer }

// Đường tín hiệu: nhạc → (khô + vang dựng từ nhiễu tắt dần) → âm lượng nhạc → loa
export function makeBus(ac: BaseAudioContext, dest: AudioNode, volume = VOLUME): Bus {
  const input = ac.createGain()
  const out = ac.createGain()
  out.gain.value = volume
  const len = Math.floor(ac.sampleRate * 3)
  const ir = ac.createBuffer(2, len, ac.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3
  }
  const verb = ac.createConvolver()
  verb.buffer = ir
  const dry = ac.createGain()
  const wet = ac.createGain()
  dry.gain.value = 0.8
  wet.gain.value = 0.45
  input.connect(dry).connect(out)
  input.connect(verb).connect(wet).connect(out)
  out.connect(dest)
  const noise = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate)
  const nd = noise.getChannelData(0)
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1
  return { input, out, noise }
}

// Đàn tranh: gảy nhanh, tắt dần, sáng lúc đầu rồi dịu (lọc thông thấp đóng dần) + bồi âm quãng tám tắt sớm
function pluck(ac: BaseAudioContext, bus: Bus, t: number, f: number, vol: number) {
  const body = ac.createOscillator()
  const shine = ac.createOscillator()
  const g = ac.createGain()
  const g2 = ac.createGain()
  const lp = ac.createBiquadFilter()
  body.type = 'triangle'
  body.frequency.value = f
  shine.type = 'sine'
  shine.frequency.value = f * 2.004
  lp.type = 'lowpass'
  lp.frequency.setValueAtTime(4200, t)
  lp.frequency.exponentialRampToValueAtTime(650, t + 1.4)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + 0.006)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6)
  g2.gain.setValueAtTime(vol * 0.4, t)
  g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.5)
  body.connect(g).connect(lp)
  shine.connect(g2).connect(lp)
  lp.connect(bus.input)
  body.start(t)
  shine.start(t)
  body.stop(t + 2.7)
  shine.stop(t + 0.6)
}

// Sáo trúc: vào chậm, rung dần, luyến từ nốt trước, kèm tiếng hơi (nhiễu lọc dải)
function flute(ac: BaseAudioContext, bus: Bus, t: number, f: number, dur: number, vol: number, from?: number) {
  const o = ac.createOscillator()
  const lfo = ac.createOscillator()
  const depth = ac.createGain()
  const g = ac.createGain()
  o.type = 'sine'
  o.frequency.setValueAtTime(from ?? f, t)
  if (from) o.frequency.setTargetAtTime(f, t + 0.02, 0.07)
  lfo.frequency.value = 5.2
  depth.gain.setValueAtTime(0, t)
  depth.gain.linearRampToValueAtTime(f * 0.007, t + dur * 0.6)
  lfo.connect(depth).connect(o.frequency)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(vol, t + 0.3)
  g.gain.setValueAtTime(vol, t + dur - 0.5)
  g.gain.linearRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(bus.input)
  const n = ac.createBufferSource()
  const bp = ac.createBiquadFilter()
  const ng = ac.createGain()
  n.buffer = bus.noise
  n.loop = true
  bp.type = 'bandpass'
  bp.frequency.value = f * 2
  bp.Q.value = 2
  ng.gain.setValueAtTime(0.0001, t)
  ng.gain.linearRampToValueAtTime(vol * 0.3, t + 0.12)
  ng.gain.linearRampToValueAtTime(vol * 0.08, t + 0.6)
  ng.gain.linearRampToValueAtTime(0.0001, t + dur)
  n.connect(bp).connect(ng).connect(bus.input)
  for (const x of [o, lfo, n]) {
    x.start(t)
    x.stop(t + dur + 0.05)
  }
}

// Trầm nền: nốt gốc + quãng năm, lên xuống rất chậm
function drone(ac: BaseAudioContext, bus: Bus, t: number, f: number, dur: number, vol: number) {
  const g = ac.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(vol, t + 3)
  g.gain.setValueAtTime(vol, t + dur - 3)
  g.gain.linearRampToValueAtTime(0.0001, t + dur)
  g.connect(bus.input)
  for (const k of [1, 1.5]) {
    const o = ac.createOscillator()
    o.type = 'sine'
    o.frequency.value = f * k
    o.connect(g)
    o.start(t)
    o.stop(t + dur)
  }
}

const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)]
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x))

// Một đoạn 8 phách bắt đầu từ t. p: số thứ tự đoạn; deg: bậc giai điệu hiện tại (đi ngẫu nhiên, trả về bậc mới)
export function phrase(ac: BaseAudioContext, bus: Bus, t: number, p: number, deg: number) {
  const hum = () => (Math.random() - 0.5) * 0.03 // lệch nhịp chút xíu cho giống người gảy
  if (p % 2 === 0) drone(ac, bus, t, p % 4 === 0 ? 73.42 : 110, PHRASE * 2 + 1, 0.035) // Rê2 / La2
  if (p % 4 === 0) for (let k = 0; k < 5; k++) pluck(ac, bus, t + k * 0.06, hz(deg - 5 + k), 0.05 + k * 0.01) // vuốt dây mở đoạn
  const kind = p % 4 === 3 ? 'rest' : p % 6 === 4 ? 'flute' : Math.random() < 0.12 ? 'rest' : 'zheng'
  if (kind === 'flute') {
    let f0: number | undefined
    let at = 0
    for (const dur of [3, 2, 3]) {
      deg = clamp(deg + pick([-2, -1, 1, 2]), 8, 13)
      flute(ac, bus, t + at * BEAT, hz(deg), dur * BEAT, 0.06, f0)
      f0 = hz(deg)
      at += dur
    }
    pluck(ac, bus, t, hz(deg - 10), 0.07) // đàn đệm nốt trầm
    pluck(ac, bus, t + 4 * BEAT, hz(deg - 8), 0.06)
  } else if (kind === 'zheng') {
    const rhythm = pick(RHYTHMS)
    rhythm.forEach((beat, k) => {
      deg = clamp(deg + pick([-2, -1, -1, 1, 1, 2]), 5, 14)
      if (k === rhythm.length - 1) deg = deg % 5 < 2.5 ? deg - (deg % 5) : deg - (deg % 5) + 3 // kết đoạn trên Rê hoặc La
      const at = t + beat * BEAT + hum()
      pluck(ac, bus, at, hz(deg), 0.09 + Math.random() * 0.03)
      if (Math.random() < 0.2) pluck(ac, bus, at + 0.01, hz(deg - 2), 0.05) // nốt đôi
    })
  }
  return deg
}

// Phát theo thời gian thực: lên lịch trước ~1 đoạn, kiểm mỗi giây. Ẩn tab thì tạm dừng cả AudioContext.
let playing: { stop: () => void } | null = null
export function startMusic() {
  if (playing) return
  try {
    const ac = audio()
    void ac.resume()
    const bus = makeBus(ac, ac.destination)
    bus.out.gain.setValueAtTime(0.0001, ac.currentTime)
    bus.out.gain.exponentialRampToValueAtTime(VOLUME, ac.currentTime + 2)
    let next = ac.currentTime + 0.3
    let p = 0
    let deg = 8
    const tick = () => {
      while (next < ac.currentTime + PHRASE) {
        deg = phrase(ac, bus, next, p++, deg)
        next += PHRASE
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    const vis = () => void (document.hidden ? ac.suspend() : ac.resume())
    document.addEventListener('visibilitychange', vis)
    playing = {
      stop() {
        clearInterval(id)
        document.removeEventListener('visibilitychange', vis)
        const end = ac.currentTime + 1
        bus.out.gain.setTargetAtTime(0.0001, ac.currentTime, 0.3)
        setTimeout(() => bus.out.disconnect(), (end - ac.currentTime) * 1000 + 200) // các nốt đã hẹn sau đó rơi vào hư không
      },
    }
  } catch {
    playing = null // trình duyệt không có WebAudio: im lặng, game vẫn chạy
  }
}
export function stopMusic() {
  playing?.stop()
  playing = null
}
