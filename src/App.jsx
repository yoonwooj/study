import { useCallback, useEffect, useState } from 'react'
import { checkStudentSession, refreshSessionIfNeeded, releaseStudentSession } from './lib/auth.js'
import { CORE_N, shuffle, prep, isRight } from './lib/quiz.js'
import { KEYS, load, save, loadUser, saveUser, migrateLegacyUserData } from './lib/storage.js'
import { startStudentDailyQuiz, submitStudentDailyAnswer } from './lib/supabase.js'
import { ymd, streakFrom } from './lib/date.js'
import { editionsOf } from './curriculum.js'
import { SUBJECT_THEME } from './lib/theme.js'
import { defaultSubject } from './lib/subjects.js'
import AppBar from './components/AppBar.jsx'
import SideMenu from './components/SideMenu.jsx'
import TabBar from './components/TabBar.jsx'
import NotesPage from './components/NotesPage.jsx'
import RecordsPage from './components/RecordsPage.jsx'
import WeekPage from './components/WeekPage.jsx'
import HanjaPage from './components/HanjaPage.jsx'
import DailyWisdomPage from './components/DailyWisdomPage.jsx'
import DailyPage from './components/DailyPage.jsx'
import LoginPage from './components/LoginPage.jsx'
import SignupPage from './components/SignupPage.jsx'
import TrialPage from './components/TrialPage.jsx'
import PaymentPage from './components/PaymentPage.jsx'
import QuizScreen from './components/QuizScreen.jsx'
import ResultScreen from './components/ResultScreen.jsx'
import NoticeModal from './components/NoticeModal.jsx'
import AdminPage from './components/AdminPage.jsx'
import PasswordRecoveryPage from './components/PasswordRecoveryPage.jsx'
import FindIdPage from './components/FindIdPage.jsx'
import PasswordResetRequestPage from './components/PasswordResetRequestPage.jsx'

const SHOW_NOTICE = false // 안내 팝업 임시 비활성화 (다시 켜려면 true)
const today = () => new Date().toDateString()

const SUBJECT_CODE_BY_NAME = {
  국어: 'kor',
  통합: 'int',
  바른생활: 'eth',
  사회: 'soc',
  과학: 'sci',
  도덕: 'eth',
  영어: 'eng',
}

