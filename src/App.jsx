import { useRef, useState } from 'react'
import { CUR, SUBJECTS } from './curriculum.js'
import { BANK } from './bank.js'

const MAX_UNITS = 3
const KEY = 'koreanQuizRecords3'
const CORE_N = 20
const TYPE = { c: '4지선다', ox: 'O/X', s: '주관식' }
const norm = (v) => String(v).replace(/\s/g, '')
const shuffle = (a) => {
  const b = [...a]
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[b[i], b[j]] = [b[j], b[i]]
  }
  return b
}
const isRight = (q, v) => (q.t === 's' ? q.a.some((x) => norm(x) === norm(v)) : v === q.a)
const answerText = (q) => (q.t === 'c' ? `${'①②③④'[q.a]} ${q.o[q.a]}` : q.t === 'ox' ? (q.a ? 'O' : 'X') : q.a[0])
const fmt = (at) => new Date(at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })
const prep = (q, unit) => {
  if (q.t !== 'c') return { ...q, unit }
  const opts = shuffle(q.o.map((text, i) => ({ text, ok: i === q.a })))
  return { ...q, unit, o: opts.map((o) => o.text), a: opts.findIndex((o) => o.ok) }
}
const bankOf = (sj, g, s, i) => BANK[`${sj}-${g}-${s}-${i}`] || []
const unitQs = (sj, g, s, i) => shuffle(bankOf(sj, g, s, i)).map((q) => prep(q, CUR[sj][g][s][i]))
const coreQs = (sj, g, s) => {
  const lists = CUR[sj][g][s].map((_, i) => unitQs(sj, g, s, i)).filter((l) => l.length)
  const out = []
  for (let k = 0; out.length < CORE_N && lists.some((l) => l[k]); k++) lists.forEach((l) => { if (l[k] && out.length < CORE_N) out.push(l[k]) })
  return shuffle(out)
}
const PER_SLIDE = 3
const SHOW_NOTICE = false // 안내 팝업 임시 비활성화 (다시 켜려면 true)
const NOTICE_KEY = 'koreanQuizNoticeHide'
const today = () => new Date().toDateString()
const noticeHidden = () => { try { return localStorage.getItem(NOTICE_KEY) === today() } catch { return false } }
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] } }
const NOTE_KEY = 'koreanQuizNotes1'
const loadNotes = () => { try { return JSON.parse(localStorage.getItem(NOTE_KEY)) || [] } catch { return [] } }
const saveNotes = (n) => { try { localStorage.setItem(NOTE_KEY, JSON.stringify(n)) } catch { /* 저장 불가 시 무시 */ } }
const save = (r) => { try { localStorage.setItem(KEY, JSON.stringify(r)) } catch { /* 저장 불가 시 무시 */ } }

