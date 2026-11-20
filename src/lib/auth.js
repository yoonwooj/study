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

const RECOVERY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export function createRecoveryCode() {
  const bytes = new Uint8Array(20)
  window.crypto.getRandomValues(bytes)
  let bits = 0, value = 0, output = ''
  for (const byte of bytes) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) { bits -= 5; output += RECOVERY_ALPHABET[(value >> bits) & 31] }
  }
  if (bits > 0) output += RECOVERY_ALPHABET[(value << (5 - bits)) & 31]
  return output.match(/.{1,4}/g).join('-')
}
export async function hashRecoveryCode(code) {
  const normalized = String(code || '').toUpperCase().replace(/[^A-Z2-9]/g, '')
  if (normalized.length !== 32) throw new Error('복구 코드 32자를 정확히 입력해 주세요.')
  const digest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}
export async function saveMyRecoveryCode(accessToken, codeHash) {
  config()
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/set_my_recovery_code`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_code_hash: codeHash }),
  })
  const data = await response.json().catch(() => false)
  if (!response.ok || data !== true) throw new Error('복구 코드를 저장하지 못했습니다. 다시 시도해 주세요.')
  return true
}
export async function findIdByRecoveryCode(code) {
  config()
  const codeHash = await hashRecoveryCode(code)
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/lookup_email_by_recovery_code`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_code_hash: codeHash }),
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error('아이디 조회를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.')
  return typeof data === 'string' ? data : null
}

function normalizeSession(data) {
  if (!data?.access_token || !data?.refresh_token || !data?.user) throw new Error('로그인 세션을 만들지 못했습니다.')
  return { access_token: data.access_token, refresh_token: data.refresh_token, expires_at: data.expires_at || Math.floor(Date.now() / 1000) + Number(data.expires_in || 3600), user: data.user }
}
function stripGuardianPhone(session) {
  const metadata = session?.user?.user_metadata
  if (!metadata || !Object.prototype.hasOwnProperty.call(metadata, 'guardian_phone')) return session
  const { guardian_phone: _phone, ...safeMetadata } = metadata
  return { ...session, user: { ...session.user, user_metadata: safeMetadata } }
}
function getDeviceId() {
  let id = window.localStorage.getItem('study_device_id')
  if (!id) {
    id = window.crypto.randomUUID()
    window.localStorage.setItem('study_device_id', id)
  }
  return id
}

async function sessionAction(accessToken, action, extra = {}) {
  config()
  const response = await fetch(`${SUPABASE_URL}/functions/v1/student-session`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, device_id: getDeviceId(), ...extra }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.error || '기기 로그인 확인에 실패했습니다.')
    error.status = response.status
    throw error
  }
  return data
}
export async function requestPasswordReset(email) {
  config()
  const redirectTo = `${window.location.origin}/reset-password`
  const response = await fetch(`${SUPABASE_URL}/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: String(email).trim() }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.msg || data.message || data.error_description || '재설정 메일을 요청하지 못했습니다.')
    error.status = response.status
    throw error
  }
  return true
}
export async function signIn(email, password) {
  const session = normalizeSession(await authRequest('token?grant_type=password', { email: String(email).trim(), password }))
  const access = await sessionAction(session.access_token, 'claim')
  const safeSession = stripGuardianPhone(session)
  return { ...safeSession, profile: access.profile || null, subscription: access.subscription || null }
}
export async function signUp(email, password) {
  const redirect = encodeURIComponent(window.location.origin)
  const data = await authRequest(`signup?redirect_to=${redirect}`, {
    email: String(email).trim(),
    password,
    data: { account_type: 'guardian' },
  })
  if (!data.session) return { needsEmailConfirmation: true }
  const session = normalizeSession(data.session)
  const access = await sessionAction(session.access_token, 'claim')
  const safeSession = stripGuardianPhone(session)
  return { session: { ...safeSession, profile: access.profile || null, subscription: access.subscription || null } }
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

export async function completeTrialSetup(accessToken, profile) {
  return sessionAction(accessToken, 'complete_trial', profile)
}
