import { SUBJECTS, unitsOf, editionLabel } from '../curriculum.js'
import { CORE_N, bankOf, gsLabel } from '../lib/quiz.js'
import UnitCarousel from './UnitCarousel.jsx'

export default function LearnPage({ subj, grade, sem, ed, editions, mode, picked, coreBest, streak, doneToday, onDaily, focusUnit, onGrade, onSem, onEdition, onMode, onToggle, onStartCore, onStartUnits }) {
  const eng = subj === 'eng'
  const units = unitsOf(subj, grade, sem, ed)
  const counts = units.map((_, i) => bankOf(subj, grade, sem, i, ed).length)
  const coreTotal = Math.min(CORE_N, counts.reduce((a, b) => a + b, 0))
  const n = picked.length
  const best = coreBest(grade, sem)
  const edLabel = eng && editions.length > 1 ? ` · ${(editions.find((e) => e.id === ed) || {}).author || ''}` : ''
  return (
    <>
      <main className="page">
        <button className="daily-banner" onClick={onDaily}>
          <span>⭐</span>
          <span><b>오늘의 학습</b><small>{doneToday ? '오늘 완료! 한 번 더 풀어 볼까요?' : '오늘의 20문제를 풀어 볼까요?'}</small></span>
          {streak > 0 && <em>🔥 {streak}일</em>}
        </button>
        <section className="hero"><small>지금 선택한 과정</small><b>{SUBJECTS[subj]} · {gsLabel(subj, grade, sem)}{eng ? edLabel : ''}{subj === 'mor' && grade < 3 ? ' (바른 생활)' : ''}</b></section>
        <section className="sel">
          <div className="sel-row"><span className="lbl">학년</span>
            <div className="grades" role="group" aria-label="학년 선택">
              {[1, 2, 3, 4, 5, 6].map((g) => <button key={g} aria-pressed={g === grade} disabled={eng && g < 3} onClick={() => onGrade(g)}><b>{g}</b><small>학년</small></button>)}
            </div>
          </div>
          {eng ? (
            <div className="sel-row"><span className="lbl">교과서</span>
              <div className="eds" role="group" aria-label="교과서 선택">
                {editions.map((e) => <button key={e.id} aria-pressed={e.id === ed} onClick={() => onEdition(e.id)}>{editionLabel(e)}</button>)}
              </div>
            </div>
          ) : (
            <div className="sel-row"><span className="lbl">학기</span>
              <div className="seg" role="group" aria-label="학기 선택">
                {[1, 2].map((s) => <button key={s} aria-pressed={s === sem} onClick={() => onSem(s)}>{s}학기</button>)}
              </div>
            </div>
          )}
          <div className="sel-row"><span className="lbl">방식</span>
            <div className="seg alt" role="group" aria-label="학습 방식">
              <button aria-pressed={mode === 'unit'} onClick={() => onMode('unit')}>단원별 학습</button>
              <button aria-pressed={mode === 'core'} onClick={() => onMode('core')}>{eng ? '핵심 20문제' : '학기 핵심 20문제'}</button>
            </div>
          </div>
        </section>

        {mode === 'core' ? (
          <section className="card">
            <h2>{eng ? '핵심 문제' : '학기 핵심 문제'}</h2>
            <p className="sub">{coreTotal === 0 ? '이 과정의 문제는 준비 중이에요.' : `모든 단원에서 골고루 뽑은 핵심 ${coreTotal}문제로 점검해요.`}</p>
            <ul className="ulist">{units.map((u, i) => counts[i] > 0 && <li key={i}><span>{i + 1}</span>{u}<em>{counts[i]}문제</em></li>)}</ul>
            {best >= 0 && <p className="best">🏅 최고 점수 {best}/{CORE_N}</p>}
          </section>
        ) : (
          <UnitCarousel key={`${subj}-${grade}-${sem}-${ed}`} units={units} counts={counts} picked={picked} onToggle={onToggle} focus={focusUnit} />
        )}
      </main>
      <div className="cta"><div className="cta-in">
        {mode === 'core'
          ? <button className="btn block" disabled={coreTotal === 0} onClick={onStartCore}>{coreTotal === 0 ? '문제 준비 중' : `핵심 ${coreTotal}문제 시작하기`}</button>
          : <button className="btn block" disabled={n === 0} onClick={onStartUnits}>{n === 0 ? '단원을 선택해 주세요' : `${n}개 단원 · ${picked.reduce((a, i) => a + counts[i], 0)}문제 시작하기`}</button>}
      </div></div>
    </>
  )
}