export default function App() {
  const [tab, setTab] = useState('learn')
  const [subj, setSubj] = useState('kor')
  const [grade, setGrade] = useState(1)
  const [sem, setSem] = useState(1)
  const [mode, setMode] = useState('unit')
  const [picked, setPicked] = useState([])
  const [run, setRun] = useState(null)
  const [text, setText] = useState('')
  const [records, setRecords] = useState(load)
  const [notes, setNotes] = useState(loadNotes)
  const [noteGrade, setNoteGrade] = useState('all')
  const unitsRef = useRef(null)
  const [uIdx, setUIdx] = useState(0)
  const [notice, setNotice] = useState(() => SHOW_NOTICE && !noticeHidden())

  const units = CUR[subj][grade][sem]
  const counts = units.map((_, i) => bankOf(subj, grade, sem, i).length)
  const coreTotal = Math.min(CORE_N, counts.reduce((a, b) => a + b, 0))
  const coreBest = (g, s) => records.filter((r) => r.subj === subj && r.g === g && r.s === s && r.kind === 'core').reduce((m, r) => Math.max(m, r.score), -1)
  const reset = () => {
    setPicked([]); setRun(null); setText(''); setUIdx(0)
    if (unitsRef.current) unitsRef.current.scrollTo({ left: 0 })
  }
  const onUnitScroll = (e) => {
    const el = e.currentTarget
    const pages = Math.ceil(units.length / PER_SLIDE)
    setUIdx(Math.min(pages - 1, Math.round(el.scrollLeft / el.clientWidth)))
  }
  const hideNoticeToday = () => {
    try { localStorage.setItem(NOTICE_KEY, today()) } catch { /* 저장 불가 시 무시 */ }
    setNotice(false)
  }
  const goUnit = (i) => unitsRef.current && unitsRef.current.children[i].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
  const pickGrade = (g) => { setGrade(g); reset() }
  const pickSubj = (sj) => { setSubj(sj); reset() }
  const pickSem = (s) => { setSem(s); reset() }
  const toggle = (i) => setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : p.length < MAX_UNITS ? [...p, i] : p))

  const begin = (qs, label, kind, retry = false) => {
    setText('')
    setRun({ qs, i: 0, ans: null, ok: null, score: 0, wrongs: [], finished: false, retry, saved: false, label, kind })
  }
  const startCore = () => begin(coreQs(subj, grade, sem), '학기 핵심 문제', 'core')
  const startUnits = () => {
    const order = [...picked].sort((a, b) => a - b)
    begin(order.flatMap((i) => unitQs(subj, grade, sem, i)), order.map((i) => units[i]).join(', '), 'unit')
  }
  const updateNotes = (fn) => setNotes((p) => { const n = fn(p); saveNotes(n); return n })
  const delNote = (key) => updateNotes((p) => p.filter((x) => x.key !== key))
  const startNotes = (list) => begin(
    shuffle(list).slice(0, CORE_N).map((nt) => ({ ...prep(nt.q, nt.unit), _ctx: { subj: nt.subj, g: nt.g, s: nt.s } })),
    '오답노트 복습', 'note')
  const submit = (v) => {
    const q = run.qs[run.i]
    const ok = isRight(q, v)
    const ctx = q._ctx || { subj, g: grade, s: sem }
    const key = `${ctx.subj}|${ctx.g}|${ctx.s}|${q.q}`
    if (ok) updateNotes((p) => (p.some((x) => x.key === key) ? p.filter((x) => x.key !== key) : p))
    else updateNotes((p) => (p.some((x) => x.key === key) ? p : [{ key, ...ctx, unit: q.unit, at: Date.now(), q: { t: q.t, q: q.q, o: q.o, a: q.a, e: q.e } }, ...p].slice(0, 300)))
    setRun({ ...run, ans: v, ok, score: run.score + (ok ? 1 : 0), wrongs: ok ? run.wrongs : [...run.wrongs, q] })
  }
  const next = () => {
    setText('')
    if (run.i + 1 < run.qs.length) return setRun({ ...run, i: run.i + 1, ans: null, ok: null })
    let saved = false
    if (!run.retry && run.kind !== 'note') {
      const r = [...records, { subj, g: grade, s: sem, kind: run.kind, label: run.label, score: run.score, total: run.qs.length, at: Date.now() }]
      setRecords(r); save(r); saved = true
    }
    setRun({ ...run, finished: true, saved })
  }
  const quit = () => { if (window.confirm('풀이를 그만할까요? (점수는 저장되지 않아요)')) setRun(null) }
  const clearAll = () => { if (window.confirm('저장된 점수 기록을 모두 지울까요?')) { setRecords([]); save([]) } }

  /* ---------- 문제 풀이 화면 ---------- */
  if (run && !run.finished) {
    const q = run.qs[run.i]
    const answered = run.ok !== null
    const cls = (k) => 'opt' + (answered ? (k === q.a ? ' right' : k === run.ans ? ' wrong' : '') : '')
    const oxCls = (v) => 'ox-b' + (answered ? (v === q.a ? ' right' : v === run.ans ? ' wrong' : '') : '')
    return (
      <div className="app quiz" data-subject={subj}>
        <header className="qbar">
          <button className="icon" onClick={quit} aria-label="그만하기">✕</button>
          <div className="progress"><span style={{ width: `${((run.i + (answered ? 1 : 0)) / run.qs.length) * 100}%` }} /></div>
          <span className="count">{run.i + 1}/{run.qs.length}</span>
        </header>
        <main className="qbody">
          <p className="tags"><span>{run.retry ? '다시 풀기' : q.unit}</span><span>{TYPE[q.t]}</span></p>
          <h2 className="qtext">{q.q}</h2>
          {q.t === 'c' && (
            <div className="opts">
              {q.o.map((o, k) => (
                <button key={k} className={cls(k)} disabled={answered} onClick={() => submit(k)}><i>{k + 1}</i>{o}</button>
              ))}
            </div>
          )}
          {q.t === 'ox' && (
            <div className="ox">
              {[true, false].map((v) => (
                <button key={String(v)} className={oxCls(v)} disabled={answered} onClick={() => submit(v)}>{v ? 'O' : 'X'}</button>
              ))}
            </div>
          )}
          {q.t === 's' && (
            <form className="short" onSubmit={(e) => { e.preventDefault(); if (!answered && text.trim()) submit(text) }}>
              <input value={text} onChange={(e) => setText(e.target.value)} disabled={answered} placeholder="정답을 입력하세요" aria-label="정답 입력" autoFocus />
              <button className="btn" type="submit" disabled={answered || !text.trim()}>확인</button>
            </form>
          )}
        </main>
        {answered && (
          <div className={'sheet ' + (run.ok ? 'ok' : 'no')} role="status">
            <div className="sheet-in">
              <b>{run.ok ? '🎉 정답이에요!' : '😢 아쉬워요'}</b>
              {!run.ok && <p>정답: <strong>{answerText(q)}</strong></p>}
              <p className="why">{q.e}</p>
              <button className="btn block" onClick={next}>{run.i + 1 >= run.qs.length ? '결과 보기' : '다음 문제'}</button>
            </div>
          </div>
        )}
      </div>
    )
  }

  /* ---------- 결과 화면 ---------- */
  if (run && run.finished) {
    const C = 2 * Math.PI * 54
    const pct = run.score / run.qs.length
    return (
      <div className="app" data-subject={subj}>
        <main className="result">
          <p className="sub">{run.kind === 'note' ? '오답노트' : `${SUBJECTS[subj]} ${grade}학년 ${sem}학기`} · {run.retry ? '틀린 문제 다시 풀기' : run.label}</p>
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
          {run.wrongs.length > 0 && <button className="btn block no" onClick={() => begin(shuffle(run.wrongs), run.label, run.kind, true)}>🔁 틀린 {run.wrongs.length}문제만 다시 풀기</button>}
          <button className="btn block ghost" onClick={() => setRun(null)}>홈으로</button>
        </div></div>
      </div>
    )
  }

  /* ---------- 홈 / 기록 ---------- */
  const n = picked.length
  return (
    <div className="app" data-subject={subj}>
      <header className="appbar">
        <div className="subj" role="group" aria-label="과목 선택">
          {Object.entries(SUBJECTS).map(([k, v]) => <button key={k} aria-pressed={subj === k} onClick={() => pickSubj(k)}>{v}</button>)}
        </div>
        <span className="sub">{tab === 'learn' ? `${grade}학년 ${sem}학기${subj === 'mor' && grade < 3 ? ' · 바른 생활' : ''}` : tab === 'note' ? '오답노트' : '내 학습 기록'}</span>
      </header>

      {tab === 'learn' && (
        <main className="page">
          <section className="hero"><b>{SUBJECTS[subj]} · {grade}학년 {sem}학기{subj === 'mor' && grade < 3 ? ' (바른 생활)' : ''}</b></section>
          <section className="sel">
            <div className="sel-row"><span className="lbl">학년</span>
              <div className="grades" role="group" aria-label="학년 선택">
                {[1, 2, 3, 4, 5, 6].map((g) => <button key={g} aria-pressed={g === grade} onClick={() => pickGrade(g)}><b>{g}</b><small>학년</small></button>)}
              </div>
            </div>
            <div className="sel-row"><span className="lbl">학기</span>
              <div className="seg" role="group" aria-label="학기 선택">
                {[1, 2].map((s) => <button key={s} aria-pressed={s === sem} onClick={() => pickSem(s)}>{s}학기</button>)}
              </div>
            </div>
            <div className="sel-row"><span className="lbl">방식</span>
              <div className="seg alt" role="group" aria-label="학습 방식">
                <button aria-pressed={mode === 'unit'} onClick={() => setMode('unit')}>단원별 학습</button>
                <button aria-pressed={mode === 'core'} onClick={() => { setMode('core'); setPicked([]) }}>학기 핵심 20문제</button>
              </div>
            </div>
          </section>

          {mode === 'core' ? (
            <section className="card">
              <h2>학기 핵심 문제</h2>
              <p className="sub">{coreTotal === 0 ? '이 학기의 문제는 준비 중이에요.' : `모든 단원에서 골고루 뽑은 핵심 ${coreTotal}문제로 한 학기를 점검해요.`}</p>
              <ul className="ulist">{units.map((u, i) => counts[i] > 0 && <li key={i}><span>{i + 1}</span>{u}<em>{counts[i]}문제</em></li>)}</ul>
              {coreBest(grade, sem) >= 0 && <p className="best">🏅 최고 점수 {coreBest(grade, sem)}/{CORE_N}</p>}
            </section>
          ) : (
            <section>
              <p className="sub row"><span>옆으로 밀어 전체 {units.length}개 단원을 보고, 1~{MAX_UNITS}개 고르세요</span><b>{n}/{MAX_UNITS}</b></p>
              <div className="units" ref={unitsRef} onScroll={onUnitScroll}>
                {Array.from({ length: Math.ceil(units.length / PER_SLIDE) }, (_, p) => (
                  <div key={p} className="slide">
                    {units.slice(p * PER_SLIDE, p * PER_SLIDE + PER_SLIDE).map((u, k) => {
                      const i = p * PER_SLIDE + k
                      const on = picked.includes(i)
                      const cnt = counts[i]
                      return (
                        <button key={i} className={'unit' + (on ? ' on' : '')} aria-pressed={on} disabled={cnt === 0 || (!on && n >= MAX_UNITS)} onClick={() => toggle(i)}>
                          <span className="check">{on ? '✓' : i + 1}</span>
                          <span className="uname">{u}<small>{cnt > 0 ? `${cnt}문제` : '준비 중'}</small></span>
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
              <div className="dots" aria-label="슬라이드 위치">
                {Array.from({ length: Math.ceil(units.length / PER_SLIDE) }, (_, p) => <button key={p} className={p === uIdx ? 'on' : ''} aria-label={`${p + 1}번째 슬라이드`} onClick={() => goUnit(p)} />)}
              </div>
            </section>
          )}
        </main>
      )}

      {tab === 'note' && (() => {
        const mine = notes.filter((x) => x.subj === subj)
        const shown = noteGrade === 'all' ? mine : mine.filter((x) => x.g === noteGrade)
        return (
          <main className="page">
            <section className="hero"><small>{SUBJECTS[subj]} 오답노트</small><b>틀린 문제 {mine.length}개</b></section>
            <div className="grades nf" role="group" aria-label="학년 필터">
              {['all', 1, 2, 3, 4, 5, 6].map((g) => (
                <button key={g} aria-pressed={noteGrade === g} onClick={() => setNoteGrade(g)}>{g === 'all' ? <b>전체</b> : <><b>{g}</b><small>학년</small></>}</button>
              ))}
            </div>
            {shown.length === 0 ? <p className="sub empty">틀린 문제가 없어요. 🎉<br />문제를 풀다 틀리면 여기에 모여요.</p> : (
              <>
                <p className="sub">다시 풀어서 맞히면 오답노트에서 자동으로 사라져요.</p>
                {shown.map((nt) => (
                  <div key={nt.key} className="note">
                    <div className="note-top"><span className="meta">{nt.g}학년 {nt.s}학기 · {nt.unit}</span><button className="del" onClick={() => delNote(nt.key)} aria-label="오답노트에서 삭제">✕</button></div>
                    <b>{nt.q.q}</b>
                    <p>정답: <strong>{answerText(nt.q)}</strong></p>
                    <p className="why">{nt.q.e}</p>
                  </div>
                ))}
              </>
            )}
          </main>
        )
      })()}

      {tab === 'rec' && (
        <main className="page">
          <section className="card">
            <h2>{SUBJECTS[subj]} · 학기 핵심 문제 최고 점수</h2>
            <div className="grid">
              {[1, 2, 3, 4, 5, 6].flatMap((g) => [1, 2].map((s) => (
                <div key={g + '-' + s} className="cell"><small>{g}-{s}</small><b>{coreBest(g, s) < 0 ? '-' : coreBest(g, s)}</b></div>
              )))}
            </div>
          </section>
          <section className="card">
            <h2>최근 기록</h2>
            {records.length === 0 ? <p className="sub">아직 저장된 기록이 없어요.</p> : (
              <ul className="hist">
                {[...records].reverse().slice(0, 15).map((r, k) => (
                  <li key={k}><div><b>{SUBJECTS[r.subj || 'kor']} {r.g}학년 {r.s}학기</b><small>{fmt(r.at)} · {r.label}</small></div><strong>{r.score}/{r.total}</strong></li>
                ))}
              </ul>
            )}
            {records.length > 0 && <button className="btn ghost block" onClick={clearAll}>기록 지우기</button>}
          </section>
        </main>
      )}

      {tab === 'note' && (() => {
        const mine = notes.filter((x) => x.subj === subj)
        const shown = noteGrade === 'all' ? mine : mine.filter((x) => x.g === noteGrade)
        return (
          <div className="cta"><div className="cta-in">
            <button className="btn block" disabled={shown.length === 0} onClick={() => startNotes(shown)}>{shown.length === 0 ? '풀 문제가 없어요' : `📝 ${Math.min(shown.length, CORE_N)}문제 다시 풀기`}</button>
          </div></div>
        )
      })()}

      {tab === 'learn' && (
        <div className="cta"><div className="cta-in">
          {mode === 'core'
            ? <button className="btn block" disabled={coreTotal === 0} onClick={startCore}>{coreTotal === 0 ? '문제 준비 중' : `핵심 ${coreTotal}문제 시작하기`}</button>
            : <button className="btn block" disabled={n === 0} onClick={startUnits}>{n === 0 ? '단원을 선택해 주세요' : `${n}개 단원 · ${picked.reduce((a, i) => a + counts[i], 0)}문제 시작하기`}</button>}
        </div></div>
      )}

      <nav className="tabbar">
        <button aria-current={tab === 'learn'} onClick={() => setTab('learn')}><span>📖</span>학습</button>
        <button aria-current={tab === 'note'} onClick={() => setTab('note')}><span>📝</span>오답노트{notes.length > 0 && <i className="bdg">{notes.length > 99 ? '99+' : notes.length}</i>}</button>
        <button aria-current={tab === 'rec'} onClick={() => setTab('rec')}><span>📊</span>기록</button>
      </nav>

      {notice && (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="noticeTitle">
          <div className="modal-card">
            <h2 id="noticeTitle">📢 안내</h2>
            <p>교육과정 개정(2022 개정)에 따라 단원과 순서가 달라, 실제 교과서와 다를 수 있습니다.</p>
            <p className="sub">이 앱의 문제는 학습 주제를 바탕으로 직접 만든 문제예요.</p>
            <div className="modal-btns">
              <button className="btn ghost" onClick={hideNoticeToday}>오늘 하루 안 보기</button>
              <button className="btn" onClick={() => setNotice(false)}>확인</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