export default function App() {
  const storedAuth = load(KEYS.auth, null)
  const initialAuth = storedAuth?.access_token ? storedAuth : null
  if (initialAuth?.user?.id) migrateLegacyUserData(initialAuth.user.id)
  const initialSettings = initialAuth?.settings || null

  const [tab, setTab] = useState('learn') // learn | note | rec | week | hanja | sci | daily
  const [menuOpen, setMenuOpen] = useState(false)
  const [auth, setAuth] = useState(initialAuth) // Supabase Auth 사용자 세션
  const [loginNotice, setLoginNotice] = useState(storedAuth && !storedAuth.access_token ? '로그인 방식이 변경되었습니다. Supabase 계정의 이메일과 비밀번호로 다시 로그인해 주세요.' : '')
  const [, setFocusUnit] = useState(-1)
  const [subj, setSubj] = useState('kor')
  const [catSubject, setCatSubject] = useState(initialSettings?.subject || '') // 테마색용
  const [dailySubject, setDailySubject] = useState(() => defaultSubject(initialSettings?.grade ? Number(initialSettings.grade) : 1))
  const onCatSel = useCallback((s) => setCatSubject(s.subject), [])
  const [grade, setGrade] = useState(initialSettings?.grade ? Number(initialSettings.grade) : 1)
  const [edition, setEdition] = useState('')
  const [sem, setSem] = useState(initialSettings?.semester ? Number(initialSettings.semester) : 1)
  const [, setPicked] = useState([])
  const [run, setRun] = useState(null)
  const [text, setText] = useState('')
  const [records, setRecords] = useState(() => loadUser(KEYS.records, initialAuth?.user?.id, []))
  const [notes, setNotes] = useState(() => loadUser(KEYS.notes, initialAuth?.user?.id, []))
  const [daily, setDaily] = useState(() => loadUser(KEYS.daily, initialAuth?.user?.id, {}))
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizError, setQuizError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [dailyGrade, setDailyGrade] = useState(initialSettings?.grade ? Number(initialSettings.grade) : 1)
  const [dailySem, setDailySem] = useState(initialSettings?.semester ? Number(initialSettings.semester) : null)
  const [dailyUnitName, setDailyUnitName] = useState(initialSettings?.unitName || '')
  const [notice, setNotice] = useState(() => SHOW_NOTICE && load(KEYS.notice, '') !== today())
  const [renewalDismissed, setRenewalDismissed] = useState(false)

  useEffect(() => {
    const s = auth?.settings
    if (s?.grade) {
      const g = Number(s.grade)
      setGrade(g)
      setDailyGrade(g)
    }
    if (s?.semester) {
      const sm = Number(s.semester)
      setSem(sm)
      setDailySem(sm)
    }
    setDailyUnitName(s?.unitName || '')
  }, [auth])

  const streak = streakFrom(new Set(Object.keys(daily).map((k) => k.split('|')[0])))
  const editions = subj === 'eng' ? editionsOf(grade) : []
  const ed = subj === 'eng' ? (editions.find((e) => e.id === edition) || editions[0] || {}).id : undefined
  const coreBest = (g, s) =>
    records
      .filter((r) => r.subj === subj && r.g === g && r.s === s && r.kind === 'core' && r.ed === ed)
      .reduce((m, r) => Math.max(m, r.score), -1)
  const reset = () => {
    setPicked([])
    setRun(null)
    setText('')
    setFocusUnit(-1)
  }
  const pickSubj = (sj) => {
    setSubj(sj)
    if (sj === 'eng') {
      setSem(1)
      setGrade((g) => (g < 3 ? 3 : g))
    }
    reset()
  }
  const handleDailySubject = (subjName) => {
    setDailySubject(subjName)
    setCatSubject(subjName)
    setSubj(SUBJECT_CODE_BY_NAME[subjName] || 'kor')
  }
  const handleSubjThemeChange = (code) => {
    setSubj(code)
    setCatSubject(code)
  }
  const name = auth ? (typeof auth.user === 'string' ? auth.user : auth.user?.email || '') : ''
  const handleLogin = async ({ user, settings, session }) => {
    const verifiedSession = session
    const assignedGrade = Number(verifiedSession?.profile?.grade || verifiedSession?.user?.user_metadata?.grade) || null
    const nextSettings = settings
      ? {
          ...settings,
          grade: Number(settings.grade) || assignedGrade || 1,
          semester: settings.semester != null ? Number(settings.semester) : null,
          unitName: settings.unitName || '',
        }
      : assignedGrade
        ? { grade: assignedGrade, semester: null, unitName: '', subject: defaultSubject(assignedGrade) }
        : null
    const a = { user, settings: nextSettings, ...verifiedSession }
    setRecords(loadUser(KEYS.records, session.user.id, []))
    setNotes(loadUser(KEYS.notes, session.user.id, []))
    setDaily(loadUser(KEYS.daily, session.user.id, {}))
    setAuth(a)
    setLoginNotice('')
    save(KEYS.auth, a)
    const nextGrade = nextSettings?.grade || 1
    const nextSubject = nextSettings?.subject || defaultSubject(nextGrade)
    setGrade(nextGrade)
    setSem(nextSettings?.semester || 1)
    setDailyGrade(nextGrade)
    setDailySem(nextSettings ? nextSettings.semester : null)
    setDailyUnitName(nextSettings?.unitName || '')
    setDailySubject(nextSubject)
    setCatSubject(nextSubject)
    setSubj(SUBJECT_CODE_BY_NAME[nextSubject] || 'kor')
    setEdition('')
    setRun(null)
    setTab('learn')
    setMenuOpen(false)
  }
  const handlePaymentComplete = (result) => {
    const profile = result?.profile || {}
    const grade = Number(profile.grade) || 1
    const settings = { grade, semester: null, unitName: '', subject: defaultSubject(grade) }
    const updated = { ...auth, settings, profile, subscription: result?.subscription || null }
    setAuth(updated)
    save(KEYS.auth, updated)
    window.location.replace('/')
  }
  const logout = async () => {
    await releaseStudentSession(auth?.access_token)
    setAuth(null)
    save(KEYS.auth, null)
    setRecords([]); setNotes([]); setDaily({})
    setQuizError(''); setSubmitError(''); setQuizLoading(false); setSubmitting(false)
    setDailySem(null)
    setDailyUnitName('')
    setDailyGrade(1)
    setGrade(1)
    setSem(1)
    setDailySubject(defaultSubject(1))
    setCatSubject(defaultSubject(1))
    setSubj('kor')
    setEdition('')
    setMenuOpen(false)
    setRun(null)
    setTab('learn')
  }
  // 로그인한 모든 학습 계정에 30분 비활동 자동 로그아웃을 적용합니다.
  useEffect(() => {
    if (!auth?.access_token) return undefined

    let timer
    let expired = false
    const resetIdleTimer = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(async () => {
        if (expired) return
        expired = true
        window.alert('30분 동안 동작이 없어 자동 로그아웃됩니다.')
        await logout()
      }, 30 * 60 * 1000)
    }
    const activityEvents = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart', 'wheel']
    activityEvents.forEach((eventName) => window.addEventListener(eventName, resetIdleTimer, { passive: true }))
    resetIdleTimer()

    return () => {
      window.clearTimeout(timer)
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, resetIdleTimer))
    }
  }, [auth?.access_token])

  useEffect(() => {
    if (!auth?.access_token) return undefined
    let alive = true
    const validateSession = async () => {
      try {
        const refreshed = await refreshSessionIfNeeded(auth)
        if (!alive) return
        if (refreshed.access_token !== auth.access_token || refreshed.refresh_token !== auth.refresh_token) {
          const updated = { ...auth, ...refreshed }
          setAuth(updated)
          save(KEYS.auth, updated)
        }
        const active = await checkStudentSession(refreshed.access_token)
        if (!alive || active) return
        save(KEYS.auth, null)
        setAuth(null)
        setRecords([]); setNotes([]); setDaily({}); setRun(null)
        setLoginNotice('다른 기기에서 같은 계정으로 로그인하여 현재 기기의 접속이 종료되었습니다.')
      } catch (error) {
        if (!alive) return
        if (error.status === 401) {
          save(KEYS.auth, null)
          setAuth(null)
          setRecords([]); setNotes([]); setDaily({}); setRun(null)
          setLoginNotice('로그인 세션이 만료되었습니다. 다시 로그인해 주세요.')
        } else console.warn('세션 확인을 일시적으로 완료하지 못했습니다.', error)
      }
    }
    validateSession()
    const timer = window.setInterval(validateSession, 12000)
    window.addEventListener('focus', validateSession)
    return () => { alive = false; window.clearInterval(timer); window.removeEventListener('focus', validateSession) }
  }, [auth?.access_token])

  const goMenu = (k) => {
    setTab(k)
    setMenuOpen(false)
    window.scrollTo(0, 0)
  }

  const begin = (qs, label, kind, retry = false, extra = {}) => {
    setText('')
    setSubmitError('')
    setRun({
      qs,
      i: 0,
      ans: null,
      ok: null,
      score: 0,
      wrongs: [],
      finished: false,
      retry,
      saved: false,
      label,
      kind,
      ...extra,
    })
  }
  const startDaily = async (g, s = dailySem, subjName = dailySubject, uName = dailyUnitName) => {
    const activeGrade = Number(auth?.settings?.grade ?? g) || 1
    const activeSem =
      auth?.settings?.semester != null
        ? Number(auth.settings.semester)
        : s != null
          ? Number(s)
          : null
    const activeUnit = auth?.settings?.unitName ?? uName ?? ''
    const label = `${activeGrade}학년${activeSem ? ` ${activeSem}학기` : ''}${activeUnit ? ` · ${activeUnit}` : subjName ? ` · ${subjName}` : ''}`
    setQuizLoading(true)
    setQuizError('')
    try {
      const previewRequested = new URLSearchParams(window.location.search).get('preview') === '1'
      // Visual-only preview: use the existing sample questions directly in QuizScreen.
      // This intentionally bypasses the 20-question server gate and never saves a result.
      const previewSamples = {
        국어: {
          unit: '경험과 관련지으며 이해해요',
          questions: [
            {
              t: 'c',
              q: '다음 글을 읽고 민지의 마음으로 가장 알맞은 것은? “민지는 처음으로 반 친구들 앞에서 책을 읽었다. 목소리가 조금 떨렸지만, 친구들이 끝까지 들어 주고 박수를 보내자 환하게 웃었다.”',
              o: ['친구들이 자신을 놀릴까 봐 화가 났다', '책 읽기가 지루해서 빨리 끝내고 싶었다', '친구들의 응원에 뿌듯하고 기뻤다', '다시는 책을 읽지 않겠다고 생각했다'],
              a: 2,
              e: '친구들이 끝까지 들어 주고 박수를 보내자 민지가 환하게 웃었어요. 응원받은 기쁨과 뿌듯함을 느꼈다고 볼 수 있어요.',
            },
            {
              t: 'ox',
              q: '글을 읽으며 자신의 경험을 떠올리면 인물의 마음과 글의 내용을 더 잘 이해할 수 있어요.',
              a: true,
              e: '자신의 경험과 글의 내용을 연결하면 인물의 마음과 상황을 더 깊이 이해할 수 있어요.',
            },
            {
              t: 's',
              q: '글의 내용과 관련 있는 자신의 경험을 떠올리며 읽는 방법을 무엇이라고 할까요?',
              a: ['경험과 관련지어 읽기', '경험과 관련지으며 읽기', '경험을 떠올리며 읽기', '경험 연결하기'],
              e: '글의 내용과 자신의 경험을 연결하여 읽는 것을 경험과 관련지어 읽기라고 해요.',
            },
          ],
        },
        사회: {
          unit: '사회 변화와 다양한 문화',
          questions: [
            {
              t: 'c',
              q: '다양한 문화가 함께 살아가는 사회에서 가장 바람직한 태도는 무엇일까요?',
              o: ['서로 다른 문화를 존중한다', '나와 다른 문화를 무조건 틀렸다고 한다', '친구의 문화를 놀린다', '한 가지 문화만 인정한다'],
              a: 0,
              e: '사람마다 생활 모습과 문화가 다를 수 있으므로 서로 이해하고 존중하는 태도가 필요해요.',
            },
            {
              t: 'ox',
              q: '서로 다른 문화가 함께 살아가는 사회에서는 나와 다른 문화를 존중하는 태도가 필요해요.',
              a: true,
              e: '문화마다 생활 모습과 생각이 다를 수 있으므로 서로 이해하고 존중해야 해요.',
            },
            {
              t: 's',
              q: '나와 다른 생활 모습이나 문화를 이해하고 소중하게 대하는 태도를 무엇이라고 할까요?',
              a: ['존중', '문화 존중', '서로 존중하기'],
              e: '서로 다른 문화를 소중하게 여기고 인정하는 태도를 존중이라고 해요.',
            },
          ],
        },
        과학: {
          unit: '물체와 물질',
          questions: [
            {
              t: 'c',
              q: '연필을 이루는 물질에 대한 설명으로 알맞은 것은 무엇일까요?',
              o: ['연필은 나무와 흑연 등 여러 물질로 이루어져 있다', '연필은 물만으로 이루어져 있다', '연필은 공기만으로 이루어져 있다', '연필은 유리만으로 이루어져 있다'],
              a: 0,
              e: '연필은 나무로 된 부분과 흑연으로 된 심처럼 여러 물질로 이루어져 있어요.',
            },
            {
              t: 'ox',
              q: '연필은 나무와 흑연처럼 한 가지가 아닌 여러 물질로 이루어져 있어요.',
              a: true,
              e: '연필은 나무로 된 부분과 흑연으로 된 심 등 여러 물질로 이루어져 있어요.',
            },
            {
              t: 's',
              q: '연필의 몸통을 만드는 대표적인 물질 한 가지를 써 보세요.',
              a: ['나무'],
              e: '연필의 몸통은 보통 나무로 만들어요. (제품에 따라 다른 재료를 사용하기도 해요.)',
            },
          ],
        },
      }
      if (previewRequested && activeGrade === 3 && previewSamples[subjName]) {
        const sample = previewSamples[subjName]
        const questions = sample.questions.map((item) =>
          item.t === 'c' ? prep(item, sample.unit) : { ...item, unit: sample.unit }
        )
        begin(questions, `3학년 2학기 · ${subjName} 미리보기`, 'daily', true, {
          dgrade: 3, dsem: 2, dsubject: subjName, dunitName: sample.unit,
          previewOnly: true,
        })
        return
      }
      const result = await startStudentDailyQuiz(auth.access_token, {
        grade: activeGrade, semester: activeSem, subject: subjName, unitName: activeUnit,
      })
      begin(result.questions, label, 'daily', false, {
        dgrade: activeGrade, dsem: activeSem, dsubject: subjName, dunitName: activeUnit,
        serverBacked: true, serverSessionId: result.session_id,
      })
    } catch (error) {
      setQuizError(error.message || '문제를 불러오지 못했습니다.')
    } finally {
      setQuizLoading(false)
    }
  }
  const startNotes = (list) =>
    begin(
      shuffle(list)
        .slice(0, CORE_N)
        .map((nt) => ({ ...prep(nt.q, nt.unit), _ctx: { subj: nt.subj, g: nt.g, s: nt.s, ed: nt.ed } })),
      '오답노트 복습',
      'note'
    )

  const updateNotes = (fn) =>
    setNotes((p) => {
      const n = fn(p)
      saveUser(KEYS.notes, auth?.user?.id, n)
      return n
    })
  const delNote = (key) => updateNotes((p) => p.filter((x) => x.key !== key))
  const submit = async (v) => {
    const q = run.qs[run.i]
    if (run.serverBacked) {
      setSubmitting(true)
      setSubmitError('')
      try {
        const result = await submitStudentDailyAnswer(auth.access_token, {
          sessionId: run.serverSessionId, questionIndex: run.i, answer: v,
        })
        const answeredQuestion = { ...q, a: result.correct_answer_value, e: result.explanation || '' }
        const ctx = q._ctx || { subj, g: grade, s: sem, ed }
        const key = `${ctx.subj}|${ctx.g}|${ctx.s}|${ctx.ed ? ctx.ed + '|' : ''}${q.q}`
        const nextNotes = result.is_correct
          ? notes.filter((item) => item.key !== key)
          : notes.some((item) => item.key === key)
            ? notes
            : [{ key, ...ctx, unit: q.unit, at: Date.now(), q: { t: q.t, q: q.q, o: q.o, a: answeredQuestion.a, e: answeredQuestion.e } }, ...notes].slice(0, 300)
        setNotes(nextNotes)
        saveUser(KEYS.notes, auth?.user?.id, nextNotes)
        setRun({
          ...run,
          ans: v,
          ok: result.is_correct,
          score: run.score + (result.is_correct ? 1 : 0),
          wrongs: result.is_correct ? run.wrongs : [...run.wrongs, answeredQuestion],
          correctAnswerIndex: result.correct_answer_index,
          correctAnswerValue: result.correct_answer_value,
          correctAnswerText: result.correct_answer_text,
          explanation: result.explanation || '',
        })
      } catch (error) {
        setSubmitError(error.message || '답안을 채점하지 못했습니다. 다시 시도해 주세요.')
      } finally {
        setSubmitting(false)
      }
      return
    }
    const ok = isRight(q, v)
    const ctx = q._ctx || { subj, g: grade, s: sem, ed }
    const key = `${ctx.subj}|${ctx.g}|${ctx.s}|${ctx.ed ? ctx.ed + '|' : ''}${q.q}`
    if (!run.previewOnly) {
      const nextNotes = ok
        ? notes.filter((item) => item.key !== key)
        : notes.some((item) => item.key === key)
          ? notes
          : [{ key, ...ctx, unit: q.unit, at: Date.now(), q: { t: q.t, q: q.q, o: q.o, a: q.a, e: q.e } }, ...notes].slice(0, 300)
      setNotes(nextNotes)
      saveUser(KEYS.notes, auth?.user?.id, nextNotes)
    }
    setRun({
      ...run,
      ans: v,
      ok,
      score: run.score + (ok ? 1 : 0),
      wrongs: ok ? run.wrongs : [...run.wrongs, q],
    })
  }
  const next = () => {
    setText('')
    if (run.i + 1 < run.qs.length) return setRun({ ...run, i: run.i + 1, ans: null, ok: null, correctAnswerIndex: null, correctAnswerValue: null, correctAnswerText: '', explanation: '' })
    let saved = false
    if (!run.retry && run.kind !== 'note') {
      const isDaily = run.kind === 'daily'
      const activeSem = isDaily ? (run.dsem ?? 0) : sem
      const r = [
        ...records,
        {
          subj,
          g: isDaily ? run.dgrade : grade,
          s: activeSem,
          ed,
          kind: run.kind,
          label: run.label,
          score: run.score,
          total: run.qs.length,
          at: Date.now(),
        },
      ]
      setRecords(r)
      saveUser(KEYS.records, auth?.user?.id, r)
      saved = true
      if (isDaily) {
        const subjectName = run.dsubject || dailySubject
        const k = activeSem
          ? `${ymd()}|${run.dgrade}|${activeSem}|${subjectName}`
          : `${ymd()}|${run.dgrade}|${subjectName}`
        const d = {
          ...daily,
          [k]: { score: Math.max(daily[k] ? daily[k].score : 0, run.score), total: run.qs.length },
        }
        setDaily(d)
        saveUser(KEYS.daily, auth?.user?.id, d)
      }
    }
    return setRun({ ...run, finished: true, saved })
  }
  const quit = () => {
    if (window.confirm('풀이를 그만할까요? (점수는 저장되지 않아요)')) setRun(null)
  }
  const clearAll = () => {
    if (window.confirm('저장된 점수 기록을 모두 지울까요?')) {
      setRecords([])
      saveUser(KEYS.records, auth?.user?.id, [])
    }
  }
  const hideNoticeToday = () => {
    save(KEYS.notice, today())
    setNotice(false)
  }

  // Supabase 비밀번호 복구 메일의 URL hash를 감지해 학습 화면 대신 재설정 화면을 표시합니다.
  const recoveryParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  if (recoveryParams.get('type') === 'recovery') return <PasswordRecoveryPage />

  // 관리자 페이지는 학생용 임시 로그인과 분리해 Supabase Auth로 인증합니다.
  const currentPath = window.location.pathname.replace(/\/+$/, '') || '/'
  if (currentPath === '/login' && !auth) return <LoginPage onLogin={handleLogin} notice={loginNotice} />
  if (currentPath === '/admin') return <AdminPage />
  if (currentPath === '/signup') return <SignupPage onLogin={handleLogin} />
  if (currentPath === '/trial') return <TrialPage onLogin={handleLogin} />
  if (currentPath === '/payment') return auth
    ? <PaymentPage auth={auth} onComplete={handlePaymentComplete} />
    : <LoginPage onLogin={handleLogin} notice={loginNotice} />
  if (currentPath === '/find-id') return <FindIdPage />
  if (currentPath === '/forgot-password') return <PasswordResetRequestPage />
  if (currentPath === '/reset-password') return <PasswordRecoveryPage />

  if (!auth) return <LoginPage onLogin={handleLogin} notice={loginNotice} />
  const signupMode = auth.user?.user_metadata?.signup_mode
  if (signupMode === 'trial' && !auth.subscription) return <PaymentPage auth={auth} onComplete={handlePaymentComplete} />
  if (signupMode === 'member' && !auth.subscription) return <PaymentPage auth={auth} onComplete={handlePaymentComplete} mode="member" />
  if (auth.settings?.grade == null) return <PaymentPage auth={auth} onComplete={handlePaymentComplete} />
  const trialEndTime = auth.subscription?.is_trial ? new Date(auth.subscription.ends_at).getTime() : 0
  const trialDaysLeft = trialEndTime ? Math.ceil((trialEndTime - Date.now()) / 86400000) : null
  const runTheme = (run && run.catalogMeta && SUBJECT_THEME[run.catalogMeta.subject]) || subj

  if (run && !run.finished) {
    return (
      <QuizScreen
        run={run}
        subj={subj}
        theme={runTheme}
        text={text}
        onText={setText}
        onSubmit={submit}
        onNext={next}
        onQuit={quit}
        submitting={submitting}
        submitError={submitError}
      />
    )
  }
  if (run && run.finished) {
    return (
      <ResultScreen
        run={run}
        subj={subj}
        theme={runTheme}
        grade={grade}
        sem={sem}
        onRetryWrong={() => begin(shuffle(run.wrongs), run.label, run.kind, true)}
        onHome={() => setRun(null)}
      />
    )
  }

  const special = { hanja: '📜 하루한자', wisdom: Number(auth.settings?.grade || dailyGrade) <= 2 ? '💬 하루속담' : '💬 영어명언', rec: '과목별 학습' }
  const theme =
    special[tab] && tab !== 'rec'
      ? tab
      : SUBJECT_THEME[dailySubject] || SUBJECT_THEME[catSubject] || subj
  const lockedGrade = auth.settings?.grade != null ? Number(auth.settings.grade) : undefined
  const lockedSemester = auth.settings?.semester != null ? Number(auth.settings.semester) : undefined
  const lockedUnitName = auth.settings?.unitName || ''
  const showDaily = tab === 'learn' || tab === 'daily'

  return (
    <div className="app" data-subject={theme}>
      <AppBar
        subj={subj}
        onSubj={pickSubj}
        name={name}
        onName={() => setMenuOpen(true)}
        onMenu={() => setMenuOpen(true)}
        hideSubj
        title={special[tab] || '오늘의 학습'}
      />
      {!renewalDismissed && auth.subscription?.is_trial && trialDaysLeft !== null && trialDaysLeft <= 2 && (
        <section className="trial-renewal-notice" role="status">
          <div><strong>{trialEndTime <= Date.now() ? '무료 체험이 종료됐어요.' : trialDaysLeft === 0 ? '무료 체험이 오늘 종료돼요.' : '무료 체험이 ' + trialDaysLeft + '일 후 종료돼요.'}</strong><p>학습을 계속하려면 이용권을 연장해 주세요.</p></div>
          <div className="trial-renewal-actions">
            <button type="button" onClick={() => window.location.assign('/payment?mode=extend')}>학습 연장</button>
            <button type="button" className="trial-renewal-dismiss" onClick={() => setRenewalDismissed(true)}>연장 안 하기</button>
          </div>
        </section>
      )}

      {showDaily && (
        <DailyPage
          grade={dailyGrade}
          subject={dailySubject}
          onSubject={handleDailySubject}
          onGrade={(g) => {
            const nextG = Number(g)
            setDailyGrade(nextG)
            setGrade(nextG)
            onCatSel({ subject: '' })
          }}
          semester={dailySem}
          onSemester={(s) => {
            const nextS = s != null ? Number(s) : null
            setDailySem(nextS)
            setSem(nextS || 1)
          }}
          unitName={lockedUnitName}
          loading={quizLoading}
          error={quizError}
          onlyGrade={lockedGrade}
          onlySemester={lockedSemester}
          daily={daily}
          streak={streak}
          onStart={startDaily}
        />
      )}
      {tab === 'note' && (
        <NotesPage
          subj={subj}
          grade={auth.settings?.grade ? Number(auth.settings.grade) : grade}
          notes={notes}
          onDelete={delNote}
          onStart={startNotes}
          onSubjectChange={handleSubjThemeChange}
        />
      )}
      {tab === 'rec' && (
        <RecordsPage
          subj={subj}
          initialGrade={auth.settings?.grade ? Number(auth.settings.grade) : grade}
          records={records}
          coreBest={coreBest}
          onClear={clearAll}
          onSubjectChange={handleSubjThemeChange}
        />
      )}
      {tab === 'week' && <WeekPage records={records.filter((r) => Number(r.g) === lockedGrade)} />}
      {tab === 'hanja' && <HanjaPage />}
      {tab === 'wisdom' && <DailyWisdomPage grade={lockedGrade || dailyGrade} />}

      <TabBar tab={tab} onTab={setTab} noteCount={notes.length} />
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} onGo={goMenu} onLogout={logout} name={name} grade={lockedGrade || dailyGrade} />
      {notice && <NoticeModal onHideToday={hideNoticeToday} onClose={() => setNotice(false)} />}
    </div>
  )
}
// import { useCallback, useEffect, useState } from 'react'
// import { CORE_N, shuffle, prep, isRight } from './lib/quiz.js'
// import { KEYS, load, save } from './lib/storage.js'
// import { ymd, streakFrom } from './lib/date.js'
// import { dailyQs } from './lib/daily.js'
// import { editionsOf } from './curriculum.js'
// import { SUBJECT_THEME } from './lib/theme.js'
// import AppBar from './components/AppBar.jsx'
// import SideMenu from './components/SideMenu.jsx'
// import TabBar from './components/TabBar.jsx'
// import NotesPage from './components/NotesPage.jsx'
// import RecordsPage from './components/RecordsPage.jsx'
// import WeekPage from './components/WeekPage.jsx'
// import HanjaPage from './components/HanjaPage.jsx'
// import SciencePage from './components/SciencePage.jsx'
// import DailyPage from './components/DailyPage.jsx'
// import LoginPage from './components/LoginPage.jsx'
// import QuizScreen from './components/QuizScreen.jsx'
// import ResultScreen from './components/ResultScreen.jsx'
// import NoticeModal from './components/NoticeModal.jsx'

