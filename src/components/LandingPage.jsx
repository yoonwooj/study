import HomepageQuestionPreview from './HomepageQuestionPreview.jsx'

const subjects = [
  { name: '국어', desc: '읽고 이해하고, 생각을 표현하는 힘', icon: '가', tone: 'kor' },
  { name: '사회', desc: '우리 주변과 세상을 알아가는 공부', icon: '⌖', tone: 'soc' },
  { name: '과학', desc: '관찰하고 질문하며 원리를 발견하는 공부', icon: '✳', tone: 'sci' },
]

export default function LandingPage() {
  return (
    <div className="marketing-site">
      <header className="marketing-header">
        <a className="marketing-brand" href="/" aria-label="홈으로">
          <span className="marketing-brand-mark">S</span>
          <span>매일 성장하는 공부 습관</span>
        </a>
        <nav className="marketing-nav" aria-label="주요 메뉴">
          <a href="#features">서비스 소개</a>
          <a href="#subjects">과목 안내</a>
          <a href="#preview">학습 미리보기</a>
        </nav>
        <div className="marketing-header-actions">
          <a className="marketing-login" href="/login">로그인</a>
          <a className="marketing-nav-cta" href="/trial">2주 무료 체험</a>
        </div>
      </header>

      <main>
        <section className="marketing-hero">
          <div className="marketing-hero-inner">
            <div className="marketing-hero-copy">
              <span className="marketing-kicker"><i /> 초등학생을 위한 매일 학습</span>
              <h1>하루 20문제,<br /><em>공부 습관</em>이 달라집니다.</h1>
              <p className="marketing-hero-lead">국어·사회·과학을 매일 조금씩. 부담은 가볍게, 배움은 꾸준하게 이어가세요.</p>
              <div className="marketing-hero-points">
                <span>✓ 하루 20문제</span><span>✓ PC·태블릿·모바일</span><span>✓ 약정 없이 시작</span>
              </div>
              <div className="marketing-hero-actions">
                <a className="marketing-button primary" href="/trial">첫 2주 무료로 시작하기 <span>→</span></a>
                <a className="marketing-text-link" href="#preview">실제 문제 먼저 보기</a>
              </div>
              <p className="marketing-hero-note">최초 1회 · 자동 결제 없음 · 카드 등록 없음</p>
            </div>
            <div className="marketing-hero-visual" aria-label="오늘의 학습 예시">
              <div className="marketing-float-label">TODAY'S STUDY <b>20문제</b></div>
              <div className="marketing-study-card">
                <div className="marketing-study-top"><span>오늘의 학습</span><span className="marketing-live-dot">매일 업데이트</span></div>
                <div className="marketing-study-title">오늘도 한 걸음,<br />꾸준히 성장해요!</div>
                <div className="marketing-study-progress"><span style={{width:'65%'}} /></div>
                <div className="marketing-study-meta"><span>오늘의 학습 진행</span><b>13 / 20</b></div>
                <div className="marketing-subject-list">
                  <div><i className="subject-icon kor">가</i><span><b>국어</b><small>읽고 이해하는 힘</small></span><strong>학습하기 ›</strong></div>
                  <div><i className="subject-icon soc">⌖</i><span><b>사회</b><small>세상을 알아가는 힘</small></span><strong>학습하기 ›</strong></div>
                  <div><i className="subject-icon sci">✳</i><span><b>과학</b><small>탐구하고 발견하는 힘</small></span><strong>학습하기 ›</strong></div>
                </div>
              </div>
              <div className="marketing-floating-sticker"><span>✦</span> 오늘의 작은 성취가<br />내일의 자신감으로</div>
            </div>
          </div>
        </section>

        <section className="marketing-proof" aria-label="서비스 핵심 특징">
          <div><b>20문제</b><span>매일 새로운 학습</span></div>
          <div><b>3과목</b><span>국어 · 사회 · 과학</span></div>
          <div><b>14일</b><span>무료로 먼저 경험</span></div>
          <div><b>언제 어디서나</b><span>기기 제한 없이 학습</span></div>
        </section>

        <section className="marketing-section marketing-features" id="features">
          <div className="marketing-section-heading">
            <span className="marketing-eyebrow">WHY DAILY STUDY</span>
            <h2>매일의 학습이 쌓이면<br />실력이 됩니다.</h2>
            <p>많은 양보다 중요한 건 꾸준함. 아이가 스스로 시작하고 끝까지 해내는 경험을 만듭니다.</p>
          </div>
          <div className="marketing-feature-grid">
            <article className="marketing-feature-card"><span className="feature-number">01</span><div className="feature-symbol">☀</div><h3>매일 새로운 20문제</h3><p>짧고 알찬 분량으로 매일 학습을 이어가고, 배운 내용을 자연스럽게 되짚어요.</p></article>
            <article className="marketing-feature-card"><span className="feature-number">02</span><div className="feature-symbol">◎</div><h3>다양한 문제 유형</h3><p>객관식, OX, 주관식 문제를 풀며 단순히 고르는 것을 넘어 스스로 답을 생각해요.</p></article>
            <article className="marketing-feature-card"><span className="feature-number">03</span><div className="feature-symbol">↗</div><h3>학습 결과와 취약점 확인</h3><p>학습 기록과 정답률을 확인하고, 어떤 부분을 더 공부하면 좋을지 살펴볼 수 있어요.</p></article>
          </div>
        </section>

        <section className="marketing-subject-section" id="subjects">
          <div className="marketing-section marketing-subject-inner">
            <div className="marketing-section-heading">
              <span className="marketing-eyebrow">3 CORE SUBJECTS</span>
              <h2>초등 핵심 과목을<br />하루 한 번 탄탄하게</h2>
              <p>국어·사회·과학, 꼭 필요한 과목에 집중합니다.</p>
            </div>
            <div className="marketing-subject-cards">
              {subjects.map((subject) => <article className={`marketing-subject-card ${subject.tone}`} key={subject.name}>
                <span className="marketing-subject-icon">{subject.icon}</span>
                <div><h3>{subject.name}</h3><p>{subject.desc}</p></div>
                <span className="marketing-subject-arrow">↗</span>
              </article>)}
            </div>
          </div>
        </section>

        <section className="marketing-section marketing-preview-section" id="preview">
          <div className="marketing-section-heading centered">
            <span className="marketing-eyebrow">REAL LEARNING PREVIEW</span>
            <h2>실제 학습 화면을<br />먼저 경험해 보세요.</h2>
            <p>서비스에서 사용하는 문제 풀이 화면으로 객관식·OX·주관식 유형을 확인할 수 있어요.</p>
          </div>
          <HomepageQuestionPreview />
          <div className="marketing-preview-cta"><p>우리 아이에게 맞는 학습인지 직접 확인해 보세요.</p><a className="marketing-button primary" href="/trial">2주 무료 체험 신청하기 <span>→</span></a></div>
        </section>

        <section className="marketing-extras">
          <div className="marketing-extra-card"><span>한자 학습</span><h3>한자 6·7·8급<br />읽기와 쓰기</h3><p>교과 학습과 함께 어휘의 기초를 다져요.</p><b>漢</b></div>
          <div className="marketing-extra-card quote"><span>매일의 한마디</span><h3>속담과 영어 명언으로<br />생각의 폭 넓히기</h3><p>짧은 문장 하나로 새로운 배움을 더해요.</p><b>“ ”</b></div>
        </section>

        <section className="marketing-final-cta">
          <span className="marketing-eyebrow">START YOUR 14 DAYS</span>
          <h2>오늘부터 가볍게,<br />매일의 공부를 시작해요.</h2>
          <p>첫 2주는 무료. 자동 결제와 카드 등록 없이 시작할 수 있어요.</p>
          <a className="marketing-button light" href="/trial">2주 무료 체험 시작하기 <span>→</span></a>
          <a className="marketing-final-login" href="/login">이미 계정이 있나요? 로그인</a>
        </section>
      </main>
      <footer className="marketing-footer"><a className="marketing-brand" href="/"><span className="marketing-brand-mark">S</span><span>매일 성장하는 공부 습관</span></a><span>국어 · 사회 · 과학 | 매일 꾸준한 학습</span></footer>
      <a className="marketing-mobile-cta" href="/trial">2주 무료 체험 시작하기 <span>→</span></a>
    </div>
  )
}
