import { useState } from 'react'
import { signUp } from '../lib/auth.js'

export default function SignupPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [grade, setGrade] = useState('3')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const result = await signUp(email, password, Number(grade))
      if (result.needsEmailConfirmation) {
        setSuccess('가입 확인 메일을 보냈습니다. 이메일 인증을 마친 뒤 로그인해 주세요. 선택한 학년은 계정에 저장됩니다.')
      } else {
        await onLogin({ session: result.session, user: result.session.user.email })
      }
    } catch (e) {
      setError(e.message || '회원가입에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app login" data-subject="kor">
      <main className="page">
        <section className="hero"><small>초등 학습</small><b>회원가입</b></section>
        <form className="card login-form" onSubmit={submit}>
          <label className="field">이메일
            <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError('') }} autoComplete="email" autoCapitalize="none" required />
          </label>
          <label className="field">비밀번호
            <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError('') }} autoComplete="new-password" minLength={8} required />
          </label>
          <label className="field">학년
            <select value={grade} onChange={(e) => setGrade(e.target.value)}>
              {[1, 2, 3, 4, 5, 6].map((g) => <option key={g} value={g}>{g}학년</option>)}
            </select>
          </label>
          {error && <p className="err" role="alert">{error}</p>}
          {success && <p className="sub" role="status">{success}</p>}
          <button className="btn block" type="submit" disabled={!email || password.length < 8 || loading}>{loading ? '가입 처리 중…' : '회원가입'}</button>
        </form>
      </main>
    </div>
  )
}