// const SHOW_NOTICE = false // 안내 팝업 임시 비활성화 (다시 켜려면 true)
// const today = () => new Date().toDateString()

// const SUBJECT_CODE_BY_NAME = {
//   국어: 'kor',
//   통합: 'int',
//   바른생활: 'eth',
//   사회: 'soc',
//   과학: 'sci',
//   도덕: 'eth',
//   영어: 'eng',
// }

// export default function App() {
//   const initialAuth = load(KEYS.auth, null)
//   const initialSettings = initialAuth?.settings || null

//   const [tab, setTab] = useState('learn') // learn | note | rec | week | hanja | sci | daily
//   const [menuOpen, setMenuOpen] = useState(false)
//   const [auth, setAuth] = useState(initialAuth) // 로그인한 사용자 { user, settings }
//   const [, setFocusUnit] = useState(-1)
//   const [subj, setSubj] = useState('kor')
//   const [catSubject, setCatSubject] = useState(initialSettings?.subject || '') // 테마색용
//   const [dailySubject, setDailySubject] = useState('국어')
//   const onCatSel = useCallback((s) => setCatSubject(s.subject), [])
//   const [grade, setGrade] = useState(initialSettings?.grade ? Number(initialSettings.grade) : 1)
//   const [edition, setEdition] = useState('')
//   const [sem, setSem] = useState(initialSettings?.semester ? Number(initialSettings.semester) : 1)
//   const [, setPicked] = useState([])
//   const [run, setRun] = useState(null)
//   const [text, setText] = useState('')
//   const [records, setRecords] = useState(() => load(KEYS.records, []))
//   const [notes, setNotes] = useState(() => load(KEYS.notes, []))
//   const [daily, setDaily] = useState(() => load(KEYS.daily, {}))
//   const [dailyGrade, setDailyGrade] = useState(initialSettings?.grade ? Number(initialSettings.grade) : 1)
//   const [dailySem, setDailySem] = useState(initialSettings?.semester ? Number(initialSettings.semester) : null)
//   const [dailyUnitName, setDailyUnitName] = useState(initialSettings?.unitName || '')
//   const [notice, setNotice] = useState(() => SHOW_NOTICE && load(KEYS.notice, '') !== today())

