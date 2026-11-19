import { useEffect, useMemo, useState } from 'react'
import './AdminPage.css'

const URL = import.meta.env.VITE_SUPABASE_URL
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const money = (v) => v == null ? '—' : `${Number(v).toLocaleString('ko-KR')}원`
const date = (v) => v ? new Date(v).toLocaleDateString('ko-KR') : '—'

async function request(path, options = {}) {
  const res = await fetch(`${URL}${path}`, { ...options, headers: { apikey: KEY, 'Content-Type': 'application/json', ...(options.headers || {}) } })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.msg || data.message || data.error_description || data.error || '요청에 실패했습니다.')
  return data
}

export default function AdminPage() {
  const [session, setSession] = useState(() => { try { return JSON.parse(sessionStorage.getItem('quiz_admin_session') || 'null') } catch { return null } })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [members, setMembers] = useState([])
  const [summary, setSummary] = useState({ total: 0, active: 0, expired: 0, no_subscription: 0 })
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(null)
  const [editName, setEditName] = useState('')
  const [editGrade, setEditGrade] = useState('')
  const [plan, setPlan] = useState('3')
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [payStatus, setPayStatus] = useState('manual')
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [testEmail, setTestEmail] = useState('')
  const [testPassword, setTestPassword] = useState('')
  const [testName, setTestName] = useState('')
  const [testGrade, setTestGrade] = useState('3')
  const [testSuccess, setTestSuccess] = useState('')

  const callAdmin = async (payload) => request('/functions/v1/admin-members', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify(payload) })
  const loadMembers = async () => {
    if (!session?.access_token) return
    setLoading(true); setError('')
    try { const data = await callAdmin({ action: 'list' }); setMembers(data.members || []); setSummary(data.summary || summary) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { if (session?.access_token) loadMembers() }, [session?.access_token])

  const login = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const data = await request('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email, password }) })
      const next = { access_token: data.access_token, refresh_token: data.refresh_token, user: data.user }
      sessionStorage.setItem('quiz_admin_session', JSON.stringify(next)); setSession(next)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }
  const logout = () => { sessionStorage.removeItem('quiz_admin_session'); setSession(null); setMembers([]) }
  const filtered = useMemo(() => members.filter((m) => {
    const text = `${m.email || ''} ${m.profile?.display_name || ''}`.toLowerCase()
    const match = text.includes(search.toLowerCase())
    const s = m.subscription
    const statusMatch = filter === 'all' || (filter === 'active' && s?.status === 'active' && new Date(s.ends_at) >= new Date()) || (filter === 'expired' && s && new Date(s.ends_at) < new Date()) || (filter === 'none' && !s)
    return match && statusMatch
  }), [members, search, filter])

  const openEdit = (member) => { setEditing(member); setEditName(member.profile?.display_name || ''); setEditGrade(member.profile?.grade ? String(member.profile.grade) : '') }
  const saveProfile = async (e) => { e.preventDefault(); if (!editing) return; setLoading(true); setError(''); try { await callAdmin({ action: 'update_profile', user_id: editing.id, display_name: editName, grade: editGrade }); setEditing(null); await loadMembers() } catch (e) { setError(e.message) } finally { setLoading(false) } }
  const openSubscription = (member) => { setSelected(member); setPlan('3'); const currentEnd = member.subscription?.status === 'active' ? new Date(member.subscription.ends_at) : new Date(); if (member.subscription?.status === 'active' && currentEnd > new Date()) currentEnd.setDate(currentEnd.getDate() + 1); const localDate = new Date(currentEnd.getTime() - currentEnd.getTimezoneOffset() * 60000).toISOString().slice(0, 10); setStartDate(localDate); setPayStatus('manual'); setAmount(''); setMemo('') }
  const saveSubscription = async (e) => {
    e.preventDefault(); if (!selected) return
    setLoading(true); setError('')
    try {
      await callAdmin({ action: 'save_subscription', user_id: selected.id, plan_months: plan === 'trial' ? 3 : Number(plan), is_trial: plan === 'trial', starts_at: `${startDate}T00:00:00+09:00`, status: 'active', payment_status: payStatus, amount_krw: amount, memo })
      setSelected(null); await loadMembers()
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const createTestAccount = async (e) => {
    e.preventDefault()
    setLoading(true); setError(''); setTestSuccess('')
    try {
      const data = await callAdmin({ action: 'create_test_user', email: testEmail, password: testPassword, display_name: testName, grade: Number(testGrade) })
      setTestSuccess('테스트 계정 ' + data.user.email + ' 생성 완료 · 12개월 이용권 자동 지급')
      setTestEmail(''); setTestPassword(''); setTestName(''); setTestGrade('3')
      await loadMembers()
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }
  if (!session) return <main className="admin-shell"><form className="admin-login" onSubmit={login}><div className="admin-mark">STUDY<span>ADMIN</span></div><h1>관리자 로그인</h1><p>관리자 계정으로 로그인해 주세요.</p><label>이메일<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" /></label><label>비밀번호<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /></label>{error && <div className="admin-error">{error}</div>}<button disabled={loading}>{loading ? '확인 중…' : '로그인'}</button><a href="/" className="admin-back">학습 서비스로 돌아가기</a></form></main>

  return <main className="admin-shell"><header className="admin-header"><div><div className="admin-mark">STUDY<span>ADMIN</span></div><p>회원 및 구독 관리</p></div><div className="admin-actions"><span>{session.user?.email}</span><button className="light" onClick={loadMembers}>새로고침</button><button className="light" onClick={logout}>로그아웃</button></div></header>
    <section className="admin-content"><div className="admin-title"><div><h1>회원 관리</h1><p>가입 회원, 학년 정보, 구독 상태와 이용 기간을 관리합니다.</p></div><span className="admin-live">SUPABASE 연결</span></div>
      <div className="admin-stats"><article><span>전체 회원</span><strong>{summary.total.toLocaleString()}</strong></article><article><span>구독 이용 중</span><strong>{summary.active.toLocaleString()}</strong></article><article><span>기간 만료</span><strong>{summary.expired.toLocaleString()}</strong></article><article><span>미구독 회원</span><strong>{summary.no_subscription.toLocaleString()}</strong></article></div>
      <section className="test-create-panel"><div><h2>테스트 계정 만들기</h2><p>이메일 인증 없이 생성되며, 12개월 테스트 이용권이 자동으로 지급됩니다.</p></div><form onSubmit={createTestAccount}><label>이메일<input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="test01@example.com" required /></label><label>비밀번호<input type="password" value={testPassword} onChange={(e) => setTestPassword(e.target.value)} minLength={8} placeholder="8자 이상" required /></label><label>학생 이름<input value={testName} onChange={(e) => setTestName(e.target.value)} placeholder="테스트 학생" /></label><label>학년<select value={testGrade} onChange={(e) => setTestGrade(e.target.value)}>{[1,2,3,4,5,6].map((g) => <option key={g} value={g}>{g}학년</option>)}</select></label><button disabled={loading}>{loading ? "생성 중…" : "테스트 계정 생성"}</button></form>{testSuccess && <div className="test-success">{testSuccess}</div>}</section>
      <div className="admin-toolbar"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="이메일 또는 이름 검색"/><select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">전체 회원</option><option value="active">구독 이용 중</option><option value="expired">기간 만료</option><option value="none">미구독</option></select><span>{filtered.length}명</span></div>
      {error && <div className="admin-error wide">{error}</div>}
      <div className="admin-table-wrap"><table><thead><tr><th>회원</th><th>학년</th><th>가입일</th><th>구독 상품</th><th>이용 기간</th><th>결제 상태</th><th>관리</th></tr></thead><tbody>{filtered.map((m) => { const s = m.subscription; const active = s?.status === 'active' && new Date(s.ends_at) >= new Date(); return <tr key={m.id}><td><b>{m.profile?.display_name || '이름 미등록'}</b>{m.is_test && <em className="test-tag">테스트</em>}<small>{m.email || m.phone || m.id}</small></td><td>{m.profile?.grade ? `${m.profile.grade}학년` : '미설정'}</td><td>{date(m.created_at)}</td><td>{s ? (s.is_trial ? '2주 체험' : `${s.plan_months}개월`) : '미구독'}</td><td>{s ? `${date(s.starts_at)} ~ ${date(s.ends_at)}` : '—'}</td><td><i className={`status ${active ? 'on' : s ? 'off' : 'none'}`}>{active ? '이용 중' : s ? '만료/중지' : '미구독'}</i><small>{s?.payment_status === 'paid' ? '결제 완료' : s?.payment_status === 'pending' ? '결제 대기' : s?.payment_status === 'refunded' ? '환불' : s ? '수동 등록' : ''}</small></td><td><button className="small" onClick={() => openEdit(m)}>회원정보</button> <button className="small" onClick={() => openSubscription(m)}>구독 관리</button></td></tr> })}{!filtered.length && <tr><td colSpan="7" className="empty">{loading ? '불러오는 중…' : '표시할 회원이 없습니다.'}</td></tr>}</tbody></table></div>
      <p className="admin-footnote">현재 관리자 페이지는 구독을 수동 등록하는 운영 도구입니다. 실제 카드 결제 및 자동 갱신은 결제 PG 연동 후 활성화해야 합니다.</p>
    </section>
    {selected && <div className="admin-modal-bg" onClick={() => setSelected(null)}><form className="admin-modal" onSubmit={saveSubscription} onClick={(e) => e.stopPropagation()}><button type="button" className="modal-x" onClick={() => setSelected(null)}>×</button><h2>구독 등록 / 연장</h2><p>{selected.profile?.display_name || selected.email}</p><label>구독 기간<select value={plan} onChange={(e) => setPlan(e.target.value)}><option value="trial">2주 무료 체험</option><option value="3">3개월</option><option value="6">6개월</option><option value="12">12개월</option></select></label><label>시작일<input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required /></label><label>결제 상태<select value={payStatus} onChange={(e) => setPayStatus(e.target.value)}><option value="manual">수동 등록</option><option value="paid">결제 완료</option><option value="pending">결제 대기</option><option value="refunded">환불</option></select></label><label>결제 금액(원)<input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="예: 39000" /></label><label>관리 메모<textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="운영자 메모" /></label><button disabled={loading}>{loading ? '저장 중…' : '구독 저장'}</button></form></div>}
  </main>
}
