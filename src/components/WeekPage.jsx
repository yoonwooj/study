import { recTitle } from '../lib/quiz.js'
import { sameDay } from '../lib/date.js'

const DAYS = ['월', '화', '수', '목', '금', '토', '일']

// 이번 주(월~일)에 저장된 학습 기록을 한눈에 보여줘요.
export default function WeekPage({ records }) {
  const now = new Date()
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7))
  const days = DAYS.map((label, i) => {
    const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)
    const list = records.filter((r) => sameDay(new Date(r.at), date)).sort((a, b) => a.at - b.at)
    return { label, date, list, score: list.reduce((a, r) => a + r.score, 0), total: list.reduce((a, r) => a + r.total, 0) }
  })
  const all = days.flatMap((d) => d.list)
  const solved = days.reduce((a, d) => a + d.total, 0)
  const correct = days.reduce((a, d) => a + d.score, 0)
  const studied = days.filter((d) => d.list.length > 0).length
  const maxTotal = Math.max(1, ...days.map((d) => d.total))
  return (
    <main className="page">
      <section className="hero"><small>이번주 학습 ({monday.getMonth() + 1}/{monday.getDate()} ~)</small><b>{studied}일 학습 · {all.length}회 · {solved}문제</b></section>
      <section className="card">
        <h2>요일별 학습량</h2>
        <div className="week">
          {days.map((d) => (
            <div key={d.label} className={'wd' + (sameDay(d.date, now) ? ' today' : '')}>
              <div className="bar"><span style={{ height: `${(d.total / maxTotal) * 100}%` }} /></div>
              <b>{d.label}</b><small>{d.total > 0 ? d.total : '-'}</small>
            </div>
          ))}
        </div>
        <p className="sub">정답률 {solved > 0 ? Math.round((correct / solved) * 100) : 0}% ({correct}/{solved})</p>
      </section>
      <section className="card">
        <h2>이번주 학습 전체보기</h2>
        {all.length === 0 ? <p className="sub">이번 주에 저장된 학습이 아직 없어요. 오늘 시작해 볼까요?</p> : (
          <ul className="hist">
            {[...days].reverse().filter((d) => d.list.length > 0).flatMap((d) => [...d.list].reverse().map((r) => (
              <li key={r.at}><div><b>{d.label}요일 · {recTitle(r)}</b><small>{r.label}</small></div><strong>{r.score}/{r.total}</strong></li>
            )))}
          </ul>
        )}
      </section>
    </main>
  )
}