//   useEffect(() => {
//     const s = auth?.settings
//     if (s?.grade) {
//       const g = Number(s.grade)
//       setGrade(g)
//       setDailyGrade(g)
//     }
//     if (s?.semester) {
//       const sm = Number(s.semester)
//       setSem(sm)
//       setDailySem(sm)
//     }
//     setDailyUnitName(s?.unitName || '')
//   }, [auth])

//   const streak = streakFrom(new Set(Object.keys(daily).map((k) => k.split('|')[0])))
//   const editions = subj === 'eng' ? editionsOf(grade) : []
//   const ed = subj === 'eng' ? (editions.find((e) => e.id === edition) || editions[0] || {}).id : undefined
//   const coreBest = (g, s) =>
//     records
//       .filter((r) => r.subj === subj && r.g === g && r.s === s && r.kind === 'core' && r.ed === ed)
//       .reduce((m, r) => Math.max(m, r.score), -1)
//   const reset = () => {
//     setPicked([])
//     setRun(null)
//     setText('')
//     setFocusUnit(-1)
//   }
//   const pickSubj = (sj) => {
//     setSubj(sj)
//     if (sj === 'eng') {
//       setSem(1)
//       setGrade((g) => (g < 3 ? 3 : g))
//     }
//     reset()
//   }
//   const handleDailySubject = (subjName) => {
//     setDailySubject(subjName)
//     setCatSubject(subjName)
//     setSubj(SUBJECT_CODE_BY_NAME[subjName] || 'kor')
//   }
//   const name = auth ? auth.user : ''
//   const handleLogin = ({ user, settings }) => {
//     const nextSettings = settings
//       ? {
//           ...settings,
//           grade: Number(settings.grade) || 1,
//           semester: settings.semester != null ? Number(settings.semester) : 1,
//           unitName: settings.unitName || '',
//         }
//       : null
//     const a = { user, settings: nextSettings }
//     setAuth(a)
//     save(KEYS.auth, a)
//     if (nextSettings) {
//       setGrade(nextSettings.grade)
//       setSem(nextSettings.semester)
//       setDailyGrade(nextSettings.grade)
//       setDailySem(nextSettings.semester)
//       setDailyUnitName(nextSettings.unitName)
//       setCatSubject(nextSettings.subject || '')
//     } else {
//       setDailySem(null)
//       setDailyUnitName('')
//     }
//     setRun(null)
//     setTab('learn')
//     setMenuOpen(false)
//   }
//   const logout = () => {
//     setAuth(null)
//     save(KEYS.auth, null)
//     setDailySem(null)
//     setDailyUnitName('')
//     setMenuOpen(false)
//     setRun(null)
//     setTab('learn')
//   }
//   const goMenu = (k) => {
//     setTab(k)
//     setMenuOpen(false)
//     window.scrollTo(0, 0)
//   }

