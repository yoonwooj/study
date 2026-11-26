import { useEffect, useRef, useState } from 'react'
import { dayIndex, todayLabel } from '../lib/date.js'
import { fetchDailyWisdom } from '../lib/supabase.js'

const COMMON_WORD_MEANINGS = {
  a: { pos: '관사', meanings: ['하나의', '어떤', '한 사람 또는 사물'] , note: '자음 소리로 시작하는 셀 수 있는 단수 명사 앞에 쓰며, 특별히 정해지지 않은 하나를 나타냅니다.' },
  an: { pos: '관사', meanings: ['하나의', '어떤'], note: '모음 소리로 시작하는 셀 수 있는 단수 명사 앞에 씁니다.' },
  the: { pos: '정관사', meanings: ['그', '바로 그'], note: '말하는 사람과 듣는 사람이 무엇인지 알고 있는 특정한 사람이나 사물을 가리킵니다.' },
  is: { pos: '동사 (be동사)', meanings: ['~이다', '~에 있다', '~한 상태이다'], note: '주어가 he, she, it 또는 단수 명사일 때 현재 상태·정체·위치를 나타냅니다.' },
  am: { pos: '동사 (be동사)', meanings: ['~이다', '~에 있다', '~한 상태이다'], note: '주어 I와 함께 쓰는 be동사의 현재형입니다.' },
  are: { pos: '동사 (be동사)', meanings: ['~이다', '~에 있다', '~한 상태이다'], note: '주어 you 또는 복수 주어와 함께 쓰는 be동사의 현재형입니다.' },
  was: { pos: '동사 (be동사)', meanings: ['~이었다', '~에 있었다'], note: 'am/is의 과거형입니다.' },
  were: { pos: '동사 (be동사)', meanings: ['~이었다', '~에 있었다'], note: 'are의 과거형입니다.' },
  be: { pos: '동사', meanings: ['~이다', '~이 되다', '존재하다'], note: '상태나 존재를 나타내는 동사입니다.' },
  every: { pos: '한정사', meanings: ['모든', '매 ~마다', '하나하나의'], note: '셋 이상의 사람이나 사물을 빠짐없이 각각 가리킵니다. every day는 매일이라는 뜻입니다.' },
  each: { pos: '한정사·대명사', meanings: ['각각의', '각자'], note: '여럿을 하나씩 따로 보아 각각을 강조합니다.' },
  to: { pos: '전치사·to부정사', meanings: ['~에', '~로', '~하기'], note: '방향·도착점 또는 동사의 기본형 앞에서 목적이나 행동을 나타냅니다.' },
  of: { pos: '전치사', meanings: ['~의', '~중의', '~으로 이루어진'], note: '소유·부분·재료·관계를 나타냅니다.' },
  in: { pos: '전치사·부사', meanings: ['~안에', '~에서', '~동안'], note: '장소·시간·상태의 범위를 나타냅니다.' },
  on: { pos: '전치사·부사', meanings: ['~위에', '~에', '계속하여'], note: '접촉한 위치나 특정 날짜·요일 등을 나타냅니다.' },
  and: { pos: '접속사', meanings: ['그리고', '~와/과'], note: '단어·구·문장을 서로 연결합니다.' },
  or: { pos: '접속사', meanings: ['또는', '혹은'], note: '선택이나 대안을 연결합니다.' },
  but: { pos: '접속사', meanings: ['그러나', '~이지만'], note: '앞뒤 내용이 반대되거나 대조됨을 나타냅니다.' },
  is not: { pos: '표현', meanings: ['~이 아니다', '~하지 않다'], note: 'be동사 is의 부정 표현입니다.' },
  it: { pos: '대명사', meanings: ['그것', '그것은'], note: '앞에서 언급한 사물·동물·상황 등을 가리킵니다.' },
  you: { pos: '대명사', meanings: ['너', '당신', '너희'], note: '말을 듣는 사람을 가리킵니다.' },
  we: { pos: '대명사', meanings: ['우리'], note: '말하는 사람을 포함한 여러 사람을 가리킵니다.' },
  they: { pos: '대명사', meanings: ['그들', '그것들'], note: '앞에서 언급한 여러 사람이나 사물을 가리킵니다.' },
  for: { pos: '전치사·접속사', meanings: ['~을 위해', '~동안', '~에 대해'], note: '목적·대상·기간 등을 나타냅니다.' },
  with: { pos: '전치사', meanings: ['~와 함께', '~을 가지고', '~을 사용하여'], note: '동반·수단·도구 등을 나타냅니다.' },
  your: { pos: '소유격', meanings: ['너의', '당신의', '너희의'], note: '듣는 사람에게 속한 것을 나타냅니다.' },
  my: { pos: '소유격', meanings: ['나의', '내'], note: '말하는 사람에게 속한 것을 나타냅니다.' },
  this: { pos: '한정사·대명사', meanings: ['이', '이것'], note: '말하는 사람 가까이에 있거나 현재 언급하는 대상을 가리킵니다.' },
  that: { pos: '한정사·대명사·접속사', meanings: ['저', '그것', '~라는 것'], note: '문맥에 따라 대상을 가리키거나 문장을 연결합니다.' },
  not: { pos: '부사', meanings: ['~아니다', '~않다'], note: '동사·형용사 등의 의미를 부정합니다.' },
  no: { pos: '한정사·부사', meanings: ['아니', '없는', '전혀 ~않다'], note: '부정이나 수량이 없음을 나타냅니다.' },
  power: { pos: '명사', meanings: ['힘', '능력', '권력', '전력'], note: '무언가를 할 수 있는 힘이나 영향력을 뜻합니다.' },
  knowledge: { pos: '명사', meanings: ['지식', '알고 있는 것', '학식'], note: '배우거나 경험하여 알게 된 정보와 이해를 뜻합니다.' }
}

