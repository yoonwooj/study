import { useEffect, useState } from 'react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export default function PasswordRecoveryPage() {
  const [accessToken, setAccessToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const token = params.get('access_token')
    const type = params.get('type')
    if (type === 'recovery' && token) {
      setAccessToken(token)
      // URL fragment에 인증 토큰이 계속 남지 않도록 메모리로 옮긴 뒤 주소창에서 제거합니다.
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    } else {
      setMessage('비밀번호 재설정 링크가 유효하지 않거나 만료되었습니다. 로그인 화면에서 비밀번호 찾기를 다시 요청해 주세요.')
    }
  }, [])

  const submit = async (event) => {
    event.preventDefault()
    setMessage('')
    if (!accessToken) {
      setMessage('재설정 인증 정보가 없습니다. 비밀번호 찾기 이메일을 다시 요청해 주세요.')
      return
    }
    if (password.length < 8) {
      setMessage('비밀번호는 8자 이상 입력해 주세요.')
      return
    }
    if (password !== confirmPassword) {
      setMessage('비밀번호 확인이 일치하지 않습니다.')
      return
    }
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      setMessage('Supabase 환경변수가 설정되지 않았습니다.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method: 'PUT',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(result.msg || result.message || result.error_description || result.error || '비밀번호 변경에 실패했습니다.')
      }
      setDone(true)
      setPassword('')
      setConfirmPassword('')
      setMessage('비밀번호가 변경되었습니다. 로그인 화면으로 이동해 주세요.')
    } catch (error) {
      setMessage(error.message || '비밀번호 변경 중 오류가 발생했습니다.')
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
    message: { margin: '14px 0 0', color: done ? '#087a4b' : '#d14343', fontSize: 13, lineHeight: 1.6 },
    link: { display: 'block', marginTop: 16, textAlign: 'center', color: '#13a66b', fontSize: 14, fontWeight: 700, textDecoration: 'none' },
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.eyebrow}>STUDY</div>
        <h1 style={styles.title}>새 비밀번호 설정</h1>
        <p style={styles.desc}>새로 사용할 비밀번호를 입력해 주세요.</p>
        {!done && accessToken && (
          <form onSubmit={submit}>
            <label style={styles.label}>새 비밀번호
              <input style={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={8} required />
            </label>
            <label style={styles.label}>새 비밀번호 확인
              <input style={styles.input} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" minLength={8} required />
            </label>
            <button style={styles.button} type="submit" disabled={loading}>{loading ? '변경 중…' : '비밀번호 변경하기'}</button>
          </form>
        )}
        {message && <p role="status" style={styles.message}>{message}</p>}
        {done && <a style={styles.link} href="/">로그인 화면으로 이동</a>}
        {!accessToken && <a style={styles.link} href="/">로그인 화면으로 돌아가기</a>}
      </section>
    </main>
  )
}
