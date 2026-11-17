import { useEffect } from 'react'

const ITEMS = [
  { k: 'daily', icon: '⭐', label: '오늘의 학습' },
  { k: 'week', icon: '📅', label: '이번주 학습 전체보기' },
  { k: 'hanja', icon: '📜', label: '하루한자' },
  { k: 'sci', icon: '🔬', label: '과학상식' },
]

// 열리면 뒤쪽 화면이 어두워지는(딤 처리) 오른쪽 메뉴
export default function SideMenu({ open, onClose, onGo, onLogout, name }) {
  useEffect(() => {
    if (!open) return undefined
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])

  return (
    <>
      <div className={'dim' + (open ? ' on' : '')} onClick={onClose} aria-hidden="true" />
      <aside className={'drawer' + (open ? ' on' : '')} role="dialog" aria-modal="true" aria-label="메뉴">
        <div className="drawer-head"><b>메뉴</b><button className="icon" onClick={onClose} aria-label="메뉴 닫기">✕</button></div>
        <p className="sub">{name}님, 오늘도 한 걸음 더!</p>
        <nav className="drawer-list">
          {ITEMS.map((it) => (
            <button key={it.k} onClick={() => onGo(it.k)}><span>{it.icon}</span>{it.label}<i>›</i></button>
          ))}
        </nav>
        <button className="logout" onClick={onLogout}>로그아웃</button>
      </aside>
    </>
  )
}
