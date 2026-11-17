import { SUBJECTS } from '../curriculum.js'
import { fmt, recTitle } from '../lib/quiz.js'

export default function RecordsPage({ subj, records, coreBest, onClear }) {
  return (
    <main className="page">
      <section className="card">
        <h2>{SUBJECTS[subj] || ({ soc: '사회', sci: '과학', eth: '도덕' }[subj] || '통합')} · 학기 핵심 문제 최고 점수</h2>
        <div className="grid">
          {(subj === 'eng' ? [3, 4, 5, 6].map((g) => [g, 1]) : [1, 2, 3, 4, 5, 6].flatMap((g) => [[g, 1], [g, 2]])).map(([g, s]) => (
            <div key={g + '-' + s} className="cell"><small>{subj === 'eng' ? `${g}학년` : `${g}-${s}`}</small><b>{coreBest(g, s) < 0 ? '-' : coreBest(g, s)}</b></div>
          ))}
        </div>
      </section>
      <section className="card">
        <h2>최근 기록</h2>
        {records.length === 0 ? <p className="sub">아직 저장된 기록이 없어요.</p> : (
          <ul className="hist">
            {[...records].reverse().slice(0, 15).map((r, k) => (
              <li key={k}><div><b>{recTitle(r)}</b><small>{fmt(r.at)} · {r.label}</small></div><strong>{r.score}/{r.total}</strong></li>
            ))}
          </ul>
        )}
        {records.length > 0 && <button className="btn ghost block" onClick={onClear}>기록 지우기</button>}
      </section>
    </main>
  )
}
