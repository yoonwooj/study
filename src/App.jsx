import { useCallback, useState } from 'react'
import { MAX_UNITS, CORE_N, shuffle, prep, isRight, coreQs, unitQs } from './lib/quiz.js'
import { KEYS, load, save } from './lib/storage.js'
import { ymd, streakFrom } from './lib/date.js'
import { dailyQs } from './lib/daily.js'
import { unitsOf, editionsOf } from './curriculum.js'
import { SUBJECT_THEME } from './lib/theme.js'
import AppBar from './components/AppBar.jsx'
import SideMenu from './components/SideMenu.jsx'
import TabBar from './components/TabBar.jsx'
import CatalogLearnPage from './components/CatalogLearnPage.jsx'
import NotesPage from './components/NotesPage.jsx'
import RecordsPage from './components/RecordsPage.jsx'
import WeekPage from './components/WeekPage.jsx'
import HanjaPage from './components/HanjaPage.jsx'
import SciencePage from './components/SciencePage.jsx'
import DailyPage from './components/DailyPage.jsx'
import LoginPage from './components/LoginPage.jsx'
import QuizScreen from './components/QuizScreen.jsx'
import ResultScreen from './components/ResultScreen.jsx'
import NoticeModal from './components/NoticeModal.jsx'

const SHOW_PAGE_TITLE = true // 하루한자·과학상식에서 과목 탭 대신 제목을 보여줄지 (false면 빈 칸)
const SHOW_NOTICE = false // 안내 팝업 임시 비활성화 (다시 켜려면 true)
const today = () => new Date().toDateString()