//   const begin = (qs, label, kind, retry = false, extra = {}) => {
//     setText('')
//     setRun({
//       qs,
//       i: 0,
//       ans: null,
//       ok: null,
//       score: 0,
//       wrongs: [],
//       finished: false,
//       retry,
//       saved: false,
//       label,
//       kind,
//       ...extra,
//     })
//   }
//   const startDaily = (g, s = dailySem, subjName = dailySubject, uName = dailyUnitName) => {
//     const activeGrade = Number(auth?.settings?.grade ?? g) || 1
//     const activeSem =
//       auth?.settings?.semester != null
//         ? Number(auth.settings.semester)
//         : s != null
//           ? Number(s)
//           : null
//     const activeUnit = auth?.settings?.unitName ?? uName ?? ''
//     const label = `${activeGrade}학년${activeSem ? ` ${activeSem}학기` : ''}${activeUnit ? ` · ${activeUnit}` : subjName ? ` · ${subjName}` : ''}`
//     begin(
//       dailyQs(activeGrade, undefined, activeSem, activeUnit),
//       label,
//       'daily',
//       false,
//       { dgrade: activeGrade, dsem: activeSem, dsubject: subjName, dunitName: activeUnit }
//     )
//   }
//   const startNotes = (list) =>
//     begin(
//       shuffle(list)
//         .slice(0, CORE_N)
//         .map((nt) => ({ ...prep(nt.q, nt.unit), _ctx: { subj: nt.subj, g: nt.g, s: nt.s, ed: nt.ed } })),
//       '오답노트 복습',
//       'note'
//     )

//   const updateNotes = (fn) =>
//     setNotes((p) => {
//       const n = fn(p)
//       save(KEYS.notes, n)
//       return n
//     })
//   const delNote = (key) => updateNotes((p) => p.filter((x) => x.key !== key))
//   const submit = (v) => {
//     const q = run.qs[run.i]
//     const ok = isRight(q, v)
//     const ctx = q._ctx || { subj, g: grade, s: sem, ed }
//     const key = `${ctx.subj}|${ctx.g}|${ctx.s}|${ctx.ed ? ctx.ed + '|' : ''}${q.q}`
//     if (ok) {
//       updateNotes((p) => (p.some((x) => x.key === key) ? p.filter((x) => x.key !== key) : p))
//     } else {
//       updateNotes((p) =>
//         p.some((x) => x.key === key)
//           ? p
//           : [{ key, ...ctx, unit: q.unit, at: Date.now(), q: { t: q.t, q: q.q, o: q.o, a: q.a, e: q.e } }, ...p].slice(0, 300)
//       )
//     }
//     setRun({
//       ...run,
//       ans: v,
//       ok,
//       score: run.score + (ok ? 1 : 0),
//       wrongs: ok ? run.wrongs : [...run.wrongs, q],
//     })
//   }
//   const next = () => {
//     setText('')
//     if (run.i + 1 < run.qs.length) return setRun({ ...run, i: run.i + 1, ans: null, ok: null })
//     let saved = false
//     if (!run.retry && run.kind !== 'note') {
//       const isDaily = run.kind === 'daily'
//       const activeSem = isDaily ? (run.dsem ?? 0) : sem
//       const r = [
//         ...records,
//         {
//           subj,
//           g: isDaily ? run.dgrade : grade,
//           s: activeSem,
//           ed,
//           kind: run.kind,
//           label: run.label,
//           score: run.score,
//           total: run.qs.length,
//           at: Date.now(),
//         },
//       ]
//       setRecords(r)
//       save(KEYS.records, r)
//       saved = true
//       if (isDaily) {
//         const k = activeSem ? `${ymd()}|${run.dgrade}|${activeSem}` : `${ymd()}|${run.dgrade}`
//         const d = {
//           ...daily,
//           [k]: { score: Math.max(daily[k] ? daily[k].score : 0, run.score), total: run.qs.length },
//         }
//         setDaily(d)
//         save(KEYS.daily, d)
//       }
//     }
//     return setRun({ ...run, finished: true, saved })
//   }
//   const quit = () => {
//     if (window.confirm('풀이를 그만할까요? (점수는 저장되지 않아요)')) setRun(null)
//   }
//   const clearAll = () => {
//     if (window.confirm('저장된 점수 기록을 모두 지울까요?')) {
//       setRecords([])
//       save(KEYS.records, [])
//     }
//   }
//   const hideNoticeToday = () => {
//     save(KEYS.notice, today())
//     setNotice(false)
//   }

//   if (!auth) return <LoginPage onLogin={handleLogin} />

//   const runTheme = (run && run.catalogMeta && SUBJECT_THEME[run.catalogMeta.subject]) || subj

//   if (run && !run.finished) {
//     return (
//       <QuizScreen
//         run={run}
//         subj={subj}
//         theme={runTheme}
//         text={text}
//         onText={setText}
//         onSubmit={submit}
//         onNext={next}
//         onQuit={quit}
//       />
//     )
//   }
//   if (run && run.finished) {
//     return (
//       <ResultScreen
//         run={run}
//         subj={subj}
//         theme={runTheme}
//         grade={grade}
//         sem={sem}
//         onRetryWrong={() => begin(shuffle(run.wrongs), run.label, run.kind, true)}
//         onHome={() => setRun(null)}
//       />
//     )
//   }

//   const special = { hanja: '📜 하루한자', sci: '🔬 과학상식', rec: '과목별 학습' }
//   const theme =
//     special[tab] && tab !== 'rec'
//       ? tab
//       : SUBJECT_THEME[dailySubject] || SUBJECT_THEME[catSubject] || subj
//   const lockedGrade = auth.settings?.grade != null ? Number(auth.settings.grade) : undefined
//   const lockedSemester = auth.settings?.semester != null ? Number(auth.settings.semester) : undefined
//   const lockedUnitName = auth.settings?.unitName || ''
//   const showDaily = tab === 'learn' || tab === 'daily'

