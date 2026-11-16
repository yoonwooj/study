import { useMemo } from 'react'
import { dailyQs, DAILY_N } from '../lib/daily.js'
import { dayIndex, todayLabel, ymd } from '../lib/date.js'

export default function DailyPage({ grade, onGrade, daily, streak, onStart }) {
  const day = dayIndex()
  const plan = useMemo(() => dailyQs(grade, day), [grade, day])
  const today = ymd()
  const rec = daily[`${today}|${grade}`]
  const doneCount = [1, 2, 3, 4, 5, 6].filter((g) => daily[`${today}|${g}`]).length
  const cnt = (sj) => plan.filter((q) => q._ctx.subj === sj).length
  return (
    <>
      <main className="page">
        <section className="hero"><small>{todayLabel()}</small><b>⭐ 오늘의 학습 · {grade}학년</b></section>
        <section className="card streak">
          <div><b>🔥 {streak}일 연속</b><small>오늘 완료한 학년 {doneCount}/6</small></div>
        </section>
        <section className="sel">
          <div className="sel-row"><span className="lbl">학년</span>
            <div className="grades" role="group" aria-label="학년 선택">
              {[1, 2, 3, 4, 5, 6].map((g) => (
                <button key={g} aria-pressed={g === grade} onClick={() => onGrade(g)}><b>{g}</b><small>{daily[`${today}|${g}`] ? '✓완료' : '학년'}</small></button>
              ))}
            </div>
          </div>
        </section>
        <section className="card">
          <h2>오늘의 {plan.length}문제</h2>
          <ul className="ulist">
            <li><span>국</span>국어<em>{cnt('kor')}문제</em></li>
            <li><span>도</span>도덕<em>{cnt('mor')}문제</em></li>
          </ul>
          <p className="sub">날짜가 바뀌면 새 문제가 나와요. 틀린 문제는 오답노트에 모여요.</p>
          {rec && <p className="best">🏅 오늘 최고 점수 {rec.score}/{rec.total}</p>}
        </section>
      </main>
      <div className="cta"><div className="cta-in">
        <button className="btn block" disabled={plan.length === 0} onClick={() => onStart(grade)}>{plan.length === 0 ? '문제 준비 중' : rec ? `다시 풀기 (${Math.min(plan.length, DAILY_N)}문제)` : `오늘의 학습 시작 (${Math.min(plan.length, DAILY_N)}문제)`}</button>
      </div></div>
    </>
  )
}
