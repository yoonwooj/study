import { useEffect, useState } from 'react'
import { SUBJECTS } from '../curriculum.js'
import { fmt, recTitle } from '../lib/quiz.js'

const SUBJECT_NAMES = {
  kor: '국어',
  mor: '도덕',
  soc: '사회',
  sci: '과학',
  eth: '바른생활',
  eng: '영어',
  int: '통합',
}

const GRADE_SUBJECT_CODES = {
  1: ['kor', 'int', 'eth'],
  2: ['kor', 'int', 'eth'],
  3: ['kor', 'soc', 'sci'],
  4: ['kor', 'soc', 'sci'],
  5: ['kor', 'soc', 'sci'],
  6: ['kor', 'soc', 'sci'],
}

const normalizeSubjCode = (code, grade) => {
  if (!code) return 'kor'
  if (code === 'mor') return Number(grade) <= 2 ? 'int' : 'eth'
  return code
}

const matchesSubj = (recordSubj, selectedSubj, grade) => {
  const normRecord = normalizeSubjCode(recordSubj, grade)
  const normSelected = normalizeSubjCode(selectedSubj, grade)
  if (normRecord === normSelected) return true
  if ((selectedSubj === 'int' || selectedSubj === 'eth') && recordSubj === 'mor') {
    return Number(grade) <= 2
  }
  return false
}

const labelOfSubject = (code, grade) => {
  if (code === 'eth') return Number(grade) <= 2 ? '바른생활' : '도덕'
  if (code === 'mor') return Number(grade) <= 2 ? '바른생활' : '도덕'
  return SUBJECTS[code] || SUBJECT_NAMES[code] || code || '과목'
}

export default function RecordsPage({
  subj,
  initialGrade = 1,
  records,
  coreBest,
  onClear,
  onSubjectChange,
}) {
  const activeGrade = Number(initialGrade) || 1
  const allowedSubjects = GRADE_SUBJECT_CODES[activeGrade] || GRADE_SUBJECT_CODES[1]

  const [selectedSubj, setSelectedSubj] = useState(() => {
    const norm = normalizeSubjCode(subj, activeGrade)
    return allowedSubjects.includes(norm) ? norm : allowedSubjects[0]
  })

  useEffect(() => {
    const nextAllowed = GRADE_SUBJECT_CODES[activeGrade] || GRADE_SUBJECT_CODES[1]
    const norm = normalizeSubjCode(subj, activeGrade)
    if (nextAllowed.includes(norm)) {
      setSelectedSubj(norm)
    } else if (!nextAllowed.includes(selectedSubj)) {
      const fallback = nextAllowed[0]
      setSelectedSubj(fallback)
      if (onSubjectChange) onSubjectChange(fallback)
    }
  }, [activeGrade, subj])

  const handleSelectSubj = (code) => {
    setSelectedSubj(code)
    if (onSubjectChange) onSubjectChange(code)
  }

  const filteredRecords = records.filter(
    (r) => Number(r.g) === activeGrade && matchesSubj(r.subj, selectedSubj, activeGrade)
  )

  return (
    <main className="page" data-subject={selectedSubj}>
      <section className="hero" data-subject={selectedSubj}>
        <small>과목별 학습 기록</small>
        <b>
          {activeGrade}학년 · {labelOfSubject(selectedSubj, activeGrade)}
        </b>
      </section>


      <section className="sel">
        <div className="sel-row">
          <span className="lbl">과목</span>
          <div className="chips" role="group" aria-label="과목 선택">
            {allowedSubjects.map((code) => (
              <button
                type="button"
                key={code}
                className="chip"
                aria-pressed={selectedSubj === code}
                onClick={() => handleSelectSubj(code)}
              >
                {labelOfSubject(code, activeGrade)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="card">
        <h2>
          {labelOfSubject(selectedSubj, activeGrade)} · {activeGrade}학년 학기 핵심 최고 점수
        </h2>
        <div className="grid">
          {[1, 2].map((s) => (
            <div key={`${activeGrade}-${s}`} className="cell">
              <small>
                {activeGrade}-{s}
              </small>
              <b>{coreBest(activeGrade, s) < 0 ? '-' : coreBest(activeGrade, s)}</b>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>
          {activeGrade}학년 · {labelOfSubject(selectedSubj, activeGrade)} 기록
        </h2>
        {filteredRecords.length === 0 ? (
          <p className="sub">선택한 학년과 과목의 저장된 기록이 없어요.</p>
        ) : (
          <ul className="hist">
            {[...filteredRecords]
              .reverse()
              .slice(0, 15)
              .map((r, k) => (
                <li key={r.at ? `${r.at}-${k}` : k}>
                  <div>
                    <b>{recTitle(r)}</b>
                    <small>
                      {fmt(r.at)} · {r.label}
                    </small>
                  </div>
                  <strong>
                    {r.score}/{r.total}
                  </strong>
                </li>
              ))}
          </ul>
        )}
        {records.length > 0 && (
          <button type="button" className="btn ghost block" onClick={onClear}>
            기록 지우기
          </button>
        )}
      </section>
    </main>
  )
}
