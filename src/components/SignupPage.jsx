import { useState } from 'react'
import { signUp } from '../lib/auth.js'

export default function SignupPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState(() => {
    try { return window.sessionStorage.getItem('study.pending-guardian-phone') || '' } catch { return '' }
  })
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailConfirmation, setEmailConfirmation] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!/^01[016789]\\d{7,8}$/.test(phone.replace(/[^0-9]/g, ''))) return setError('보호자 휴대폰 번호를 정확히 입력해 주세요.')
    if (password !== passwordConfirm) return setError('비밀번호가 서로 일치하지 않습니다.')
    if (!agreed) return setError('서비스 이용 및 개인정보 처리에 동의해 주세요.')
    setLoading(true)
    try {
      try { window.sessionStorage.setItem('study.pending-guardian-phone', phone.replace(/[^0-9]/g, '')) } catch {}
      const result = await signUp(email, password)
      if (result.session) {
        await onLogin({ session: result.session, user: result.session.user.email })
        window.location.replace('/payment')
      } else {
        setEmailConfirmation(true)
      }
    } catch (e) {
      setError(e.message || '회원가입에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (emailConfirmation) {
    return (
      <div className="app login" data-subject="kor">
        <main className="page signup-page">
          <section className="hero signup-hero">
            <small>WELCOME</small>
            <b>이메일을 확인해 주세요</b>
            <p>보호자 계정 등록이 접수되었습니다.</p>
          </section>
          <section className="card login-form signup-card signup-confirm-card">
            <div className="signup-success-icon" aria-hidden="true">✉</div>
            <h2>인증 메일을 보냈어요</h2>
            <p className="sub"><strong>{email}</strong> 주소로 발송된 인증 링크를 눌러 가입을 완료해 주세요.</p>
            <p className="signup-note">이메일 인증 후 로그인하면 휴대폰 번호가 다음 단계에 이어지고, 자녀 정보 등록과 14일 무료 체험을 시작할 수 있습니다.</p>
            <a className="btn block signup-link" href="/">로그인 화면으로 이동</a>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="app login" data-subject="kor">
      <main className="page signup-page">
        <section className="hero signup-hero">
          <small>GUARDIAN ACCOUNT</small>
          <b>보호자 회원가입</b>
          <p>먼저 계정을 만들고, 다음 단계에서 자녀 정보와 무료 체험을 등록해요.</p>
          <div className="signup-trial"><strong>14일 무료 체험</strong><span>카드 등록 없이 시작</span></div>
        </section>

        <form className="card login-form signup-card" onSubmit={submit}>
          <div className="signup-section-title signup-grid-full">
            <span>01</span><div><strong>보호자 계정</strong><small>로그인 정보와 보호자 연락처를 입력해 주세요.</small></div>
          </div>
          <div className="signup-form-grid">
            <label className="field">보호자 이메일
              <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError('') }} autoComplete="email" autoCapitalize="none" placeholder="parent@example.com" required />
            </label>
            <label className="field">비밀번호
              <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError('') }} autoComplete="new-password" minLength={8} placeholder="8자 이상 입력" required />
            </label>
            <label className="field">보호자 휴대폰 번호\n              <input type="tel" inputMode="numeric" autoComplete="tel" value={phone} onChange={(e) => { setPhone(e.target.value.replace(/[^0-9-]/g, '').slice(0, 13)); setError('') }} placeholder="010-0000-0000" required />\n            </label>\n            <label className="field">비밀번호 확인
              <input type="password" value={passwordConfirm} onChange={(e) => { setPasswordConfirm(e.target.value); setError('') }} autoComplete="new-password" minLength={8} placeholder="비밀번호를 한 번 더 입력" required />
            </label>
          </div>

          <label className="signup-consent">
            <input type="checkbox" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setError('') }} />
            <span><strong>(필수)</strong> 계정 생성 및 서비스 제공을 위한 이메일 수집·이용과 서비스 이용약관 및 개인정보 처리방침에 동의합니다. 휴대폰 번호는 다음 단계의 체험 등록에도 이어집니다.</span>
          </label>
          {error && <p className="err" role="alert">{error}</p>}
          <button className="btn block signup-submit" type="submit" disabled={!email || !/^01[016789]\\d{7,8}$/.test(phone.replace(/[^0-9]/g, '')) || password.length < 8 || password !== passwordConfirm || !agreed || loading}>
            {loading ? '가입 처리 중…' : '다음 단계로'}
          </button>
          <nav className="login-help-links" aria-label="로그인 이동"><a href="/">이미 계정이 있으신가요? 로그인</a></nav>
        </form>
      </main>
    </div>
  )
}
