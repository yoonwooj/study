// ⚠️ 임시 로그인입니다. 아이디·비밀번호가 앱 코드에 그대로 들어 있어서 보안용이 아니에요.
// (브라우저 개발자 도구로 누구나 볼 수 있어요.) 실제 서비스에서는 Supabase Auth 같은 서버 인증으로 바꾸세요.
const USERS = [{ id: 'admin', pw: '7788' }]
export const checkLogin = (id, pw) => USERS.some((u) => u.id === String(id).trim() && u.pw === pw)
