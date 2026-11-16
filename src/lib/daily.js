import { CUR } from '../curriculum.js'
import { prep, bankOf } from './quiz.js'
import { dayIndex } from './date.js'

export const DAILY_N = 20

// 같은 값(seed)이면 항상 같은 순서가 나오는 섞기
const rng = (seed) => {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const seededShuffle = (arr, seed) => {
  const r = rng(seed)
  const b = [...arr]
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[b[i], b[j]] = [b[j], b[i]]
  }
  return b
}
const pool = (subj, g) => {
  const out = []
  for (const s of [1, 2]) CUR[subj][g][s].forEach((unit, i) => bankOf(subj, g, s, i).forEach((q) => out.push({ q, unit, ctx: { subj, g, s } })))
  return out
}

// 학년마다 국어 10 + 도덕 10문제. 날짜가 바뀌면 이어서 다음 문제를 내서, 한 바퀴 돌 때까지는 겹치지 않아요.
export function dailyQs(grade, day = dayIndex()) {
  const half = DAILY_N / 2
  const picks = ['kor', 'mor'].flatMap((sj, k) => {
    const list = seededShuffle(pool(sj, grade), grade * 1000 + k)
    return Array.from({ length: Math.min(half, list.length) }, (_, i) => list[(day * half + i) % list.length])
  })
  return seededShuffle(picks, day * 7 + grade).map((x) => ({ ...prep(x.q, x.unit), _ctx: x.ctx }))
}
