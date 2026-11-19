import { STROKES } from '../data/strokes.js'
import { fetchHanjaStrokeData } from './supabase.js'

const cache = new Map()
const code = (c) => c.codePointAt(0).toString(16)

export async function loadGuide(c) {
  if (cache.has(c)) return cache.get(c)
  let g = null

  // 1순위: Supabase에 이전한 획순 좌표 데이터
  try {
    const row = await fetchHanjaStrokeData(c)
    if (Array.isArray(row?.stroke_paths) && row.stroke_paths.length) {
      const lines = row.stroke_paths.map((stroke) =>
        stroke.map(([x, y]) => [x * 10.24, y * 10.24])
      )
      g = { kind: 'basic', lines, medians: lines }
    }
  } catch {
    // Supabase에서 획순을 읽지 못하면 기존 공개 JSON/내장 데이터로 대체합니다.
  }

  // 2순위: Hanzi Writer 정식 획순 JSON
  if (!g) {
    try {
      const r = await fetch(`${import.meta.env.BASE_URL}hanzi/${code(c)}.json`)
      if (r.ok) {
        const j = await r.json()
        if (Array.isArray(j.strokes) && Array.isArray(j.medians)) {
          g = { kind: 'full', paths: j.strokes, medians: j.medians.map((m) => m.map(([x, y]) => [x, 900 - y])) }
        }
      }
    } catch {
      // 정식 JSON이 없으면 내장 획순을 사용합니다.
    }
  }

  // 3순위: 앱에 포함된 기본 획순
  if (!g && STROKES[c]) {
    const lines = STROKES[c].map((stroke) => stroke.map(([x, y]) => [x * 10.24, y * 10.24]))
    g = { kind: 'basic', lines, medians: lines }
  }

  g = g || { kind: 'none', medians: [] }
  cache.set(c, g)
  return g
}
