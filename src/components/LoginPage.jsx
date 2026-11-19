import { useState } from 'react'
import { signIn } from '../lib/auth.js'

export default function LoginPage({ onLogin, notice = '' }) {
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setLoading(true)
    try {
      const session = await signIn(id, pw)
      await onLogin({ session, user: session.user.email })
    } catch (error) {
      setErr(error.message || '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app login" data-subject="kor">
      <main className="page">
        <section className="hero"><small>초등 학습</small><b>로그인</b></section>
        <form className="card login-form" onSubmit={submit}>
          <label className="field">이메일
            <input type="email" value={id} onChange={(e) => { setId(e.target.value); setErr('') }} autoComplete="username" autoCapitalize="none" autoFocus required />
          </label>
          <label className="field">비밀번호
            <input type="password" value={pw} onChange={(e) => { setPw(e.target.value); setErr('') }} autoComplete="current-password" required />
          </label>
          {notice && <p className="sub" role="status">{notice}</p>}
          {err && <p className="err" role="alert">{err}</p>}
          <button className="btn block" type="submit" disabled={!id || !pw || loading}>{loading ? '로그인 중…' : '로그인'}</button>
        </form>
      </main>
    </div>
  )
}
