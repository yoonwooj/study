import { useEffect, useMemo, useState } from 'react'
import { dayIndex, todayLabel } from '../lib/date.js'
import { shuffle } from '../lib/quiz.js'
import { fetchHanjaDictionary } from '../lib/supabase.js'
import HanjaWrite from './HanjaWrite.jsx'

const SHOW_HANJA_QUIZ = false

// Supabase 한자 사전을 기준 데이터로 사용합니다.
export default function HanjaPage() {
  const day = dayIndex()
  const [hanja, setHanja] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [pick, setPick] = useState(null)
  const [pc, setPc] = useState('')

  useEffect(() => {
    let alive = true
    fetchHanjaDictionary()
      .then((rows) => {
        if (!alive) return
        setHanja(rows)
        setLoadError('')
      })
      .catch((error) => {
        if (alive) setLoadError(error.message || '한자 데이터를 불러오지 못했습니다.')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => { alive = false }
  }, [])

  const h = hanja.length ? hanja[day % hanja.length] : null
  useEffect(() => {
    if (h && !pc) setPc(h.c)
  }, [h, pc])

  const options = useMemo(
    () => h ? shuffle([h, ...shuffle(hanja.filter((x) => x.c !== h.c)).slice(0, 3)]) : [],
    [h, hanja]
  )
  const recent = h
    ? [1, 2, 3, 4, 5, 6].map((k) => hanja[((day - k) % hanja.length + hanja.length) % hanja.length])
    : []

  if (loading) return <main className="page"><section className="card center">한자 정보를 불러오는 중입니다.</section></main>
  if (!h) return <main className="page"><section className="card center"><p>{loadError || '등록된 한자 데이터가 없습니다.'}</p></section></main>

  return (
    <main className="page">
      <section className="hero"><small>{todayLabel()}</small><b>오늘의 한자</b></section>
      <section className="card center">
        <div className="hanja" aria-label={`${h.hun} ${h.eum}`}>{h.c}</div>
        <p className="hun">{h.hun} {h.eum}</p>
        <p className="sub"><span className="lv">{h.level}급</span> 배정한자 · 총 {h.stroke_count}획</p>
        <ul className="words">{h.words.map((w) => <li key={w}>{w}</li>)}</ul>
      </section>
      {SHOW_HANJA_QUIZ && (
        <section className="card">
          <h2>맞혀 보기</h2>
          <p className="sub">「{h.c}」의 뜻과 음은 무엇일까요?</p>
          <div className="opts">
            {options.map((o) => (
              <button key={o.c} className={'opt' + (pick ? (o.c === h.c ? ' right' : o.c === pick.c ? ' wrong' : '') : '')} disabled={!!pick} onClick={() => setPick(o)}>{o.hun} {o.eum}</button>
            ))}
          </div>
          {pick && <p className="sub">{pick.c === h.c ? '🎉 정답이에요!' : `😢 정답은 "${h.hun} ${h.eum}"이에요.`}</p>}
        </section>
      )}
      <section className="card">
        <h2>✍️ 써 보기 · {pc}</h2>
        <p className="sub">획순이 표시돼요. 손가락이나 펜으로 따라 써 보세요.</p>
        <HanjaWrite key={pc} c={pc} />
      </section>
      <section className="card">
        <h2>지난 한자 (눌러서 써 보기)</h2>
        <div className="recent">{[h, ...recent].map((x) => <button key={x.c} aria-pressed={pc === x.c} onClick={() => setPc(x.c)}><b>{x.c}</b><small>{x.hun} {x.eum}</small></button>)}</div>
      </section>
    </main>
  )
}