//   return (
//     <div className="app" data-subject={theme}>
//       <AppBar
//         subj={subj}
//         onSubj={pickSubj}
//         name={name}
//         onName={() => setMenuOpen(true)}
//         onMenu={() => setMenuOpen(true)}
//         hideSubj
//         title={special[tab] || '오늘의 학습'}
//       />

//       {showDaily && (
//         <DailyPage
//           grade={dailyGrade}
//           subject={dailySubject}
//           onSubject={handleDailySubject}
//           onGrade={(g) => {
//             const nextG = Number(g)
//             setDailyGrade(nextG)
//             setGrade(nextG)
//             onCatSel({ subject: '' })
//           }}
//           semester={dailySem}
//           onSemester={(s) => {
//             const nextS = s != null ? Number(s) : null
//             setDailySem(nextS)
//             setSem(nextS || 1)
//           }}
//           unitName={lockedUnitName}
//           onlyGrade={lockedGrade}
//           onlySemester={lockedSemester}
//           daily={daily}
//           streak={streak}
//           onStart={startDaily}
//         />
//       )}
//       {tab === 'note' && <NotesPage subj={subj} notes={notes} onDelete={delNote} onStart={startNotes} />}
//       {tab === 'rec' && (
//         <RecordsPage
//           subj={subj}
//           initialGrade={auth.settings?.grade ? Number(auth.settings.grade) : grade}
//           records={records}
//           coreBest={coreBest}
//           onClear={clearAll}
//         />
//       )}
//       {tab === 'week' && <WeekPage records={records} />}
//       {tab === 'hanja' && <HanjaPage />}
//       {tab === 'sci' && <SciencePage />}

//       <TabBar tab={tab} onTab={setTab} noteCount={notes.length} />
//       <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} onGo={goMenu} onLogout={logout} name={name} />
//       {notice && <NoticeModal onHideToday={hideNoticeToday} onClose={() => setNotice(false)} />}
//     </div>
//   )
// }
// 2차 정상
// import { useCallback, useState } from 'react'
// import { CORE_N, shuffle, prep, isRight } from './lib/quiz.js'
// import { KEYS, load, save } from './lib/storage.js'
// import { ymd, streakFrom } from './lib/date.js'
// import { dailyQs } from './lib/daily.js'
// import { editionsOf } from './curriculum.js'
// import { SUBJECT_THEME } from './lib/theme.js'
// import AppBar from './components/AppBar.jsx'
// import SideMenu from './components/SideMenu.jsx'
// import TabBar from './components/TabBar.jsx'
// import NotesPage from './components/NotesPage.jsx'
// import RecordsPage from './components/RecordsPage.jsx'
// import WeekPage from './components/WeekPage.jsx'
// import HanjaPage from './components/HanjaPage.jsx'
// import SciencePage from './components/SciencePage.jsx'
// import DailyPage from './components/DailyPage.jsx'
// import LoginPage from './components/LoginPage.jsx'
// import QuizScreen from './components/QuizScreen.jsx'
// import ResultScreen from './components/ResultScreen.jsx'
// import NoticeModal from './components/NoticeModal.jsx'

// const SHOW_NOTICE = false // 안내 팝업 임시 비활성화 (다시 켜려면 true)
// const today = () => new Date().toDateString()

// export default function App() {
//   const [tab, setTab] = useState('learn') // learn | note | rec | week | hanja | sci | daily
//   const [menuOpen, setMenuOpen] = useState(false)
//   const [auth, setAuth] = useState(() => load(KEYS.auth, null)) // 로그인한 사용자 { user, settings }
//   const [, setFocusUnit] = useState(-1)
//   const [subj, setSubj] = useState('kor')
//   const [catSubject, setCatSubject] = useState('') // 테마색용
//   const onCatSel = useCallback((s) => setCatSubject(s.subject), [])
//   const [grade, setGrade] = useState(1)
//   const [edition, setEdition] = useState('')
//   const [sem, setSem] = useState(1)
//   const [, setPicked] = useState([])
//   const [run, setRun] = useState(null)
//   const [text, setText] = useState('')
//   const [records, setRecords] = useState(() => load(KEYS.records, []))
//   const [notes, setNotes] = useState(() => load(KEYS.notes, []))
//   const [daily, setDaily] = useState(() => load(KEYS.daily, {}))
//   const [dailyGrade, setDailyGrade] = useState(1)
//   const [dailySem, setDailySem] = useState(null) // null이면 전체 학기, 숫자(1|2)면 해당 학기만
//   const [notice, setNotice] = useState(() => SHOW_NOTICE && load(KEYS.notice, '') !== today())

//   const streak = streakFrom(new Set(Object.keys(daily).map((k) => k.split('|')[0])))
//   const editions = subj === 'eng' ? editionsOf(grade) : []
//   const ed = subj === 'eng' ? (editions.find((e) => e.id === edition) || editions[0] || {}).id : undefined
//   const coreBest = (g, s) =>
//     records
//       .filter((r) => r.subj === subj && r.g === g && r.s === s && r.kind === 'core' && r.ed === ed)
//       .reduce((m, r) => Math.max(m, r.score), -1)
//   const reset = () => {
//     setPicked([])
//     setRun(null)
//     setText('')
//     setFocusUnit(-1)
//   }
//   const pickSubj = (sj) => {
//     setSubj(sj)
//     if (sj === 'eng') {
//       setSem(1)
//       setGrade((g) => (g < 3 ? 3 : g))
//     }
//     reset()
//   }
//   const name = auth ? auth.user : ''
//   const handleLogin = ({ user, settings }) => {
//     const a = { user, settings: settings || null } // settings: 로그인 화면의 ⚙ 설정 (학년·학기·단원)
//     setAuth(a)
//     save(KEYS.auth, a)
//     if (settings) {
//       setGrade(settings.grade)
//       setSem(settings.semester)
//       setDailyGrade(settings.grade)
//       setDailySem(settings.semester)
//       setCatSubject(settings.subject || '')
//     } else {
//       setDailySem(null)
//     }
//     setRun(null)
//     setTab('learn')
//     setMenuOpen(false)
//   }
//   const logout = () => {
//     setAuth(null)
//     save(KEYS.auth, null)
//     setDailySem(null)
//     setMenuOpen(false)
//     setRun(null)
//     setTab('learn')
//   }
//   const goMenu = (k) => {
//     setTab(k)
//     setMenuOpen(false)
//     window.scrollTo(0, 0)
//   }

//   const begin = (qs, label, kind, retry = false, extra = {}) => {
//     setText('')
//     setRun({
//       qs,
//       i: 0,
//       ans: null,
//       ok: null,
//       score: 0,
//       wrongs: [],
//       finished: false,
//       retry,
//       saved: false,
//       label,
//       kind,
//       ...extra,
//     })
//   }
//   const startDaily = (g, s = dailySem) => {
//     const activeSem = auth?.settings?.semester ?? s ?? null
//     begin(
//       dailyQs(g, undefined, activeSem),
//       `${g}학년${activeSem ? ` ${activeSem}학기` : ''}`,
//       'daily',
//       false,
//       { dgrade: g, dsem: activeSem }
//     )
//   }
//   const startNotes = (list) =>
//     begin(
//       shuffle(list)
//         .slice(0, CORE_N)
//         .map((nt) => ({ ...prep(nt.q, nt.unit), _ctx: { subj: nt.subj, g: nt.g, s: nt.s, ed: nt.ed } })),
//       '오답노트 복습',
//       'note'
//     )

