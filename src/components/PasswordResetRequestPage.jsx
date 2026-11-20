import { useState } from 'react'
import { requestPasswordReset } from '../lib/auth.js'

export default function PasswordResetRequestPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await requestPasswordReset(email)
      setSent(true)
    } catch {
      // 계정 존재 여부가 외부에 노출되지 않도록 오류 문구를 통일합니다.
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  const styles = {
    page: { minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 20, background: '#f4f6fb', color: '#182230', fontFamily: '"Noto Sans KR", sans-serif' },
    card: { width: '100%', maxWidth: 420, padding: 28, borderRadius: 20, background: '#fff', boxShadow: '0 12px 40px rgba(20,35,60,.10)' },
    eyebrow: { color: '#13a66b', fontSize: 12, fontWeight: 800, letterSpacing: '.12em' },
    title: { margin: '8px 0', fontSize: 25, fontWeight: 800 },
    desc: { margin: '0 0 22px', color: '#667085', fontSize: 14, lineHeight: 1.6 },
    label: { display: 'grid', gap: 7, marginBottom: 14, fontSize: 13, fontWeight: 700 },
    input: { width: '100%', boxSizing: 'border-box', padding: '13px 14px', border: '1px solid #dce2eb', borderRadius: 11, fontSize: 15 },
    button: { width: '100%', padding: 14, border: 0, borderRadius: 11, background: '#13a66b', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer' },
    message: { margin: '14px 0 0', color: '#087a4b', fontSize: 13, lineHeight: 1.6 },
    link: { display: 'block', marginTop: 16, textAlign: 'center', color: '#13a66b', fontSize: 14, fontWeight: 700, textDecoration: 'none' },
  }
  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.eyebrow}>ACCOUNT HELP</div>
        <h1 style={styles.title}>비밀번호 찾기</h1>
        {!sent ? (
          <>
            <p style={styles.desc}>가입할 때 사용한 이메일 주소를 입력하면 비밀번호 재설정 링크를 보내드립니다.</p>
            <form onSubmit={submit}>
              <label style={styles.label}>가입 이메일
                <input style={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoCapitalize="none" required />
              </label>
              {error && <p role="alert">{error}</p>}
              <button style={styles.button} type="submit" disabled={!email || loading}>{loading ? '메일 요청 중…' : '재설정 메일 보내기'}</button>
            </form>
          </>
        ) : (
          <p role="status" style={styles.message}>해당 이메일로 계정이 존재하고 메일 발송이 가능한 경우 비밀번호 재설정 안내를 보냈습니다. 받은편지함과 스팸함을 확인해 주세요.</p>
        )}
        <a style={styles.link} href="/">로그인으로 돌아가기</a>
      </section>
    </main>
  )
}