export default function App() {
  const [tab, setTab] = useState('learn') // learn | note | rec | week | hanja | sci
  const [menuOpen, setMenuOpen] = useState(false)
  const [auth, setAuth] = useState(() => load(KEYS.auth, null)) // 로그인한 사용자 { user }
  const [focusUnit, setFocusUnit] = useState(-1)
  const [subj, setSubj] = useState('kor')
  const [catSubject, setCatSubject] = useState('') // 카탈로그에서 고른 과목 이름 (테마색용)
  const onCatSel = useCallback((s) => setCatSubject(s.subject), [])
  const [grade, setGrade] = useState(1)
  const [edition, setEdition] = useState('')
  const [sem, setSem] = useState(1)
  const [mode, setMode] = useState('unit')
  const [picked, setPicked] = useState([])
  const [run, setRun] = useState(null)
  const [text, setText] = useState('')
  const [records, setRecords] = useState(() => load(KEYS.records, []))
  const [notes, setNotes] = useState(() => load(KEYS.notes, []))
  const [noteGrade, setNoteGrade] = useState('all')
  const [daily, setDaily] = useState(() => load(KEYS.daily, {}))
  const [dailyGrade, setDailyGrade] = useState(1)
  const [notice, setNotice] = useState(() => SHOW_NOTICE && load(KEYS.notice, '') !== today())

  const streak = streakFrom(new Set(Object.keys(daily).map((k) => k.split('|')[0])))
  const editions = subj === 'eng' ? editionsOf(grade) : []
  const ed = subj === 'eng' ? (editions.find((e) => e.id === edition) || editions[0] || {}).id : undefined
  const coreBest = (g, s) => records.filter((r) => r.subj === subj && r.g === g && r.s === s && r.kind === 'core' && r.ed === ed).reduce((m, r) => Math.max(m, r.score), -1)
  const reset = () => { setPicked([]); setRun(null); setText(''); setFocusUnit(-1) }
  const pickSubj = (sj) => {
    setSubj(sj)
    if (sj === 'eng') { setSem(1); setGrade((g) => (g < 3 ? 3 : g)) }
    reset()
  }
  const pickGrade = (g) => { setGrade(g); setDailyGrade(g); setEdition(''); reset() }
  const pickSem = (s) => { setSem(s); reset() }
  const pickMode = (m) => { setMode(m); if (m === 'core') setPicked([]) }
  const toggle = (i) => setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : p.length < MAX_UNITS ? [...p, i] : p))
  const name = auth ? auth.user : ''
  const handleLogin = ({ user, settings }) => {
    const a = { user, settings: settings || null } // settings: 로그인 화면의 ⚙ 설정 (학년·학기·과목·단원)
    setAuth(a); save(KEYS.auth, a)
    if (settings) { setGrade(settings.grade); setSem(settings.semester); setDailyGrade(settings.grade); setCatSubject(settings.subject) }
    setRun(null); setTab('learn'); setMenuOpen(false)
  }
  const logout = () => { setAuth(null); save(KEYS.auth, null); setMenuOpen(false); setRun(null); setTab('learn') }
  const goMenu = (k) => { setTab(k); setMenuOpen(false); window.scrollTo(0, 0) }

  const begin = (qs, label, kind, retry = false, extra = {}) => {
    setText('')
    setRun({ qs, i: 0, ans: null, ok: null, score: 0, wrongs: [], finished: false, retry, saved: false, label, kind, ...extra })
  }
  const startDaily = (g) => begin(dailyQs(g), `${g}학년`, 'daily', false, { dgrade: g })
  const startCatalog = (qs, label, meta) => {
    setGrade(meta.grade)
    setSem(meta.semester)
    const subjectKey = ({ '국어': 'kor', '통합': 'mor', '사회': 'soc', '과학': 'sci', '도덕': 'eth', '바른생활': 'eth' })[meta.subject] || 'kor'
    setSubj(subjectKey)
    begin(qs, label, 'unit', false, { catalogMeta: meta })
  }
  const startCore = () => begin(coreQs(subj, grade, sem, ed), '학기 핵심 문제', 'core')
  const startUnits = () => {
    const units = unitsOf(subj, grade, sem, ed)
    const order = [...picked].sort((a, b) => a - b)
    begin(order.flatMap((i) => unitQs(subj, grade, sem, i, ed)), order.map((i) => units[i]).join(', '), 'unit')
  }
  const startNotes = (list) => begin(
    shuffle(list).slice(0, CORE_N).map((nt) => ({ ...prep(nt.q, nt.unit), _ctx: { subj: nt.subj, g: nt.g, s: nt.s, ed: nt.ed } })),
    '오답노트 복습', 'note')

  const updateNotes = (fn) => setNotes((p) => { const n = fn(p); save(KEYS.notes, n); return n })
  const delNote = (key) => updateNotes((p) => p.filter((x) => x.key !== key))
  const submit = (v) => {
    const q = run.qs[run.i]
    const ok = isRight(q, v)
    const ctx = q._ctx || { subj, g: grade, s: sem, ed }
    const key = `${ctx.subj}|${ctx.g}|${ctx.s}|${ctx.ed ? ctx.ed + '|' : ''}${q.q}`
    if (ok) updateNotes((p) => (p.some((x) => x.key === key) ? p.filter((x) => x.key !== key) : p))
    else updateNotes((p) => (p.some((x) => x.key === key) ? p : [{ key, ...ctx, unit: q.unit, at: Date.now(), q: { t: q.t, q: q.q, o: q.o, a: q.a, e: q.e } }, ...p].slice(0, 300)))
    setRun({ ...run, ans: v, ok, score: run.score + (ok ? 1 : 0), wrongs: ok ? run.wrongs : [...run.wrongs, q] })
  }
  const next = () => {
    setText('')
    if (run.i + 1 < run.qs.length) return setRun({ ...run, i: run.i + 1, ans: null, ok: null })
    let saved = false
    if (!run.retry && run.kind !== 'note') {
      const isDaily = run.kind === 'daily'
      const r = [...records, { subj, g: isDaily ? run.dgrade : grade, s: isDaily ? 0 : sem, ed, kind: run.kind, label: run.label, score: run.score, total: run.qs.length, at: Date.now() }]
      setRecords(r); save(KEYS.records, r); saved = true
      if (isDaily) {
        const k = `${ymd()}|${run.dgrade}`
        const d = { ...daily, [k]: { score: Math.max(daily[k] ? daily[k].score : 0, run.score), total: run.qs.length } }
        setDaily(d); save(KEYS.daily, d)
      }
    }
    return setRun({ ...run, finished: true, saved })
  }
  const quit = () => { if (window.confirm('풀이를 그만할까요? (점수는 저장되지 않아요)')) setRun(null) }
  const clearAll = () => { if (window.confirm('저장된 점수 기록을 모두 지울까요?')) { setRecords([]); save(KEYS.records, []) } }
  const hideNoticeToday = () => { save(KEYS.notice, today()); setNotice(false) }

  if (!auth) return <LoginPage onLogin={handleLogin} />

  // 문제 풀이·결과 화면의 테마: 카탈로그에서 시작했으면 그 과목 색, 아니면 기존 과목 키
  const runTheme = (run && run.catalogMeta && SUBJECT_THEME[run.catalogMeta.subject]) || subj

  if (run && !run.finished) {
    return <QuizScreen run={run} subj={subj} theme={runTheme} text={text} onText={setText} onSubmit={submit} onNext={next} onQuit={quit} />
  }
  if (run && run.finished) {
    return <ResultScreen run={run} subj={subj} theme={runTheme} grade={grade} sem={sem} onRetryWrong={() => begin(shuffle(run.wrongs), run.label, run.kind, true)} onHome={() => setRun(null)} />
  }

  // 하루한자·과학상식은 과목과 별개의 테마색을 쓰고, 상단의 과목 탭 대신 제목을 보여줘요.
  const special = { hanja: '📜 하루한자', sci: '🔬 과학상식' }
  const theme = special[tab] ? tab : (SUBJECT_THEME[catSubject] || subj)

  return (
    <div className="app" data-subject={theme}>
      <AppBar subj={subj} onSubj={pickSubj} name={name} onName={() => setMenuOpen(true)} onMenu={() => setMenuOpen(true)} hideSubj title={special[tab] || '단원별 학습'} />

      {tab === 'learn' && (
        <CatalogLearnPage initialGrade={grade} initialSemester={sem} lock={auth.settings || null} onStart={startCatalog} onSelectionChange={onCatSel} />
      )}
      {tab === 'note' && <NotesPage subj={subj} notes={notes} noteGrade={noteGrade} onNoteGrade={setNoteGrade} onDelete={delNote} onStart={startNotes} />}
      {tab === 'rec' && <RecordsPage subj={subj} records={records} coreBest={coreBest} onClear={clearAll} />}
      {tab === 'daily' && <DailyPage grade={dailyGrade} onGrade={setDailyGrade} onlyGrade={auth.settings ? auth.settings.grade : undefined} daily={daily} streak={streak} onStart={startDaily} />}
      {tab === 'week' && <WeekPage records={records} />}
      {tab === 'hanja' && <HanjaPage />}
      {tab === 'sci' && <SciencePage />}

      <TabBar tab={tab} onTab={setTab} noteCount={notes.length} />
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} onGo={goMenu} onLogout={logout} name={name} />
      {notice && <NoticeModal onHideToday={hideNoticeToday} onClose={() => setNotice(false)} />}
    </div>
  )
}
