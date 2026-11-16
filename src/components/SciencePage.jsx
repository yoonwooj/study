import { useState } from 'react'
import { SCIENCE } from '../data/science.js'
import { dayIndex, todayLabel } from '../lib/date.js'

// 매일 하나씩 바뀌는 과학상식
export default function SciencePage() {
  const day = dayIndex()
  const f = SCIENCE[day % SCIENCE.length]
  const [pick, setPick] = useState(null)
  const recent = [1, 2, 3, 4, 5].map((k) => SCIENCE[(((day - k) % SCIENCE.length) + SCIENCE.length) % SCIENCE.length])
  return (
    <main className="page">
      <section className="hero"><small>{todayLabel()}</small><b>오늘의 과학상식</b></section>
      <section className="card center">
        <div className="sci-emoji" aria-hidden="true">{f.emoji}</div>
        <h2>{f.title}</h2>
        <p className="sci-text">{f.text}</p>
      </section>
      <section className="card">
        <h2>O/X로 확인해 봐요</h2>
        <p className="sub">{f.q}</p>
        <div className="ox">
          {[true, false].map((v) => (
            <button key={String(v)} className={'ox-b' + (pick !== null ? (v === f.a ? ' right' : v === pick ? ' wrong' : '') : '')} disabled={pick !== null} onClick={() => setPick(v)}>{v ? 'O' : 'X'}</button>
          ))}
        </div>
        {pick !== null && <p className="sub">{pick === f.a ? '🎉 정답이에요!' : '😢 아쉬워요.'} {f.text}</p>}
      </section>
      <section className="card">
        <h2>지난 상식</h2>
        <ul className="hist">{recent.map((x) => <li key={x.title}><div><b>{x.emoji} {x.title}</b></div></li>)}</ul>
      </section>
    </main>
  )
}
