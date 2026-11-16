// 오늘 날짜를 숫자로 바꿔서 "매일 바뀌는" 학습 콘텐츠를 고를 때 써요.
export const dayIndex = (d = new Date()) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000)
export const ymd = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
// 오늘(오늘 안 했으면 어제)부터 거꾸로 연속으로 학습한 날 수
export const streakFrom = (dates) => {
  const d = new Date()
  if (!dates.has(ymd(d))) d.setDate(d.getDate() - 1)
  let n = 0
  while (dates.has(ymd(d))) { n++; d.setDate(d.getDate() - 1) }
  return n
}
export const todayLabel = () => new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })
export const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
