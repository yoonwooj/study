import { SUBJECTS } from '../curriculum.js'
import { CORE_N, answerText, gsLabel } from '../lib/quiz.js'

export default function NotesPage({ subj, notes, noteGrade, onNoteGrade, onDelete, onStart }) {
  const mine = notes.filter((x) => x.subj === subj)
  const shown = noteGrade === 'all' ? mine : mine.filter((x) => x.g === noteGrade)
  return (
    <>
      <main className="page">
        <section className="hero"><small>{SUBJECTS[subj] || ({ soc: '사회', sci: '과학', eth: '도덕' }[subj] || '통합')} 오답노트</small><b>틀린 문제 {mine.length}개</b></section>
        <div className="grades nf" role="group" aria-label="학년 필터">
          {['all', 1, 2, 3, 4, 5, 6].map((g) => (
            <button key={g} aria-pressed={noteGrade === g} onClick={() => onNoteGrade(g)}>{g === 'all' ? <b>전체</b> : <><b>{g}</b><small>학년</small></>}</button>
          ))}
        </div>
        {shown.length === 0 ? <p className="sub empty">틀린 문제가 없어요. 🎉<br />문제를 풀다 틀리면 여기에 모여요.</p> : (
          <>
            <p className="sub">다시 풀어서 맞히면 오답노트에서 자동으로 사라져요.</p>
            {shown.map((nt) => (
              <div key={nt.key} className="note">
                <div className="note-top"><span className="meta">{gsLabel(nt.subj, nt.g, nt.s)} · {nt.unit}</span><button className="del" onClick={() => onDelete(nt.key)} aria-label="오답노트에서 삭제">✕</button></div>
                <b>{nt.q.q}</b>
                <p>정답: <strong>{answerText(nt.q)}</strong></p>
                <p className="why">{nt.q.e}</p>
              </div>
            ))}
          </>
        )}
      </main>
      <div className="cta"><div className="cta-in">
        <button className="btn block" disabled={shown.length === 0} onClick={() => onStart(shown)}>{shown.length === 0 ? '풀 문제가 없어요' : `📝 ${Math.min(shown.length, CORE_N)}문제 다시 풀기`}</button>
      </div></div>
    </>
  )
}
