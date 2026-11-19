import { CUR } from '../curriculum.js'
import { prep, bankOf } from './quiz.js'
import { dayIndex } from './date.js'

export const DAILY_N = 20

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

const pool = (subj, g, sem = null, unitName = '') => {
  const out = []
  const sems = sem ? [Number(sem)] : [1, 2]
  for (const s of sems) {
    ;(CUR[subj]?.[g]?.[s] || []).forEach((unit, i) => {
      bankOf(subj, g, s, i).forEach((q) => {
        out.push({ q, unit, ctx: { subj, g, s } })
      })
    })
  }
  if (!unitName) return out
  const matched = out.filter((item) => item.unit && item.unit.includes(unitName))
  return matched.length > 0 ? matched : out
}

// 학년(및 선택 학기·단원) 기준 오늘의 20문제 구성
export function dailyQs(grade, day = dayIndex(), semester = null, unitName = '', subjectName = '') {
  const g = Number(grade) || 1
  const s = semester ? Number(semester) : null
  const subjectCode = {
    국어: 'kor',
    통합: 'mor',
    바른생활: 'mor',
    사회: 'soc',
    과학: 'sci',
  }[subjectName]

  // 과목이 지정되면 해당 과목의 문제만 구성합니다.
  if (subjectCode) {
    const list = seededShuffle(pool(subjectCode, g, s, unitName), g * 1000 + subjectCode.length + (s || 0) * 100)
    const picks = Array.from(
      { length: Math.min(DAILY_N, list.length) },
      (_, i) => list[(day * DAILY_N + i) % list.length]
    )
    return seededShuffle(picks, day * 7 + g + subjectCode.length + (s || 0))
      .map((x) => ({ ...prep(x.q, x.unit), _ctx: x.ctx }))
  }

  const half = DAILY_N / 2
  const picks = ['kor', 'mor'].flatMap((sj, k) => {
    const list = seededShuffle(pool(sj, g, s, unitName), g * 1000 + k + (s || 0) * 100)
    if (list.length === 0) return []
    return Array.from({ length: Math.min(half, list.length) }, (_, i) => list[(day * half + i) % list.length])
  })
  return seededShuffle(picks, day * 7 + g + (s || 0)).map((x) => ({ ...prep(x.q, x.unit), _ctx: x.ctx }))
}
// 2차
// import { useEffect, useMemo, useState } from 'react'
// import { dailyQs, DAILY_N } from '../lib/daily.js'
// import { dayIndex, todayLabel, ymd } from '../lib/date.js'
// import { SUBJECT_THEME } from '../lib/theme.js'

// const SUBJECTS_BY_GRADE = {
//   1: ['국어', '통합', '바른생활'],
//   2: ['국어', '통합', '바른생활'],
//   3: ['국어', '사회', '과학'],
//   4: ['국어', '사회', '과학'],
//   5: ['국어', '사회', '과학'],
//   6: ['국어', '사회', '과학'],
// }

// const SUBJECT_TO_CODE = {
//   국어: 'kor',
//   통합: 'mor',
//   바른생활: 'mor',
//   사회: 'soc',
//   과학: 'sci',
// }

// export default function DailyPage({
//   grade,
//   subject,
//   onSubject,
//   semester = null,
//   onSemester,
//   unitName = '',
//   daily,
//   streak,
//   onStart,
//   onlyGrade,
//   onlySemester,
// }) {
//   const activeGrade = Number(onlyGrade ?? grade) || 1
//   const activeSem =
//     onlySemester != null
//       ? Number(onlySemester)
//       : semester != null
//         ? Number(semester)
//         : null
//   const gradeSubjects = SUBJECTS_BY_GRADE[activeGrade] || SUBJECTS_BY_GRADE[1]

//   const [innerSubject, setInnerSubject] = useState(subject || gradeSubjects[0])
//   const activeSubject =
//     subject && gradeSubjects.includes(subject)
//       ? subject
//       : gradeSubjects.includes(innerSubject)
//         ? innerSubject
//         : gradeSubjects[0]

//   useEffect(() => {
//     if (!gradeSubjects.includes(activeSubject)) {
//       const next = gradeSubjects[0]
//       setInnerSubject(next)
//       if (onSubject) onSubject(next)
//     }
//   }, [activeGrade])

