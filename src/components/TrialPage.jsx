import { useState } from 'react'
import { signUp, checkLoginId, checkTrialEligibility } from '../lib/auth.js'

export default function TrialPage({ onLogin }) {
  const [loginId,setLoginId]=useState('')
  const [loginIdChecked,setLoginIdChecked]=useState(false)
  const [idMessage,setIdMessage]=useState('')
  const [checkingId,setCheckingId]=useState(false)
  const [email,setEmail]=useState('')
  const [phone,setPhone]=useState('')
  const [studentName,setStudentName]=useState('')
  const [schoolName,setSchoolName]=useState('')
  const [grade,setGrade]=useState('3')
  const [password,setPassword]=useState('')
  const [passwordConfirm,setPasswordConfirm]=useState('')
  const [agreed,setAgreed]=useState(false)
  const [error,setError]=useState('')
  const [loading,setLoading]=useState(false)
  const [emailConfirmation,setEmailConfirmation]=useState(false)

  const verifyId=async()=>{
    setIdMessage('')
    if(!/^[a-z][a-z0-9]{3,15}$/.test(loginId))return setIdMessage('영문 소문자로 시작하는 4~16자의 영문 소문자·숫자 조합으로 입력해 주세요.')
    setCheckingId(true)
    try{const r=await checkLoginId(loginId);setLoginIdChecked(r.available===true);setIdMessage(r.available?'사용할 수 있는 아이디입니다.':'이미 사용 중인 아이디입니다.')}
    catch(e){setLoginIdChecked(false);setIdMessage(e.message||'중복 확인에 실패했습니다.')}
    finally{setCheckingId(false)}
  }
  const submit=async e=>{
    e.preventDefault();setError('')
    const normalizedPhone=phone.replace(/[^0-9]/g,'')
    if(!loginIdChecked)return setError('로그인 아이디 중복 확인을 완료해 주세요.')
    if(!/^01[016789]\d{7,8}$/.test(normalizedPhone))return setError('휴대폰 번호를 정확히 입력해 주세요.')
    if(!studentName.trim()||!schoolName.trim())return setError('자녀 이름과 학교를 입력해 주세요.')
    if(password.length<8||password!==passwordConfirm)return setError('비밀번호를 8자 이상 입력하고 확인란과 일치시켜 주세요.')
    if(!agreed)return setError('무료 체험 및 개인정보 처리에 동의해 주세요.')
    setLoading(true)
    try{
      const eligibility=await checkTrialEligibility(email,normalizedPhone)
      if(!eligibility.eligible)return setError('이 이메일 또는 휴대폰 번호로 이미 2주 체험을 신청한 이력이 있습니다. 기존 계정으로 로그인해 주세요.')
      window.sessionStorage.setItem('study.pending-guardian-phone',normalizedPhone)
      window.sessionStorage.setItem('study.pending-student-name',studentName.trim())
      window.sessionStorage.setItem('study.pending-school-name',schoolName.trim())
      window.sessionStorage.setItem('study.pending-grade',grade)
      const result=await signUp(email,password,loginId)
      if(result.session){
        await onLogin({session:result.session,user:result.session.user.email})
        window.location.replace('/payment')
      }else setEmailConfirmation(true)
    }catch(e){setError(e.message||'체험 신청을 완료하지 못했습니다.')}
    finally{setLoading(false)}
  }

  return <div className="app login" data-subject="kor">
    <main className="page signup-page trial-application-page">
      <nav className="public-top-nav" aria-label="주요 메뉴"><a href="/signup">회원가입</a><a className="trial-nav-link" href="/trial" aria-current="page">2주 체험</a></nav>
      <section className="hero signup-hero trial-hero">
        <small>14 DAYS FREE TRIAL</small><b>첫 2주 무료 체험 신청</b>
        <p>처음 이용하는 학생을 위한 14일 무료 학습입니다. 회원가입 메뉴와 별도로 신청하며, 자동 결제나 카드 등록은 없습니다.</p>
        <div className="signup-trial"><strong>14일 무료</strong><span>최초 1회 · 자동 결제 없음 · 약정 없음</span></div>
      </section>
      {emailConfirmation ? <section className="card signup-card signup-confirm-card">
        <div className="signup-success-icon" aria-hidden="true">✉</div><h2>이메일을 확인해 주세요</h2>
        <p className="sub"><strong>{email}</strong> 주소로 인증 메일을 보냈어요. 이메일 인증을 마친 뒤 로그인하면 체험 등록을 이어갈 수 있습니다.</p>
        <a className="btn block signup-link" href="/">로그인 화면으로 이동</a>
      </section> : <form className="card signup-card" onSubmit={submit}>
        <div className="signup-section-title signup-grid-full"><span>01</span><div><strong>보호자 계정 정보</strong><small>체험 신청 후 로그인할 때 사용할 정보입니다.</small></div></div>
        <div className="signup-form-grid">
          <div className="field">로그인 아이디
            <div className="id-check-row"><input type="text" value={loginId} onChange={e=>{setLoginId(e.target.value.toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,16));setLoginIdChecked(false);setIdMessage('');setError('')}} autoComplete="username" placeholder="예: parent123" maxLength={16} required/><button type="button" className="id-check-button" onClick={verifyId} disabled={checkingId||!loginId}>{checkingId?'확인 중':'중복 확인'}</button></div>
            {idMessage&&<small className={loginIdChecked?'id-check-ok':'id-check-message'} role="status">{idMessage}</small>}<small className="id-help">영문 소문자로 시작하는 4~16자, 영문 소문자와 숫자만 사용</small>
          </div>
          <label className="field">보호자 이메일<input type="email" value={email} onChange={e=>{setEmail(e.target.value);setError('')}} autoComplete="email" autoCapitalize="none" placeholder="parent@example.com" required/></label>
          <label className="field">비밀번호<input type="password" value={password} onChange={e=>{setPassword(e.target.value);setError('')}} autoComplete="new-password" minLength={8} placeholder="8자 이상 입력" required/></label>
          <label className="field">비밀번호 확인<input type="password" value={passwordConfirm} onChange={e=>{setPasswordConfirm(e.target.value);setError('')}} autoComplete="new-password" minLength={8} placeholder="비밀번호 다시 입력" required/></label>
          <label className="field">보호자 휴대폰 번호<input type="tel" inputMode="numeric" value={phone} onChange={e=>{setPhone(e.target.value.replace(/[^0-9-]/g,'').slice(0,13));setError('')}} autoComplete="tel" placeholder="010-0000-0000" required/></label>
        </div>
        <div className="signup-divider"/>
        <div className="signup-section-title signup-grid-full"><span>02</span><div><strong>학생 정보</strong><small>학습에 참여할 자녀의 정보를 입력해 주세요.</small></div></div>
        <div className="signup-form-grid">
          <label className="field">학생 이름<input type="text" value={studentName} onChange={e=>setStudentName(e.target.value.slice(0,20))} maxLength={20} placeholder="학생 이름" required/></label>
          <label className="field">학교 이름<input type="text" value={schoolName} onChange={e=>setSchoolName(e.target.value.slice(0,50))} maxLength={50} placeholder="예: 서울○○초등학교" required/></label>
          <label className="field">현재 학년<select value={grade} onChange={e=>setGrade(e.target.value)}>{[1,2,3,4,5,6].map(g=><option key={g} value={g}>{g}학년</option>)}</select></label>
        </div>
        <p className="signup-note">이메일과 휴대폰 번호는 기존 체험 이력 확인에 사용됩니다. 이미 체험 이력이 확인되면 신청이 제한됩니다.</p>
        <label className="signup-consent"><input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)}/><span><strong>(필수)</strong> 14일 무료 체험 제공, 계정 관리 및 학습 서비스 제공을 위한 보호자 이메일·휴대폰 번호와 자녀 정보의 수집·이용에 동의합니다. 체험 중복 방지를 위한 이력은 안전하게 암호화·해시 처리하여 보관합니다.</span></label>
        {error&&<p className="err" role="alert">{error}</p>}
        <button className="btn block signup-submit" type="submit" disabled={!email||!loginIdChecked||!phone||!studentName.trim()||!schoolName.trim()||password.length<8||password!==passwordConfirm||!agreed||loading}>{loading?'신청 처리 중…':'14일 무료 체험 신청하기'}</button>
        <p className="signup-trial-caption">체험은 보호자 이메일 또는 휴대폰 번호 기준 최초 1회만 제공됩니다. 14일 후 자동 결제되지 않습니다.</p>
      </form>}
    </main>
  </div>
}
