// 문제 작성 도우미
// mc(문제, [정답, 오답, 오답, 오답], 해설): 정답을 항상 첫 번째로 쓰면 앱이 보기를 섞어 줘요.
// ox(문제, true|false, 해설): 단원마다 O 하나, X 하나가 되도록 작성하세요.
// sa(문제, [정답들], 해설): 주관식
export const mc = (q, o, e) => ({ t: 'c', q, o, a: 0, e })
export const ox = (q, a, e) => ({ t: 'ox', q, a, e })
export const sa = (q, a, e) => ({ t: 's', q, a, e })
