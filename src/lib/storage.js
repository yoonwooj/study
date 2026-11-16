export const KEYS = { records: 'koreanQuizRecords3', notes: 'koreanQuizNotes1', notice: 'koreanQuizNoticeHide', name: 'koreanQuizName1', daily: 'koreanQuizDaily1' }
export const load = (key, fallback) => {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback } catch { return fallback }
}
export const save = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* 저장 불가 시 무시 */ }
}
