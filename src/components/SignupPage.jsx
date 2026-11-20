import { useState } from 'react'
import { signUp } from '../lib/auth.js'

const GRADES = [1, 2, 3, 4, 5, 6]

export default function SignupPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [phone, setPhone] = useState('')
  const [studentName, setStudentName] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [grade, setGrade] = useState('3')
  const [privacyAgreed, setPrivacyAgreed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailConfirmation, setEmailConfirmation] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== passwordConfirm) {
      setError('비밀번호가 서로 일치하지 않습니다.')
      return
    }
    if (!privacyAgreed) {
      setError('개인정보 수집 및 이용에 동의해 주세요.')
      return
    }
    setLoading(true)
    try {
      const result = await signUp(email, password, Number(grade), {
        guardianPhone: phone.replace(/[^0-9]/g, ''),
        studentName: studentName.trim(),
        schoolName: schoolName.trim(),
      })
      if (result.session) {
        await onLogin({ session: result.session, user: result.session.user.email })
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
          <section className="card login-form signup-card">
            <div className="signup-success-icon" aria-hidden="true">✉</div>
            <h2>인증 메일을 보냈어요</h2>
            <p className="sub"><strong>{email}</strong> 주소로 발송된 인증 링크를 눌러 가입을 완료해 주세요.</p>
            <p className="signup-note">이메일 인증이 완료된 뒤 보호자 이메일과 비밀번호로 로그인할 수 있습니다.</p>
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
          <p>보호자 계정 하나로 자녀의 학습을 관리해요.</p>
          <div className="signup-trial"><strong>14일 무료 체험</strong><span>보호자 계정당 최초 1회</span></div>
          <p className="signup-trial-caption">이메일 인증을 완료하고 첫 로그인하면 14일 체험이 시작됩니다. 보호자 계정당 1회만 제공돼요.</p>
        </section>

        <form className="card login-form signup-card" onSubmit={submit}>
          <div className="signup-section-title"><span>01</span><div><strong>보호자 계정</strong><small>로그인에 사용할 정보를 입력해 주세요.</small></div></div>
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
            <input type="tel" inputMode="numeric" autoComplete="tel" value={phone} onChange={(e) => { setPhone(e.target.value.replace(/[^0-9-]/g, '').slice(0, 13)); setError('') }} placeholder="010-0000-0000" minLength={10} required />
          </label>
          <p className="signup-note">휴대폰 번호는 무료 체험 중복 확인을 위해 서버에서 암호화·해시 처리합니다. 현재 SMS 본인인증은 하지 않으므로 입력한 번호 자체의 실제 소유 여부까지 확인하는 것은 아닙니다.</p>

          <div className="signup-divider" />
          <div className="signup-section-title"><span>02</span><div><strong>자녀 정보</strong><small>첫 번째 자녀의 학습 정보를 입력해 주세요.</small></div></div>
          <label className="field">학생 이름
            <input type="text" value={studentName} onChange={(e) => setStudentName(e.target.value.slice(0, 20))} autoComplete="off" placeholder="학생 이름" maxLength={20} required />
          </label>
          <label className="field">학교 이름
            <input type="text" value={schoolName} onChange={(e) => setSchoolName(e.target.value.slice(0, 50))} autoComplete="off" placeholder="예: 서울○○초등학교" maxLength={50} required />
          </label>
          <label className="field">현재 학년
            <select value={grade} onChange={(e) => setGrade(e.target.value)}>
              {GRADES.map((g) => <option key={g} value={g}>{g}학년</option>)}
            </select>
          </label>

          <label className="signup-consent">
            <input type="checkbox" checked={privacyAgreed} onChange={(e) => { setPrivacyAgreed(e.target.checked); setError('') }} />
            <span><strong>(필수)</strong> 회원가입·계정 관리, 무료 체험 중복 확인 및 향후 본인인증·알림 기능을 위해 보호자 이메일과 휴대폰 번호를 수집·이용하는 데 동의합니다. 이메일·전화번호는 해시 또는 암호화 처리하며, 무료 체험 이력은 탈퇴 후에도 중복 발급 방지를 위해 서비스 운영 기간 동안 보관됩니다.</span>
          </label>
          <p className="signup-legal">같은 보호자 이메일 또는 휴대폰 번호로 이미 무료 체험을 이용한 이력이 있으면 추가 체험이 발급되지 않습니다. 이메일 인증이 끝난 뒤 첫 로그인 시 서버에서 중복 여부를 확인하고 체험 기간을 등록합니다. 번호 미인증 상태이므로 다른 사람의 번호를 입력하는 행위까지 완전히 차단하지는 못합니다.</p>

          {error && <p className="err" role="alert">{error}</p>}
          <button className="btn block signup-submit" type="submit" disabled={!email || password.length < 8 || password !== passwordConfirm || phone.replace(/[^0-9]/g, '').length < 10 || !studentName.trim() || !schoolName.trim() || !privacyAgreed || loading}>
            {loading ? '가입 처리 중…' : '보호자 계정 만들기'}
          </button>
          <nav className="login-help-links" aria-label="로그인 이동"><a href="/">이미 계정이 있으신가요? 로그인</a></nav>
        </form>
      </main>
    </div>
  )
}
