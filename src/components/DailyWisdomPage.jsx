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
  const [speechRate, setSpeechRate] = useState(0.95)
  const [selectedWord, setSelectedWord] = useState('')
  const [wordMeaning, setWordMeaning] = useState('')
  const [wordLoading, setWordLoading] = useState(false)
  const [wordError, setWordError] = useState('')
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
    setSelectedWord('')
    setWordMeaning('')
    setWordError('')
  }, [quoteText])

  useEffect(() => {
    if (!selectedWord) return
    const controller = new AbortController()
    const cacheKey = `daily-wisdom-word:${selectedWord.toLowerCase()}`
    const cached = window.sessionStorage.getItem(cacheKey)
    if (cached) {
      setWordMeaning(cached)
      setWordLoading(false)
      return () => controller.abort()
    }
    setWordLoading(true)
    setWordMeaning('')
    setWordError('')
    fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(selectedWord)}&langpair=en|ko`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('뜻을 불러오지 못했습니다.')
        return response.json()
      })
      .then((data) => {
        const translated = data?.responseData?.translatedText
        if (!translated || data?.responseStatus !== 200) throw new Error('뜻을 찾지 못했습니다.')
        const clean = translated.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
        window.sessionStorage.setItem(cacheKey, clean)
        setWordMeaning(clean)
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setWordError('단어 뜻을 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setWordLoading(false)
      })
    return () => controller.abort()
  }, [selectedWord])

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

  const speakWord = () => {
    if (!selectedWord || !speechSupported) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(selectedWord)
    const voice = window.speechSynthesis.getVoices()
      .filter((entry) => /^en(-|_)/i.test(entry.lang || ''))
      .sort((a, b) => {
        const score = (entry) => {
          const name = entry.name.toLowerCase()
          return (/google us english/.test(name) ? 100 : 0)
            + (/microsoft.*(aria|jenny|guy|ava|andrew)/.test(name) ? 95 : 0)
            + (/samantha|ava|allison|serena/.test(name) ? 85 : 0)
            + (/enhanced|premium|neural|natural/.test(name) ? 30 : 0)
            + (/en-us/i.test(entry.lang) ? 20 : 0)
        }
        return score(b) - score(a)
      })[0]
    if (voice) utterance.voice = voice
    utterance.lang = voice?.lang || 'en-US'
    utterance.rate = speechRate
    utterance.pitch = 1.02
    utterance.volume = 1
    window.speechSynthesis.speak(utterance)
  }

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    setSpeaking(false)
  }

  const speakQuote = () => {
    if (!quoteText || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(quoteText)
    const voices = window.speechSynthesis.getVoices()
    const englishVoice = voices
      .filter((voice) => /^en(-|_)/i.test(voice.lang || ''))
      .sort((a, b) => {
        const score = (voice) => {
          const name = voice.name.toLowerCase()
          let value = 0
          if (/google us english/.test(name)) value += 100
          if (/microsoft.*(aria|jenny|guy|ana|ava|andrew)/.test(name)) value += 95
          if (/samantha|ava|allison|serena/.test(name)) value += 85
          if (/enhanced|premium|neural|natural/.test(name)) value += 30
          if (/en-us/i.test(voice.lang)) value += 20
          if (voice.localService) value += 2
          return value
        }
        return score(b) - score(a)
      })[0]
    if (englishVoice) utterance.voice = englishVoice
    utterance.lang = englishVoice?.lang || 'en-US'
    utterance.rate = speechRate
    utterance.pitch = 1.02
    utterance.volume = 1
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
              <p className="daily-wisdom-original" aria-label="단어를 선택해 뜻과 발음을 확인하세요">
                “{String(item.content).split(/(\\s+)/).map((part, index) => {
                  if (!part.trim()) return part
                  const word = part.replace(/^[^A-Za-z]+|[^A-Za-z'-]+$/g, '')
                  if (!word) return part
                  return <button
                    key={`${word}-${index}`}
                    type="button"
                    className={`quote-word ${selectedWord.toLowerCase() === word.toLowerCase() ? 'active' : ''}`}
                    onClick={() => setSelectedWord(word)}
                    aria-pressed={selectedWord.toLowerCase() === word.toLowerCase()}
                    title={`${word} 뜻 보기`}
                  >{part}</button>
                })}”
              </p>
              {selectedWord && (
                <section className="quote-word-detail" aria-live="polite">
                  <div className="quote-word-heading">
                    <div>
                      <strong>{selectedWord}</strong>
                      <span>선택한 단어</span>
                    </div>
                    <button type="button" className="quote-word-close" onClick={() => setSelectedWord('')} aria-label="단어 뜻 닫기">×</button>
                  </div>
                  <p className="quote-word-meaning">
                    {wordLoading ? '뜻을 찾고 있어요…' : wordError || wordMeaning || '뜻을 불러오는 중입니다.'}
                  </p>
                  <button type="button" className="quote-word-speak" onClick={speakWord} disabled={!speechSupported}>
                    <span aria-hidden="true">🔊</span> 단어 발음 듣기
                  </button>
                </section>
              )}
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
                {speechSupported && <p className="quote-audio-help">기기에서 사용할 수 있는 영어 음성 중 자연스러운 음성을 자동으로 선택합니다. 음질은 브라우저와 기기에 따라 달라집니다.</p>}
              </div>
            </>
          )}
        </section>
      )}
    </main>
  )
}
