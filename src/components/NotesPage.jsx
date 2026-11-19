import { useEffect, useState } from 'react'
import { SUBJECTS } from '../curriculum.js'
import { CORE_N, answerText } from '../lib/quiz.js'

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

const labelOfSubject = (code, grade) => {
  if (code === 'eth') return Number(grade) <= 2 ? '바른생활' : '도덕'
  if (code === 'mor') return Number(grade) <= 2 ? '바른생활' : '도덕'
  return SUBJECTS[code] || SUBJECT_NAMES[code] || code || '과목'
}

const matchesNoteSubject = (noteSubj, selectedSubj, grade) => {
  if (!noteSubj) return selectedSubj === 'kor'
  if (noteSubj === selectedSubj) return true
  if (noteSubj === 'mor') {
    if (Number(grade) <= 2) return selectedSubj === 'int' || selectedSubj === 'eth'
    return selectedSubj === 'eth'
  }
  return false
}

export default function NotesPage({ subj, grade = 1, notes, onDelete, onStart, onSubjectChange }) {
  const activeGrade = Number(grade) || 1
  const gradeSubjects = GRADE_SUBJECT_CODES[activeGrade] || GRADE_SUBJECT_CODES[1]

  const gradeNotes = notes.filter((x) => Number(x.g) === activeGrade)

  const [selectedSubj, setSelectedSubj] = useState(() =>
    gradeSubjects.includes(subj) ? subj : gradeSubjects[0]
  )

  useEffect(() => {
    const nextSubjects = GRADE_SUBJECT_CODES[activeGrade] || GRADE_SUBJECT_CODES[1]
    if (nextSubjects.includes(subj)) {
      setSelectedSubj(subj)
    } else if (!nextSubjects.includes(selectedSubj)) {
      const fallback = nextSubjects[0]
      setSelectedSubj(fallback)
      if (onSubjectChange) onSubjectChange(fallback)
    }
  }, [activeGrade, subj])

  const handleSelectSubj = (code) => {
    setSelectedSubj(code)
    if (onSubjectChange) onSubjectChange(code)
  }

  const shown = gradeNotes.filter((x) => matchesNoteSubject(x.subj, selectedSubj, activeGrade))

  return (
    <>
      <main className="page" data-subject={selectedSubj}>
        <section className="hero" data-subject={selectedSubj}>
          <small>{activeGrade}학년 · {labelOfSubject(selectedSubj, activeGrade)} 오답노트</small>
          <b>틀린 문제 {shown.length}개</b>
        </section>

        <div className="chips" role="group" aria-label="과목 선택">
          {gradeSubjects.map((code) => (
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

        {shown.length === 0 ? (
          <p className="sub empty">
            틀린 문제가 없어요. 🎉<br />
            문제를 풀다 틀리면 여기에 모여요.
          </p>
        ) : (
          <>
            <p className="sub">다시 풀어서 맞히면 오답노트에서 자동으로 사라져요.</p>
            {shown.map((nt) => (
              <div key={nt.key} className="note">
                <div className="note-top">
                  <span className="meta">
                    {labelOfSubject(nt.subj, activeGrade)} · {nt.unit}
                  </span>
                  <button
                    type="button"
                    className="del"
                    onClick={() => onDelete(nt.key)}
                    aria-label="오답노트에서 삭제"
                  >
                    ✕
                  </button>
                </div>
                <b>{nt.q.q}</b>
                <p>정답: <strong>{answerText(nt.q)}</strong></p>
                <p className="why">{nt.q.e}</p>
              </div>
            ))}
          </>
        )}
      </main>

      <div className="cta">
        <div className="cta-in">
          <button
            type="button"
            className="btn block"
            disabled={shown.length === 0}
            onClick={() => onStart(shown)}
          >
            {shown.length === 0
              ? '풀 문제가 없어요'
              : `📝 ${Math.min(shown.length, CORE_N)}문제 다시 풀기`}
          </button>
        </div>
      </div>
    </>
  )
}
