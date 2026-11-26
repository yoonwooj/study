import { STROKES } from '../data/strokes.js'
import { fetchHanjaStrokeData } from './supabase.js'

const cache = new Map()
const code = (c) => c.codePointAt(0).toString(16)

export async function loadGuide(c) {
  if (cache.has(c)) return cache.get(c)
  let g = null

  // 1순위: Supabase에 저장된 Hanzi Writer 획순 및 중심선 데이터
  try {
    const row = await fetchHanjaStrokeData(c)
    const data = row?.stroke_paths
    if (
      data &&
      !Array.isArray(data) &&
      Array.isArray(data.strokes) &&
      Array.isArray(data.medians) &&
      data.strokes.length === data.medians.length &&
      data.strokes.length > 0
    ) {
      g = {
        kind: 'full',
        paths: data.strokes,
        medians: data.medians.map((m) => m.map(([x, y]) => [x, 900 - y])),
      }
    } else if (Array.isArray(data) && data.length && Array.isArray(data[0])) {
      // 이전에 저장했던 점 좌표 형식과의 하위 호환
      const lines = data.map((stroke) => stroke.map(([x, y]) => [x * 10.24, y * 10.24]))
      g = { kind: 'basic', lines, medians: lines }
    }
  } catch {
    // Supabase에서 읽지 못하면 공개 JSON 또는 기존 내장 데이터로 대체합니다.
  }

  // 2순위: 프로젝트에 포함된 Hanzi Writer JSON
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