//   const updateNotes = (fn) =>
//     setNotes((p) => {
//       const n = fn(p)
//       save(KEYS.notes, n)
//       return n
//     })
//   const delNote = (key) => updateNotes((p) => p.filter((x) => x.key !== key))
//   const submit = (v) => {
//     const q = run.qs[run.i]
//     const ok = isRight(q, v)
//     const ctx = q._ctx || { subj, g: grade, s: sem, ed }
//     const key = `${ctx.subj}|${ctx.g}|${ctx.s}|${ctx.ed ? ctx.ed + '|' : ''}${q.q}`
//     if (ok) {
//       updateNotes((p) => (p.some((x) => x.key === key) ? p.filter((x) => x.key !== key) : p))
//     } else {
//       updateNotes((p) =>
//         p.some((x) => x.key === key)
//           ? p
//           : [{ key, ...ctx, unit: q.unit, at: Date.now(), q: { t: q.t, q: q.q, o: q.o, a: q.a, e: q.e } }, ...p].slice(0, 300)
//       )
//     }
//     setRun({
//       ...run,
//       ans: v,
//       ok,
//       score: run.score + (ok ? 1 : 0),
//       wrongs: ok ? run.wrongs : [...run.wrongs, q],
//     })
//   }
//   const next = () => {
//     setText('')
//     if (run.i + 1 < run.qs.length) return setRun({ ...run, i: run.i + 1, ans: null, ok: null })
//     let saved = false
//     if (!run.retry && run.kind !== 'note') {
//       const isDaily = run.kind === 'daily'
//       const activeSem = isDaily ? (run.dsem ?? 0) : sem
//       const r = [
//         ...records,
//         {
//           subj,
//           g: isDaily ? run.dgrade : grade,
//           s: activeSem,
//           ed,
//           kind: run.kind,
//           label: run.label,
//           score: run.score,
//           total: run.qs.length,
//           at: Date.now(),
//         },
//       ]
//       setRecords(r)
//       save(KEYS.records, r)
//       saved = true
//       if (isDaily) {
//         const k = activeSem ? `${ymd()}|${run.dgrade}|${activeSem}` : `${ymd()}|${run.dgrade}`
//         const d = {
//           ...daily,
//           [k]: { score: Math.max(daily[k] ? daily[k].score : 0, run.score), total: run.qs.length },
//         }
//         setDaily(d)
//         save(KEYS.daily, d)
//       }
//     }
//     return setRun({ ...run, finished: true, saved })
//   }
//   const quit = () => {
//     if (window.confirm('풀이를 그만할까요? (점수는 저장되지 않아요)')) setRun(null)
//   }
//   const clearAll = () => {
//     if (window.confirm('저장된 점수 기록을 모두 지울까요?')) {
//       setRecords([])
//       save(KEYS.records, [])
//     }
//   }
//   const hideNoticeToday = () => {
//     save(KEYS.notice, today())
//     setNotice(false)
//   }

//   if (!auth) return <LoginPage onLogin={handleLogin} />

//   const runTheme = (run && run.catalogMeta && SUBJECT_THEME[run.catalogMeta.subject]) || subj

//   if (run && !run.finished) {
//     return (
//       <QuizScreen
//         run={run}
//         subj={subj}
//         theme={runTheme}
//         text={text}
//         onText={setText}
//         onSubmit={submit}
//         onNext={next}
//         onQuit={quit}
//       />
//     )
//   }
//   if (run && run.finished) {
//     return (
//       <ResultScreen
//         run={run}
//         subj={subj}
//         theme={runTheme}
//         grade={grade}
//         sem={sem}
//         onRetryWrong={() => begin(shuffle(run.wrongs), run.label, run.kind, true)}
//         onHome={() => setRun(null)}
//       />
//     )
//   }

//   const special = { hanja: '📜 하루한자', sci: '🔬 과학상식', rec: '과목별 학습' }
//   const theme = special[tab] && tab !== 'rec' ? tab : (SUBJECT_THEME[catSubject] || subj)
//   const lockedGrade = auth.settings ? auth.settings.grade : undefined
//   const lockedSemester = auth.settings ? auth.settings.semester : undefined
//   const showDaily = tab === 'learn' || tab === 'daily'

//   return (
//     <div className="app" data-subject={theme}>
//       <AppBar
//         subj={subj}
//         onSubj={pickSubj}
//         name={name}
//         onName={() => setMenuOpen(true)}
//         onMenu={() => setMenuOpen(true)}
//         hideSubj
//         title={special[tab] || '오늘의 학습'}
//       />

//       {showDaily && (
//         <DailyPage
//           grade={dailyGrade}
//           onGrade={(g) => {
//             setDailyGrade(g)
//             setGrade(g)
//             onCatSel({ subject: '' })
//           }}
//           semester={dailySem}
//           onSemester={(s) => {
//             setDailySem(s)
//             setSem(s)
//           }}
//           onlyGrade={lockedGrade}
//           onlySemester={lockedSemester}
//           daily={daily}
//           streak={streak}
//           onStart={startDaily}
//         />
//       )}
//       {tab === 'note' && <NotesPage subj={subj} notes={notes} onDelete={delNote} onStart={startNotes} />}
//       {tab === 'rec' && (
//         <RecordsPage
//           subj={subj}
//           initialGrade={auth.settings ? auth.settings.grade : grade}
//           records={records}
//           coreBest={coreBest}
//           onClear={clearAll}
//         />
//       )}
//       {tab === 'week' && <WeekPage records={records} />}
//       {tab === 'hanja' && <HanjaPage />}
//       {tab === 'sci' && <SciencePage />}

//       <TabBar tab={tab} onTab={setTab} noteCount={notes.length} />
//       <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} onGo={goMenu} onLogout={logout} name={name} />
//       {notice && <NoticeModal onHideToday={hideNoticeToday} onClose={() => setNotice(false)} />}
//     </div>
//   )
// }

// import { useCallback, useState } from 'react'
// import { MAX_UNITS, CORE_N, shuffle, prep, isRight, coreQs, unitQs } from './lib/quiz.js'
// import { KEYS, load, save } from './lib/storage.js'
// import { ymd, streakFrom } from './lib/date.js'
// import { dailyQs } from './lib/daily.js'
// import { unitsOf, editionsOf } from './curriculum.js'
// import { SUBJECT_THEME } from './lib/theme.js'
// import AppBar from './components/AppBar.jsx'
// import SideMenu from './components/SideMenu.jsx'
// import TabBar from './components/TabBar.jsx'
// import CatalogLearnPage from './components/CatalogLearnPage.jsx'
// import NotesPage from './components/NotesPage.jsx'
// import RecordsPage from './components/RecordsPage.jsx'
// import WeekPage from './components/WeekPage.jsx'
// import HanjaPage from './components/HanjaPage.jsx'
// import SciencePage from './components/SciencePage.jsx'
// import DailyPage from './components/DailyPage.jsx'
// import LoginPage from './components/LoginPage.jsx'
// import QuizScreen from './components/QuizScreen.jsx'
// import ResultScreen from './components/ResultScreen.jsx'
// import NoticeModal from './components/NoticeModal.jsx'

// const SHOW_PAGE_TITLE = true // 하루한자·과학상식에서 과목 탭 대신 제목을 보여줄지 (false면 빈 칸)
// const SHOW_NOTICE = false // 안내 팝업 임시 비활성화 (다시 켜려면 true)
// const today = () => new Date().toDateString()

// export default function App() {
//   const [tab, setTab] = useState('learn') // learn | note | rec | week | hanja | sci
//   const [menuOpen, setMenuOpen] = useState(false)
//   const [auth, setAuth] = useState(() => load(KEYS.auth, null)) // 로그인한 사용자 { user }
//   const [focusUnit, setFocusUnit] = useState(-1)
//   const [subj, setSubj] = useState('kor')
//   const [catSubject, setCatSubject] = useState('') // 카탈로그에서 고른 과목 이름 (테마색용)
//   const onCatSel = useCallback((s) => setCatSubject(s.subject), [])
//   const [grade, setGrade] = useState(1)
//   const [edition, setEdition] = useState('')
//   const [sem, setSem] = useState(1)
//   const [mode, setMode] = useState('unit')
//   const [picked, setPicked] = useState([])
//   const [run, setRun] = useState(null)
//   const [text, setText] = useState('')
//   const [records, setRecords] = useState(() => load(KEYS.records, []))
//   const [notes, setNotes] = useState(() => load(KEYS.notes, []))
//   const [noteGrade, setNoteGrade] = useState('all')
//   const [daily, setDaily] = useState(() => load(KEYS.daily, {}))
//   const [dailyGrade, setDailyGrade] = useState(1)
//   const [notice, setNotice] = useState(() => SHOW_NOTICE && load(KEYS.notice, '') !== today())

