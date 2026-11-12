// c(문제, [보기 4개], 정답 번호(0~3), 해설)  x(문제, true|false, 해설)  s(문제, [정답들], 해설)
export const c = (q, o, a, e) => ({ t: 'c', q, o, a, e })
export const x = (q, a, e) => ({ t: 'ox', q, a, e })
export const s = (q, a, e) => ({ t: 's', q, a, e })
