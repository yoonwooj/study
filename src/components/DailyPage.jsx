import { useEffect, useState } from 'react'
import { todayLabel, ymd } from '../lib/date.js'
import { SUBJECT_THEME } from '../lib/theme.js'

const DAILY_N = 20

const SUBJECTS_BY_GRADE = {
  1: ['국어', '통합', '바른생활'],
  2: ['국어', '통합', '바른생활'],
  3: ['국어', '사회', '과학'],
  4: ['국어', '사회', '과학'],
  5: ['국어', '사회', '과학'],
  6: ['국어', '사회', '과학'],
}

const SUBJECT_TO_CODE = {
  국어: 'kor',
  통합: 'mor',
  바른생활: 'mor',
  사회: 'soc',
  과학: 'sci',
}

export default function DailyPage({
  grade,
  subject,
  onSubject,
  semester = null,
  onSemester,
  daily,
  streak,
  onStart,
  onlyGrade,
  onlySemester,
  unitName = '',
  loading = false,
  error = '',
}) {
  const activeGrade = onlyGrade ?? grade
  const activeSem = onlySemester ?? semester
  const gradeSubjects = SUBJECTS_BY_GRADE[activeGrade] || SUBJECTS_BY_GRADE[1]

  const [innerSubject, setInnerSubject] = useState(subject || gradeSubjects[0])
  const activeSubject = subject && gradeSubjects.includes(subject)
    ? subject
    : gradeSubjects.includes(innerSubject)
      ? innerSubject
      : gradeSubjects[0]

  useEffect(() => {
    if (!gradeSubjects.includes(activeSubject)) {
      const next = gradeSubjects[0]
      setInnerSubject(next)
      if (onSubject) onSubject(next)
    }
  }, [activeGrade])

  const handleSelectSubject = (subjName) => {
    setInnerSubject(subjName)
    if (onSubject) onSubject(subjName)
  }

  const today = ymd()
  const recKey = activeSem
    ? `${today}|${activeGrade}|${activeSem}|${activeSubject}`
    : `${today}|${activeGrade}|${activeSubject}`
  const rec = daily[recKey]
  const doneCount = gradeSubjects.filter((subjName) => {
    const key = activeSem
      ? `${today}|${activeGrade}|${activeSem}|${subjName}`
      : `${today}|${activeGrade}|${subjName}`
    return Boolean(daily[key])
  }).length
  const showSemesterRow = onlyGrade == null && !onlySemester && typeof onSemester === 'function'

  return (
    <>
      <main className="page">
        <section className="hero">
          <small>{todayLabel()}</small>
          <b>⭐ 오늘의 학습 · {activeGrade}학년{activeSem ? ` ${activeSem}학기` : ''} · {activeSubject}</b>
        </section>

        <section className="card streak">
          <div><b>🔥 {streak}일 연속</b><small>오늘 완료한 과목 {doneCount}/{gradeSubjects.length}</small></div>
        </section>

        <section className="sel">
          <div className="sel-row">
            <span className="lbl">과목</span>
            <div className="subject-pills" role="group" aria-label="과목 선택">
              {gradeSubjects.map((subjName) => (
                <button
                  type="button"
                  key={subjName}
                  data-theme={SUBJECT_THEME[subjName] || SUBJECT_TO_CODE[subjName] || 'kor'}
                  aria-pressed={activeSubject === subjName}
                  onClick={() => handleSelectSubject(subjName)}
                >
                  {subjName}
                </button>
              ))}
            </div>
          </div>

          {showSemesterRow && (
            <div className="sel-row">
              <span className="lbl">학기</span>
              <div className="seg" role="group" aria-label="학기 선택">
                <button type="button" aria-pressed={activeSem === null} onClick={() => onSemester(null)}>전체</button>
                {[1, 2].map((s) => (
                  <button type="button" key={s} aria-pressed={activeSem === s} onClick={() => onSemester(s)}>
                    {s}학기
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="card">
          <h2>오늘의 {activeSubject} {DAILY_N}문제</h2>
          <ul className="ulist">
            <li>
              <span>{activeSubject.slice(0, 1)}</span>
              {activeSubject}
              <em>{DAILY_N}문제</em>
            </li>
          </ul>
          <p className="sub">날짜가 바뀌면 새 문제가 나와요. 틀린 문제는 오답노트에 모여요.</p>
          {rec && <p className="best">🏅 오늘 최고 점수 {rec.score}/{rec.total}</p>}
          {error && <p className="err" role="alert">{error}</p>}
        </section>
      </main>

      <div className="cta">
        <div className="cta-in">
          <button
            type="button"
            className="btn block"
            disabled={loading}
            onClick={() => onStart(activeGrade, activeSem, activeSubject, unitName)}
          >
            {loading ? '문제 준비 중…' : rec
              ? `다시 풀기 (${DAILY_N}문제)`
              : `오늘의 학습 시작 (${DAILY_N}문제)`}
          </button>
        </div>
      </div>
    </>
  )
}
// import { useMemo } from 'react'
// import { dailyQs, DAILY_N } from '../lib/daily.js'
// import { dayIndex, todayLabel, ymd } from '../lib/date.js'

// export default function DailyPage({ grade, onGrade, daily, streak, onStart, onlyGrade }) {
//   const grades = onlyGrade ? [onlyGrade] : [1, 2, 3, 4, 5, 6]
//   const day = dayIndex()
//   const plan = useMemo(() => dailyQs(grade, day), [grade, day])
//   const today = ymd()
//   const rec = daily[`${today}|${grade}`]
//   const doneCount = grades.filter((g) => daily[`${today}|${g}`]).length
//   const cnt = (sj) => plan.filter((q) => q._ctx.subj === sj).length
//   return (
//     <>
//       <main className="page">
//         <section className="hero"><small>{todayLabel()}</small><b>⭐ 오늘의 학습 · {grade}학년</b></section>
//         <section className="card streak">
//           <div><b>🔥 {streak}일 연속</b><small>오늘 완료한 학년 {doneCount}/{grades.length}</small></div>
//         </section>
//         <section className="sel">
//           <div className="sel-row"><span className="lbl">학년</span>
//             <div className="grades" role="group" aria-label="학년 선택">
//               {grades.map((g) => (
//                 <button key={g} aria-pressed={g === grade} onClick={() => onGrade(g)}><b>{g}</b><small>{daily[`${today}|${g}`] ? '✓완료' : '학년'}</small></button>
//               ))}
//             </div>
//           </div>
//         </section>
//         <section className="card">
//           <h2>오늘의 {plan.length}문제</h2>
//           <ul className="ulist">
//             <li><span>국</span>국어<em>{cnt('kor')}문제</em></li>
//             <li><span>도</span>도덕<em>{cnt('mor')}문제</em></li>
//           </ul>
//           <p className="sub">날짜가 바뀌면 새 문제가 나와요. 틀린 문제는 오답노트에 모여요.</p>
//           {rec && <p className="best">🏅 오늘 최고 점수 {rec.score}/{rec.total}</p>}
//         </section>
//       </main>
//       <div className="cta"><div className="cta-in">
//         <button className="btn block" disabled={plan.length === 0} onClick={() => onStart(grade)}>{plan.length === 0 ? '문제 준비 중' : rec ? `다시 풀기 (${Math.min(plan.length, DAILY_N)}문제)` : `오늘의 학습 시작 (${Math.min(plan.length, DAILY_N)}문제)`}</button>
//       </div></div>
//     </>
//   )
// }
