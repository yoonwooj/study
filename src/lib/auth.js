const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

function config() {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Supabase 환경변수가 설정되지 않았습니다.')
}
async function authRequest(path, body) {
  config()
  const response = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, { method: 'POST', headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.msg || data.message || data.error_description || data.error || '인증 요청에 실패했습니다.')
    error.status = response.status
    throw error
  }
  return data
}
function normalizeSession(data) {
  if (!data?.access_token || !data?.refresh_token || !data?.user) throw new Error('로그인 세션을 만들지 못했습니다.')
  return { access_token: data.access_token, refresh_token: data.refresh_token, expires_at: data.expires_at || Math.floor(Date.now() / 1000) + Number(data.expires_in || 3600), user: data.user }
}
async function sessionAction(accessToken, action) {
  config()
  const response = await fetch(`${SUPABASE_URL}/functions/v1/student-session`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.error || '기기 로그인 확인에 실패했습니다.')
    error.status = response.status
    throw error
  }
  return data
}
export async function signIn(email, password) {
  const session = normalizeSession(await authRequest('token?grant_type=password', { email: String(email).trim(), password }))
  await sessionAction(session.access_token, 'claim')
  return session
}
export async function signUp(email, password) {
  const redirect = encodeURIComponent(window.location.origin)
  const data = await authRequest(`signup?redirect_to=${redirect}`, { email: String(email).trim(), password })
  if (!data.session) return { needsEmailConfirmation: true }
  const session = normalizeSession(data.session)
  await sessionAction(session.access_token, 'claim')
  return { session }
}
let refreshPromise = null
export async function refreshSessionIfNeeded(session) {
  if (!session?.refresh_token) throw new Error('로그인 세션이 없습니다.')
  if (Number(session.expires_at || 0) > Math.floor(Date.now() / 1000) + 120) return session
  if (!refreshPromise) {
    refreshPromise = authRequest('token?grant_type=refresh_token', { refresh_token: session.refresh_token }).then(normalizeSession).finally(() => { refreshPromise = null })
  }
  return refreshPromise
}
export async function checkStudentSession(accessToken) {
  return (await sessionAction(accessToken, 'check')).active === true
}
export async function releaseStudentSession(accessToken) {
  if (!accessToken) return
  try { await sessionAction(accessToken, 'release') } catch { /* 네트워크 오류여도 로컬 로그아웃은 진행 */ }
}
