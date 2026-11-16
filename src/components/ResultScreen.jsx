import { SUBJECTS } from '../curriculum.js'
import { answerText, gsLabel } from '../lib/quiz.js'

export default function ResultScreen({ run, subj, grade, sem, onRetryWrong, onHome }) {
  const C = 2 * Math.PI * 54
  const pct = run.score / run.qs.length
  return (
    <div className="app" data-subject={subj}>
      <main className="result">
        <p className="sub">{run.kind === 'note' ? '오답노트' : run.kind === 'daily' ? '오늘의 학습' : `${SUBJECTS[subj]} ${gsLabel(subj, grade, sem)}`} · {run.retry ? '틀린 문제 다시 풀기' : run.label}</p>
        <svg viewBox="0 0 120 120" className="ring-wrap" role="img" aria-label={`${run.qs.length}문제 중 ${run.score}문제 정답`}>
          <circle cx="60" cy="60" r="54" className="ring-bg" />
          <circle cx="60" cy="60" r="54" className="ring" strokeDasharray={`${C * pct} ${C}`} transform="rotate(-90 60 60)" />
          <text x="60" y="58" className="r-score">{run.score}/{run.qs.length}</text>
          <text x="60" y="78" className="r-label">{Math.round(pct * 100)}점</text>
        </svg>
        <p className="msg">{pct === 1 ? '모두 맞혔어요! 최고예요 🏆' : pct >= 0.7 ? '잘했어요! 조금만 더 힘내요 👍' : '틀린 문제를 다시 확인해 봐요 💪'}</p>
        <p className="sub">{run.saved ? '✅ 점수가 저장되었어요.' : '다시 풀기 점수는 저장되지 않아요.'}</p>
        {run.wrongs.length > 0 && (
          <section className="wrongs">
            <h3>틀린 문제 {run.wrongs.length}개</h3>
            {run.wrongs.map((w, k) => (
              <div key={k} className="w"><b>{w.q}</b><p>정답: <strong>{answerText(w)}</strong></p><p className="why">{w.e}</p></div>
            ))}
          </section>
        )}
      </main>
      <div className="cta flat"><div className="cta-in col">
        {run.wrongs.length > 0 && <button className="btn block no" onClick={onRetryWrong}>🔁 틀린 {run.wrongs.length}문제만 다시 풀기</button>}
        <button className="btn block ghost" onClick={onHome}>홈으로</button>
      </div></div>
    </div>
  )
}
