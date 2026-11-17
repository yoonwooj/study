import { SUBJECTS, unitsOf, keyOf } from '../curriculum.js'
import { BANK } from '../bank/index.js'

export const MAX_UNITS = 3
export const CORE_N = 20
export const PER_SLIDE = 3
export const TYPE = { c: '4지선다', ox: 'O/X', s: '주관식' }

export const norm = (v) => String(v).replace(/[\s.,!?]/g, '').toLowerCase()
export const shuffle = (a) => {
  const b = [...a]
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[b[i], b[j]] = [b[j], b[i]]
  }
  return b
}
export const isRight = (q, v) => (q.t === 's' ? q.a.some((x) => norm(x) === norm(v)) : v === q.a)
export const answerText = (q) => (q.t === 'c' ? `${'①②③④'[q.a]} ${q.o[q.a]}` : q.t === 'ox' ? (q.a ? 'O' : 'X') : q.a[0])
const NAMES = { ...SUBJECTS, eng: '영어', soc: '사회', sci: '과학', eth: '도덕' } // 숨긴 과목의 기록 표시용
export const gsLabel = (sj, g, s) => (sj === 'eng' ? `${g}학년` : `${g}학년 ${s}학기`)
export const recTitle = (r) => (r.kind === 'daily' ? `오늘의 학습 ${r.g}학년` : `${r.subj === 'mor' && r.g < 3 ? '통합' : (NAMES[r.subj || 'kor'] || '국어')} ${gsLabel(r.subj || 'kor', r.g, r.s)}`)
export const fmt = (at) => new Date(at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })

// 4지선다는 풀 때마다 보기 순서를 섞고 정답 번호를 다시 계산해요.
export const prep = (q, unit) => {
  if (q.t !== 'c') return { ...q, unit }
  const opts = shuffle(q.o.map((text, i) => ({ text, ok: i === q.a })))
  return { ...q, unit, o: opts.map((o) => o.text), a: opts.findIndex((o) => o.ok) }
}
export const bankOf = (sj, g, s, i, ed) => BANK[keyOf(sj, g, s, i, ed)] || []
export const unitQs = (sj, g, s, i, ed) => shuffle(bankOf(sj, g, s, i, ed)).map((q) => prep(q, unitsOf(sj, g, s, ed)[i]))
export const coreQs = (sj, g, s, ed) => {
  const lists = unitsOf(sj, g, s, ed).map((_, i) => unitQs(sj, g, s, i, ed)).filter((l) => l.length)
  const out = []
  for (let k = 0; out.length < CORE_N && lists.some((l) => l[k]); k++) lists.forEach((l) => { if (l[k] && out.length < CORE_N) out.push(l[k]) })
  return shuffle(out)
}
