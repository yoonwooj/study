export default function TabBar({ tab, onTab, noteCount }) {
  return (
    <nav className="tabbar">
      <button aria-current={tab === 'learn'} onClick={() => onTab('learn')}><span>📖</span>학습</button>
      <button aria-current={tab === 'note'} onClick={() => onTab('note')}><span>📝</span>오답노트{noteCount > 0 && <i className="bdg">{noteCount > 99 ? '99+' : noteCount}</i>}</button>
      <button aria-current={tab === 'rec'} onClick={() => onTab('rec')}><span>📊</span>기록</button>
    </nav>
  )
}
