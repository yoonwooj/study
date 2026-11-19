import { useEffect, useMemo, useState } from 'react'
import { fetchCatalogUnits, fetchDailyQuestions, fetchTodayGeneration } from '../lib/supabase.js'
import { SUBJECT_THEME } from '../lib/theme.js'
import { subjectsFor, defaultSubject, dbSubject } from '../lib/subjects.js'

// lock: 로그인 설정 { grade, semester, subject, unitId, unitName } — 있으면 그 값만 보여줘요.
export default function CatalogLearnPage({ initialGrade = 1, initialSemester = 1, lock = null, onStart, onSelectionChange }) {
  const [grade, setGrade] = useState(lock ? lock.grade : initialGrade)
  const [semester, setSemester] = useState(lock ? lock.semester : initialSemester)
  const [subject, setSubject] = useState(lock ? lock.subject : defaultSubject(initialGrade))
  const [publisher, setPublisher] = useState('')
  const [allUnits, setAllUnits] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')
  const [daily, setDaily] = useState(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError('')
    setSelected([])
    fetchCatalogUnits({ grade, semester, subject: dbSubject(subject) })
      .then((rows) => {
        if (!alive) return
        setAllUnits(rows)
        if (lock && lock.unitId && rows.some((r) => r.id === lock.unitId)) setSelected([lock.unitId])
        const publishers = [...new Set(rows.map((row) => row.publisher).filter(Boolean))]
        setPublisher((current) => publishers.includes(current) ? current : (publishers[0] || ''))
      })
      .catch((e) => { if (alive) { setAllUnits([]); setPublisher(''); setError(e.message) } })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [grade, semester, subject])

  useEffect(() => {
    let alive = true
    fetchTodayGeneration().then((run) => { if (alive) setDaily(run) }).catch(() => { if (alive) setDaily(null) })
    return () => { alive = false }
  }, [])

  useEffect(() => {
    onSelectionChange?.({ grade, semester, subject })
  }, [grade, semester, subject, onSelectionChange])

  const publishers = useMemo(() => [...new Set(allUnits.map((row) => row.publisher).filter(Boolean))], [allUnits])
  const units = useMemo(() => allUnits
    .filter((row) => !publisher || row.publisher === publisher)
    .filter((row) => !(lock && lock.unitId) || row.id === lock.unitId), [allUnits, publisher, lock])

  const changeGrade = (value) => {
    const next = Number(value)
    setGrade(next)
    setSubject(defaultSubject(next))
    setPublisher('')
    setSelected([])
  }
  const toggleUnit = (id) => {
    setSelected((current) => current.includes(id)
      ? current.filter((x) => x !== id)
      : current.length < 3 ? [...current, id] : current)
  }
  const start = async () => {
    if (!selected.length) return
    setStarting(true)
    setError('')
    try {
      const questions = await fetchDailyQuestions(selected, units)
      const names = units.filter((u) => selected.includes(u.id)).map((u) => u.unit_name)
      onStart(questions, names.join(' · '), { grade, semester, subject, publisher })
    } catch (e) {
      setError(e.message)
    } finally {
      setStarting(false)
    }
  }

  return (
    <>
      <main className="page">
        <section className="hero">
          <small>{lock ? '로그인에서 설정한 학습 범위' : 'Supabase 교과서 단원 데이터 · 매일 AI 신규 출제'}</small>
          <b>{lock ? `${subject} · ${grade}학년 ${semester}학기` : '오늘의 단원별 학습'}</b>
        </section>
        <section className="card">
          {lock ? (
            <div className="lock-chips"><span>{grade}학년</span><span>{semester}학기</span><span data-theme={SUBJECT_THEME[subject]}>{subject}</span>{lock.unitName && <span>{lock.unitName}</span>}</div>
          ) : (<>
          <div className="sel-row"><span className="lbl">학년</span>
            <div className="grades">
              {[1, 2, 3, 4, 5, 6].map((g) => <button key={g} aria-pressed={g === grade} onClick={() => changeGrade(g)}><b>{g}</b><small>학년</small></button>)}
            </div>
          </div>
          <div className="sel-row"><span className="lbl">학기</span>
            <div className="seg">
              {[1, 2].map((s) => <button key={s} aria-pressed={s === semester} onClick={() => { setSemester(s); setSelected([]) }}>{s}학기</button>)}
            </div>
          </div>
          <div className="sel-row"><span className="lbl">과목</span>
            <div className="subject-pills">
              {subjectsFor(grade).map((s) => <button key={s} data-theme={SUBJECT_THEME[s]} aria-pressed={subject === s} onClick={() => { setSubject(s); setPublisher(''); setSelected([]) }}>{s}</button>)}
            </div>
          </div>
          </>)}
          {publishers.length > 0 && (
            <label className="field">출판사
              <select value={publisher} onChange={(e) => { setPublisher(e.target.value); setSelected([]) }}>
                {publishers.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
          )}
        </section>

        <section className="card">
          <div className="unit-heading">
            <h2>단원 선택</h2>
            <span>{selected.length}/3 선택</span>
          </div>
          {loading ? <p className="sub">Supabase에서 단원 목록을 불러오는 중이에요.</p> : null}
          {!loading && units.length === 0 && (
            <div className="empty catalog-empty">
              <b>아직 등록된 단원 정보가 없어요.</b>
              <p className="sub">{grade}학년 {semester}학기 {subject} 목차가 Supabase에 추가되면 이곳에 자동으로 표시됩니다.</p>
            </div>
          )}
          <div className="catalog-units">
            {units.map((unit) => {
              const checked = selected.includes(unit.id)
              return (
                <button type="button" key={unit.id} className={`catalog-unit${checked ? ' selected' : ''}`}
                  onClick={() => toggleUnit(unit.id)} disabled={!checked && selected.length >= 3}>
                  <span className="catalog-check">{checked ? '✓' : ''}</span>
                  <span className="catalog-unit-copy">
                    <b>{unit.unit_number}. {unit.unit_name}</b>
                    <small>{unit.verification_status || '목차 확인 상태 미기재'}</small>
                  </span>
                </button>
              )
            })}
          </div>
          {units.some((u) => u.learning_goal || u.source_note) && (
            <p className="sub">등록된 학습 정보와 출처 메모를 바탕으로 출제합니다. 세부 내용이 확인되지 않은 단원은 확인된 주제 범위 안에서만 문제를 만듭니다.</p>
          )}
        </section>

        <section className="card daily-status">
          <h2>오늘의 문제 생성 상태</h2>
          {daily
            ? <p><b>{daily.generated_count}/{daily.requested_count}문제 생성 완료</b><small>{daily.generation_date} · 오늘 생성된 문제를 사용합니다.</small></p>
            : <p><b>오늘의 문제 세트 대기 중</b><small>매일 오전 4시(한국 시간)에 새 문제를 생성합니다.</small></p>}
        </section>
        {error && <p className="err catalog-error" role="alert">{error}</p>}
      </main>
      <div className="cta"><div className="cta-in">
        <button className="btn block" disabled={selected.length === 0 || starting || loading} onClick={start}>
          {starting ? '오늘의 문제를 불러오는 중…' : `선택한 단원으로 20문제 풀기`}
        </button>
      </div></div>
    </>
  )
}
