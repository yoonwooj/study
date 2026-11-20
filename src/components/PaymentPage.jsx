import { useState } from 'react'
import { completeTrialSetup } from '../lib/auth.js'

const GRADES = [1, 2, 3, 4, 5, 6]

function pendingGuardianPhone() {
  try { return window.sessionStorage.getItem('study.pending-guardian-phone') || '' } catch { return '' }
}
const isExtendMode = () => new URLSearchParams(window.location.search).get('mode') === 'extend'

export default function PaymentPage({ auth, onComplete, mode }) {
  const [phone, setPhone] = useState(pendingGuardianPhone)
  const [studentName, setStudentName] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [grade, setGrade] = useState('3')
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const extending = mode === 'extend' || isExtendMode()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!/^01[016789]\d{7,8}$/.test(phone.replace(/[^0-9]/g, ''))) {
      setError('휴대폰 번호를 010-0000-0000 형식으로 입력해 주세요.')
      return
    }
    if (!studentName.trim() || !schoolName.trim()) {
      setError('자녀 이름과 학교를 입력해 주세요.')
      return
    }
    if (!agreed) {
      setError('무료 체험 및 개인정보 처리에 동의해 주세요.')
      return
    }
    setLoading(true)
    try {
      const result = await completeTrialSetup(auth.access_token, {
        guardian_phone: phone.replace(/[^0-9]/g, ''),
        student_name: studentName.trim(),
        school_name: schoolName.trim(),
        grade: Number(grade),
      })
      try { window.sessionStorage.removeItem('study.pending-guardian-phone') } catch {}
      await onComplete(result)
    } catch (e) {
      setError(e.message || '무료 체험 등록을 완료하지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app login" data-subject="kor">
      <main className="page signup-page payment-page">
        <section className="hero signup-hero payment-hero">
          <small>{extending ? 'MEMBERSHIP' : 'START YOUR FREE TRIAL'}</small>
          <b>{extending ? '학습 이용권 연장' : '14일 무료 체험 등록'}</b>
          <p>{extending ? '이용권을 선택해 학습을 이어갈 수 있어요.' : '보호자와 자녀 정보를 등록하면 오늘부터 14일 동안 자유롭게 학습할 수 있어요.'}</p>
          {!extending && <div className="signup-trial"><strong>14일 무료</strong><span>자동 결제 없음 · 카드 등록 없음</span></div>}
        </section>

        {extending ? (
          <section className="card signup-card">
            <div className="signup-section-title"><span>01</span><div><strong>이용권 선택</strong><small>원하는 학습 기간을 선택해 주세요.</small></div></div>
            <div className="payment-plan-grid">
              <article className="payment-plan"><strong>1개월 이용권</strong><span>한 달 동안 학습</span></article>
              <article className="payment-plan"><strong>3개월 이용권</strong><span>꾸준한 학습을 위한 선택</span></article>
              <article className="payment-plan"><strong>12개월 이용권</strong><span>장기 학습을 위한 선택</span></article>
            </div>
            <p className="signup-note">현재 결제 대행사(PG)와 이용권 가격이 확정되지 않아 실제 결제는 아직 진행하지 않습니다. 결제 기능을 연결한 뒤 이 화면에서 안전하게 결제할 수 있도록 구성했습니다.</p>
            <button className="btn block" type="button" disabled>결제 기능 준비 중</button>
            <a className="login-help-links payment-back" href="/">학습 화면으로 돌아가기</a>
          </section>
        ) : (
          <form className="card signup-card" onSubmit={submit}>
            <div className="signup-section-title signup-grid-full"><span>01</span><div><strong>보호자 정보</strong><small>무료 체험 중복 확인에 사용합니다.</small></div></div>
            <div className="signup-form-grid">
              <label className="field">보호자 이메일
                <input type="email" value={auth?.user?.email || ''} readOnly />
              </label>
              <label className="field">보호자 휴대폰 번호
                <input type="tel" inputMode="numeric" autoComplete="tel" value={phone} onChange={(e) => { setPhone(e.target.value.replace(/[^0-9-]/g, '').slice(0, 13)); setError('') }} placeholder="010-0000-0000" required />
              </label>
            </div>
            <p className="signup-note">휴대폰 번호는 무료 체험 중복 확인을 위해 서버에서 해시 및 암호화 처리합니다. 현재 SMS 본인인증은 하지 않으므로 번호의 실제 소유 여부까지 확인하는 것은 아닙니다.</p>
            <div className="signup-divider" />
            <div className="signup-section-title signup-grid-full"><span>02</span><div><strong>자녀 정보</strong><small>학습에 사용할 첫 번째 자녀의 정보를 입력해 주세요.</small></div></div>
            <div className="signup-form-grid">
              <label className="field">학생 이름
                <input type="text" value={studentName} onChange={(e) => setStudentName(e.target.value.slice(0, 20))} autoComplete="off" placeholder="학생 이름" maxLength={20} required />
              </label>
              <label className="field">학교 이름
                <input type="text" value={schoolName} onChange={(e) => setSchoolName(e.target.value.slice(0, 50))} autoComplete="off" placeholder="예: 서울○○초등학교" maxLength={50} required />
              </label>
              <label className="field">현재 학년
                <select value={grade} onChange={(e) => setGrade(e.target.value)}>{GRADES.map((g) => <option key={g} value={g}>{g}학년</option>)}</select>
              </label>
            </div>
            <label className="signup-consent">
              <input type="checkbox" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setError('') }} />
              <span><strong>(필수)</strong> 보호자 휴대폰 번호 및 자녀 정보를 무료 체험 발급, 계정 관리, 학습 제공을 위해 수집·이용하는 데 동의합니다. 휴대폰 번호는 해시 또는 암호화 처리하며, 무료 체험 중복 방지를 위한 이력은 탈퇴 후에도 서비스 운영 기간 동안 보관됩니다.</span>
            </label>
            {error && <p className="err" role="alert">{error}</p>}
            <button className="btn block signup-submit" type="submit" disabled={!phone || !studentName.trim() || !schoolName.trim() || !agreed || loading}>
              {loading ? '무료 체험 등록 중…' : '14일 무료 체험 시작하기'}
            </button>
            <p className="signup-trial-caption payment-caption">체험은 보호자 계정당 최초 1회만 제공됩니다. 14일 종료 후 자동 결제되지 않으며, 계속 이용하려면 학습 페이지에서 직접 연장하기를 선택해야 합니다.</p>
          </form>
        )}
      </main>
    </div>
  )
}
