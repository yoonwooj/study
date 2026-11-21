import { useEffect, useRef, useState } from 'react'
import { dayIndex, todayLabel } from '../lib/date.js'
import { fetchDailyWisdom } from '../lib/supabase.js'

export default function DailyWisdomPage({ grade = 1 }) {
  const isYoung = Number(grade) <= 2
  const category = isYoung ? 'proverb' : 'quote'
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [day, setDay] = useState(() => dayIndex())
  const [speechRate, setSpeechRate] = useState(1)
  const [repeat, setRepeat] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const repeatRef = useRef(false)
  const currentTextRef = useRef('')

  useEffect(() => {
    const timer = window.setInterval(() => setDay(dayIndex()), 60 * 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError('')
    fetchDailyWisdom(category, Number(grade))
      .then((rows) => { if (alive) setItems(rows) })
      .catch((e) => { if (alive) setError(e.message || '오늘의 콘텐츠를 불러오지 못했습니다.') })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [category, grade])

  const item = items.length ? items[day % items.length] : null
  const quoteText = !isYoung && item?.content ? String(item.content).trim() : ''

  useEffect(() => {
    repeatRef.current = repeat
  }, [repeat])

  useEffect(() => {
    currentTextRef.current = quoteText
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    setSpeaking(false)
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    }
  }, [quoteText])

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    setSpeaking(false)
  }

  const speakQuote = () => {
    if (!quoteText || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(quoteText)
    const voices = window.speechSynthesis.getVoices()
    const englishVoice = voices.find((voice) => voice.lang?.toLowerCase() === 'en-us')
      || voices.find((voice) => voice.lang?.toLowerCase().startsWith('en-'))
    if (englishVoice) utterance.voice = englishVoice
    utterance.lang = englishVoice?.lang || 'en-US'
    utterance.rate = speechRate
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => {
      if (repeatRef.current && currentTextRef.current === quoteText) speakQuote()
      else setSpeaking(false)
    }
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  const speechSupported = typeof window !== 'undefined'
    && 'speechSynthesis' in window
    && 'SpeechSynthesisUtterance' in window

  return (
    <main className="page daily-wisdom-page">
      <section className={`hero daily-wisdom-hero ${isYoung ? 'proverb-hero' : 'english-quote-hero'}`}>
        <small>{todayLabel()}</small>
        <b>{isYoung ? '💬 오늘의 하루속담' : '🌍 오늘의 영어명언'}</b>
        <p>매일 하나씩, 하루에 한 가지 좋은 생각을 만나요.</p>
      </section>
      {loading ? (
        <section className="card daily-wisdom-loading">오늘의 내용을 준비하고 있어요…</section>
      ) : error ? (
        <section className="card daily-wisdom-error" role="alert">{error}</section>
      ) : !item ? (
        <section className="card daily-wisdom-error">등록된 콘텐츠가 없습니다.</section>
      ) : (
        <section className="card daily-wisdom-card">
          {isYoung && <span className="daily-wisdom-day">DAY {String((day % 100) + 1).padStart(2, '0')} · 100일 콘텐츠</span>}
          {isYoung ? (
            <>
              <h2 className="daily-wisdom-title">{item.title}</h2>
              <p className="daily-wisdom-meaning">{item.meaning}</p>
              <p className="daily-wisdom-example">💡 예시: {item.content}</p>
            </>
          ) : (
            <>
              <p className="daily-wisdom-original">“{item.content}”</p>
              <p className="daily-wisdom-meaning">{item.meaning}</p>
              <p className="daily-wisdom-author">— {item.attribution || item.title}</p>
              <div className="quote-audio" aria-label="영어 명언 듣기 기능">
                <div className="quote-audio-actions">
                  <button type="button" className="quote-audio-play" onClick={speakQuote} disabled={!speechSupported}>
                    <span aria-hidden="true">▶</span> {speaking ? '다시 듣기' : '영어 듣기'}
                  </button>
                  <button type="button" className="quote-audio-stop" onClick={stopSpeaking} disabled={!speechSupported}>
                    정지
                  </button>
                  <button
                    type="button"
                    className={`quote-audio-repeat ${repeat ? 'active' : ''}`}
                    onClick={() => setRepeat((value) => !value)}
                    aria-pressed={repeat}
                    disabled={!speechSupported}
                  >
                    ↻ 반복 {repeat ? '켜짐' : '꺼짐'}
                  </button>
                </div>
                <label className="quote-audio-rate">
                  <span>재생 속도</span>
                  <select value={speechRate} onChange={(event) => setSpeechRate(Number(event.target.value))}>
                    <option value="0.75">느리게 · 0.75배</option>
                    <option value="1">보통 · 1배</option>
                    <option value="1.25">빠르게 · 1.25배</option>
                  </select>
                </label>
                {!speechSupported && <p className="quote-audio-help">이 브라우저에서는 음성 재생을 지원하지 않습니다.</p>}
                {speechSupported && <p className="quote-audio-help">기기에서 제공하는 영어 음성으로 읽어 줍니다.</p>}
              </div>
            </>
          )}
        </section>
      )}
    </main>
  )
}
