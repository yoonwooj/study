import { useEffect, useState } from 'react'
import { signIn, signUp } from '../lib/auth.js'
import { fetchCatalogUnits } from '../lib/supabase.js'
import { defaultSubject, dbSubject } from '../lib/subjects.js'

export default function LoginPage({ onLogin, notice = '' }) {
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [success, setSuccess] = useState('')
  const [mode, setMode] = useState('login')
  const [open, setOpen] = useState(false)
  const [grade, setGrade] = useState(1)
  const [semester, setSemester] = useState(1)
  const [unitId, setUnitId] = useState('')
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(false)
  const [unitErr, setUnitErr] = useState('')
  const [applied, setApplied] = useState(null)
  const subject = defaultSubject(grade)

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

  const changeGrade = (g) => { setGrade(g); setUnitId('') }
  const apply = () => {
    const u = units.find((x) => String(x.id) === String(unitId))
    setApplied({ grade, semester, subject, unitId: u ? u.id : null, unitName: u ? u.unit_name : '' })
    setOpen(false)
  }
  const clear = () => { setApplied(null); setUnitId('') }

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setSuccess('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        if (pw.length < 8) throw new Error('비밀번호는 8자 이상 입력해 주세요.')
        const result = await signUp(id, pw)
        if (result.needsEmailConfirmation) setSuccess('가입 확인 메일을 보냈습니다. 이메일의 인증 링크를 누른 뒤 로그인해 주세요.')
        else await onLogin({ session: result.session, user: result.session.user.email, settings: applied })
      } else {
        const session = await signIn(id, pw)
        await onLogin({ session, user: session.user.email, settings: applied })
      }
    } catch (error) {
      setErr(error.message || '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app login" data-subject="kor">
      <main className="page">
        <section className="hero"><small>초등 학습</small><b>{mode === 'signup' ? '회원가입' : '로그인'}</b></section>
        <form className="card login-form" onSubmit={submit}>
          <label className="field">이메일
            <input type="email" value={id} onChange={(e) => { setId(e.target.value); setErr(''); setSuccess('') }} autoComplete="username" autoCapitalize="none" autoFocus required />
          </label>
          <label className="field">비밀번호
            <input type="password" value={pw} onChange={(e) => { setPw(e.target.value); setErr(''); setSuccess('') }} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={mode === 'signup' ? 8 : undefined} required />
          </label>
          {notice && <p className="sub" role="status">{notice}</p>}
          {err && <p className="err" role="alert">{err}</p>}
          {success && <p className="sub" role="status">{success}</p>}
          <button className="btn block" type="submit" disabled={!id || !pw || loading}>{loading ? '처리 중…' : mode === 'signup' ? '회원가입' : '로그인'}</button>
          <button type="button" className="login-set-btn" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setErr(''); setSuccess('') }}>{mode === 'login' ? '처음 이용하시나요? 회원가입' : '이미 계정이 있나요? 로그인'}</button>
          <button type="button" className="login-set-btn" aria-expanded={open} onClick={() => setOpen(!open)}>⚙ 학습 설정</button>
          {applied && !open && (
            <p className="login-applied">
              적용된 설정: {applied.grade}학년 {applied.semester}학기{applied.unitName ? ` · ${applied.unitName}` : ' · 전체 단원'}
              <button type="button" onClick={clear}>지우기</button>
            </p>
          )}
          {open && (
            <div className="login-panel">
              <div className="sel-row"><span className="lbl">학년</span>
                <div className="grades" role="group" aria-label="학년 선택">
                  {[1, 2, 3, 4, 5, 6].map((g) => (
                    <button type="button" key={g} aria-pressed={g === grade} onClick={() => changeGrade(g)}><b>{g}</b><small>학년</small></button>
                  ))}
                </div>
              </div>
              <div className="sel-row"><span className="lbl">학기</span>
                <div className="seg" role="group" aria-label="학기 선택">
                  {[1, 2].map((s) => (
                    <button type="button" key={s} aria-pressed={s === semester} onClick={() => { setSemester(s); setUnitId('') }}>{s}학기</button>
                  ))}
                </div>
              </div>
              <div className="login-unit-row">
                <label className="lbl" htmlFor="login-unit-select">단원</label>
                <select id="login-unit-select" className="login-unit-select" value={unitId} onChange={(e) => setUnitId(e.target.value)} disabled={loading}>
                  <option value="">전체 단원</option>
                  {units.map((u) => <option key={u.id} value={u.id}>{u.unit_number}. {u.unit_name}</option>)}
                </select>
              </div>
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