//   const streak = streakFrom(new Set(Object.keys(daily).map((k) => k.split('|')[0])))
//   const editions = subj === 'eng' ? editionsOf(grade) : []
//   const ed = subj === 'eng' ? (editions.find((e) => e.id === edition) || editions[0] || {}).id : undefined
//   const coreBest = (g, s) => records.filter((r) => r.subj === subj && r.g === g && r.s === s && r.kind === 'core' && r.ed === ed).reduce((m, r) => Math.max(m, r.score), -1)
//   const reset = () => { setPicked([]); setRun(null); setText(''); setFocusUnit(-1) }
//   const pickSubj = (sj) => {
//     setSubj(sj)
//     if (sj === 'eng') { setSem(1); setGrade((g) => (g < 3 ? 3 : g)) }
//     reset()
//   }
//   const pickGrade = (g) => { setGrade(g); setDailyGrade(g); setEdition(''); reset() }
//   const pickSem = (s) => { setSem(s); reset() }
//   const pickMode = (m) => { setMode(m); if (m === 'core') setPicked([]) }
//   const toggle = (i) => setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : p.length < MAX_UNITS ? [...p, i] : p))
//   const name = auth ? auth.user : ''
//   const handleLogin = ({ user, settings }) => {
//     const a = { user, settings: settings || null } // settings: 로그인 화면의 ⚙ 설정 (학년·학기·과목·단원)
//     setAuth(a); save(KEYS.auth, a)
//     if (settings) { setGrade(settings.grade); setSem(settings.semester); setDailyGrade(settings.grade); setCatSubject(settings.subject) }
//     setRun(null); setTab('learn'); setMenuOpen(false)
//   }
//   const logout = () => { setAuth(null); save(KEYS.auth, null); setMenuOpen(false); setRun(null); setTab('learn') }
//   const goMenu = (k) => { setTab(k); setMenuOpen(false); window.scrollTo(0, 0) }

//   const begin = (qs, label, kind, retry = false, extra = {}) => {
//     setText('')
//     setRun({ qs, i: 0, ans: null, ok: null, score: 0, wrongs: [], finished: false, retry, saved: false, label, kind, ...extra })
//   }
//   const startDaily = (g) => begin(dailyQs(g), `${g}학년`, 'daily', false, { dgrade: g })
//   const startCatalog = (qs, label, meta) => {
//     setGrade(meta.grade)
//     setSem(meta.semester)
//     const subjectKey = ({ '국어': 'kor', '통합': 'mor', '사회': 'soc', '과학': 'sci', '도덕': 'eth', '바른생활': 'eth' })[meta.subject] || 'kor'
//     setSubj(subjectKey)
//     begin(qs, label, 'unit', false, { catalogMeta: meta })
//   }
//   const startCore = () => begin(coreQs(subj, grade, sem, ed), '학기 핵심 문제', 'core')
//   const startUnits = () => {
//     const units = unitsOf(subj, grade, sem, ed)
//     const order = [...picked].sort((a, b) => a - b)
//     begin(order.flatMap((i) => unitQs(subj, grade, sem, i, ed)), order.map((i) => units[i]).join(', '), 'unit')
//   }
//   const startNotes = (list) => begin(
//     shuffle(list).slice(0, CORE_N).map((nt) => ({ ...prep(nt.q, nt.unit), _ctx: { subj: nt.subj, g: nt.g, s: nt.s, ed: nt.ed } })),
//     '오답노트 복습', 'note')

//   const updateNotes = (fn) => setNotes((p) => { const n = fn(p); save(KEYS.notes, n); return n })
//   const delNote = (key) => updateNotes((p) => p.filter((x) => x.key !== key))
//   const submit = (v) => {
//     const q = run.qs[run.i]
//     const ok = isRight(q, v)
//     const ctx = q._ctx || { subj, g: grade, s: sem, ed }
//     const key = `${ctx.subj}|${ctx.g}|${ctx.s}|${ctx.ed ? ctx.ed + '|' : ''}${q.q}`
//     if (ok) updateNotes((p) => (p.some((x) => x.key === key) ? p.filter((x) => x.key !== key) : p))
//     else updateNotes((p) => (p.some((x) => x.key === key) ? p : [{ key, ...ctx, unit: q.unit, at: Date.now(), q: { t: q.t, q: q.q, o: q.o, a: q.a, e: q.e } }, ...p].slice(0, 300)))
//     setRun({ ...run, ans: v, ok, score: run.score + (ok ? 1 : 0), wrongs: ok ? run.wrongs : [...run.wrongs, q] })
//   }
//   const next = () => {
//     setText('')
//     if (run.i + 1 < run.qs.length) return setRun({ ...run, i: run.i + 1, ans: null, ok: null })
//     let saved = false
//     if (!run.retry && run.kind !== 'note') {
//       const isDaily = run.kind === 'daily'
//       const r = [...records, { subj, g: isDaily ? run.dgrade : grade, s: isDaily ? 0 : sem, ed, kind: run.kind, label: run.label, score: run.score, total: run.qs.length, at: Date.now() }]
//       setRecords(r); save(KEYS.records, r); saved = true
//       if (isDaily) {
//         const k = `${ymd()}|${run.dgrade}`
//         const d = { ...daily, [k]: { score: Math.max(daily[k] ? daily[k].score : 0, run.score), total: run.qs.length } }
//         setDaily(d); save(KEYS.daily, d)
//       }
//     }
//     return setRun({ ...run, finished: true, saved })
//   }
//   const quit = () => { if (window.confirm('풀이를 그만할까요? (점수는 저장되지 않아요)')) setRun(null) }
//   const clearAll = () => { if (window.confirm('저장된 점수 기록을 모두 지울까요?')) { setRecords([]); save(KEYS.records, []) } }
//   const hideNoticeToday = () => { save(KEYS.notice, today()); setNotice(false) }

//   if (!auth) return <LoginPage onLogin={handleLogin} />

//   // 문제 풀이·결과 화면의 테마: 카탈로그에서 시작했으면 그 과목 색, 아니면 기존 과목 키
//   const runTheme = (run && run.catalogMeta && SUBJECT_THEME[run.catalogMeta.subject]) || subj

//   if (run && !run.finished) {
//     return <QuizScreen run={run} subj={subj} theme={runTheme} text={text} onText={setText} onSubmit={submit} onNext={next} onQuit={quit} />
//   }
//   if (run && run.finished) {
//     return <ResultScreen run={run} subj={subj} theme={runTheme} grade={grade} sem={sem} onRetryWrong={() => begin(shuffle(run.wrongs), run.label, run.kind, true)} onHome={() => setRun(null)} />
//   }

//   // 하루한자·과학상식은 과목과 별개의 테마색을 쓰고, 상단의 과목 탭 대신 제목을 보여줘요.
//   const special = { hanja: '📜 하루한자', sci: '🔬 과학상식' }
//   const theme = special[tab] ? tab : (SUBJECT_THEME[catSubject] || subj)

//   return (
//     <div className="app" data-subject={theme}>
//       <AppBar subj={subj} onSubj={pickSubj} name={name} onName={() => setMenuOpen(true)} onMenu={() => setMenuOpen(true)} hideSubj title={special[tab] || '단원별 학습'} />

//       {tab === 'learn' && (
//         <CatalogLearnPage initialGrade={grade} initialSemester={sem} lock={auth.settings || null} onStart={startCatalog} onSelectionChange={onCatSel} />
//       )}
//       {tab === 'note' && <NotesPage subj={subj} notes={notes} noteGrade={noteGrade} onNoteGrade={setNoteGrade} onDelete={delNote} onStart={startNotes} />}
//       {tab === 'rec' && <RecordsPage subj={subj} records={records} coreBest={coreBest} onClear={clearAll} />}
//       {tab === 'daily' && <DailyPage grade={dailyGrade} onGrade={setDailyGrade} onlyGrade={auth.settings ? auth.settings.grade : undefined} daily={daily} streak={streak} onStart={startDaily} />}
//       {tab === 'week' && <WeekPage records={records} />}
//       {tab === 'hanja' && <HanjaPage />}
//       {tab === 'sci' && <SciencePage />}

//       <TabBar tab={tab} onTab={setTab} noteCount={notes.length} />
//       <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} onGo={goMenu} onLogout={logout} name={name} />
//       {notice && <NoticeModal onHideToday={hideNoticeToday} onClose={() => setNotice(false)} />}
//     </div>
//   )
// }
