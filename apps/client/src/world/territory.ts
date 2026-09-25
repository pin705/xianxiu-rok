// Lãnh thổ tiên minh trên bản đồ giới: nền màu nhạt theo từng dải ô liền + viền nơi đổi chủ (Graphics, DU), cờ trận kỳ.
// Mỗi minh một màu (minh mình: ngọc bích). Chủ từng ô tính ở rules (snapClaims → territoryGrid), cùng luật với server.
import type { Graphics } from 'pixi.js'
import { MAP_W } from '@rok/rules/world'
import { WORLD_TILE } from '@rok/art'
import { texOf } from './stage'

const T = WORLD_TILE
// màu lãnh thổ các tiên minh khác (theo id), cùng họ màu khoáng của tranh
const COLORS = [0xb8382a, 0x2f6690, 0x8a5a9e, 0xb07a2a, 0x4a6b7c, 0x9c4a3a]
export const terrColor = (aid: number, mine?: number) => (aid === mine ? 0x3f8f6b : COLORS[aid % COLORS.length])

// Trận kỳ: cán mực + lá cờ màu tiên minh (nướng một lần mỗi màu)
export const flagTex = (color: number) =>
  texOf(`wflag:${color}`, () => {
    const c = document.createElement('canvas')
    c.width = c.height = 64
    const g = c.getContext('2d')!
    const pennant = () => {
      g.beginPath()
      g.moveTo(22, 6)
      g.quadraticCurveTo(42, 2, 60, 14)
      g.quadraticCurveTo(46, 23, 58, 34)
      g.quadraticCurveTo(40, 38, 22, 36)
      g.closePath()
    }
    // quầng giấy sáng quanh cờ: đọc được trên mọi nền địa hình
    g.lineJoin = 'round'
    g.strokeStyle = 'rgba(246,238,220,0.9)'
    g.lineWidth = 7
    pennant()
    g.stroke()
    g.strokeRect(17, 5, 6, 56)
    g.fillStyle = '#2b2520'
    g.fillRect(17, 4, 6, 57)
    g.fillStyle = `#${color.toString(16).padStart(6, '0')}`
    g.strokeStyle = '#2b2520'
    g.lineWidth = 3
    pennant()
    g.fill()
    g.stroke()
    return c
  })

// own: ô → id tiên minh (0: vô chủ / tranh chấp)
export function paintTerritory(g: Graphics, own: Int32Array, mine?: number) {
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= MAP_W || y >= MAP_W ? 0 : own[y * MAP_W + x])
  const edges = new Map<number, number[]>() // màu → các đoạn viền (x0, y0, x1, y1 theo ô)
  for (let y = 0; y < MAP_W; y++)
    for (let x = 0; x < MAP_W;) {
      const o = own[y * MAP_W + x]
      let end = x + 1
      while (end < MAP_W && own[y * MAP_W + end] === o) end++
      const c = terrColor(o, mine)
      if (o) g.rect(x * T, y * T, (end - x) * T, T).fill({ color: c, alpha: o === mine ? 0.16 : 0.13 })
      const list = edges.get(c) ?? []
      for (let k = x; o && k < end; k++) {
        if (at(k, y - 1) !== o) list.push(k, y, k + 1, y)
        if (at(k, y + 1) !== o) list.push(k, y + 1, k + 1, y + 1)
        if (k === x && at(k - 1, y) !== o) list.push(k, y, k, y + 1)
        if (k === end - 1 && at(k + 1, y) !== o) list.push(k + 1, y, k + 1, y + 1)
      }
      if (o) edges.set(c, list)
      x = end
    }
  for (const [c, list] of edges) {
    for (let i = 0; i < list.length; i += 4)
      g.moveTo(list[i] * T, list[i + 1] * T).lineTo(list[i + 2] * T, list[i + 3] * T)
    g.stroke({ width: T * 0.14, color: c, alpha: 0.75 })
  }
}
