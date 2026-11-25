import { useEffect, useRef, useState } from 'react'
import { readLoginIdFromMagicLink, requestIdLookupLink } from '../lib/auth.js'

export default function FindIdPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [loginId, setLoginId] = useState('')
  const [error, setError] = useState('')
  const processingMagicLink = useRef(false)

  useEffect(() => {
    let active = true
    if (processingMagicLink.current) return () => { active = false }
    processingMagicLink.current = true
    readLoginIdFromMagicLink()
      .then((found) => { if (active && found) { setLoginId(found); setSent(false) } })
      .catch((e) => { if (active) setError(e.message || '이메일 인증에 실패했습니다.') })
    return () => { active = false }
  }, [])

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setLoginId('')
    try {
      await requestIdLookupLink(email)
      setSent(true)
    } catch {
      // 계정 존재 여부가 노출되지 않도록 동일한 안내를 표시합니다.
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app login account-center" data-subject="kor">
      <main className="page account-page">
        <section className="hero">
          <small>ACCOUNT HELP</small>
          <b>아이디 찾기</b>
        </section>
        <section className="card login-form account-card">
          {loginId ? (
            <>
              <p className="sub">이메일 인증이 완료되었습니다. 회원가입 때 설정한 로그인 아이디입니다.</p>
              <p className="account-found-id" role="status">{loginId}</p>
            </>
          ) : sent ? (
            <p className="sub account-message" role="status">
              입력한 이메일로 계정이 확인되면 아이디 확인 링크를 보내드립니다. 받은편지함과 스팸함을 확인해 주세요.
            </p>
          ) : (
            <>
              <p className="sub">회원가입 때 등록한 이메일 주소를 입력해 주세요. 해당 이메일로 인증 링크를 보내드립니다.</p>
              <form onSubmit={submit}>
                <label className="field">가입 이메일
                  <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError('') }} autoComplete="email" autoCapitalize="none" placeholder="가입한 이메일 주소" required />
                </label>
                <button className="btn block" type="submit" disabled={!email.trim() || loading}>{loading ? '메일 요청 중…' : '인증 메일 보내기'}</button>
              </form>
            </>
          )}
          {error && <p className="err" role="alert">{error}</p>}
          <a className="account-back-link" href="/">로그인으로 돌아가기</a>
        </section>
      </main>
    </div>
  )
}
