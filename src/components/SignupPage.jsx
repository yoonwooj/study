import { useState } from 'react'
import { signUp, checkLoginId } from '../lib/auth.js'

export default function SignupPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [loginId, setLoginId] = useState('')
  const [loginIdChecked, setLoginIdChecked] = useState(false)
  const [loginIdMessage, setLoginIdMessage] = useState('')
  const [checkingId, setCheckingId] = useState(false)
  const [phone, setPhone] = useState(() => {
    try { return window.sessionStorage.getItem('study.pending-guardian-phone') || '' } catch { return '' }
  })
  const [studentName, setStudentName] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [grade, setGrade] = useState('3')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailConfirmation, setEmailConfirmation] = useState(false)

  const verifyLoginId = async () => {
    setLoginIdMessage('')
    if (!/^[a-z][a-z0-9]{3,15}$/.test(loginId)) return setLoginIdMessage('영문 소문자로 시작하는 4~16자의 영문 소문자·숫자 조합으로 입력해 주세요.')
    setCheckingId(true)
    try {
      const result = await checkLoginId(loginId)
      setLoginIdChecked(result.available === true)
      setLoginIdMessage(result.available ? '사용할 수 있는 아이디입니다.' : '이미 사용 중인 아이디입니다.')
    } catch (error) { setLoginIdChecked(false); setLoginIdMessage(error.message || '중복 확인에 실패했습니다.') }
    finally { setCheckingId(false) }
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!/^[a-z][a-z0-9]{3,15}$/.test(loginId) || !loginIdChecked) return setError('로그인 아이디 중복 확인을 완료해 주세요.')
    if (!/^01[016789]\d{7,8}$/.test(phone.replace(/[^0-9]/g, ''))) return setError('보호자 휴대폰 번호를 정확히 입력해 주세요.')
    if (!studentName.trim() || !schoolName.trim()) return setError('자녀 이름과 학교를 입력해 주세요.')
    if (password !== passwordConfirm) return setError('비밀번호가 서로 일치하지 않습니다.')
    if (!agreed) return setError('서비스 이용 및 개인정보 처리에 동의해 주세요.')
    setLoading(true)
    try {
      try {
        window.sessionStorage.setItem('study.pending-guardian-phone', phone.replace(/[^0-9]/g, ''))
        window.sessionStorage.setItem('study.pending-student-name', studentName.trim())
        window.sessionStorage.setItem('study.pending-school-name', schoolName.trim())
        window.sessionStorage.setItem('study.pending-grade', grade)
      } catch {}
      const result = await signUp(email, password, loginId, 'member', { student_name: studentName.trim(), school_name: schoolName.trim(), grade })
      if (result.session) {
        await onLogin({ session: result.session, user: result.session.user.email })
        window.location.replace('/payment?mode=member')
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
          <nav className="public-top-nav" aria-label="주요 메뉴"><a href="/signup" aria-current="page">회원가입</a><a className="trial-nav-link" href="/trial">2주 체험</a></nav>
          <section className="hero signup-hero">
            <small>WELCOME</small>
            <b>이메일을 확인해 주세요</b>
            <p>보호자 계정 등록이 접수되었습니다.</p>
          </section>
          <section className="card login-form signup-card signup-confirm-card">
            <div className="signup-success-icon" aria-hidden="true">✉</div>
            <h2>인증 메일을 보냈어요</h2>
            <p className="sub"><strong>{email}</strong> 주소로 발송된 인증 링크를 눌러 가입을 완료해 주세요.</p>
            <p className="signup-note">이메일 인증을 완료한 뒤 로그인해 주세요. 입력한 보호자·자녀 정보는 2주 2주 무료 체험은 상단 메뉴에서 별도로 신청해 주세요.</p>
            <a className="btn block signup-link" href="/">로그인 화면으로 이동</a>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="app login" data-subject="kor">
      <main className="page signup-page">
        <nav className="public-top-nav" aria-label="주요 메뉴"><a href="/signup" aria-current="page">회원가입</a><a className="trial-nav-link" href="/trial">2주 체험</a></nav>
        <section className="hero signup-hero">
          <small>GUARDIAN ACCOUNT</small>
          <b>보호자 회원가입</b>
          <p>보호자와 자녀 정보를 한 번에 입력하고 계정을 만들어 주세요. 무료 체험은 로그인 후 별도로 시작할 수 있습니다.</p>
        </section>

        <form className="card login-form signup-card" onSubmit={submit}>
          <div className="signup-section-title signup-grid-full">
            <span>01</span><div><strong>보호자 정보</strong><small>로그인 정보와 보호자 연락처를 입력해 주세요.</small></div>
          </div>
          <div className="signup-form-grid">
            <div className="field">로그인 아이디
              <div className="id-check-row"><input type="text" value={loginId} onChange={(e) => { setLoginId(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0,16)); setLoginIdChecked(false); setLoginIdMessage(''); setError('') }} autoComplete="username" placeholder="예: parent123" maxLength={16} required /><button type="button" className="id-check-button" onClick={verifyLoginId} disabled={checkingId || !loginId}>{checkingId ? '확인 중' : '중복 확인'}</button></div>
              {loginIdMessage && <small className={loginIdChecked ? 'id-check-ok' : 'id-check-message'} role="status">{loginIdMessage}</small>}
              <small className="id-help">영문 소문자로 시작하는 4~16자, 영문 소문자와 숫자만 사용</small>
            </div>
            <label className="field">보호자 이메일
              <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError('') }} autoComplete="email" autoCapitalize="none" placeholder="parent@example.com" required />
            </label>
            <label className="field">비밀번호
              <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError('') }} autoComplete="new-password" minLength={8} placeholder="8자 이상 입력" required />
            </label>
            <label className="field">비밀번호 확인
              <input type="password" value={passwordConfirm} onChange={(e) => { setPasswordConfirm(e.target.value); setError('') }} autoComplete="new-password" minLength={8} placeholder="비밀번호를 한 번 더 입력" required />
            </label>
            <label className="field">보호자 휴대폰 번호
              <input type="tel" inputMode="numeric" autoComplete="tel" value={phone} onChange={(e) => { setPhone(e.target.value.replace(/[^0-9-]/g, '').slice(0, 13)); setError('') }} placeholder="010-0000-0000" required />
            </label>
          </div>

          <div className="signup-divider" />
          <div className="signup-section-title signup-grid-full">
            <span>02</span><div><strong>자녀 정보</strong><small>학습에 사용할 자녀의 정보를 입력해 주세요.</small></div>
          </div>
          <div className="signup-form-grid">
            <label className="field">학생 이름
              <input type="text" value={studentName} onChange={(e) => { setStudentName(e.target.value.slice(0, 20)); setError('') }} autoComplete="off" placeholder="학생 이름" maxLength={20} required />
            </label>
            <label className="field">학교 이름
              <input type="text" value={schoolName} onChange={(e) => { setSchoolName(e.target.value.slice(0, 50)); setError('') }} autoComplete="off" placeholder="예: 서울○○초등학교" maxLength={50} required />
            </label>
            <label className="field">현재 학년
              <select value={grade} onChange={(e) => { setGrade(e.target.value); setError('') }}>
                {[1, 2, 3, 4, 5, 6].map((g) => <option key={g} value={g}>{g}학년</option>)}
              </select>
            </label>
          </div>

          <label className="signup-consent">
            <input type="checkbox" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setError('') }} />
            <span><strong>(필수)</strong> 회원가입 및 서비스 제공을 위한 보호자 이메일·휴대폰 번호와 자녀 이름·학교·학년의 수집·이용, 서비스 이용약관 및 개인정보 처리방침에 동의합니다. 무료 체험은 상단의 2주 체험 메뉴에서 별도로 신청할 수 있습니다.</span>
          </label>
          {error && <p className="err" role="alert">{error}</p>}
          <button className="btn block signup-submit" type="submit" disabled={!email || !loginIdChecked || !/^01[016789]\d{7,8}$/.test(phone.replace(/[^0-9]/g, '')) || !studentName.trim() || !schoolName.trim() || password.length < 8 || password !== passwordConfirm || !agreed || loading}>
            {loading ? '가입 처리 중…' : '회원가입'}
          </button>
        </form>
      </main>
    </div>
  )
}
