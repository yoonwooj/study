import { useEffect, useRef, useState } from 'react'
import { loadGuide } from '../lib/hanziGuide.js'

const pts = (m) => m.map((p) => p.join(',')).join(' ')
const head = (m) => {
  const [x2, y2] = m[m.length - 1]
  const [x1, y1] = m.length > 1 ? m[m.length - 2] : [x2 - 1, y2]
  const a = Math.atan2(y2 - y1, x2 - x1)
  const bx = x2 - Math.cos(a) * 36
  const by = y2 - Math.sin(a) * 36
  return `${x2},${y2} ${bx - Math.sin(a) * 22},${by + Math.cos(a) * 22} ${bx + Math.sin(a) * 22},${by - Math.cos(a) * 22}`
}

// 반투명 글자 위에 획순을 표시하고, 그 위에 손으로 따라 써 보는 연습판
export default function HanjaWrite({ c }) {
  const [guide, setGuide] = useState(null)
  const [showOrder, setShowOrder] = useState(true)
  const [stepMode, setStepMode] = useState(false)
  const [step, setStep] = useState(1)
  const [count, setCount] = useState(0)
  const cv = useRef(null)
  const strokes = useRef([])
  const cur = useRef(null)

  useEffect(() => {
    let alive = true
    loadGuide(c).then((g) => { if (alive) setGuide(g) })
    return () => { alive = false }
  }, [c])

  const redraw = () => {
    const el = cv.current
    if (!el) return
    const ctx = el.getContext('2d')
    ctx.clearRect(0, 0, el.width, el.height)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = el.width * 0.03
    ctx.strokeStyle = getComputedStyle(el).color
    strokes.current.forEach((s) => {
      ctx.beginPath()
      s.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
      if (s.length === 1) ctx.lineTo(s[0][0] + 0.1, s[0][1])
      ctx.stroke()
    })
  }
  useEffect(() => {
    const el = cv.current
    const fit = () => {
      const dpr = window.devicePixelRatio || 1
      el.width = Math.round(el.clientWidth * dpr)
      el.height = Math.round(el.clientHeight * dpr)
      redraw()
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const pos = (e) => {
    const r = cv.current.getBoundingClientRect()
    return [((e.clientX - r.left) / r.width) * cv.current.width, ((e.clientY - r.top) / r.height) * cv.current.height]
  }
  const down = (e) => {
    cv.current.setPointerCapture(e.pointerId)
    cur.current = [pos(e)]
    strokes.current.push(cur.current)
    redraw()
  }
  const move = (e) => { if (cur.current) { cur.current.push(pos(e)); redraw() } }
  const up = () => { if (cur.current) { cur.current = null; setCount(strokes.current.length) } }
  const undo = () => { strokes.current.pop(); setCount(strokes.current.length); redraw() }
  const clear = () => { strokes.current = []; setCount(0); redraw() }

  const N = guide ? guide.medians.length : 0
  const shown = !showOrder ? 0 : stepMode ? step : N
  const cls = (i) => (i < shown ? (stepMode && i === step - 1 ? ' cur' : ' seen') : '')

  return (
    <div className="write">
      <div className="pad">
        <svg viewBox="0 0 1024 1024" aria-hidden="true">
          <g className="grid"><line x1="512" y1="0" x2="512" y2="1024" /><line x1="0" y1="512" x2="1024" y2="512" /></g>
          {guide && guide.kind === 'full' && (
            <g transform="scale(1,-1) translate(0,-900)">{guide.paths.map((d, i) => <path key={i} d={d} className={'gshape' + cls(i)} />)}</g>
          )}
          {guide && guide.kind === 'basic' && guide.lines.map((l, i) => <polyline key={i} points={pts(l)} className={'gline' + cls(i)} />)}
          {guide && guide.kind === 'none' && <text x="512" y="800" textAnchor="middle" fontSize="880" className="gtext">{c}</text>}
          {guide && guide.medians.slice(0, shown).map((m, i) => (
            <g key={i} className="order">
              <polyline points={pts(m)} />
              <polygon points={head(m)} />
              <circle cx={m[0][0]} cy={m[0][1]} r="34" />
              <text x={m[0][0]} y={m[0][1]} dy="14" textAnchor="middle">{i + 1}</text>
            </g>
          ))}
        </svg>
        <canvas ref={cv} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} aria-label={`${c} 글자 따라 쓰기`} />
      </div>
      <div className="wbtns">
        <button onClick={undo} disabled={!count}>↶ 되돌리기</button>
        <button onClick={clear} disabled={!count}>🗑 지우기</button>
        {N > 0 && <button aria-pressed={showOrder} onClick={() => setShowOrder(!showOrder)}>{showOrder ? '획순 숨기기' : '획순 보기'}</button>}
      </div>
      {N > 0 && showOrder && (
        <div className="wbtns">
          <button aria-pressed={stepMode} onClick={() => { setStepMode(!stepMode); setStep(1) }}>한 획씩 보기</button>
          {stepMode && <>
            <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step <= 1}>◀</button>
            <span className="stepn">{step}/{N}</span>
            <button onClick={() => setStep(Math.min(N, step + 1))} disabled={step >= N}>▶</button>
          </>}
        </div>
      )}
      {guide && guide.kind !== 'none' && <p className="sub wnote">총 {N}획 · 내가 쓴 획 {count}</p>}
    </div>
  )
}