//   const handleSelectSubject = (subjName) => {
//     setInnerSubject(subjName)
//     if (onSubject) onSubject(subjName)
//   }

//   const grades = onlyGrade ? [Number(onlyGrade)] : [1, 2, 3, 4, 5, 6]
//   const day = dayIndex()
//   const plan = useMemo(
//     () => dailyQs(activeGrade, day, activeSem, unitName),
//     [activeGrade, day, activeSem, unitName]
//   )
//   const today = ymd()
//   const recKey = activeSem
//     ? `${today}|${activeGrade}|${activeSem}|${activeSubject}`
//     : `${today}|${activeGrade}|${activeSubject}`
//   const rec = daily[recKey] || daily[`${today}|${activeGrade}`]
//   const doneCount = grades.filter((g) =>
//     activeSem
//       ? daily[`${today}|${g}|${activeSem}`] || daily[`${today}|${g}`]
//       : daily[`${today}|${g}`]
//   ).length
//   const showSemesterRow = !onlySemester && typeof onSemester === 'function'

//   return (
//     <>
//       <main className="page">
//         <section className="hero">
//           <small>{todayLabel()}</small>
//           <b>
//             ⭐ 오늘의 학습 · {activeGrade}학년
//             {activeSem ? ` ${activeSem}학기` : ''}
//             {unitName ? ` · ${unitName}` : ` · ${activeSubject}`}
//           </b>
//         </section>

//         <section className="card streak">
//           <div>
//             <b>🔥 {streak}일 연속</b>
//             <small>오늘 완료한 학년 {doneCount}/{grades.length}</small>
//           </div>
//         </section>

//         <section className="sel">
//           <div className="sel-row">
//             <span className="lbl">과목</span>
//             <div className="subject-pills" role="group" aria-label="과목 선택">
//               {gradeSubjects.map((subjName) => (
//                 <button
//                   type="button"
//                   key={subjName}
//                   data-theme={SUBJECT_THEME[subjName] || SUBJECT_TO_CODE[subjName] || 'kor'}
//                   aria-pressed={activeSubject === subjName}
//                   onClick={() => handleSelectSubject(subjName)}
//                 >
//                   {subjName}
//                 </button>
//               ))}
//             </div>
//           </div>

//           {showSemesterRow && (
//             <div className="sel-row">
//               <span className="lbl">학기</span>
//               <div className="seg" role="group" aria-label="학기 선택">
//                 <button
//                   type="button"
//                   aria-pressed={activeSem === null}
//                   onClick={() => onSemester(null)}
//                 >
//                   전체
//                 </button>
//                 {[1, 2].map((s) => (
//                   <button
//                     type="button"
//                     key={s}
//                     aria-pressed={activeSem === s}
//                     onClick={() => onSemester(s)}
//                   >
//                     {s}학기
//                   </button>
//                 ))}
//               </div>
//             </div>
//           )}
//         </section>

//         <section className="card">
//           <h2>
//             오늘의 {unitName ? `${unitName} ` : `${activeSubject} `}
//             {Math.min(plan.length, DAILY_N)}문제
//           </h2>
//           <ul className="ulist">
//             <li>
//               <span>{activeSubject.slice(0, 1)}</span>
//               {unitName
//                 ? `${activeGrade}학년${activeSem ? ` ${activeSem}학기` : ''} · ${unitName}`
//                 : activeSubject}
//               <em>{Math.min(plan.length, DAILY_N)}문제</em>
//             </li>
//           </ul>
//           <p className="sub">날짜가 바뀌면 새 문제가 나와요. 틀린 문제는 오답노트에 모여요.</p>
//           {rec && (
//             <p className="best">
//               🏅 오늘 최고 점수 {rec.score}/{rec.total}
//             </p>
//           )}
//         </section>
//       </main>

