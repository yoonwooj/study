import { useState } from 'react'
import { signUp } from '../lib/auth.js'
export default function SignupPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [grade, setGrade] = useState('3')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [recoveryCode, setRecoveryCode] = useState('')
  const [pendingSession, setPendingSession] = useState(null)
  const [copied, setCopied] = useState(false)
  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const result = await signUp(email, password, Number(grade))
      setRecoveryCode(result.recoveryCode)
      setPendingSession(result.session || null)
    } catch (e) { setError(e.message || '회원가입에 실패했습니다.') }
    finally { setLoading(false) }
  }
  const copyCode = async () => {
    try { await navigator.clipboard.writeText(recoveryCode); setCopied(true) }
    catch { setCopied(false) }
  }
  if (recoveryCode) return (
    <div className="app login" data-subject="kor"><main className="page">
      <section className="hero"><small>ACCOUNT SECURITY</small><b>복구 코드 보관</b></section>
      <section className="card login-form">
        <p className="sub">회원가입이 접수되었습니다. 이 코드는 아이디를 잊었을 때 가입 이메일을 확인하는 데 사용합니다.</p>
        <div style={{ padding: 18, borderRadius: 14, background: '#f1f5ff', textAlign: 'center', margin: '12px 0' }}>
          <strong style={{ display: 'block', fontSize: 20, letterSpacing: 1.2, lineHeight: 1.8, overflowWrap: 'anywhere' }}>{recoveryCode}</strong>
        </div>
        <p className="err">복구 코드는 지금 한 번만 표시됩니다. 종이나 비밀번호 관리자에 저장하세요. 이 화면을 닫으면 다시 볼 수 없습니다.</p>
        <button className="btn block" type="button" onClick={copyCode}>{copied ? '복사 완료' : '복구 코드 복사'}</button>
        {pendingSession
          ? <button className="btn block" type="button" style={{ marginTop: 10 }} onClick={() => onLogin({ session: pendingSession, user: pendingSession.user.email })}>저장 완료 · 학습 시작</button>
          : <a className="btn block" style={{ display: 'block', textAlign: 'center', marginTop: 10, textDecoration: 'none' }} href="/">이메일 인증 후 로그인하기</a>}
      </section>
    </main></div>
  )
  return (
    <div className="app login" data-subject="kor"><main className="page">
      <section className="hero"><small>초등 학습</small><b>회원가입</b></section>
      <form className="card login-form" onSubmit={submit}>
        <label className="field">이메일
          <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError('') }} autoComplete="email" autoCapitalize="none" required />
        </label>
        <label className="field">비밀번호
          <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError('') }} autoComplete="new-password" minLength={8} required />
        </label>
        <label className="field">학년
          <select value={grade} onChange={(e) => setGrade(e.target.value)}>{[1,2,3,4,5,6].map((g) => <option key={g} value={g}>{g}학년</option>)}</select>
        </label>
        {error && <p className="err" role="alert">{error}</p>}
        <p className="sub">가입 완료 후 아이디 찾기에 사용할 복구 코드를 발급합니다. 코드를 꼭 보관해 주세요.</p>
        <button className="btn block" type="submit" disabled={!email || password.length < 8 || loading}>{loading ? '가입 처리 중…' : '회원가입'}</button>
      </form>
    </main></div>
  )
}
