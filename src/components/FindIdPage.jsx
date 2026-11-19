import React from 'react'

export default function FindIdPage() {
  const styles = {
    page: { minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 20, background: '#f4f6fb', color: '#182230', fontFamily: '"Noto Sans KR", sans-serif' },
    card: { width: '100%', maxWidth: 440, padding: 28, borderRadius: 20, background: '#fff', boxShadow: '0 12px 40px rgba(20,35,60,.10)' },
    eyebrow: { color: '#3867e8', fontSize: 12, fontWeight: 800, letterSpacing: '.12em' },
    title: { margin: '8px 0', fontSize: 25, fontWeight: 800 },
    desc: { color: '#667085', fontSize: 14, lineHeight: 1.7 },
    link: { display: 'block', marginTop: 18, textAlign: 'center', color: '#3867e8', fontSize: 14, fontWeight: 700, textDecoration: 'none' },
    note: { padding: 16, borderRadius: 12, background: '#f1f5ff', color: '#334155', fontSize: 14, lineHeight: 1.7 },
  }
  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.eyebrow}>ACCOUNT HELP</div>
        <h1 style={styles.title}>아이디 찾기</h1>
        <p style={styles.desc}>이 서비스의 아이디는 회원가입할 때 입력한 이메일 주소입니다.</p>
        <div style={styles.note}>
          <strong>이메일 주소가 기억나지 않나요?</strong><br />
          자주 사용하는 이메일의 받은편지함에서 가입 확인 메일을 검색해 보세요. 가입 당시 사용한 이메일을 확인할 수 있습니다.
        </div>
        <p style={styles.desc}>계정 이메일을 확인할 수 없다면 보호자에게 가입에 사용한 이메일을 확인하거나 서비스 운영자에게 문의해 주세요. 본인 확인 수단이 등록되어 있지 않아 이름이나 학년만으로 이메일을 조회해 드리지는 않습니다.</p>
        <a style={styles.link} href="/">로그인으로 돌아가기</a>
      </section>
    </main>
  )
}