//       <div className="cta">
//         <div className="cta-in">
//           <button
//             type="button"
//             className="btn block"
//             disabled={plan.length === 0}
//             onClick={() => onStart(activeGrade, activeSem, activeSubject, unitName)}
//           >
//             {plan.length === 0
//               ? '문제 준비 중'
//               : rec
//                 ? `다시 풀기 (${Math.min(plan.length, DAILY_N)}문제)`
//                 : `오늘의 학습 시작 (${Math.min(plan.length, DAILY_N)}문제)`}
//           </button>
//         </div>
//       </div>
//     </>
//   )
// }
// 2차
// import { CUR } from '../curriculum.js'
// import { prep, bankOf } from './quiz.js'
// import { dayIndex } from './date.js'

// export const DAILY_N = 20

// const rng = (seed) => {
//   let a = seed >>> 0
//   return () => {
//     a = (a + 0x6d2b79f5) >>> 0
//     let t = a
//     t = Math.imul(t ^ (t >>> 15), t | 1)
//     t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
//     return ((t ^ (t >>> 14)) >>> 0) / 4294967296
//   }
// }
// const seededShuffle = (arr, seed) => {
//   const r = rng(seed)
//   const b = [...arr]
//   for (let i = b.length - 1; i > 0; i--) {
//     const j = Math.floor(r() * (i + 1))
//     ;[b[i], b[j]] = [b[j], b[i]]
//   }
//   return b
// }
// const pool = (subj, g, sem = null) => {
//   const out = []
//   const sems = sem ? [sem] : [1, 2]
//   for (const s of sems) {
//     ;(CUR[subj]?.[g]?.[s] || []).forEach((unit, i) => {
//       bankOf(subj, g, s, i).forEach((q) => out.push({ q, unit, ctx: { subj, g, s } }))
//     })
//   }
//   return out
// }

// // 학년(및 선택 학기) 기준 오늘의 20문제 구성
// export function dailyQs(grade, day = dayIndex(), semester = null) {
//   const half = DAILY_N / 2
//   const picks = ['kor', 'mor'].flatMap((sj, k) => {
//     const list = seededShuffle(pool(sj, grade, semester), grade * 1000 + k + (semester || 0) * 100)
//     return Array.from({ length: Math.min(half, list.length) }, (_, i) => list[(day * half + i) % list.length])
//   })
//   return seededShuffle(picks, day * 7 + grade + (semester || 0)).map((x) => ({ ...prep(x.q, x.unit), _ctx: x.ctx }))
// }
// import { CUR } from '../curriculum.js'
// import { prep, bankOf } from './quiz.js'
// import { dayIndex } from './date.js'

// export const DAILY_N = 20

// // 같은 값(seed)이면 항상 같은 순서가 나오는 섞기
// const rng = (seed) => {
//   let a = seed >>> 0
//   return () => {
//     a = (a + 0x6d2b79f5) >>> 0
//     let t = a
//     t = Math.imul(t ^ (t >>> 15), t | 1)
//     t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
//     return ((t ^ (t >>> 14)) >>> 0) / 4294967296
//   }
// }
// const seededShuffle = (arr, seed) => {
//   const r = rng(seed)
//   const b = [...arr]
//   for (let i = b.length - 1; i > 0; i--) {
//     const j = Math.floor(r() * (i + 1))
//     ;[b[i], b[j]] = [b[j], b[i]]
//   }
//   return b
// }
// const pool = (subj, g) => {
//   const out = []
//   for (const s of [1, 2]) CUR[subj][g][s].forEach((unit, i) => bankOf(subj, g, s, i).forEach((q) => out.push({ q, unit, ctx: { subj, g, s } })))
//   return out
// }

// // 학년마다 국어 10 + 도덕 10문제. 날짜가 바뀌면 이어서 다음 문제를 내서, 한 바퀴 돌 때까지는 겹치지 않아요.
// export function dailyQs(grade, day = dayIndex()) {
//   const half = DAILY_N / 2
//   const picks = ['kor', 'mor'].flatMap((sj, k) => {
//     const list = seededShuffle(pool(sj, grade), grade * 1000 + k)
//     return Array.from({ length: Math.min(half, list.length) }, (_, i) => list[(day * half + i) % list.length])
//   })
//   return seededShuffle(picks, day * 7 + grade).map((x) => ({ ...prep(x.q, x.unit), _ctx: x.ctx }))
// }
