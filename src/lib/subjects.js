// 학년별로 보이는 과목: 1·2학년은 국어·통합·바른생활, 3~6학년은 국어·사회·과학
export const subjectsFor = (grade) => (grade <= 2 ? ['국어', '통합', '바른생활'] : ['국어', '사회', '과학'])
export const defaultSubject = (grade) => (grade <= 2 ? '통합' : '국어')

// 화면에 보이는 과목 이름 → Supabase textbook_units.subject 값.
// DB에 저장된 이름이 다르면(예: '바른 생활', '도덕') 여기만 바꾸세요.
const SUBJECT_DB = { 바른생활: '바른생활' }
export const dbSubject = (label) => SUBJECT_DB[label] || label
