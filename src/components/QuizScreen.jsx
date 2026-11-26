import { TYPE, answerText } from '../lib/quiz.js'

export default function QuizScreen({ run, subj, text, onText, onSubmit, onNext, onQuit, submitting = false, submitError = '' }) {
  const q = run.qs[run.i]
  const answered = run.ok !== null
  const correctIndex = run.serverBacked ? run.correctAnswerIndex : q.a
  const correctValue = run.serverBacked ? run.correctAnswerValue : q.a
  const mark = (right, picked) => (answered ? (right ? ' right' : picked ? ' wrong' : '') : '')
  return (
    <div className="app quiz" data-subject={subj}>
      <header className="qbar">
        <button className="icon" onClick={onQuit} aria-label="그만하기">✕</button>
        <div className="progress"><span style={{ width: `${((run.i + (answered ? 1 : 0)) / run.qs.length) * 100}%` }} /></div>
        <span className="count">{run.i + 1}/{run.qs.length}</span>
      </header>
      <main className="qbody">
        <p className="tags"><span>{run.previewOnly ? q.unit : run.retry ? '다시 풀기' : q.unit}</span><span>{TYPE[q.t]}</span></p>
        <h2 className="qtext">{q.q}</h2>
        {q.t === 'c' && (
          <div className="opts">
            {q.o.map((o, k) => (
              <button key={k} className={'opt' + mark(k === correctIndex, k === run.ans)} disabled={answered || submitting} onClick={() => onSubmit(k)}><i>{k + 1}</i>{o}</button>
            ))}
          </div>
        )}
        {q.t === 'ox' && (
          <div className="ox">
            {[true, false].map((v) => (
              <button key={String(v)} className={'ox-b' + mark(v === correctValue, v === run.ans)} disabled={answered || submitting} onClick={() => onSubmit(v)}>{v ? 'O' : 'X'}</button>
            ))}
          </div>
        )}
        {q.t === 's' && (
          <form className="short" onSubmit={(e) => { e.preventDefault(); if (!answered && text.trim()) onSubmit(text) }}>
            <input value={text} onChange={(e) => onText(e.target.value)} disabled={answered || submitting} placeholder="정답을 입력하세요" aria-label="정답 입력" autoFocus />
            <button className="btn" type="submit" disabled={answered || submitting || !text.trim()}>확인</button>
          </form>
        )}
      </main>
      {submitError && <p className="err" role="alert">{submitError}</p>}
      {submitting && <p className="sub" role="status">정답을 확인하고 있어요…</p>}
      {answered && (
        <div className={'sheet ' + (run.ok ? 'ok' : 'no')} role="status">
          <div className="sheet-in">
            <b>{run.ok ? '🎉 정답이에요!' : '😢 아쉬워요'}</b>
            {!run.ok && <p>정답: <strong>{run.serverBacked ? run.correctAnswerText : answerText(q)}</strong></p>}
            <p className="why">{run.serverBacked ? run.explanation : q.e}</p>
            <button className="btn block" onClick={onNext}>{run.i + 1 >= run.qs.length ? '결과 보기' : '다음 문제'}</button>
          </div>
        </div>
      )}
    </div>
  )
}
