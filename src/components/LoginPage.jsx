import { useState } from 'react'
import { signIn } from '../lib/auth.js'

const REMEMBER_ID_KEY = 'study.remembered-email'

function readRememberedEmail() {
  try { return window.localStorage.getItem(REMEMBER_ID_KEY) || '' } catch { return '' }
}

export default function LoginPage({ onLogin, notice = '' }) {
  const [id, setId] = useState(readRememberedEmail)
  const [rememberId, setRememberId] = useState(() => Boolean(readRememberedEmail()))
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
            <input type="email" value={id} onChange={(e) => {
              const value = e.target.value
              setId(value)
              setErr('')
              if (rememberId) {
                try {
                  if (value) window.localStorage.setItem(REMEMBER_ID_KEY, value)
                  else window.localStorage.removeItem(REMEMBER_ID_KEY)
                } catch {}
              }
            }} autoComplete="username" autoCapitalize="none" autoFocus required />
          </label>
          <label className="field">비밀번호
            <input type="password" value={pw} onChange={(e) => { setPw(e.target.value); setErr('') }} autoComplete="current-password" required />
          </label>
          <label className="remember-id">
            <input type="checkbox" checked={rememberId} onChange={(e) => {
              const checked = e.target.checked
              setRememberId(checked)
              try {
                if (checked && id) window.localStorage.setItem(REMEMBER_ID_KEY, id)
                else window.localStorage.removeItem(REMEMBER_ID_KEY)
              } catch {}
            }} />
            <span>아이디(이메일) 기억하기</span>
          </label>
          {notice && <p className="sub" role="status">{notice}</p>}
          {err && <p className="err" role="alert">{err}</p>}
          <button className="btn block" type="submit" disabled={!id || !pw || loading}>{loading ? '로그인 중…' : '로그인'}</button>
        </form>
      </main>
    </div>
  )
}
