import { useState } from 'react'
import { SUBJECTS, unitsOf } from '../curriculum.js'
import { bankOf } from '../lib/quiz.js'
import { checkLogin } from '../lib/auth.js'

// 문제가 있는 첫 번째 단원 번호 (없으면 -1)
const firstUnit = (sj, g, s) => unitsOf(sj, g, s).findIndex((_, i) => bankOf(sj, g, s, i).length > 0)

export default function LoginPage({ onLogin }) {
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [subj, setSubj] = useState('kor')
  const [grade, setGrade] = useState(1)
  const [sem, setSem] = useState(1)
  const [unit, setUnit] = useState(() => firstUnit('kor', 1, 1))
  const [err, setErr] = useState('')
  const units = unitsOf(subj, grade, sem)
  const pick = (s, g, m) => { setSubj(s); setGrade(g); setSem(m); setUnit(firstUnit(s, g, m)) }
  const submit = (e) => {
    e.preventDefault()
    if (!checkLogin(id, pw)) { setErr('아이디 또는 비밀번호가 맞지 않아요.'); return }
    onLogin({ user: id.trim(), subj, grade, sem, unit })
  }
  return (
    <div className="app login" data-subject={subj}>
      <main className="page">
        <section className="hero"><small>초등 국어 · 도덕</small><b>로그인</b></section>
        <form className="card login-form" onSubmit={submit}>
          <label className="field">아이디
            <input value={id} onChange={(e) => { setId(e.target.value); setErr('') }} autoComplete="username" autoCapitalize="none" autoFocus />
          </label>
          <label className="field">비밀번호
            <input type="password" value={pw} onChange={(e) => { setPw(e.target.value); setErr('') }} autoComplete="current-password" />
          </label>
          <div className="sel login-sel">
            <div className="sel-row"><span className="lbl">과목</span>
              <div className="seg" role="group" aria-label="과목 선택">
                {Object.entries(SUBJECTS).map(([k, v]) => <button type="button" key={k} aria-pressed={k === subj} onClick={() => pick(k, grade, sem)}>{v}</button>)}
              </div>
            </div>
            <div className="sel-row"><span className="lbl">학년</span>
              <div className="grades" role="group" aria-label="학년 선택">
                {[1, 2, 3, 4, 5, 6].map((g) => <button type="button" key={g} aria-pressed={g === grade} onClick={() => pick(subj, g, sem)}><b>{g}</b><small>학년</small></button>)}
              </div>
            </div>
            <div className="sel-row"><span className="lbl">학기</span>
              <div className="seg" role="group" aria-label="학기 선택">
                {[1, 2].map((s) => <button type="button" key={s} aria-pressed={s === sem} onClick={() => pick(subj, grade, s)}>{s}학기</button>)}
              </div>
            </div>
          </div>
          <label className="field">단원
            <select value={unit} onChange={(e) => setUnit(+e.target.value)}>
              <option value={-1}>단원을 고르지 않고 시작</option>
              {units.map((u, i) => {
                const cnt = bankOf(subj, grade, sem, i).length
                return <option key={i} value={i} disabled={cnt === 0}>{u}{cnt === 0 ? ' (준비 중)' : ''}</option>
              })}
            </select>
          </label>
          {err && <p className="err" role="alert">{err}</p>}
          <button className="btn block" type="submit" disabled={!id || !pw}>로그인</button>
        </form>
      </main>
    </div>
  )
}
