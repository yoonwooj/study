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
export const seoulYmd = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit'
}).format(new Date())

export async function fetchCatalogUnits({ grade, semester, subject }) {
  return rest('textbook_units', {
    select: 'id,grade,semester,publisher,subject,unit_number,unit_name,learning_goal,verification_status,source_note,catalog_record_id',
    grade: `eq.${grade}`,
    semester: `eq.${semester}`,
    subject: `eq.${subject}`,
    order: 'publisher.asc,unit_number.asc'
  })
}
export async function fetchTodayGeneration() {
  const rows = await rest('generation_runs', {
    select: 'id,generation_date,status,requested_count,generated_count,error_message',
    generation_date: `eq.${seoulYmd()}`,
    status: 'eq.completed',
    limit: '1'
  })
  return rows[0] || null
}
export async function fetchDailyQuestions(unitIds, unitRows = []) {
  if (!unitIds?.length) throw new Error('단원을 먼저 선택해 주세요.')
  const run = await fetchTodayGeneration()
  if (!run) throw new Error('오늘의 문제 세트가 아직 준비되지 않았어요. 매일 오전 4시 이후 다시 확인해 주세요.')
  const ids = `(${unitIds.join(',')})`
  const rows = await rest('questions', {
    select: 'id,unit_id,question,question_type,options,answer,explanation,difficulty',
    generation_run_id: `eq.${run.id}`,
    unit_id: `in.${ids}`,
    order: 'id.asc'
  })
  if (rows.length < 20) throw new Error(`오늘 선택한 단원의 문제는 ${rows.length}개만 준비되어 있어요. 생성 상태를 확인해 주세요.`)
  const shuffled = [...rows]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, 20).map((row) => {
    const options = Array.isArray(row.options) ? row.options : []
    const unitInfo = unitRows.find((u) => u.id === row.unit_id)
    const subjectKey = ({ '국어': 'kor', '통합': 'mor', '사회': 'soc', '과학': 'sci', '도덕': 'eth', '바른생활': 'eth' })[unitInfo?.subject] || 'kor'
    return {
      t: 'c',
      q: row.question,
      o: options,
      a: options.indexOf(row.answer),
      e: row.explanation || '',
      unit: unitRows.find((u) => u.id === row.unit_id)?.unit_name || '',
      difficulty: row.difficulty,
      _dbId: row.id,
      _ctx: {
        subj: subjectKey,
        g: unitInfo?.grade,
        s: unitInfo?.semester,
        unit_id: row.unit_id,
        generation_run_id: run.id
      }
    }
  })
}
