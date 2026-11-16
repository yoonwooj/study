import { STROKES } from '../data/strokes.js'

const cache = new Map()
const code = (c) => c.codePointAt(0).toString(16)

// 좌표는 모두 0~1024 화면 좌표로 맞춰요.
// 1순위: public/hanzi/{유니코드}.json (Hanzi Writer 데이터, 정식 획순과 글자 모양)
// 2순위: 내장 기본 획순(src/data/strokes.js)
// 3순위: 획순 없이 반투명 글자만
export async function loadGuide(c) {
  if (cache.has(c)) return cache.get(c)
  let g = null
  try {
    const r = await fetch(`${import.meta.env.BASE_URL}hanzi/${code(c)}.json`)
    if (r.ok) {
      const j = await r.json()
      if (Array.isArray(j.strokes) && Array.isArray(j.medians)) {
        g = { kind: 'full', paths: j.strokes, medians: j.medians.map((m) => m.map(([x, y]) => [x, 900 - y])) }
      }
    }
  } catch { /* 파일이 없으면 다음 순위로 */ }
  if (!g && STROKES[c]) {
    const lines = STROKES[c].map((s) => s.map(([x, y]) => [x * 10.24, y * 10.24]))
    g = { kind: 'basic', lines, medians: lines }
  }
  g = g || { kind: 'none', medians: [] }
  cache.set(c, g)
  return g
}