export default function DailyWisdomPage({ grade = 1 }) {
  const isYoung = Number(grade) <= 2
  const category = isYoung ? 'proverb' : 'quote'
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [day, setDay] = useState(() => dayIndex())
  const [speechRate, setSpeechRate] = useState(0.95)
  const [selectedWord, setSelectedWord] = useState('')
  const [wordMeaning, setWordMeaning] = useState(null)
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
    const word = selectedWord.toLowerCase()
    const cacheKey = `daily-wisdom-word-v2:${word}`
    const cached = window.sessionStorage.getItem(cacheKey)
    if (cached) {
      try { setWordMeaning(JSON.parse(cached)); setWordLoading(false); return () => controller.abort() } catch {}
    }
    setWordLoading(true)
    setWordMeaning(null)
    setWordError('')
    const local = COMMON_WORD_MEANINGS[word]
    if (local) {
      const result = { ...local, source: '학습용 기본 사전' }
      setWordMeaning(result)
      window.sessionStorage.setItem(cacheKey, JSON.stringify(result))
      setWordLoading(false)
      return () => controller.abort()
    }

    const loadDictionary = async () => {
      try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, { signal: controller.signal })
        if (!response.ok) throw new Error('사전에서 단어를 찾지 못했습니다.')
        const entries = await response.json()
        const entry = entries[0]
        const meanings = (entry?.meanings || []).slice(0, 3).map((meaning) => ({
          pos: meaning.partOfSpeech || '',
          definitions: (meaning.definitions || []).slice(0, 2).map((definition) => definition.definition).filter(Boolean),
          examples: (meaning.definitions || []).slice(0, 2).map((definition) => definition.example).filter(Boolean)
        }))
        const phonetic = entry?.phonetic || entry?.phonetics?.find((p) => p.text)?.text || ''
        const translateText = meanings.flatMap((meaning) => meaning.definitions).slice(0, 4).join(' / ')
        let korean = ''
        if (translateText) {
          try {
            const translatedResponse = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(translateText)}&langpair=en|ko`, { signal: controller.signal })
            const translatedData = await translatedResponse.json()
            korean = translatedData?.responseData?.translatedText || ''
          } catch (error) {
            if (error.name === 'AbortError') throw error
          }
        }
        const result = { pos: meanings.map((m) => m.pos).filter(Boolean).join(' · '), meanings: korean ? [korean] : [], definitions: meanings, phonetic, source: 'Free Dictionary API · 한국어 설명은 MyMemory 번역 참고' }
        setWordMeaning(result)
        window.sessionStorage.setItem(cacheKey, JSON.stringify(result))
      } catch (error) {
        if (error.name !== 'AbortError') setWordError('사전 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
      } finally {
        if (!controller.signal.aborted) setWordLoading(false)
      }
    }
    loadDictionary()
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
                “{String(item.content).split(/(\s+)/).map((part, index) => {
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
                  {wordLoading ? <p className="quote-word-meaning">사전에서 뜻을 찾고 있어요…</p> : wordError ? <p className="quote-word-meaning">{wordError}</p> : wordMeaning && (
                    <div className="quote-word-definitions">
                      {wordMeaning.pos && <span className="quote-word-pos">{wordMeaning.pos}</span>}
                      {wordMeaning.phonetic && <span className="quote-word-phonetic">/{wordMeaning.phonetic}/</span>}
                      {wordMeaning.meanings?.length > 0 && <ol className="quote-word-korean">{wordMeaning.meanings.map((meaning, index) => <li key={index}>{meaning}</li>)}</ol>}
                      {wordMeaning.note && <p className="quote-word-note">{wordMeaning.note}</p>}
                      {wordMeaning.definitions?.map((meaning, index) => (
                        <div className="quote-word-english" key={index}>
                          <strong>{meaning.pos}</strong>
                          {meaning.definitions.map((definition, definitionIndex) => <p key={definitionIndex}>{definition}</p>)}
                          {meaning.examples.map((example, exampleIndex) => <small key={exampleIndex}>예문: {example}</small>)}
                        </div>
                      ))}
                      <small className="quote-word-source">출처: {wordMeaning.source}</small>
                    </div>
                  )}
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
