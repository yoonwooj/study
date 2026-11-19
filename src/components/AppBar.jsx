import { SUBJECTS } from '../curriculum.js'

// 왼쪽: 과목 탭 / 오른쪽: 사용자 이름 + 햄버거 메뉴
// hideSubj가 true면 과목 탭을 아예 그리지 않고, title이 있으면 그 자리에 페이지 제목만 보여줘요.
export default function AppBar({ subj, onSubj, name, onName, onMenu, title, hideSubj }) {
  return (
    <header className="appbar">
      {hideSubj ? (
        title ? <h1 className="ab-title">{title}</h1> : <span />
      ) : (
        <div className="subj" role="group" aria-label="과목 선택">
          {Object.entries(SUBJECTS).map(([k, v]) => <button key={k} aria-pressed={subj === k} onClick={() => onSubj(k)}>{v}</button>)}
        </div>
      )}
      {/* .ab-right: 나중에 로그인하면 사용자 이름이 표시될 자리예요. 지금은 임시로 닉네임(눌러서 변경)을 보여줘요. */}
      <div className="ab-right">
        <button className="name" onClick={onName} aria-label="이름 바꾸기">👤 {name}</button>
        <button className="burger" onClick={onMenu} aria-label="메뉴 열기">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 7h16M4 12h10M4 17h16" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" /></svg>
        </button>
      </div>
    </header>
  )
}
