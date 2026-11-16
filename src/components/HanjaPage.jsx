import { useMemo, useState } from 'react'
import { HANJA } from '../data/hanja.js'
import { dayIndex, todayLabel } from '../lib/date.js'
import { shuffle } from '../lib/quiz.js'
import HanjaWrite from './HanjaWrite.jsx'

// 매일 한 글자씩 바뀌는 하루한자
export default function HanjaPage() {
  const day = dayIndex()
  const h = HANJA[day % HANJA.length]
  const [pick, setPick] = useState(null)
  const [pc, setPc] = useState(h.c)
  const options = useMemo(() => shuffle([h, ...shuffle(HANJA.filter((x) => x !== h)).slice(0, 3)]), [h])
  const recent = [1, 2, 3, 4, 5, 6].map((k) => HANJA[(((day - k) % HANJA.length) + HANJA.length) % HANJA.length])
  return (
    <main className="page">
      <section className="hero"><small>{todayLabel()}</small><b>오늘의 한자</b></section>
      <section className="card center">
        <div className="hanja" aria-label={`${h.hun} ${h.eum}`}>{h.c}</div>
        <p className="hun">{h.hun} {h.eum}</p>
        <p className="sub"><span className="lv">{h.level}급</span> 배정한자</p>
        <ul className="words">{h.words.map((w) => <li key={w}>{w}</li>)}</ul>
      </section>
      <section className="card">
        <h2>맞혀 보기</h2>
        <p className="sub">「{h.c}」의 뜻과 음은 무엇일까요?</p>
        <div className="opts">
          {options.map((o) => (
            <button key={o.c} className={'opt' + (pick ? (o === h ? ' right' : o === pick ? ' wrong' : '') : '')} disabled={!!pick} onClick={() => setPick(o)}>{o.hun} {o.eum}</button>
          ))}
        </div>
        {pick && <p className="sub">{pick === h ? '🎉 정답이에요!' : `😢 정답은 "${h.hun} ${h.eum}"이에요.`}</p>}
      </section>
      <section className="card">
        <h2>✍️ 써 보기 · {pc}</h2>
        <p className="sub">반투명 글자 위에 획순이 표시돼요. 손가락이나 펜으로 따라 써 보세요.</p>
        <HanjaWrite key={pc} c={pc} />
      </section>
      <section className="card">
        <h2>지난 한자 (눌러서 써 보기)</h2>
        <div className="recent">{[h, ...recent].map((x) => <button key={x.c} aria-pressed={pc === x.c} onClick={() => setPc(x.c)}><b>{x.c}</b><small>{x.hun} {x.eum}</small></button>)}</div>
      </section>
    </main>
  )
}
