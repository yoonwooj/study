import { useState } from 'react'
import { findIdByRecoveryCode } from '../lib/auth.js'
export default function FindIdPage() {
  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async (event) => {
    event.preventDefault(); setLoading(true); setError(''); setEmail('')
    try {
      const found = await findIdByRecoveryCode(code)
      if (!found) setError('일치하는 복구 코드가 없습니다. 코드를 다시 확인하거나 로그인된 기기에서 새 코드를 발급받아 주세요.')
      else setEmail(found)
    } catch (e) { setError(e.message || '아이디 조회에 실패했습니다.') }
    finally { setLoading(false) }
  }
  const styles = {
    page: { minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 20, background: '#f4f6fb', color: '#182230', fontFamily: '"Noto Sans KR", sans-serif' },
    card: { width: '100%', maxWidth: 440, padding: 28, borderRadius: 20, background: '#fff', boxShadow: '0 12px 40px rgba(20,35,60,.10)' },
    eyebrow: { color: '#3867e8', fontSize: 12, fontWeight: 800, letterSpacing: '.12em' },
    title: { margin: '8px 0', fontSize: 25, fontWeight: 800 },
    desc: { color: '#667085', fontSize: 14, lineHeight: 1.7 },
    label: { display: 'grid', gap: 8, margin: '18px 0', fontSize: 13, fontWeight: 700 },
    input: { width: '100%', boxSizing: 'border-box', padding: 13, border: '1px solid #dce2eb', borderRadius: 11, fontSize: 15, letterSpacing: 1 },
    button: { width: '100%', padding: 14, border: 0, borderRadius: 11, background: '#3867e8', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer' },
    message: { padding: 14, borderRadius: 12, background: '#edf8f2', color: '#087a4b', fontSize: 15, lineHeight: 1.7, overflowWrap: 'anywhere' },
    error: { color: '#b42318', fontSize: 13, lineHeight: 1.6 },
    link: { display: 'block', marginTop: 18, textAlign: 'center', color: '#3867e8', fontSize: 14, fontWeight: 700, textDecoration: 'none' },
  }
  return <main style={styles.page}><section style={styles.card}>
    <div style={styles.eyebrow}>ACCOUNT HELP</div><h1 style={styles.title}>아이디 찾기</h1>
    <p style={styles.desc}>회원가입 때 발급받아 보관한 복구 코드를 입력해 주세요.</p>
    <form onSubmit={submit}>
      <label style={styles.label}>복구 코드
        <input style={styles.input} value={code} onChange={(e) => { setCode(e.target.value); setError(''); setEmail('') }} placeholder="예: ABCD-EFGH-..." autoCapitalize="characters" autoComplete="off" required />
      </label>
      <button style={styles.button} type="submit" disabled={!code.trim() || loading}>{loading ? '확인 중…' : '아이디 확인하기'}</button>
    </form>
    {email && <p role="status" style={styles.message}>가입 이메일(아이디)은 <strong>{email}</strong> 입니다.<br />보안을 위해 복구 코드는 이번 조회로 사용 완료되었습니다.</p>}
    {error && <p role="alert" style={styles.error}>{error}</p>}
    <p style={styles.desc}>복구 코드는 한 번만 사용할 수 있습니다. 아이디를 확인한 뒤 로그인하면 계정 메뉴에서 새 코드를 발급받을 수 있습니다.</p>
    <a style={styles.link} href="/">로그인으로 돌아가기</a>
  </section></main>
}
