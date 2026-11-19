const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

function config() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('.env 파일에 VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 설정해 주세요.')
  }
}
async function rest(path, params = {}) {
  config()
  const url = new URL(`${SUPABASE_URL}/rest/v1/${path}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
  const response = await fetch(url, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.message || body.error || `Supabase 요청 실패 (${response.status})`)
  return body
}
async function studentQuizRequest(accessToken, body) {
  config()
  const response = await fetch(`${SUPABASE_URL}/functions/v1/student-daily-quiz`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.error || '학습 요청을 처리하지 못했습니다.')
    error.status = response.status
    throw error
  }
  return data
}
export async function fetchCatalogUnits({ grade, semester, subject }) {
  return rest('textbook_units', {
    select: 'id,grade,semester,publisher,subject,unit_number,unit_name,learning_goal,verification_status,source_note,catalog_record_id',
    grade: `eq.${grade}`,
    semester: `eq.${semester}`,
    subject: `eq.${subject}`,
    order: 'publisher.asc,unit_number.asc'
  })
}
export async function startStudentDailyQuiz(accessToken, { grade, semester, subject, unitName = '' }) {
  return studentQuizRequest(accessToken, { action: 'start', grade, semester, subject, unitName })
}
export async function submitStudentDailyAnswer(accessToken, { sessionId, questionIndex, answer }) {
  return studentQuizRequest(accessToken, {
    action: 'submit',
    session_id: sessionId,
    question_index: questionIndex,
    answer,
  })
}
