import { useEffect, useState } from 'react'
import { checkLogin } from '../lib/auth.js'
import { fetchCatalogUnits } from '../lib/supabase.js'
import { SUBJECT_THEME } from '../lib/theme.js'
import { subjectsFor, defaultSubject, dbSubject } from '../lib/subjects.js'

export default function LoginPage({ onLogin }) {
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  // 설정: 학년·학기·과목·단원 (적용을 눌러야 로그인 후 그 값만 보여요)
  const [open, setOpen] = useState(false)
  const [grade, setGrade] = useState(1)
  const [semester, setSemester] = useState(1)
  const [subject, setSubject] = useState('통합')
  const [unitId, setUnitId] = useState('')
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(false)
  const [unitErr, setUnitErr] = useState('')
  const [applied, setApplied] = useState(null)

  useEffect(() => {
    if (!open) return undefined
    let alive = true
    setLoading(true)
    setUnitErr('')
    fetchCatalogUnits({ grade, semester, subject: dbSubject(subject) })
      .then((rows) => { if (alive) setUnits(rows) })
      .catch((e) => { if (alive) { setUnits([]); setUnitErr(e.message) } })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [open, grade, semester, subject])

  const changeGrade = (g) => { setGrade(g); setSubject(defaultSubject(g)); setUnitId('') }
  const apply = () => {
    const u = units.find((x) => String(x.id) === String(unitId))
    setApplied({ grade, semester, subject, unitId: u ? u.id : null, unitName: u ? u.unit_name : '' })
    setOpen(false)
  }
  const clear = () => { setApplied(null); setUnitId('') }
  const submit = (e) => {
    e.preventDefault()
    if (!checkLogin(id, pw)) { setErr('아이디 또는 비밀번호가 맞지 않아요.'); return }
    onLogin({ user: id.trim(), settings: applied })
  }

  return (
    <div className="app login" data-subject="kor">
      <main className="page">
        <section className="hero"><small>초등 학습</small><b>로그인</b></section>
        <form className="card login-form" onSubmit={submit}>
          <label className="field">아이디
            <input value={id} onChange={(e) => { setId(e.target.value); setErr('') }} autoComplete="username" autoCapitalize="none" autoFocus />
          </label>
          <label className="field">비밀번호
            <input type="password" value={pw} onChange={(e) => { setPw(e.target.value); setErr('') }} autoComplete="current-password" />
          </label>
          {err && <p className="err" role="alert">{err}</p>}
          <button className="btn block" type="submit" disabled={!id || !pw}>로그인</button>

          <button type="button" className="login-set-btn" aria-expanded={open} onClick={() => setOpen(!open)}>⚙ 설정</button>
          {applied && !open && (
            <p className="login-applied">
              적용된 설정: {applied.grade}학년 {applied.semester}학기 · {applied.subject}{applied.unitName ? ` · ${applied.unitName}` : ' · 전체 단원'}
              <button type="button" onClick={clear}>지우기</button>
            </p>
          )}

          {open && (
            <div className="login-panel">
              <div className="sel-row"><span className="lbl">학년</span>
                <div className="grades" role="group" aria-label="학년 선택">
                  {[1, 2, 3, 4, 5, 6].map((g) => <button type="button" key={g} aria-pressed={g === grade} onClick={() => changeGrade(g)}><b>{g}</b><small>학년</small></button>)}
                </div>
              </div>
              <div className="sel-row"><span className="lbl">학기</span>
                <div className="seg" role="group" aria-label="학기 선택">
                  {[1, 2].map((s) => <button type="button" key={s} aria-pressed={s === semester} onClick={() => { setSemester(s); setUnitId('') }}>{s}학기</button>)}
                </div>
              </div>
              <div className="sel-row"><span className="lbl">과목</span>
                <div className="subject-pills">
                  {subjectsFor(grade).map((s) => <button type="button" key={s} data-theme={SUBJECT_THEME[s]} aria-pressed={subject === s} onClick={() => { setSubject(s); setUnitId('') }}>{s}</button>)}
                </div>
              </div>
              <label className="field">단원
                <select value={unitId} onChange={(e) => setUnitId(e.target.value)} disabled={loading}>
                  <option value="">전체 단원</option>
                  {units.map((u) => <option key={u.id} value={u.id}>{u.unit_number}. {u.unit_name}</option>)}
                </select>
              </label>
              {loading && <p className="sub">단원 목록을 불러오는 중이에요.</p>}
              {!loading && unitErr && <p className="err" role="alert">{unitErr}</p>}
              {!loading && !unitErr && units.length === 0 && <p className="sub">이 조합의 단원 정보가 아직 없어요.</p>}
              <div className="login-panel-btns">
                <button type="button" className="btn ghost" onClick={() => { clear(); setOpen(false) }}>설정 안 함</button>
                <button type="button" className="btn" onClick={apply}>적용</button>
              </div>
            </div>
          )}
        </form>
      </main>
    </div>
  )
}
