import { useState } from 'react'
import { createRecoveryCode, hashRecoveryCode, saveMyRecoveryCode } from '../lib/auth.js'

export default function RecoveryCodePage({ accessToken }) {
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const issue = async () => {
    setLoading(true); setError(''); setCode(''); setCopied(false)
    try {
      const nextCode = createRecoveryCode()
      const hash = await hashRecoveryCode(nextCode)
      await saveMyRecoveryCode(accessToken, hash)
      setCode(nextCode)
    } catch (e) { setError(e.message || '복구 코드 발급에 실패했습니다.') }
    finally { setLoading(false) }
  }
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true) }
    catch { setError('복사할 수 없습니다. 코드를 직접 선택해 보관해 주세요.') }
  }
  return <section className="page">
    <div className="card login-form">
      <h2>아이디 복구 코드</h2>
      <p className="sub">아이디(가입 이메일)를 잊었을 때 사용할 수 있는 코드입니다. 코드는 서버에 해시값으로만 저장되며 원문은 발급 직후 한 번만 표시됩니다.</p>
      <p className="err">새 코드를 발급하면 이전 복구 코드는 즉시 사용할 수 없게 됩니다. 다른 사람에게 공유하지 말고 안전한 곳에 보관하세요.</p>
      {code && <div style={{ padding: 18, borderRadius: 14, background: '#f1f5ff', textAlign: 'center', margin: '14px 0' }}>
        <strong style={{ display: 'block', fontSize: 20, letterSpacing: 1.2, lineHeight: 1.8, overflowWrap: 'anywhere' }}>{code}</strong>
        <button className="btn block" type="button" onClick={copy} style={{ marginTop: 10 }}>{copied ? '복사 완료' : '복구 코드 복사'}</button>
      </div>}
      {error && <p className="err" role="alert">{error}</p>}
      <button className="btn block" type="button" onClick={issue} disabled={loading}>{loading ? '발급 중…' : code ? '새 복구 코드 발급 (기존 코드 무효화)' : '복구 코드 발급하기'}</button>
    </div>
  </section>
}
