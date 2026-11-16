import { useRef, useState } from 'react'
import { MAX_UNITS, PER_SLIDE } from '../lib/quiz.js'

// 한 슬라이드에 단원 3개씩, 옆으로 밀어서 전체 단원 보기
export default function UnitCarousel({ units, counts, picked, onToggle }) {
  const ref = useRef(null)
  const [idx, setIdx] = useState(0)
  const pages = Math.ceil(units.length / PER_SLIDE)
  const n = picked.length
  const onScroll = (e) => setIdx(Math.min(pages - 1, Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth)))
  const go = (p) => ref.current && ref.current.children[p].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
  return (
    <section>
      <p className="sub row"><span>옆으로 밀어 전체 {units.length}개 단원을 보고, 1~{MAX_UNITS}개 고르세요</span><b>{n}/{MAX_UNITS}</b></p>
      <div className="units" ref={ref} onScroll={onScroll}>
        {Array.from({ length: pages }, (_, p) => (
          <div key={p} className="slide">
            {units.slice(p * PER_SLIDE, p * PER_SLIDE + PER_SLIDE).map((u, k) => {
              const i = p * PER_SLIDE + k
              const on = picked.includes(i)
              const cnt = counts[i]
              return (
                <button key={i} className={'unit' + (on ? ' on' : '')} aria-pressed={on} disabled={cnt === 0 || (!on && n >= MAX_UNITS)} onClick={() => onToggle(i)}>
                  <span className="check">{on ? '✓' : i + 1}</span>
                  <span className="uname">{u}<small>{cnt > 0 ? `${cnt}문제` : '준비 중'}</small></span>
                </button>
              )
            })}
          </div>
        ))}
      </div>
      <div className="dots" aria-label="슬라이드 위치">
        {Array.from({ length: pages }, (_, p) => <button key={p} className={p === idx ? 'on' : ''} aria-label={`${p + 1}번째 슬라이드`} onClick={() => go(p)} />)}
      </div>
    </section>
  )
}
