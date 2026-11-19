export const KEYS = {
  records: 'koreanQuizRecords3',
  notes: 'koreanQuizNotes1',
  notice: 'koreanQuizNoticeHide',
  name: 'koreanQuizName1',
  daily: 'koreanQuizDaily1',
  auth: 'koreanQuizAuth1',
}
export const load = (key, fallback) => {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback } catch { return fallback }
}
export const save = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* 저장 불가 시 무시 */ }
}
export const userStorageKey = (key, userId) => `${key}::${userId}`
export const loadUser = (key, userId, fallback) => {
  if (!userId) return fallback
  return load(userStorageKey(key, userId), fallback)
}
export const saveUser = (key, userId, value) => {
  if (!userId) return
  save(userStorageKey(key, userId), value)
}
// 기존 단일 브라우저 기록은 이미 로그인된 계정이 확인될 때에만 그 계정으로 이전합니다.
export const migrateLegacyUserData = (userId) => {
  if (!userId) return
  for (const key of [KEYS.records, KEYS.notes, KEYS.daily]) {
    const scoped = userStorageKey(key, userId)
    try {
      if (localStorage.getItem(scoped) === null) {
        const legacy = localStorage.getItem(key)
        if (legacy !== null) localStorage.setItem(scoped, legacy)
      }
      localStorage.removeItem(key)
    } catch { /* 저장소 접근이 제한된 경우 무시 */ }
  }
}
